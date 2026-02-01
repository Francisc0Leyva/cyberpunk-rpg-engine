import { useEffect, useMemo, useState } from "react";
import {
  type Attributes,
  type Character,
  type CivilAttributes,
  type CivilAttributeKey,
  type CyberModSystemState,
  type OriginSelection,
  ATTRIBUTE_KEYS,
  type TagChoices,
  type TagSelections,
  type StatusSelections,
  type WeaponConfig,
} from "../types/character";
import { createDefaultCyberModsState, CYBER_SYSTEMS } from "../data/cyberSystems";
import originsData from "../data/constants/origins.json";
import tagsData from "../data/constants/tags.json";
import civilData from "../data/constants/civil_attributes.json";

import { AttributesSection } from "./AttributesSection";
import { CivilAttributesSection } from "./CivilAttributesSection";
import { TagsSection } from "./TagsSection";
import { StatusEffectsSection } from "./StatusEffectSection";
import { WeaponSection } from "./WeaponSection";
import CyberModsSection from "./CyberModsSection";
import { InfoAndResultSection } from "./InfoandResultSection";
import { ReadOnlyCharacter } from "./ReadOnlyCharacter";
import { CyberModsOverview } from "./CyberModsOverview";
import { DiceRollSection } from "./DiceRollSection";
import { OriginsSection } from "./OriginsSection";
import { ClassesSection, type ClassData } from "./ClassesSection";
import {
  getCyberCivilBonusSources,
  getCivilTagBonusSources,
  type CivilBonusSource,
} from "../lib/civilBonuses";
import {
  getAttributeTagBonusSources,
  getCyberAttributeBonusSources,
} from "../lib/attributeBonuses";

type TagInfo = {
  description: string;
  choices?: Array<{ id: string; label: string }>;
};

type TagsJson = {
  items?: Record<string, TagInfo & { name?: string }>;
};

const TAG_INFO_BY_NAME = Object.values(
  (tagsData as TagsJson).items ?? {}
).reduce<Record<string, TagInfo>>((acc, item) => {
  if (item?.name) {
    acc[item.name] = {
      description: item.description ?? "",
      choices: item.choices ?? [],
    };
  }
  return acc;
}, {});

const CYBERMOD_DESC_BY_NAME = CYBER_SYSTEMS.reduce<Record<string, string>>(
  (acc, system) => {
    system.mods.forEach(mod => {
      if (mod.name && mod.desc) {
        acc[mod.name] = mod.desc;
      }
    });
    return acc;
  },
  {}
);

type OriginChoice = {
  choose: number;
  options: string[];
};

type OriginData = {
  id: string;
  name: string;
  grants: {
    tags: string[];
    choices: OriginChoice[];
  };
};

const ORIGINS = (originsData as { origins: OriginData[] }).origins;

type CivilAttributeDef = {
  id: CivilAttributeKey;
  min: number;
  max: number;
};

const CIVIL_LIMITS = (
  civilData as { attributes: CivilAttributeDef[] }
).attributes.reduce<Record<CivilAttributeKey, { min: number; max: number }>>(
  (acc, attr) => {
    acc[attr.id] = { min: attr.min, max: attr.max };
    return acc;
  },
  {} as Record<CivilAttributeKey, { min: number; max: number }>
);

const CLASS_NAME_TO_KEY: Record<string, CivilAttributeKey> = {
  Reputation: "reputation",
  Empathy: "empathy",
  Appeal: "appeal",
  Performance: "performance",
  Crafting: "crafting",
  Driving: "driving",
  Evasion: "evasion",
  Intimidation: "intimidation",
  Luck: "luck",
  Perception: "perception",
  Persuasion: "persuasion",
  Tolerance: "tolerance",
};

type ClassRollNotes = Partial<Record<CivilAttributeKey, string>>;

type FreeTagAllowances = Record<string, number>;

type ClassChoiceOption = {
  id: string;
  label: string;
  tags?: string[];
  freeAllowances?: FreeTagAllowances;
};

type ClassChoiceGroup = {
  id: string;
  label: string;
  options: ClassChoiceOption[];
};

const CLASS_CHOICE_GROUPS: Record<string, ClassChoiceGroup[]> = {
  solo: [
    {
      id: "solo-core",
      label: "Choose one",
      options: [
        {
          id: "strength_training",
          label: "Strength Training",
          tags: ["Strength Training"],
        },
        {
          id: "interrogation_expert",
          label: "Interrogation Expert",
          tags: ["Interrogation Expert"],
        },
      ],
    },
  ],
  fixer: [
    {
      id: "fixer-core",
      label: "Choose one",
      options: [
        {
          id: "strength_training",
          label: "Strength Training",
          tags: ["Strength Training"],
        },
        {
          id: "interrogation_expert",
          label: "Interrogation Expert",
          tags: ["Interrogation Expert"],
        },
      ],
    },
    {
      id: "fixer-social",
      label: "Choose one",
      options: [
        {
          id: "swimmer",
          label: "Swimmer",
          tags: ["Swimmer"],
        },
        {
          id: "aware",
          label: "Aware",
          tags: ["Aware"],
        },
      ],
    },
  ],
  techie: [
    {
      id: "techie-core",
      label: "Choose one",
      options: [
        {
          id: "basic_education",
          label: "Basic Education",
          tags: ["Basic Education"],
        },
        {
          id: "two_int_tags",
          label: "Two Intelligence Tags",
          freeAllowances: { int_tech_skill: 2 },
        },
      ],
    },
  ],
};

