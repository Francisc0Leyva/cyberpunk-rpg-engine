import type {
  Attributes,
  TagSelections,
  CyberModsState,
  WeaponConfig,
} from "../types/character";
import { CYBER_SYSTEMS } from "../data/cyberSystems";

type LooseRecord = Record<string, any>;

type WeaponCalculationInput = Partial<WeaponConfig> & {
  type: string;
  base_damage?: number;
  baseDamage?: number;
  smart?: boolean;
  arrows?: boolean;
  alwaysCrit?: boolean;
  returned?: boolean;
  first?: boolean;
  tags?: Record<string, boolean>;
};

export type SerializedCyberMods = Record<string, string[]>;

export type StatusContext = Record<string, any>;

type CyberModEntry = (typeof CYBER_SYSTEMS)[number]["mods"][number];

type CyberModSystemMap = Record<
  string,
  {
    system: string;
    mods: CyberModEntry[];
  }
>;

const CYBERMODS_MAP: CyberModSystemMap = CYBER_SYSTEMS.reduce<CyberModSystemMap>(
  (acc, config) => {
    acc[syskey(config.system)] = {
      system: config.system,
      mods: config.mods,
    };
    return acc;
  },
  {}
);

export function serializeCyberMods(state: CyberModsState): SerializedCyberMods {
  const result: SerializedCyberMods = {};

  Object.entries(state).forEach(([systemName, data]) => {
    if (!data) return;
    const entries = (data.slots ?? [])
      .filter(name => name && name !== "None")
      .map(name => name.trim());

    if (data.tier && data.tier.trim() !== "") {
      entries.push(`tier:${data.tier.trim()}`);
    }

    if (entries.length > 0) {
      result[syskey(systemName)] = entries;
    }
  });

  return result;
}

export function computeDamage(
  attributes: Attributes,
  tags: TagSelections,
  cybermods: SerializedCyberMods,
  weapon: WeaponCalculationInput,
  status: StatusContext = {}
): string {
  const [attackType, subtype] = detectAttackCategory(weapon);

  if ("smart" in weapon && !("_weapon_smart" in status)) {
    status._weapon_smart = Boolean(weapon.smart);
  }
  if ("arrows" in weapon && !("_weapon_arrows" in status)) {
    status._weapon_arrows = Boolean(weapon.arrows);
  }
  if (weapon.first) {
    status.attacking_first = true;
    status.is_first_turn = true;
  }
  if (weapon.alwaysCrit) {
    status._force_crit = true;
  }
  if (weapon.returned) {
    status._returned_attack = true;
  }

  const technical = Number(attributes.technical ?? 10);
  const skill = Number(attributes.skill ?? 10);
  const baseHit = baseHitChance(attackType, technical, skill);
  const baseCrit = baseCritChance(skill);
  const critMult =
    attackType === "melee"
      ? meleeCritMultiplier(skill)
      : rangedCritMultiplier(technical);

  const baseDmgRaw = baseDamageFormula(subtype, attributes, weapon, tags ?? {});
  const baseDmg = ceil1(baseDmgRaw);
  const baseFormulaText = describeBaseFormula(
    subtype,
    attributes,
    weapon,
    tags ?? {}
  );

  const adjusted = applyCybermodsToNumbers({
    dmg: baseDmg,
    hitChance: baseHit,
    critChance: baseCrit,
    critMult,
    attackType,
    subtype,
    attrs: attributes,
    status,
    cybermods,
    tags: tags ?? {},
  });

  const rollHit = Math.random() <= adjusted.hitChance;
  let didCrit = false;
  if (rollHit) {
    if (adjusted.flags.force_crit) {
      didCrit = true;
    } else if (!adjusted.flags.disable_crit) {
      didCrit = Math.random() <= adjusted.critChance;
    }
  }

  let finalDamage = adjusted.dmg;
  if (!rollHit) {
    finalDamage = 0;
  } else {
    if (adjusted.flags.force_max_roll) {
      finalDamage = Math.ceil(finalDamage);
    }
    if (didCrit) {
      finalDamage *= adjusted.critMult;
    }
  }

  finalDamage = ceil1(finalDamage);

  const lines: string[] = [];
  lines.push(`Attack: ${subtype.toUpperCase()} (${attackType})`);
  lines.push(`Base Damage: ${baseDmg}`);
  lines.push(`Formula: ${baseFormulaText}`);
  lines.push(
    `Hit Chance: ${Math.round(adjusted.hitChance * 100)}%  |  Crit Chance: ${Math.round(
      adjusted.critChance * 100
    )}%  |  Crit Mult: x${adjusted.critMult.toFixed(2)}`
  );

  if (!rollHit) {
    lines.push("Result: MISS");
  } else if (didCrit) {
    lines.push(`Result: CRITICAL HIT — Damage ${finalDamage}`);
  } else {
    lines.push(`Result: HIT — Damage ${finalDamage}`);
  }

  if (rollHit && didCrit) {
    adjusted.procs.forEach(proc => {
      if ("on_crit_heal" in proc) {
        lines.push(`Proc: Feedback Circuit — Heal +${proc.on_crit_heal} HP`);
      }
    });
  }

  return lines.join("\n");
}

