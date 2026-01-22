import { useEffect, useMemo, useState } from "react";
import "./OriginsSection.css";

import originsData from "../data/constants/origins.json";
import civilData from "../data/constants/civil_attributes.json";
import type {
  CivilAttributeKey,
  CivilAttributes,
  OriginSelection,
} from "../types/character";

type OriginChoice = {
  choose: number;
  options: string[];
};

type Origin = {
  id: string;
  name: string;
  description: string;
  bonusPoints: {
    amount: number;
    spendOn: string[];
  };
  grants: {
    tags: string[];
    choices: OriginChoice[];
  };
  recommendedFor: string[];
};

type OriginsJson = {
  origins: Origin[];
};

type CivilAttributeDef = {
  id: CivilAttributeKey;
  name: string;
  min: number;
  max: number;
};

type CivilJson = {
  attributes: CivilAttributeDef[];
};

const ORIGINS = (originsData as OriginsJson).origins;
const CIVIL_ATTRS = (civilData as CivilJson).attributes;

const CIVIL_LIMITS = CIVIL_ATTRS.reduce<
  Record<CivilAttributeKey, { min: number; max: number }>
>((acc, attr) => {
  acc[attr.id] = { min: attr.min, max: attr.max };
  return acc;
}, {} as Record<CivilAttributeKey, { min: number; max: number }>);

