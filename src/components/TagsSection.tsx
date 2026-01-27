import { useMemo, useState } from "react";
import "./TagsSection.css";
import tagsData from "../data/constants/tags.json";
import type { TagChoices, TagSelections } from "../types/character";

type TagItem = {
  name: string;
  type: string;
  categoryId: string;
  cost: string;
  description: string;
  effects?: TagEffect[];
  choices?: Array<{
    id: string;
    label: string;
    effects?: TagEffect[];
  }>;
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

type TagEffect = {
  kind?: string;
  target?: string;
  status?: string;
};

type EffectFilter =
  | "all"
  | "combat"
  | "civil"
  | "attributes"
  | "checks"
  | "status";

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

function getItemEffects(item: TagItem): TagEffect[] {
  const choiceEffects =
    item.choices?.flatMap(choice => choice.effects ?? []) ?? [];
  return [...(item.effects ?? []), ...choiceEffects];
}

function getTargetPrefix(target?: string) {
  if (!target) return null;
  const [prefix] = target.split(".");
  return prefix ?? null;
}

const COMBAT_ATTRIBUTE_KEYS = new Set(["body", "cool", "reflexes"]);

function isCombatAttributeTarget(target?: string) {
  if (!target) return false;
  if (!target.startsWith("attributes.")) return false;
  const [, key] = target.split(".");
  return Boolean(key && COMBAT_ATTRIBUTE_KEYS.has(key));
}

function matchesCombatEffects(item: TagItem) {
  if (item.categoryId === "martial_arts") return true;
  const effects = getItemEffects(item);
  return effects.some(
    effect =>
      effect.kind === "onHitStatus" ||
      getTargetPrefix(effect.target) === "combat" ||
      isCombatAttributeTarget(effect.target)
  );
}

function renderCost(cost?: string) {
  if (!cost) return null;
  const symbols = cost.split("");
  const allPlus = symbols.every(symbol => symbol === "+");
  if (!allPlus) {
    return <span className="tag-cost-text">{cost}</span>;
  }
  return (
    <span className="tag-cost" aria-label={`Cost ${cost}`}>
      {symbols.map((symbol, index) => (
        <span key={`${symbol}-${index}`} className="tag-cost-plus">
          {symbol}
        </span>
      ))}
    </span>
  );
}

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
  const [search, setSearch] = useState("");
  const [effectFilter, setEffectFilter] =
    useState<EffectFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hasEffectsOnly, setHasEffectsOnly] = useState(false);
  const [costFilter, setCostFilter] = useState("all");
  const lockedSet = useMemo(() => new Set(lockedTags), [lockedTags]);
  const normalizedSearch = search.trim().toLowerCase();
  const costOptions = useMemo(() => {
    return Object.keys(COST_SCALE)
      .filter(Boolean)
      .sort((a, b) => a.length - b.length);
  }, []);
  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    TAG_ITEMS.forEach(item => {
      getItemEffects(item).forEach(effect => {
        if (effect.kind === "onHitStatus" && effect.status) {
          statuses.add(effect.status);
        }
      });
    });
    return Array.from(statuses).sort((a, b) => a.localeCompare(b));
  }, []);
  const matchesSearch = (item: TagItem) => {
    if (!normalizedSearch) return true;
    return (
      item.name.toLowerCase().includes(normalizedSearch) ||
      item.description.toLowerCase().includes(normalizedSearch)
    );
  };
  const matchesFilters = (item: TagItem) => {
    if (!matchesSearch(item)) return false;
    if (costFilter !== "all" && item.cost !== costFilter) {
      return false;
    }
    const effects = getItemEffects(item);
    if (hasEffectsOnly && effects.length === 0) return false;
    if (effectFilter === "all") return true;
    if (effectFilter === "status") {
      const statusEffects = effects.filter(
        effect => effect.kind === "onHitStatus"
      );
      if (statusEffects.length === 0) return false;
      if (statusFilter === "all") return true;
      return statusEffects.some(
        effect => effect.status === statusFilter
      );
    }
    if (effectFilter === "combat") {
      return matchesCombatEffects(item);
    }
    return effects.some(
      effect => getTargetPrefix(effect.target) === effectFilter
    );
  };
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

  const filteredCategories = useMemo(() => {
    return TAGS_BY_CATEGORY.map(category => ({
      ...category,
      items: category.items.filter(matchesFilters),
    })).filter(category => category.items.length > 0);
  }, [
    normalizedSearch,
    effectFilter,
    statusFilter,
    hasEffectsOnly,
    costFilter,
  ]);
  const filteredUncategorized = useMemo(() => {
    return UNCATEGORIZED_TAGS.filter(matchesFilters);
  }, [
    normalizedSearch,
    effectFilter,
    statusFilter,
    hasEffectsOnly,
    costFilter,
  ]);

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
      <div className="tags-filters">
        <input
          className="input tags-search-input"
          type="search"
          placeholder="Search tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="tags-filter">
          <span className="tags-filter-label">What does it do?</span>
          <select
            className="tags-filter-select"
            value={effectFilter}
            onChange={(e) => {
              const next = e.target.value as EffectFilter;
              setEffectFilter(next);
              if (next !== "status") {
                setStatusFilter("all");
              }
            }}
          >
            <option value="all">All effects</option>
            <option value="combat">Affects combat</option>
            <option value="civil">Affects civil</option>
            <option value="attributes">Affects attributes</option>
            <option value="checks">Affects checks</option>
            <option value="status">Status effects</option>
          </select>
        </label>
        {effectFilter === "status" ? (
          <label className="tags-filter">
            <span className="tags-filter-label">Status</span>
            <select
              className="tags-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() +
                    status.slice(1)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="tags-filter">
          <span className="tags-filter-label">Cost</span>
          <select
            className="tags-filter-select"
            value={costFilter}
            onChange={(e) => setCostFilter(e.target.value)}
          >
            <option value="all">All costs</option>
            {costOptions.map(cost => (
              <option key={cost} value={cost}>
                {cost}
              </option>
            ))}
          </select>
        </label>
        <label className="tags-filter-toggle">
          <input
            type="checkbox"
            checked={hasEffectsOnly}
            onChange={(e) => setHasEffectsOnly(e.target.checked)}
          />
          <span>Has effects</span>
        </label>
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
        {filteredCategories.map(category => (
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
                        <div className="tag-name-row">
                          <div className="tag-name">{item.name}</div>
                          {renderCost(item.cost)}
                        </div>
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
        {filteredUncategorized.length > 0 && (
          <div className="tag-card">
            <div className="tag-card-title">Uncategorized</div>
            <div className="tag-card-list">
            {filteredUncategorized.map(item => {
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
                      <div className="tag-name-row">
                        <div className="tag-name">{item.name}</div>
                        {renderCost(item.cost)}
                      </div>
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