const CLASS_FREE_TAG_ALLOWANCES: Record<string, FreeTagAllowances> = {
  solo: { reflex: 1, martial_arts: 1 },
  fixer: { reflex: 1, martial_arts: 1 },
  netrunner: { int_tech_skill: 1 },
  techie: { int_tech_skill: 3, reflex: 2 },
};

function getOriginAutoTags(
  originId: string | null,
  choiceTags: string[]
): string[] {
  if (!originId) return [...choiceTags];
  const origin = ORIGINS.find(item => item.id === originId);
  const tags = origin?.grants?.tags ?? [];
  return [...tags, ...choiceTags];
}

function buildSelectionInfo(character: Character): string {
  const lines: string[] = [];

  Object.values(character.cyberMods).forEach(data => {
    (data?.slots ?? []).forEach(slot => {
      if (!slot || slot === "None") return;
      const desc = CYBERMOD_DESC_BY_NAME[slot];
      lines.push(desc ? `${slot}: ${desc}` : slot);
    });
  });

  Object.entries(character.tags).forEach(([name, active]) => {
    if (!active) return;
    const info = TAG_INFO_BY_NAME[name];
    let line = info?.description ? `${name}: ${info.description}` : name;
    const choiceId = character.tagChoices[name];
    if (choiceId && info?.choices?.length) {
      const choice =
        info.choices.find(option => option.id === choiceId) ??
        info.choices.find(option => option.label === choiceId);
      if (choice?.label) {
        line += ` (Choice: ${choice.label})`;
      }
    }
    lines.push(line);
  });

  return lines.length > 0
    ? lines.join("\n")
    : "Select an item to view its description.";
}

function defaultAttributes(): Attributes {
  return {
    body: 10,
    willpower: 10,
    cool: 10,
    intelligence: 10,
    reflexes: 10,
    skill: 10,
    technical: 10,
  };
}

function defaultWeapon(): WeaponConfig {
  return {
    type: "Unarmed Melee",
    damage: 0,
    flags: {
      smart: false,
      arrows: false,
      alwaysCrit: false,
      returned: false,
      first: false,
    },
  };
}

function defaultSelections(): TagSelections {
  return {};
}

function defaultTagChoices(): TagChoices {
  return {};
}

function defaultStatusSelections(): StatusSelections {
  return {};
}

function defaultCivilAttributes(): CivilAttributes {
  return {
    reputation: 0,
    empathy: 0,
    appeal: 0,
    performance: 0,
    crafting: 0,
    driving: 0,
    evasion: 0,
    intimidation: 0,
    luck: 0,
    perception: 0,
    persuasion: 0,
    tolerance: 0,
  };
}

function defaultOrigin(): OriginSelection {
  return {
    id: null,
    allocations: {},
    choiceTags: [],
  };
}

type RollDetail = {
  label: string;
  rolls: number[];
};

type DefiantSubclassId = "media" | "whistleblower" | "rockerboy";

type RollInfo = {
  total: number;
  rolls: number[];
};

type TagPointsRoll = {
  expr: string;
  total: number;
  rolls: number[];
};

type AttributePointsInfo = {
  total: number;
  note?: string;
};

type DefiantRolls = {
  appealPerformance?: RollInfo | null;
  intimidationPersuasion?: RollInfo | null;
};

type ClassChoiceSelectionsByClass = Record<string, Record<string, string>>;
type NetrunnerAttributeChoice = "roll" | "intelligence";
type ClassAttributeChoicesByClass = Record<
  string,
  NetrunnerAttributeChoice
>;

type DefiantAllocations = {
  appeal: number;
  performance: number;
  intimidation: number;
  persuasion: number;
};

function rollDice(count: number, faces: number): number[] {
  const rolls: number[] = [];
  for (let i = 0; i < count; i += 1) {
    rolls.push(1 + Math.floor(Math.random() * faces));
  }
  return rolls;
}

function buildRollInfo(count: number, faces: number): RollInfo {
  const rolls = rollDice(count, faces);
  return {
    rolls,
    total: rolls.reduce((sum, value) => sum + value, 0),
  };
}

function mergeAllowances(
  base: FreeTagAllowances,
  extra?: FreeTagAllowances
): FreeTagAllowances {
  const next = { ...base };
  if (!extra) return next;
  Object.entries(extra).forEach(([key, value]) => {
    next[key] = (next[key] ?? 0) + value;
  });
  return next;
}

