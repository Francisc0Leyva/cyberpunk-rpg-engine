import tagsData from "../data/constants/tags.json";
import type {
  AttributeKey,
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

export type AttributeBonusSource = {
  label: string;
  values: Partial<Record<AttributeKey, number>>;
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

const ATTRIBUTE_TARGETS: Record<string, AttributeKey> = {
  "attributes.body": "body",
  "attributes.willpower": "willpower",
  "attributes.cool": "cool",
  "attributes.intelligence": "intelligence",
  "attributes.reflexes": "reflexes",
  "attributes.skill": "skill",
  "attributes.technical": "technical",
  "attributes.technical_ability": "technical",
};

export function getAttributeTagBonusSources(
  selections: TagSelections,
  choices: TagChoices = {}
): AttributeBonusSource[] {
  const sources: AttributeBonusSource[] = [];

  Object.entries(selections).forEach(([name, enabled]) => {
    if (!enabled) return;
    const tag = TAG_ITEMS_BY_NAME[name];
    if (!tag) return;
    const values: Partial<Record<AttributeKey, number>> = {};
    const applyEffects = (effects?: TagEffect[]) => {
      if (!effects) return;
      effects.forEach(effect => {
        if (effect.kind !== "stat") return;
        if (effect.op && effect.op !== "add") return;
        const target = effect.target
          ? ATTRIBUTE_TARGETS[effect.target]
          : null;
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

export function sumAttributeBonusSources(
  sources: AttributeBonusSource[]
): Partial<Record<AttributeKey, number>> {
  const totals: Partial<Record<AttributeKey, number>> = {};
  sources.forEach(source => {
    Object.entries(source.values).forEach(([key, value]) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return;
      const attr = key as AttributeKey;
      totals[attr] = (totals[attr] ?? 0) + numeric;
    });
  });
  return totals;
}