function ceil1(x: number): number {
  return Math.ceil(x * 10) / 10;
}

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function tilde(a: number, b: number, cap = 2): number {
  if (b === 0) return cap;
  const val = a / b;
  if (val < 0) return 0;
  if (val > cap) return cap;
  return val;
}

function syskey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "_");
}

function lookupMod(systemKey: string, identifier: string): CyberModEntry | null {
  const system = CYBERMODS_MAP[systemKey];
  if (!system) return null;
  return (
    system.mods.find(
      mod => mod.id === identifier || mod.name === identifier
    ) ?? null
  );
}

function parseOsSelection(values: string[] = []): [string | null, string | null] {
  let osId: string | null = null;
  let tier: string | null = null;
  values.forEach(value => {
    if (!value) return;
    if (value.startsWith("tier:")) {
      tier = value.split(":", 2)[1] ?? null;
    } else {
      osId = value;
    }
  });
  return [osId, tier];
}

function collectOsEffects(values: string[]): LooseRecord {
  const [osId, tier] = parseOsSelection(values);
  if (!osId) return {};
  const osMod = lookupMod(syskey("Operating System"), osId);
  if (!osMod) return {};
  const effects: LooseRecord = {};
  if (osMod.base_effects) {
    Object.assign(effects, osMod.base_effects);
  }
  if (osMod.tiers && tier) {
    if (osMod.tiers[tier]) {
      Object.assign(effects, osMod.tiers[tier]);
    } else if (osMod.tiers[Number(tier)]) {
      Object.assign(effects, osMod.tiers[Number(tier)]);
    }
  }
  return effects;
}

type AttackCategory = "melee" | "ranged";
type AttackSubtype =
  | "unarmed"
  | "blunt"
  | "sharp"
  | "kick"
  | "whip"
  | "slice"
  | "blast"
  | "ranged";

function detectAttackCategory(weapon: WeaponCalculationInput): [AttackCategory, AttackSubtype] {
  const wtype = (weapon.type ?? "Unarmed Melee").trim().toLowerCase();
  const mapping: Record<string, [AttackCategory, AttackSubtype]> = {
    "unarmed melee": ["melee", "unarmed"],
    unarmed: ["melee", "unarmed"],
    kick: ["melee", "kick"],
    grappling: ["melee", "unarmed"],
    blunt: ["melee", "blunt"],
    "blunt weapon melee": ["melee", "blunt"],
    sharp: ["melee", "sharp"],
    "sharp weapon melee": ["melee", "sharp"],
    blade: ["melee", "sharp"],
    bladed: ["melee", "sharp"],
    whip: ["melee", "whip"],
    slice: ["melee", "slice"],
    blast: ["ranged", "blast"],
    ranged: ["ranged", "ranged"],
    "ranged attack": ["ranged", "ranged"],
  };
  return mapping[wtype] ?? ["ranged", "ranged"];
}

