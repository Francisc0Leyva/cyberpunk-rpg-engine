import { useEffect, useMemo, useState } from "react";
import "./AttributesSection.css";

import type { Attributes, AttributeKey } from "../types/character";
import type { AttributeBonusSource } from "../lib/attributeBonuses";
import { sumAttributeBonusSources } from "../lib/attributeBonuses";

type AttributesSectionProps = {
  attributes: Attributes;
  bonusSources?: AttributeBonusSource[];
  pointsSummary?: {
    total: number;
    remaining: number;
    note?: string;
  } | null;
  loreAccurate?: boolean;
  onLoreAccurateChange?: (nextValue: boolean) => void;
  onChange: (next: Attributes) => void;
};

const attributeList: ReadonlyArray<[label: string, key: AttributeKey]> = [
  ["Body", "body"],
  ["Willpower", "willpower"],
  ["Cool", "cool"],
  ["Intelligence", "intelligence"],
  ["Reflexes", "reflexes"],
  ["Skill", "skill"],
  ["Technical Ability", "technical"],
];

const DEFAULT_SOURCES: AttributeBonusSource[] = [];

function getBonus(
  bonuses: Partial<Record<AttributeKey, number>>,
  key: AttributeKey
): number {
  const value = bonuses[key];
  return Number.isFinite(value) ? (value as number) : 0;
}

