import tagsData from "../data/constants/tags.json";
import type {
  CivilAttributeKey,
  TagChoices,
  TagSelections,
} from "../types/character";

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