function baseHitChance(
  attackType: AttackCategory,
  technical: number,
  skill: number
): number {
  if (attackType === "ranged") {
    return clamp01((((technical / 2) + (skill / 2)) * 0.01) + 0.47);
  }
  return 1;
}

function baseCritChance(skill: number): number {
  return clamp01(skill * 0.01 + 0.03);
}

function meleeCritMultiplier(skill: number): number {
  return 1 + 0.2 + skill / 100;
}

function rangedCritMultiplier(technical: number): number {
  return 1 + 0.35 + technical / 100;
}

function baseDamageFormula(
  subtype: AttackSubtype,
  attrs: Attributes,
  weapon: WeaponCalculationInput,
  tags: TagSelections
): number {
  let body = Number(attrs.body ?? 10);
  let cool = Number(attrs.cool ?? 10);
  let intelligence = Number(attrs.intelligence ?? 10);
  let reflexes = Number(attrs.reflexes ?? 10);
  const skill = Number(attrs.skill ?? 10);
  const technical = Number(attrs.technical ?? 10);

  const weaponBase = Number(
    weapon.base_damage ?? weapon.damage ?? weapon.baseDamage ?? 0
  );

  const hasTag = (tag: string): boolean => Boolean(tags?.[tag]);

  if (hasTag("Boxing") && (subtype === "unarmed" || subtype === "kick")) {
    body += 10;
  }
  if (hasTag("Brawling") && (subtype === "unarmed" || subtype === "kick")) {
    reflexes += 10;
  }

  const skillTilde = tilde(skill, cool + 50);

  if (subtype === "unarmed") {
    return body / 10 + cool / 5 + reflexes * (0.01 * skillTilde) + 0.75;
  }

  if (subtype === "kick") {
    const base = body / 10 + cool / 5 + reflexes * (0.01 * skillTilde) + 0.75;
    return 2 * base;
  }

  if (subtype === "blunt") {
    return body / 8 + (weaponBase * 0.01) * skillTilde;
  }

  if (subtype === "sharp") {
    let base = body / 10 + cool / 4;
    base *= weaponBase > 0 ? weaponBase * 0.01 : 1;
    return base;
  }

  if (subtype === "whip") {
    const base =
      intelligence / 10 + cool / 5 + reflexes * (0.01 * skillTilde) + 0.75;
    return 1.5 * base;
  }

  if (subtype === "slice") {
    let base = body / 10 + cool / 3;
    base *= weaponBase > 0 ? weaponBase * 0.01 : 1;
    return 1.5 * base;
  }

  if (subtype === "blast") {
    return (
      technical / 2 + reflexes / 10 + (weaponBase * 0.01) * skillTilde
    ) * 1.5;
  }

  return intelligence / 2 + reflexes / 10 + (weaponBase * 0.01) * skillTilde;
}