export function AttributesSection({
  attributes,
  bonusSources = DEFAULT_SOURCES,
  pointsSummary = null,
  loreAccurate = false,
  onLoreAccurateChange,
  onChange,
}: AttributesSectionProps) {
  const [locked, setLocked] = useState(false);
  const bonusTotals = useMemo(
    () => sumAttributeBonusSources(bonusSources),
    [bonusSources]
  );
  const baseTotal = useMemo(
    () =>
      attributeList.reduce(
        (sum, [, key]) => sum + Number(attributes[key] ?? 0),
        0
      ),
    [attributes]
  );
  const totals = useMemo(() => {
    const next: Record<AttributeKey, number> = {
      body: 0,
      willpower: 0,
      cool: 0,
      intelligence: 0,
      reflexes: 0,
      skill: 0,
      technical: 0,
    };
    attributeList.forEach(([, key]) => {
      const raw = Number(attributes[key] ?? 0) + getBonus(bonusTotals, key);
      next[key] = raw;
    });
    return next;
  }, [attributes, bonusTotals]);
  const [drafts, setDrafts] = useState<Record<AttributeKey, string>>(
    () =>
      Object.fromEntries(
        Object.entries(totals).map(([key, value]) => [
          key,
          String(value),
        ])
      ) as Record<AttributeKey, string>
  );

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        Object.entries(totals).map(([key, value]) => [
          key,
          String(value),
        ])
      ) as Record<AttributeKey, string>
    );
  }, [totals]);

  function getMaxBaseForKey(key: AttributeKey) {
    if (!loreAccurate || !pointsSummary) {
      return 50;
    }
    const baselineTotal = attributeList.length * 10;
    const maxBaseTotal = baselineTotal + pointsSummary.total;
    const otherTotal = baseTotal - Number(attributes[key] ?? 0);
    return Math.min(50, maxBaseTotal - otherTotal);
  }

  function getTotalBounds(key: AttributeKey) {
    const bonus = getBonus(bonusTotals, key);
    const minTotal = 10 + bonus;
    const maxBase = getMaxBaseForKey(key);
    const maxTotal = maxBase + bonus;
    return { bonus, minTotal, maxBase, maxTotal };
  }

  function getCurrentValue(key: AttributeKey) {
    const n = Number(drafts[key]);
    if (Number.isFinite(n)) return n;
    return Number(totals[key] ?? 10);
  }

  function updateAttr(key: AttributeKey, value: string) {
    setDrafts(prev => ({
      ...prev,
      [key]: value,
    }));

    const n = Number(value);
    if (!Number.isFinite(n)) return;
    const { bonus, minTotal, maxBase, maxTotal } = getTotalBounds(key);
    if (n < minTotal || n > maxTotal) return;

    const nextBase = n - bonus;
    const clampedBase = Math.max(10, Math.min(maxBase, nextBase));
    onChange({
      ...attributes,
      [key]: clampedBase,
    });
  }

  function commitAttr(key: AttributeKey) {
    const n = Number(drafts[key]);
    const safe = Number.isFinite(n) ? n : totals[key];
    const { bonus, minTotal, maxBase, maxTotal } =
      getTotalBounds(key);
    const clampedTotal = Math.max(
      minTotal,
      Math.min(maxTotal, safe)
    );
    const nextBase = Math.max(10, Math.min(maxBase, clampedTotal - bonus));

    setDrafts(prev => ({
      ...prev,
      [key]: String(nextBase + bonus),
    }));

    if (nextBase !== attributes[key]) {
      onChange({
        ...attributes,
        [key]: nextBase,
      });
    }
  }

  function stepAttr(key: AttributeKey, delta: number) {
    if (locked) return;
    const current = getCurrentValue(key);
    const { minTotal, maxTotal } = getTotalBounds(key);
    const next = Math.max(
      minTotal,
      Math.min(maxTotal, current + delta)
    );
    updateAttr(key, String(next));
  }

  return (
    <div className="block attributes-block">
      <div className="block-title">Attributes</div>
      {loreAccurate ? (
        pointsSummary ? (
          <div className="attribute-points-summary">
            <div className="attribute-points-count">
              Attribute Points: {pointsSummary.remaining} remaining /{" "}
              {pointsSummary.total}
            </div>
            {pointsSummary.note ? (
              <div className="attribute-points-note">
                {pointsSummary.note}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="attribute-points-summary attribute-points-empty">
            Select a class to roll attribute points.
          </div>
        )
      ) : null}

      {attributeList.map(([label, key]) => {
      const bonusLines = bonusSources
        .map(source => ({
          label: source.label,
          value: source.values[key] ?? 0,
        }))
        .filter(entry => Number(entry.value) !== 0);
      const { minTotal, maxBase, maxTotal } = getTotalBounds(key);
      const currentTotal = getCurrentValue(key);
      const canIncrease =
        !locked &&
        (!loreAccurate ||
          !pointsSummary ||
          (pointsSummary.remaining > 0 &&
            Number(attributes[key] ?? 0) < maxBase)) &&
        currentTotal < maxTotal;
      return (
        <div className="attribute-row" key={key}>
          <div className="field-row">
            <label className="label">{label}:</label>
            <div className="stepper-controls">
              <button
                className="stepper-button"
                type="button"
                onClick={() => stepAttr(key, -1)}
                disabled={locked || currentTotal <= minTotal}
              >
                -
              </button>
              <input
                className="input small-input"
                type="number"
                min={minTotal}
                max={maxTotal}
                value={drafts[key]}
                disabled={locked}
                onChange={(e) => updateAttr(key, e.target.value)}
                onBlur={() => commitAttr(key)}
              />
              <button
                className="stepper-button"
                type="button"
                onClick={() => stepAttr(key, 1)}
                disabled={!canIncrease}
              >
                +
              </button>
            </div>
          </div>
            {bonusLines.map(entry => (
              <div
                key={`${key}-${entry.label}`}
                className="attribute-bonus"
              >
                {entry.label} bonus:{" "}
                {entry.value > 0 ? "+" : ""}
                {entry.value}
              </div>
            ))}
          </div>
        );
      })}

      {/* Lock checkbox */}
      <div className="checkbox-row" style={{ marginTop: 6 }}>
        <input
          id="lore-accurate"
          type="checkbox"
          checked={loreAccurate}
          onChange={(e) =>
            onLoreAccurateChange?.(e.target.checked)
          }
        />
        <label htmlFor="lore-accurate">lore accurate</label>
      </div>

      <div className="checkbox-row">
        <input
          id="lock-attrs"
          type="checkbox"
          checked={locked}
          onChange={(e) => setLocked(e.target.checked)}
        />
        <label htmlFor="lock-attrs">Lock Attributes</label>
      </div>
    </div>
  );
}