function rollTagPoints(expression: string): TagPointsRoll | null {
  const match = expression.trim().match(/^(\d+)d(\d+)$/i);
  if (!match) return null;
  const count = Number(match[1]);
  const faces = Number(match[2]);
  if (!Number.isFinite(count) || !Number.isFinite(faces)) return null;
  if (count <= 0 || faces <= 0) return null;
  const rolls = rollDice(count, faces);
  return {
    expr: `${count}D${faces}`,
    rolls,
    total: rolls.reduce((sum, value) => sum + value, 0),
  };
}

function evaluateClassExpression(expression: string): {
  total: number;
  note?: string;
  usedDice: boolean;
} {
  const trimmed = expression.trim();
  if (!trimmed) {
    return { total: 0, usedDice: false };
  }
  if (/^[ab]$/i.test(trimmed)) {
    return {
      total: 0,
      usedDice: false,
      note: `Class roll: ${trimmed} (see class notes)`,
    };
  }

  const parts = trimmed.replace(/\s+/g, "").match(/[+-]?[^+-]+/g) ?? [];
  let total = 0;
  const rollDetails: RollDetail[] = [];

  parts.forEach(part => {
    if (!part) return;
    let sign = 1;
    if (part.startsWith("+")) {
      part = part.slice(1);
    } else if (part.startsWith("-")) {
      part = part.slice(1);
      sign = -1;
    }
    if (!part) return;

    const diceMatch = part.match(/^(\d+)d(\d+)$/i);
    if (diceMatch) {
      const count = Number(diceMatch[1]);
      const faces = Number(diceMatch[2]);
      if (count > 0 && faces > 0) {
        const rolls = rollDice(count, faces);
        const sum = rolls.reduce((acc, value) => acc + value, 0);
        total += sign * sum;
        rollDetails.push({
          label: `${sign < 0 ? "-" : ""}${count}D${faces}`,
          rolls,
        });
      }
      return;
    }

    const numeric = Number(part);
    if (Number.isFinite(numeric)) {
      total += sign * numeric;
    }
  });

  const usedDice = rollDetails.length > 0;
  if (!usedDice) {
    return { total, usedDice: false };
  }

  const rollsText = rollDetails
    .map(detail => `${detail.label}: [${detail.rolls.join(", ")}]`)
    .join(", ");
  const note = `Class roll: ${trimmed} (rolled ${rollsText}) = ${total}`;

  return { total, note, usedDice: true };
}

function extractAttributeBasePoints(expression: string): number {
  const match = expression.match(/\d+/);
  if (!match) return 0;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : 0;
}

function parseClassCivilLine(line: string): {
  key: CivilAttributeKey;
  expr: string;
} | null {
  const [rawName, rawExpr] = line.split(":");
  if (!rawName || rawExpr === undefined) return null;
  const key = CLASS_NAME_TO_KEY[rawName.trim()];
  if (!key) return null;
  return { key, expr: rawExpr.trim() };
}

