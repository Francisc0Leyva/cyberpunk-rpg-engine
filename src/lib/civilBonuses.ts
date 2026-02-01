import tagsData from "../data/constants/tags.json";
import type {
  CivilAttributeKey,
  CyberModsState,
  TagChoices,
  TagSelections,
} from "../types/character";
import { CYBER_SYSTEMS } from "../data/cyberSystems";

type TagEffect = {
  kind?: string;
  target?: string;
  op?: string;
  value?: number;
};

type TagChoice = {
  id?: string;
  label?: string;
  effects?: TagEffect[];
};

type TagItem = {
  name: string;
  effects?: TagEffect[];
  choices?: TagChoice[];
};

type TagsJson = {
  items?: Record<string, TagItem>;
};

export type CivilBonusSource = {
  label: string;
  values: Partial<Record<CivilAttributeKey, number>>;
};

const TAGS = tagsData as TagsJson;
const TAG_ITEMS_BY_NAME = Object.values(TAGS.items ?? {}).reduce<
  Record<string, TagItem>
>((acc, item) => {
  if (item?.name) {
    acc[item.name] = item;
  }
  return acc;
}, {});

const CIVIL_TARGETS: Record<string, CivilAttributeKey> = {
  "civil.reputation": "reputation",
  "civil.empathy": "empathy",
  "civil.appeal": "appeal",
  "civil.performance": "performance",
  "civil.crafting": "crafting",
  "civil.driving": "driving",
  "civil.evasion": "evasion",
  "civil.intimidation": "intimidation",
  "civil.luck": "luck",
  "civil.perception": "perception",
  "civil.persuasion": "persuasion",
  "civil.tolerance": "tolerance",
};

const CYBER_CIVIL_EFFECT_KEYS: Record<string, CivilAttributeKey> = {
  appeal_add: "appeal",
  performance_add: "performance",
  crafting_add: "crafting",
  driving_add: "driving",
  evasion_add: "evasion",
  intimidation_add: "intimidation",
  luck_add: "luck",
  gambler_add: "luck",
  perception_add: "perception",
  persuasion_add: "persuasion",
  persuassion_add: "persuasion",
  tolerance_add: "tolerance",
};

export function getCivilTagBonusSources(
  selections: TagSelections,
  choices: TagChoices = {}
): CivilBonusSource[] {
  const sources: CivilBonusSource[] = [];

  Object.entries(selections).forEach(([name, enabled]) => {
    if (!enabled) return;
    const tag = TAG_ITEMS_BY_NAME[name];
    if (!tag) return;
    const values: Partial<Record<CivilAttributeKey, number>> = {};
    const applyEffects = (effects?: TagEffect[]) => {
      if (!effects) return;
      effects.forEach(effect => {
        if (effect.kind !== "stat") return;
        if (effect.op && effect.op !== "add") return;
        const target = effect.target ? CIVIL_TARGETS[effect.target] : null;
        if (!target) return;
        const value = Number(effect.value);
        if (!Number.isFinite(value) || value === 0) return;
        values[target] = (values[target] ?? 0) + value;
      });
    };

    applyEffects(tag.effects);
    const choiceId = choices[name];
    if (choiceId && tag.choices?.length) {
      const choice =
        tag.choices.find(option => option.id === choiceId) ??
        tag.choices.find(option => option.label === choiceId);
      applyEffects(choice?.effects);
    }
    if (Object.keys(values).length > 0) {
      sources.push({ label: name, values });
    }
  });

  return sources;
}

export function sumCivilBonusSources(
  sources: CivilBonusSource[]
): Partial<Record<CivilAttributeKey, number>> {
  const totals: Partial<Record<CivilAttributeKey, number>> = {};
  sources.forEach(source => {
    Object.entries(source.values).forEach(([key, value]) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return;
      const attr = key as CivilAttributeKey;
      totals[attr] = (totals[attr] ?? 0) + numeric;
    });
  });
  return totals;
}

function applyCivilEffects(
  values: Partial<Record<CivilAttributeKey, number>>,
  effects?: Record<string, unknown>
) {
  if (!effects) return;
  Object.entries(CYBER_CIVIL_EFFECT_KEYS).forEach(
    ([effectKey, attrKey]) => {
      const raw = effects[effectKey];
      const numeric = Number(raw);
      if (!Number.isFinite(numeric) || numeric === 0) return;
      values[attrKey] = (values[attrKey] ?? 0) + numeric;
    }
  );
}

export function getCyberCivilBonusSources(
  cyberMods: CyberModsState
): CivilBonusSource[] {
  const sources: CivilBonusSource[] = [];
  const systemByName = CYBER_SYSTEMS.reduce<
    Record<string, (typeof CYBER_SYSTEMS)[number]>
  >((acc, system) => {
    acc[system.system] = system;
    return acc;
  }, {});

  Object.entries(cyberMods).forEach(([systemName, systemState]) => {
    const systemConfig = systemByName[systemName];
    if (!systemConfig) return;
    const selectedMods = (systemState?.slots ?? []).filter(
      name => name && name !== "None"
    );
    selectedMods.forEach(modName => {
      const mod = systemConfig.mods.find(item => item.name === modName);
      if (!mod) return;
      const values: Partial<Record<CivilAttributeKey, number>> = {};
      if (mod.effects && typeof mod.effects === "object") {
        applyCivilEffects(
          values,
          mod.effects as Record<string, unknown>
        );
      }
      if (
        systemName === "Operating System" &&
        mod.base_effects &&
        typeof mod.base_effects === "object"
      ) {
        applyCivilEffects(
          values,
          mod.base_effects as Record<string, unknown>
        );
      }
      if (
        systemName === "Operating System" &&
        mod.tiers &&
        systemState?.tier
      ) {
        const numericTierKey = String(Number(systemState.tier));
        const tierEffects =
          mod.tiers[systemState.tier] ??
          mod.tiers[numericTierKey];
        if (tierEffects && typeof tierEffects === "object") {
          applyCivilEffects(
            values,
            tierEffects as Record<string, unknown>
          );
        }
      }
      if (Object.keys(values).length > 0) {
        sources.push({
          label: mod.name,
          values,
        });
      }
    });
  });

  return sources;
}