const NAME_TO_KEY: Record<string, CivilAttributeKey> = {
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

const EMPTY_ALLOCATIONS: Partial<Record<CivilAttributeKey, number>> = {};

type OriginsSectionProps = {
  selected: OriginSelection;
  baseAttributes: CivilAttributes;
  onChange: (next: OriginSelection, autoTags: string[]) => void;
};

export function OriginsSection({
  selected,
  baseAttributes,
  onChange,
}: OriginsSectionProps) {
  const [activeId, setActiveId] = useState<string | null>(
    selected.id
  );
  const [draftAllocations, setDraftAllocations] = useState<
    Partial<Record<CivilAttributeKey, number>>
  >(selected.allocations ?? EMPTY_ALLOCATIONS);
  useEffect(() => {
    setActiveId(selected.id);
    setDraftAllocations(selected.allocations ?? EMPTY_ALLOCATIONS);
  }, [selected]);

  const activeOrigin = useMemo(
    () => ORIGINS.find(origin => origin.id === activeId) ?? null,
    [activeId]
  );

  const spendableKeys = useMemo(() => {
    if (!activeOrigin) return [] as CivilAttributeKey[];
    return activeOrigin.bonusPoints.spendOn
      .map(name => NAME_TO_KEY[name])
      .filter(Boolean) as CivilAttributeKey[];
  }, [activeOrigin]);

  const spentPoints = spendableKeys.reduce((sum, key) => {
    return sum + (draftAllocations[key] ?? 0);
  }, 0);
  const normalizedAllocations = useMemo(() => {
    const normalized: Partial<Record<CivilAttributeKey, number>> = {};
    spendableKeys.forEach(key => {
      const value = draftAllocations[key] ?? 0;
      if (value > 0) {
        normalized[key] = value;
      }
    });
    return normalized;
  }, [draftAllocations, spendableKeys]);
  const chosenTags = useMemo(() => {
    if (!activeOrigin) return [];
    if (activeOrigin.id === selected.id) {
      return selected.choiceTags ?? [];
    }
    return [];
  }, [activeOrigin, selected.id, selected.choiceTags]);
  const autoTags = useMemo(() => {
    if (!activeOrigin) return [];
    return [
      ...(activeOrigin.grants.tags ?? []),
      ...chosenTags,
    ];
  }, [activeOrigin, chosenTags]);
  function selectionsMatch(
    nextSelection: OriginSelection,
    currentSelection: OriginSelection
  ) {
    if (nextSelection.id !== currentSelection.id) return false;
    const nextAlloc = nextSelection.allocations ?? {};
    const currentAlloc = currentSelection.allocations ?? {};
    const nextKeys = Object.keys(nextAlloc);
    const currentKeys = Object.keys(currentAlloc);
    if (nextKeys.length !== currentKeys.length) return false;
    for (const key of nextKeys) {
      if (
        nextAlloc[key as CivilAttributeKey] !==
        currentAlloc[key as CivilAttributeKey]
      ) {
        return false;
      }
    }
    const nextChoices = nextSelection.choiceTags ?? [];
    const currentChoices = currentSelection.choiceTags ?? [];
    if (nextChoices.length !== currentChoices.length) return false;
    for (let i = 0; i < nextChoices.length; i += 1) {
      if (nextChoices[i] !== currentChoices[i]) return false;
    }
    return true;
  }

  function handleSelect(origin: Origin) {
    setActiveId(origin.id);
    if (origin.id === selected.id) {
      setDraftAllocations(selected.allocations ?? EMPTY_ALLOCATIONS);
    } else {
      setDraftAllocations({});
    }
  }

  function updateAllocation(
    key: CivilAttributeKey,
    nextValue: number
  ) {
    if (!activeOrigin) return;
    const current = draftAllocations[key] ?? 0;
    const totalWithoutCurrent = spentPoints - current;
    const maxByPool = activeOrigin.bonusPoints.amount - totalWithoutCurrent;

    const base = Number(baseAttributes[key] ?? 0);
    const limits = CIVIL_LIMITS[key] ?? { min: -10, max: 10 };
    const maxByCap = limits.max - base;

    const allowedMax = Math.max(0, Math.min(maxByPool, maxByCap));
    const clamped = Math.max(0, Math.min(allowedMax, nextValue));

    setDraftAllocations(prev => ({
      ...prev,
      [key]: clamped,
    }));
  }

  useEffect(() => {
    if (!activeOrigin) return;
    const nextSelection: OriginSelection = {
      id: activeOrigin.id,
      allocations: normalizedAllocations,
      choiceTags: chosenTags,
    };
    if (selectionsMatch(nextSelection, selected)) return;
    onChange(nextSelection, autoTags);
  }, [
    activeOrigin,
    autoTags,
    chosenTags,
    normalizedAllocations,
    onChange,
    selected,
  ]);

  return (
    <div className="origins-page">
      <div className="origins-header">
        <div className="origins-title">Origins</div>
        {activeOrigin ? (
          <div className="origins-points">
            {spentPoints} / {activeOrigin.bonusPoints.amount} points
            allocated
          </div>
        ) : (
          <div className="origins-points">Select an origin</div>
        )}
      </div>

      <div className="origins-grid">
        {ORIGINS.map(origin => {
          const isActive = origin.id === activeId;
          return (
            <div
              key={origin.id}
              className={`origin-card ${isActive ? "active" : ""}`}
              onClick={() => handleSelect(origin)}
            >
              <div className="origin-card-header">
                <div className="origin-card-title">{origin.name}</div>
                <div className="origin-card-points">
                  +{origin.bonusPoints.amount} points
                </div>
              </div>
              <div className="origin-card-description">
                {origin.description}
              </div>
              <div className="origin-card-meta">
                <strong>Spend On:</strong> {origin.bonusPoints.spendOn.join(", ")}
              </div>
              {origin.grants.tags.length > 0 && (
                <div className="origin-card-meta">
                  <strong>Grants:</strong> {origin.grants.tags.join(", ")}
                </div>
              )}
              {origin.recommendedFor.length > 0 && (
                <div className="origin-card-meta">
                  <strong>Recommended:</strong> {origin.recommendedFor.join(", ")}
                </div>
              )}

              {isActive && (
                <div className="origin-card-allocation">
                  <div className="origin-alloc-title">
                    Allocate points
                  </div>
                  {spendableKeys.map(key => {
                    const current = draftAllocations[key] ?? 0;
                    const limits = CIVIL_LIMITS[key];
                    const base = Number(baseAttributes[key] ?? 0);
                    const maxByCap = limits.max - base;
                    const totalWithoutCurrent = spentPoints - current;
                    const maxByPool =
                      origin.bonusPoints.amount - totalWithoutCurrent;
                    const allowedMax = Math.max(
                      0,
                      Math.min(maxByPool, maxByCap)
                    );

                    return (
                      <div key={key} className="origin-alloc-row">
                        <span className="origin-alloc-label">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                        <div className="origin-alloc-controls">
                          <button
                            className="alloc-button"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAllocation(key, current - 1);
                            }}
                            disabled={current <= 0}
                          >
                            -
                          </button>
                          <input
                            className="alloc-input"
                            type="number"
                            min={0}
                            max={allowedMax}
                            value={current}
                            readOnly
                            onClick={e => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateAllocation(key, Number(e.target.value));
                            }}
                          />
                          <button
                            className="alloc-button"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAllocation(key, current + 1);
                            }}
                            disabled={current >= allowedMax}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