function capitalizeLabel(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function CharacterSheet() {
  const [character, setCharacter] = useState<Character>(() => ({
    id: crypto.randomUUID(),
    name: "New Character",
    attributes: defaultAttributes(),
    civilAttributes: defaultCivilAttributes(),
    tags: defaultSelections(),
    tagChoices: defaultTagChoices(),
    statusEffects: defaultStatusSelections(),
    weapon: defaultWeapon(),
    cyberMods: createDefaultCyberModsState(),
    origin: defaultOrigin(),
  }));
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(
    null
  );
  const [tagResetNotice, setTagResetNotice] = useState<string | null>(
    null
  );
  const [attributeResetNotice, setAttributeResetNotice] = useState<
    string | null
  >(null);
  const [loreAccurate, setLoreAccurate] = useState(false);
  const [classRollNotes, setClassRollNotes] = useState<ClassRollNotes>({});
  const [classTagPointsRoll, setClassTagPointsRoll] =
    useState<TagPointsRoll | null>(null);
  const [classAttributePoints, setClassAttributePoints] =
    useState<AttributePointsInfo | null>(null);
  const [classAttributeChoicesByClass, setClassAttributeChoicesByClass] =
    useState<ClassAttributeChoicesByClass>({});
  const [netrunnerAttributeRoll, setNetrunnerAttributeRoll] =
    useState<RollInfo | null>(null);
  const [classChoiceSelectionsByClass, setClassChoiceSelectionsByClass] =
    useState<ClassChoiceSelectionsByClass>({});
  const [classLockedTags, setClassLockedTags] = useState<string[]>([]);
  const [classFreeTagAllowances, setClassFreeTagAllowances] =
    useState<FreeTagAllowances>({});
  const [defiantSubclass, setDefiantSubclass] =
    useState<DefiantSubclassId | null>(null);
  const [defiantRolls, setDefiantRolls] = useState<DefiantRolls>({});
  const [defiantAllocations, setDefiantAllocations] =
    useState<DefiantAllocations>({
      appeal: 0,
      performance: 0,
      intimidation: 0,
      persuasion: 0,
    });
  const [activeTab, setActiveTab] = useState<
    "edit" | "summary" | "cybermods" | "tags" | "origins" | "classes"
  >("edit");
  const originLockedTags = useMemo(
    () =>
      getOriginAutoTags(
        character.origin.id,
        character.origin.choiceTags
      ),
    [character.origin.id, character.origin.choiceTags]
  );
  const originChoiceConfig = useMemo(() => {
    const origin = ORIGINS.find(
      entry => entry.id === character.origin.id
    );
    if (!origin || !origin.grants?.choices?.length) return null;
    return {
      originId: origin.id,
      originName: origin.name,
      choices: origin.grants.choices,
      selections: character.origin.choiceTags ?? [],
    };
  }, [character.origin.id, character.origin.choiceTags]);
  const allLockedTags = useMemo(
    () => [...originLockedTags, ...classLockedTags],
    [originLockedTags, classLockedTags]
  );
  const classChoiceSelections =
    (selectedClassId &&
      classChoiceSelectionsByClass[selectedClassId]) ||
    {};

  useEffect(() => {
    if (!tagResetNotice) return;
    const timer = window.setTimeout(() => {
      setTagResetNotice(null);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [tagResetNotice]);

  useEffect(() => {
    if (!attributeResetNotice) return;
    const timer = window.setTimeout(() => {
      setAttributeResetNotice(null);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [attributeResetNotice]);

  function setAttributes(next: Attributes) {
    setCharacter(prev => ({ ...prev, attributes: next }));
  }

  function handleLoreAccurateChange(nextValue: boolean) {
    setLoreAccurate(nextValue);
    if (nextValue) {
      setAttributes(defaultAttributes());
      if (!selectedClass) {
        setCivilAttributes(defaultCivilAttributes());
        setClassRollNotes({});
        return;
      }
      if (selectedClass.id === "defiant") {
        applyClassCivil(selectedClass, {
          subclass: defiantSubclass,
          rolls: defiantRolls,
          allocations: defiantAllocations,
        });
      } else {
        applyClassCivil(selectedClass);
      }
    }
  }

  function setCivilAttributes(next: CivilAttributes) {
    setCharacter(prev => ({ ...prev, civilAttributes: next }));
  }

  function handleNameChange(value: string) {
    setCharacter(prev => ({ ...prev, name: value }));
  }

  function toggleTag(tagName: string) {
    if (allLockedTags.includes(tagName)) {
      return;
    }
    setCharacter(prev => ({
      ...prev,
      tags: {
        ...prev.tags,
        [tagName]: !prev.tags[tagName],
      },
      tagChoices: prev.tags[tagName]
        ? Object.fromEntries(
            Object.entries(prev.tagChoices).filter(
              ([key]) => key !== tagName
            )
          )
        : prev.tagChoices,
    }));
  }

  function setTagChoice(tagName: string, choiceId: string) {
    setCharacter(prev => ({
      ...prev,
      tagChoices: {
        ...prev.tagChoices,
        [tagName]: choiceId,
      },
    }));
  }

  function handleOriginChoiceSelect(
    choiceIndex: number,
    option: string
  ) {
    const origin = ORIGINS.find(
      entry => entry.id === character.origin.id
    );
    const originChoices = origin?.grants?.choices ?? [];
    const choiceGroup = originChoices[choiceIndex];
    if (!origin || !choiceGroup) return;
    if (!choiceGroup.options.includes(option)) return;

    setCharacter(prev => {
      if (prev.origin.id !== origin.id) return prev;
      const nextChoices = [...(prev.origin.choiceTags ?? [])];
      const previous = nextChoices[choiceIndex];
      nextChoices[choiceIndex] = option;
      const nextTags = { ...prev.tags };
      const nextTagChoices = { ...prev.tagChoices };

      if (previous && previous !== option) {
        delete nextTags[previous];
        delete nextTagChoices[previous];
      }
      nextTags[option] = true;

      return {
        ...prev,
        origin: {
          ...prev.origin,
          choiceTags: nextChoices,
        },
        tags: nextTags,
        tagChoices: nextTagChoices,
      };
    });
  }

  function toggleStatus(name: string) {
    setCharacter(prev => ({
      ...prev,
      statusEffects: {
        ...prev.statusEffects,
        [name]: !prev.statusEffects[name],
      },
    }));
  }

  function updateWeapon(weapon: WeaponConfig) {
    setCharacter(prev => ({ ...prev, weapon }));
  }

  function updateCyberSystem(
    systemName: string,
    next: CyberModSystemState
  ) {
    setCharacter(prev => ({
      ...prev,
      cyberMods: {
        ...prev.cyberMods,
        [systemName]: next,
      },
    }));
  }

  function computeClassTagRewards(
    classId: string | null,
    selections: Record<string, string>
  ): {
    lockedTags: string[];
    freeAllowances: FreeTagAllowances;
  } {
    if (!classId) {
      return { lockedTags: [], freeAllowances: {} };
    }
    const groups = CLASS_CHOICE_GROUPS[classId] ?? [];
    let freeAllowances = CLASS_FREE_TAG_ALLOWANCES[classId] ?? {};
    const lockedTags: string[] = [];

    groups.forEach(group => {
      const selectedOption = selections[group.id];
      if (!selectedOption) return;
      const option = group.options.find(
        entry => entry.id === selectedOption
      );
      if (!option) return;
      if (option.tags?.length) {
        lockedTags.push(...option.tags);
      }
      if (option.freeAllowances) {
        freeAllowances = mergeAllowances(
          freeAllowances,
          option.freeAllowances
        );
      }
    });

    return { lockedTags, freeAllowances };
  }

  function applyClassTagRewards(
    classId: string | null,
    selections: Record<string, string>,
    options?: { resetTags?: boolean }
  ) {
    const nextRewards = computeClassTagRewards(classId, selections);
    setCharacter(prev => {
      const nextTags = { ...prev.tags };
      const nextChoices = { ...prev.tagChoices };

      if (options?.resetTags) {
        const lockedTags = [
          ...originLockedTags,
          ...nextRewards.lockedTags,
        ];
        const lockedSet = new Set(lockedTags);
        const filteredChoices = Object.fromEntries(
          Object.entries(prev.tagChoices).filter(([tag]) =>
            lockedSet.has(tag)
          )
        );
        const lockedSelections: TagSelections = {};
        lockedTags.forEach(tag => {
          lockedSelections[tag] = true;
        });
        return {
          ...prev,
          tags: lockedSelections,
          tagChoices: filteredChoices,
        };
      }

      classLockedTags.forEach(tag => {
        if (
          !nextRewards.lockedTags.includes(tag) &&
          !originLockedTags.includes(tag)
        ) {
          delete nextTags[tag];
          delete nextChoices[tag];
        }
      });
      nextRewards.lockedTags.forEach(tag => {
        nextTags[tag] = true;
      });
      return {
        ...prev,
        tags: nextTags,
        tagChoices: nextChoices,
      };
    });
    setClassLockedTags(nextRewards.lockedTags);
    setClassFreeTagAllowances(nextRewards.freeAllowances);
  }

  function applyClassCivil(
    classData: ClassData,
    defiantState?: {
      subclass: DefiantSubclassId | null;
      rolls: DefiantRolls;
      allocations: DefiantAllocations;
    }
  ) {
    const nextAttributes: CivilAttributes = defaultCivilAttributes();
    const nextNotes: ClassRollNotes = {};
    const isTechie = classData.id === "techie";
    const isDefiant = classData.id === "defiant";
    let techieRoll: RollInfo | null = null;

    const applyValue = (key: CivilAttributeKey, value: number) => {
      const limits = CIVIL_LIMITS[key] ?? { min: -10, max: 10 };
      nextAttributes[key] = Math.max(
        limits.min,
        Math.min(limits.max, value)
      );
    };

    const defiantSubclassLabel = defiantState?.subclass
      ? capitalizeLabel(defiantState.subclass)
      : "Defiant";

    classData.civilAbilities.forEach(line => {
      const parsed = parseClassCivilLine(line);
      if (!parsed) return;
      const { key, expr } = parsed;
      const exprKey = expr.trim().toUpperCase();

      if (isDefiant && (exprKey === "A" || exprKey === "B")) {
        const subclass = defiantState?.subclass ?? null;
        if (!subclass) {
          applyValue(key, 0);
          nextNotes[key] = "Select a Defiant subclass to roll.";
          return;
        }

        if (exprKey === "A") {
          if (subclass === "rockerboy") {
            const roll = defiantState?.rolls.appealPerformance ?? null;
            const total = roll?.total ?? 0;
            const appeal = defiantState?.allocations.appeal ?? 0;
            const performance =
              defiantState?.allocations.performance ?? 0;
            const remaining = Math.max(
              0,
              total - (appeal + performance)
            );
            const rollsText = roll?.rolls?.length
              ? `[${roll.rolls.join(", ")}]`
              : "[]";
            const note = `Rockerboy roll: 1D4 (rolled ${rollsText}) = ${total} points to split between Appeal and Performance. Allocated: ${appeal}/${performance}. Remaining: ${remaining}.`;
            applyValue("appeal", appeal);
            applyValue("performance", performance);
            nextNotes.appeal = note;
            nextNotes.performance = note;
          } else {
            applyValue("appeal", 0);
            applyValue("performance", 0);
            const note = `Appeal/Performance set to 0 for ${defiantSubclassLabel}.`;
            nextNotes.appeal = note;
            nextNotes.performance = note;
          }
          return;
        }

        if (exprKey === "B") {
          const roll = defiantState?.rolls.intimidationPersuasion ?? null;
          const total = roll?.total ?? 0;
          const intimidation =
            defiantState?.allocations.intimidation ?? 0;
          const persuasion =
            defiantState?.allocations.persuasion ?? 0;
          const remaining = Math.max(
            0,
            total - (intimidation + persuasion)
          );
          const rollLabel =
            roll?.rolls?.length && roll.rolls.length > 1
              ? "2D4"
              : "1D4";
          const rollsText = roll?.rolls?.length
            ? `[${roll.rolls.join(", ")}]`
            : "[]";
          const note = `Defiant roll: ${rollLabel} (rolled ${rollsText}) = ${total} points to split between Intimidation and Persuasion. Allocated: ${intimidation}/${persuasion}. Remaining: ${remaining}.`;
          applyValue("intimidation", intimidation);
          applyValue("persuasion", persuasion);
          nextNotes.intimidation = note;
          nextNotes.persuasion = note;
          return;
        }
      }

      let evaluated = evaluateClassExpression(expr);
      if (isTechie && exprKey === "A") {
        if (!techieRoll) {
          techieRoll = buildRollInfo(2, 4);
        }
        evaluated = {
          total: 0,
          usedDice: true,
          note: `Techie roll: 2D4 (rolled [${techieRoll.rolls.join(", ")}]) = ${
            techieRoll.total
          } points to split between Crafting and Driving.`,
        };
      }

      applyValue(key, evaluated.total);
      if (evaluated.note) {
        nextNotes[key] = evaluated.note;
      }
    });

    setCharacter(prev => ({
      ...prev,
      civilAttributes: nextAttributes,
    }));
    setClassRollNotes(nextNotes);
  }

  function setClassAttributePointsForClass(
    classData: ClassData,
    options?: {
      forceReroll?: boolean;
      choiceOverride?: NetrunnerAttributeChoice;
    }
  ) {
    if (classData.id !== "netrunner") {
      const evaluated = evaluateClassExpression(
        classData.attributePoints
      );
      setClassAttributePoints({
        total: evaluated.total,
        note: evaluated.note,
      });
      setNetrunnerAttributeRoll(null);
      return;
    }

    const basePoints = extractAttributeBasePoints(
      classData.attributePoints
    );
    const storedChoice =
      classAttributeChoicesByClass[classData.id];
    const choice =
      options?.choiceOverride ?? storedChoice ?? "roll";

    if (!storedChoice) {
      setClassAttributeChoicesByClass(prev => ({
        ...prev,
        [classData.id]: choice,
      }));
    }

    if (choice === "intelligence") {
      setClassAttributePoints({
        total: basePoints,
        note: "Netrunner bonus: +10 Intelligence selected.",
      });
      return;
    }

    let roll = netrunnerAttributeRoll;
    if (!roll || options?.forceReroll) {
      roll = buildRollInfo(1, 15);
      setNetrunnerAttributeRoll(roll);
    }
    setClassAttributePoints({
      total: basePoints + roll.total,
      note: `Netrunner roll: 1D15 (rolled [${roll.rolls.join(
        ", "
      )}]) = ${basePoints + roll.total} total points.`,
    });
  }

  function handleClassSelect(classData: ClassData) {
    const classChanged = classData.id !== selectedClassId;
    const shouldRerollTagPoints = classChanged;
    const nextTagRoll = shouldRerollTagPoints
      ? rollTagPoints(classData.tagPoints)
      : classTagPointsRoll;
    const nextSelections =
      classChoiceSelectionsByClass[classData.id] ?? {};

    setSelectedClassId(classData.id);
    setSelectedClass(classData);
    setClassTagPointsRoll(nextTagRoll ?? null);
    applyClassTagRewards(classData.id, nextSelections, {
      resetTags: classChanged,
    });
    if (classChanged) {
      setAttributes(defaultAttributes());
      setClassAttributePointsForClass(classData, {
        forceReroll: true,
      });
      setAttributeResetNotice("Attribute points reset");
    }
    if (classChanged) {
      setTagResetNotice("Tag selections reset");
    }
    if (classData.id === "defiant") {
      applyClassCivil(classData, {
        subclass: defiantSubclass,
        rolls: defiantRolls,
        allocations: defiantAllocations,
      });
      return;
    }

    applyClassCivil(classData);
  }

  function handleDefiantSubclassSelect(
    classData: ClassData,
    subclassId: string
  ) {
    const normalized = subclassId.toLowerCase() as DefiantSubclassId;
    if (selectedClassId !== classData.id) {
      setSelectedClassId(classData.id);
      setSelectedClass(classData);
      setClassTagPointsRoll(
        rollTagPoints(classData.tagPoints) ?? null
      );
      setClassAttributePointsForClass(classData, {
        forceReroll: true,
      });
      setAttributes(defaultAttributes());
      setAttributeResetNotice("Attribute points reset");
    }
    const nextRolls: DefiantRolls = {};

    if (normalized === "rockerboy") {
      nextRolls.appealPerformance = buildRollInfo(1, 4);
      nextRolls.intimidationPersuasion = buildRollInfo(1, 4);
    } else {
      nextRolls.appealPerformance = null;
      nextRolls.intimidationPersuasion = buildRollInfo(2, 4);
    }

    const nextAllocations: DefiantAllocations = {
      appeal: 0,
      performance: 0,
      intimidation: 0,
      persuasion: 0,
    };

    setDefiantSubclass(normalized);
    setDefiantRolls(nextRolls);
    setDefiantAllocations(nextAllocations);

    applyClassCivil(classData, {
      subclass: normalized,
      rolls: nextRolls,
      allocations: nextAllocations,
    });
  }

  function handleDefiantAllocationChange(
    pair: "appealPerformance" | "intimidationPersuasion",
    key:
      | "appeal"
      | "performance"
      | "intimidation"
      | "persuasion",
    delta: number
  ) {
    if (!selectedClass || selectedClass.id !== "defiant") {
      return;
    }
    if (!defiantSubclass) return;

    const total =
      pair === "appealPerformance"
        ? defiantRolls.appealPerformance?.total ?? 0
        : defiantRolls.intimidationPersuasion?.total ?? 0;
    if (total <= 0) return;

    const otherKey =
      pair === "appealPerformance"
        ? key === "appeal"
          ? "performance"
          : "appeal"
        : key === "intimidation"
          ? "persuasion"
          : "intimidation";
    const currentValue = defiantAllocations[key];
    const otherValue = defiantAllocations[otherKey];
    const max = Math.max(0, total - otherValue);
    const nextValue = Math.max(
      0,
      Math.min(max, currentValue + delta)
    );
    const nextAllocations = {
      ...defiantAllocations,
      [key]: nextValue,
    };
    setDefiantAllocations(nextAllocations);
    applyClassCivil(selectedClass, {
      subclass: defiantSubclass,
      rolls: defiantRolls,
      allocations: nextAllocations,
    });
  }

  function handleClassChoiceSelect(
    classData: ClassData,
    groupId: string,
    optionId: string
  ) {
    if (classData.id !== selectedClassId) {
      const nextTagRoll = rollTagPoints(classData.tagPoints);
      setSelectedClassId(classData.id);
      setSelectedClass(classData);
      setClassTagPointsRoll(nextTagRoll ?? null);
      setClassAttributePointsForClass(classData, {
        forceReroll: true,
      });
      setAttributes(defaultAttributes());
      setAttributeResetNotice("Attribute points reset");
      applyClassCivil(classData);
    }
    setClassChoiceSelectionsByClass(prev => {
      const nextForClass = {
        ...(prev[classData.id] ?? {}),
        [groupId]: optionId,
      };
      return {
        ...prev,
        [classData.id]: nextForClass,
      };
    });
    applyClassTagRewards(classData.id, {
      ...(classChoiceSelectionsByClass[classData.id] ?? {}),
      [groupId]: optionId,
    });
  }

  function handleAttributePointChoice(
    classData: ClassData,
    choiceId: NetrunnerAttributeChoice
  ) {
    if (classData.id !== selectedClassId) {
      handleClassSelect(classData);
    }
    const previousChoice =
      classAttributeChoicesByClass[classData.id];
    const choiceChanged = previousChoice !== choiceId;
    setClassAttributeChoicesByClass(prev => ({
      ...prev,
      [classData.id]: choiceId,
    }));
    setClassAttributePointsForClass(classData, {
      choiceOverride: choiceId,
      forceReroll: choiceChanged && choiceId === "roll",
    });
  }

  function handleOriginConfirm(
    nextOrigin: OriginSelection,
    autoTags: string[]
  ) {
    setCharacter(prev => {
      const nextTags = { ...prev.tags };
      const nextChoices = { ...prev.tagChoices };
      const previousAutoTags = getOriginAutoTags(
        prev.origin.id,
        prev.origin.choiceTags
      );
      previousAutoTags.forEach(tag => {
        delete nextTags[tag];
        delete nextChoices[tag];
      });
      autoTags.forEach(tag => {
        nextTags[tag] = true;
      });
      return {
        ...prev,
        origin: nextOrigin,
        tags: nextTags,
        tagChoices: nextChoices,
      };
    });
  }

  const civilBonusSources: CivilBonusSource[] = useMemo(
    () => [
      {
        label: "Origin",
        values: character.origin.allocations,
      },
      ...getCyberCivilBonusSources(character.cyberMods),
      ...getCivilTagBonusSources(character.tags, character.tagChoices),
    ],
    [
      character.origin.allocations,
      character.cyberMods,
      character.tags,
      character.tagChoices,
    ]
  );
  const classAttributeBonusSources = useMemo(() => {
    if (selectedClassId !== "netrunner") return [];
    const choice = classAttributeChoicesByClass[selectedClassId];
    if (choice !== "intelligence") return [];
    return [
      {
        label: "Netrunner",
        values: { intelligence: 10 },
      },
    ];
  }, [selectedClassId, classAttributeChoicesByClass]);
  const attributeBonusSources = useMemo(
    () => [
      ...classAttributeBonusSources,
      ...getCyberAttributeBonusSources(character.cyberMods),
      ...getAttributeTagBonusSources(
        character.tags,
        character.tagChoices
      ),
    ],
    [
      classAttributeBonusSources,
      character.cyberMods,
      character.tags,
      character.tagChoices,
    ]
  );
  const attributePointsSummary = useMemo(() => {
    if (!classAttributePoints) return null;
    const baseTotal = ATTRIBUTE_KEYS.length * 10;
    const spent =
      ATTRIBUTE_KEYS.reduce(
        (sum, key) => sum + Number(character.attributes[key] ?? 0),
        0
      ) - baseTotal;
    return {
      total: classAttributePoints.total,
      remaining: classAttributePoints.total - spent,
      note: classAttributePoints.note,
    };
  }, [classAttributePoints, character.attributes]);
  const selectionInfo = useMemo(
    () => buildSelectionInfo(character),
    [character]
  );

  return (
    <div className="character-sheet-wrapper">
      {tagResetNotice || attributeResetNotice ? (
        <div className="toast-stack" role="status">
          {tagResetNotice ? (
            <div className="toast-item">{tagResetNotice}</div>
          ) : null}
          {attributeResetNotice ? (
            <div className="toast-item">{attributeResetNotice}</div>
          ) : null}
        </div>
      ) : null}
      <div className="tab-row">
        <button
          className={`tab-button ${
            activeTab === "edit" ? "active" : ""
          }`}
          onClick={() => setActiveTab("edit")}
        >
          Builder View
        </button>
        <button
          className={`tab-button ${
            activeTab === "classes" ? "active" : ""
          }`}
          onClick={() => setActiveTab("classes")}
        >
          Class
        </button>
        <button
          className={`tab-button ${
            activeTab === "origins" ? "active" : ""
          }`}
          onClick={() => setActiveTab("origins")}
        >
          Origins
        </button>
        <button
          className={`tab-button ${
            activeTab === "tags" ? "active" : ""
          }`}
          onClick={() => setActiveTab("tags")}
        >
          Tags
        </button>
        <button
          className={`tab-button ${
            activeTab === "cybermods" ? "active" : ""
          }`}
          onClick={() => setActiveTab("cybermods")}
        >
          Cyber Mods
        </button>
        <button
          className={`tab-button ${
            activeTab === "summary" ? "active" : ""
          }`}
          onClick={() => setActiveTab("summary")}
        >
          Read-Only Summary
        </button>
      </div>

      {activeTab === "edit" ? (
        <div className="app-layout">
          <div className="main-column">
            <div className="sheet-header">
              <label className="label" htmlFor="character-name">
                Character Name
              </label>
              <input
                id="character-name"
                className="input"
                type="text"
                value={character.name}
                onChange={e => handleNameChange(e.target.value)}
              />
            </div>

            <div className="app-row">
              <AttributesSection
                attributes={character.attributes}
                bonusSources={attributeBonusSources}
                pointsSummary={attributePointsSummary}
                loreAccurate={loreAccurate}
                onLoreAccurateChange={handleLoreAccurateChange}
                onChange={setAttributes}
              />
              <CivilAttributesSection
                attributes={character.civilAttributes}
                bonusSources={civilBonusSources}
                rollNotes={classRollNotes}
                loreAccurate={loreAccurate}
                onLoreAccurateChange={handleLoreAccurateChange}
                onChange={setCivilAttributes}
              />
              <StatusEffectsSection
                selected={character.statusEffects}
                onToggle={toggleStatus}
              />
              <div className="stack-column">
                <DiceRollSection />
                <WeaponSection
                  weapon={character.weapon}
                  tags={character.tags}
                  cyberMods={character.cyberMods}
                  onChange={updateWeapon}
                />
              </div>
            </div>
          </div>

          <div className="side-column">
            <InfoAndResultSection
              character={character}
              selectionInfo={selectionInfo}
            />
          </div>
        </div>
      ) : activeTab === "summary" ? (
        <div className="read-only-container">
          <ReadOnlyCharacter
            character={character}
            attributeBonusSources={attributeBonusSources}
          />
        </div>
      ) : activeTab === "cybermods" ? (
        <div className="cybermods-tab">
          <CyberModsSection
            selections={character.cyberMods}
            onSystemChange={updateCyberSystem}
          />
          <CyberModsOverview selections={character.cyberMods} />
        </div>
      ) : activeTab === "tags" ? (
        <div className="tags-tab">
          <TagsSection
            selected={character.tags}
            choices={character.tagChoices}
            onToggle={toggleTag}
            onChoiceChange={setTagChoice}
            classTagPoints={classTagPointsRoll}
            lockedTags={allLockedTags}
            freeTagAllowances={classFreeTagAllowances}
            originChoice={originChoiceConfig}
            onOriginChoiceSelect={handleOriginChoiceSelect}
          />
        </div>
      ) : activeTab === "origins" ? (
        <div className="origins-tab">
          <OriginsSection
            selected={character.origin}
            baseAttributes={character.civilAttributes}
            onChange={handleOriginConfirm}
          />
        </div>
      ) : (
        <div className="classes-tab">
          <ClassesSection
            selectedId={selectedClassId}
            onSelect={handleClassSelect}
            classChoiceGroups={CLASS_CHOICE_GROUPS}
            classChoiceSelections={classChoiceSelections}
            onClassChoiceSelect={handleClassChoiceSelect}
            attributePointChoices={classAttributeChoicesByClass}
            onAttributePointChoice={handleAttributePointChoice}
            defiantSubclass={defiantSubclass}
            defiantRolls={defiantRolls}
            defiantAllocations={defiantAllocations}
            onDefiantSubclassSelect={handleDefiantSubclassSelect}
            onDefiantAllocationChange={handleDefiantAllocationChange}
          />
        </div>
      )}
    </div>
  );
}