function describeBaseFormula(
  subtype: AttackSubtype,
  attrs: Attributes,
  weapon: WeaponCalculationInput,
  tags: TagSelections
): string {
  const baseBody = Number(attrs.body ?? 10);
  const baseCool = Number(attrs.cool ?? 10);
  const baseInt = Number(attrs.intelligence ?? 10);
  const baseReflex = Number(attrs.reflexes ?? 10);
  const baseSkill = Number(attrs.skill ?? 10);
  const baseTechnical = Number(attrs.technical ?? 10);
  const weaponBase = Number(
    weapon.base_damage ?? weapon.damage ?? weapon.baseDamage ?? 0
  );
  const hasTag = (tag: string): boolean => Boolean(tags?.[tag]);

  const body = baseBody + (hasTag("Boxing") && (subtype === "unarmed" || subtype === "kick") ? 10 : 0);
  const reflexes =
    baseReflex + (hasTag("Brawling") && (subtype === "unarmed" || subtype === "kick") ? 10 : 0);
  const skillTilde = tilde(baseSkill, baseCool + 50);
  const tildeText = `tilde(${baseSkill}, ${baseCool + 50}) = ${skillTilde.toFixed(2)}`;

  switch (subtype) {
    case "unarmed":
      return `((Body ${body}) / 10) + ((Cool ${baseCool}) / 5) + ((Reflexes ${reflexes}) * (0.01 * ${tildeText})) + 0.75`;
    case "kick":
      return `2 * [((Body ${body}) / 10) + ((Cool ${baseCool}) / 5) + ((Reflexes ${reflexes}) * (0.01 * ${tildeText})) + 0.75]`;
    case "blunt":
      return `((Body ${body}) / 8) + ((WeaponBase ${weaponBase} * 0.01) * ${tildeText})`;
    case "sharp":
      return `[(Body ${body} / 10) + (Cool ${baseCool} / 4)] * ${(weaponBase > 0 ? `${weaponBase} * 0.01` : "1")}`;
    case "whip":
      return `1.5 * [ (Intelligence ${baseInt} / 10) + (Cool ${baseCool} / 5) + (Reflexes ${reflexes} * (0.01 * ${tildeText})) + 0.75 ]`;
    case "slice":
      return `1.5 * [ (Body ${body} / 10) + (Cool ${baseCool} / 3) ] * ${(weaponBase > 0 ? `${weaponBase} * 0.01` : "1")}`;
    case "blast":
      return `1.5 * [ (Technical ${baseTechnical} / 2) + (Reflexes ${reflexes} / 10) + ((WeaponBase ${weaponBase} * 0.01) * ${tildeText}) ]`;
    default:
      return `(Intelligence ${baseInt} / 2) + (Reflexes ${reflexes} / 10) + ((WeaponBase ${weaponBase} * 0.01) * ${tildeText})`;
  }
}

type CyberAdjustParams = {
  dmg: number;
  hitChance: number;
  critChance: number;
  critMult: number;
  attackType: AttackCategory;
  subtype: AttackSubtype;
  attrs: Attributes;
  status: StatusContext;
  cybermods: SerializedCyberMods;
  tags: TagSelections;
};

type CyberAdjustResult = {
  dmg: number;
  hitChance: number;
  critChance: number;
  critMult: number;
  flags: {
    force_crit: boolean;
    disable_crit: boolean;
    force_max_roll: boolean;
  };
  procs: Array<Record<string, number>>;
};

