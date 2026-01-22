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

type OriginChoice = {
  choose: number;
  options: string[];
};

type OriginChoiceConfig = {
  originId: string;
  originName: string;
  choices: OriginChoice[];
  selections: string[];
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
  classTagPoints?: {
    expr: string;
    total: number;
  } | null;
  lockedTags?: string[];
  freeTagAllowances?: Record<string, number>;
  originChoice?: OriginChoiceConfig | null;
  onOriginChoiceSelect?: (
    choiceIndex: number,
    option: string
  ) => void;
};

export function TagsSection({
  selected,
  choices,
  onToggle,
  onChoiceChange,
  onSelectInfo,
  classTagPoints = null,
  lockedTags = [],
  freeTagAllowances = {},
  originChoice = null,
  onOriginChoiceSelect,
}: TagsSectionProps) {
  const lockedSet = useMemo(() => new Set(lockedTags), [lockedTags]);
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
  const { totalCost, freeUsage } = useMemo(() => {
    const byCategory = new Map<
      string,
      Array<{ cost: number }>
    >();
    TAG_ITEMS.forEach(item => {
      if (!selected[item.name]) return;
      if (lockedSet.has(item.name)) return;
      const rawCost = COST_SCALE[item.cost];
      const cost =
        typeof rawCost === "number" && Number.isFinite(rawCost)
          ? rawCost
          : 0;
      const categoryId = item.categoryId ?? "uncategorized";
      if (!byCategory.has(categoryId)) {
        byCategory.set(categoryId, []);
      }
      byCategory.get(categoryId)?.push({ cost });
    });

    let total = 0;
    const usage: Record<
      string,
      { total: number; used: number; remaining: number }
    > = {};

    CATEGORY_ORDER.forEach(category => {
      const freeTotal = freeTagAllowances[category.id] ?? 0;
      const list = byCategory.get(category.id) ?? [];
      list.sort((a, b) => b.cost - a.cost);
      let used = 0;
      list.forEach(entry => {
        if (used < freeTotal) {
          used += 1;
        } else {
          total += entry.cost;
        }
      });
      usage[category.id] = {
        total: freeTotal,
        used,
        remaining: Math.max(0, freeTotal - used),
      };
    });

    const uncategorized = byCategory.get("uncategorized") ?? [];
    uncategorized.forEach(entry => {
      total += entry.cost;
    });

    return { totalCost: total, freeUsage: usage };
  }, [selected, lockedSet, freeTagAllowances]);
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
          {classTagPoints ? (
            <span className="tags-class-roll">
              {" "}
              • Class roll: {classTagPoints.expr} ={" "}
              {classTagPoints.total}
            </span>
          ) : null}
        </div>
      </div>

      {originChoice && originChoice.choices.length > 0 ? (
        <div className="origin-bonus-card">
          <div className="origin-bonus-title">
            {originChoice.originName} origin bonus
          </div>
          {originChoice.choices.map((choice, idx) => {
            const selection = originChoice.selections[idx] ?? "";
            const optionText = choice.options.join(" or ");
            return (
              <div key={`${originChoice.originId}-bonus-${idx}`}>
                <div className="origin-bonus-text">
                  {originChoice.originName} origin bonus: select{" "}
                  {optionText}. (Free tag)
                </div>
                <div className="origin-bonus-options">
                  {choice.options.map(option => (
                    <label
                      key={`${originChoice.originId}-${idx}-${option}`}
                      className="origin-bonus-option"
                    >
                      <input
                        type="radio"
                        name={`${originChoice.originId}-bonus-${idx}`}
                        checked={selection === option}
                        onChange={() =>
                          onOriginChoiceSelect?.(idx, option)
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="tags-grid">
        {TAGS_BY_CATEGORY.map(category => (
          <div key={category.id} className="tag-card">
            <div className="tag-card-title">{category.name}</div>
            {freeUsage[category.id]?.total ? (
              <div className="tag-card-free">
                Class free tags: {freeUsage[category.id].total}
                {freeUsage[category.id].remaining !==
                freeUsage[category.id].total
                  ? ` (${freeUsage[category.id].remaining} remaining)`
                  : ""}
              </div>
            ) : null}
            <div className="tag-card-list">
              {category.items.map(item => {
                const isSelected = Boolean(selected[item.name]);
                const isLocked = lockedSet.has(item.name);
                const choiceId = choices[item.name] ?? "";
                return (
                  <div
                    key={item.id}
                    className={`tag-row ${
                      isLocked ? "tag-row-locked" : ""
                    }`}
                  >
                    <label className="tag-row-main">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isLocked}
                        onChange={() => {
                          if (isLocked) return;
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
                        {isLocked && (
                          <div className="tag-choice-lock">
                            Locked by class or origin.
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
              const isLocked = lockedSet.has(item.name);
              const choiceId = choices[item.name] ?? "";
              return (
                <div
                  key={item.id}
                  className={`tag-row ${
                    isLocked ? "tag-row-locked" : ""
                  }`}
                >
                  <label className="tag-row-main">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isLocked}
                      onChange={() => {
                        if (isLocked) return;
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
                      {isLocked && (
                        <div className="tag-choice-lock">
                          Locked by class or origin.
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
