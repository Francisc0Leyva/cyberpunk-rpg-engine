import { useMemo } from "react";
import "./TagsSection.css";
import tagsData from "../data/constants/tags.json";
import type { TagChoices, TagSelections } from "../types/character";

type TagItem = {
  name: string;
  type: string;
  categoryId: string;
  cost: string;
  description: string;
  choices?: Array<{
    id: string;
    label: string;
  }>;
  effects?: unknown[];
};

type TagCategory = {
  id: string;
  name: string;
};

type TagsRules = {
  pointsName?: string;
  costScale?: Record<string, number>;
};

type TagsJson = {
  version: number;
  rules: TagsRules;
  categories: TagCategory[];
  items: Record<string, TagItem>;
};

const TAG_DATA = tagsData as TagsJson;
const TAG_ITEMS = Object.entries(TAG_DATA.items ?? {}).map(
  ([id, item]) => ({
    id,
    ...item,
  })
);
const COST_SCALE = TAG_DATA.rules?.costScale ?? {};

const CATEGORY_ORDER = TAG_DATA.categories ?? [];
const CATEGORY_SET = new Set(CATEGORY_ORDER.map(category => category.id));

const TAGS_BY_CATEGORY = CATEGORY_ORDER.map(category => ({
  ...category,
  items: TAG_ITEMS
    .filter(item => item.categoryId === category.id)
    .sort((a, b) => a.name.localeCompare(b.name)),
}));

const UNCATEGORIZED_TAGS = TAG_ITEMS.filter(
  item => !CATEGORY_SET.has(item.categoryId)
).sort((a, b) => a.name.localeCompare(b.name));

type TagsSectionProps = {
  selected: TagSelections;
  choices: TagChoices;
  onToggle: (tagName: string) => void;
  onChoiceChange: (tagName: string, choiceId: string) => void;
  onSelectInfo?: (info: string) => void;
};

export function TagsSection({
  selected,
  choices,
  onToggle,
  onChoiceChange,
  onSelectInfo,
}: TagsSectionProps) {
  const selectedLabels = useMemo(() => {
    const items = [...TAG_ITEMS, ...UNCATEGORIZED_TAGS];
    return items
      .filter(item => selected[item.name])
      .map(item => {
        const choiceId = choices[item.name];
        if (choiceId && item.choices?.length) {
          const choice = item.choices.find(
            option => option.id === choiceId
          );
          if (choice) {
            return `${item.name} (${choice.label})`;
          }
        }
        return item.name;
      });
  }, [selected, choices]);
  const totalCost = TAG_ITEMS.reduce((sum, item) => {
    if (!selected[item.name]) return sum;
    const cost = COST_SCALE[item.cost];
    if (typeof cost !== "number" || !Number.isFinite(cost)) {
      return sum;
    }
    return sum + cost;
  }, 0);
  const pointsName = TAG_DATA.rules?.pointsName ?? "Tag Points";

  return (
    <div className="tags-page">
      <div className="tags-summary">
        <div className="tags-summary-title">
          <div className="tags-title">Tags</div>
          <div className="tags-selected">
            {selectedLabels.length > 0
              ? selectedLabels.join(", ")
              : "No tags selected"}
          </div>
        </div>
        <div className="tags-cost">
          Costs {totalCost} {pointsName}
        </div>
      </div>

      <div className="tags-grid">
        {TAGS_BY_CATEGORY.map(category => (
          <div key={category.id} className="tag-card">
            <div className="tag-card-title">{category.name}</div>
            <div className="tag-card-list">
              {category.items.map(item => {
                const isSelected = Boolean(selected[item.name]);
                const choiceId = choices[item.name] ?? "";
                return (
                  <div key={item.id} className="tag-row">
                    <label className="tag-row-main">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          onToggle(item.name);
                          onSelectInfo?.(
                            `${item.name}: ${item.description}`
                          );
                        }}
                      />
                      <div className="tag-text">
                        <div className="tag-name">{item.name}</div>
                        <div className="tag-description">
                          {item.description}
                        </div>
                      </div>
                    </label>
                    {isSelected && item.choices?.length ? (
                      <div className="tag-choices">
                        <div className="tag-choices-title">
                          Choose one:
                        </div>
                        {item.choices.map(choice => (
                          <label
                            key={`${item.id}-${choice.id}`}
                            className="tag-choice-option"
                          >
                            <input
                              type="radio"
                              name={`tag-choice-${item.id}`}
                              checked={choiceId === choice.id}
                              onChange={() =>
                                onChoiceChange(item.name, choice.id)
                              }
                            />
                            <span>{choice.label}</span>
                          </label>
                        ))}
                        {!choiceId && (
                          <div className="tag-choice-warning">
                            Select a bonus to apply.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {UNCATEGORIZED_TAGS.length > 0 && (
          <div className="tag-card">
            <div className="tag-card-title">Uncategorized</div>
            <div className="tag-card-list">
            {UNCATEGORIZED_TAGS.map(item => {
              const isSelected = Boolean(selected[item.name]);
              const choiceId = choices[item.name] ?? "";
              return (
                <div key={item.id} className="tag-row">
                  <label className="tag-row-main">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        onToggle(item.name);
                        onSelectInfo?.(
                          `${item.name}: ${item.description}`
                        );
                      }}
                    />
                    <div className="tag-text">
                      <div className="tag-name">{item.name}</div>
                      <div className="tag-description">
                        {item.description}
                      </div>
                    </div>
                  </label>
                  {isSelected && item.choices?.length ? (
                    <div className="tag-choices">
                      <div className="tag-choices-title">
                        Choose one:
                      </div>
                      {item.choices.map(choice => (
                        <label
                          key={`${item.id}-${choice.id}`}
                          className="tag-choice-option"
                        >
                          <input
                            type="radio"
                            name={`tag-choice-${item.id}`}
                            checked={choiceId === choice.id}
                            onChange={() =>
                              onChoiceChange(item.name, choice.id)
                            }
                          />
                          <span>{choice.label}</span>
                        </label>
                      ))}
                      {!choiceId && (
                        <div className="tag-choice-warning">
                          Select a bonus to apply.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