function applyCybermodsToNumbers(params: CyberAdjustParams): CyberAdjustResult {
  let { dmg, hitChance, critChance, critMult } = params;
  const { attackType, subtype, status, cybermods, tags } = params;

  const flags = {
    force_crit: Boolean(status._force_crit),
    disable_crit: false,
    force_max_roll: false,
  };
  const procs: Array<Record<string, number>> = [];

  const isFirstTurn = Boolean(status.is_first_turn);
  const attackingFirst = Boolean(status.attacking_first);
  const hpPercent = Number(
    status.hp_percent === undefined ? 100 : status.hp_percent
  );
  const smartWeapon = Boolean(
    status._weapon_smart ?? status.weapon_is_smart ?? false
  );

  const osKey = syskey("Operating System");
  const osValues = cybermods?.[osKey];
  const osEffects = osValues ? collectOsEffects(osValues) : {};

  Object.entries(cybermods ?? {}).forEach(([rawSystem, ids]) => {
    const systemKey = CYBERMODS_MAP[rawSystem]
      ? rawSystem
      : syskey(rawSystem);
    if (systemKey === osKey) {
      if (!osEffects || Object.keys(osEffects).length === 0) return;
      applyEffects(osEffects);
      return;
    }

    ids.forEach(id => {
      if (!id || id.startsWith("tier:")) return;
      const mod = lookupMod(systemKey, id);
      if (!mod) return;
      applyEffects(mod.effects ?? {});
    });
  });

  const activeTags = tags ?? {};
  if (attackType === "melee" && activeTags["Melee Training"]) {
    critChance += 0.05;
  }
  if (
    activeTags.Fencing &&
    (subtype === "sharp" || subtype === "slice")
  ) {
    critChance += 0.15;
  }
  if (activeTags.Aikido && (subtype === "unarmed" || subtype === "kick")) {
    dmg *= 1.25;
  }
  if (activeTags.Archery && attackType === "ranged" && status._weapon_arrows) {
    hitChance += 0.15;
    critChance += 0.15;
  }
  if (activeTags["Thai Kick Boxing"] && subtype === "kick") {
    dmg *= 1.5;
  }

  hitChance = clamp01(hitChance);
  critChance = flags.disable_crit ? 0 : clamp01(critChance);

  return { dmg, hitChance, critChance, critMult, flags, procs };

  function applyEffects(effects: LooseRecord) {
    if (attackType === "ranged" && effects.ranged_accuracy_add) {
      hitChance += effects.ranged_accuracy_add / 100;
    }
    if (effects.accuracy_set !== undefined) {
      hitChance = effects.accuracy_set / 100;
    }
    if (effects.attack_chance !== undefined) {
      hitChance = Math.max(hitChance, effects.attack_chance / 100);
    }

    if (effects.condition === "smart_weapon" && smartWeapon) {
      if (effects.accuracy_set !== undefined) {
        hitChance = effects.accuracy_set / 100;
      }
      if (effects.crit_rate_set !== undefined) {
        critChance = effects.crit_rate_set / 100;
      }
    }

    if (attackType === "melee" && effects.melee_damage_add) {
      dmg *= 1 + effects.melee_damage_add / 100;
    }
    if (attackType === "ranged" && effects.ranged_damage_add) {
      dmg *= 1 + effects.ranged_damage_add / 100;
    }
    if (
      (subtype === "unarmed" || subtype === "kick") &&
      effects.unarmed_damage_add
    ) {
      dmg *= 1 + effects.unarmed_damage_add / 100;
    }

    if (
      effects.condition === "first_strike" &&
      isFirstTurn &&
      attackingFirst
    ) {
      dmg *= 1 + (effects.damage_add_percent ?? 0) / 100;
    }
    if (
      effects.condition === "hp_below_50" &&
      hpPercent < 50 &&
      attackType === "melee"
    ) {
      dmg *= 1 + (effects.melee_damage_add ?? 0) / 100;
    }
    if (
      effects.condition === "burn_inflicted" &&
      status.has_burn &&
      attackType === "melee"
    ) {
      dmg *= 1 + (effects.melee_damage_add ?? 0) / 100;
    }

    if (status.berserk_active) {
      dmg *= 1 + (effects.damage_add_percent ?? 0) / 100;
      if (effects.crit_reroll_once_per_battle) {
        flags.force_crit = true;
      }
    }

    if (effects.crit_rate_add) {
      critChance += effects.crit_rate_add / 100;
    }
    if (
      (subtype === "unarmed" || subtype === "kick") &&
      effects.unarmed_crit_rate_add
    ) {
      critChance += effects.unarmed_crit_rate_add / 100;
    }
    if (
      (subtype === "unarmed" || subtype === "kick") &&
      effects.unarmed_crit_rate_set
    ) {
      critChance = effects.unarmed_crit_rate_set / 100;
    }
    if (
      (subtype === "unarmed" || subtype === "kick") &&
      effects.unarmed_crit_damage_add
    ) {
      critMult *= 1 + effects.unarmed_crit_damage_add / 100;
    }

    if (
      effects.condition === "sharp_weapon" &&
      (subtype === "sharp" || subtype === "slice") &&
      effects.crit_chance_add
    ) {
      critChance += effects.crit_chance_add / 100;
    }

    if (
      effects.unarmed_disable_crit &&
      (subtype === "unarmed" || subtype === "kick")
    ) {
      flags.disable_crit = true;
    }
    if (effects.crit_auto_on_low_hp && hpPercent <= 20) {
      flags.force_crit = true;
    }
    if (
      effects.unarmed_scale_to_ceiling &&
      (subtype === "unarmed" || subtype === "kick")
    ) {
      flags.force_max_roll = true;
    }

    if (effects.health_points_on_crit) {
      procs.push({ on_crit_heal: effects.health_points_on_crit });
    }
  }
}
