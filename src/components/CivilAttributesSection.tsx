import { useEffect, useMemo, useState } from "react";
import "./CivilAttributesSection.css";

import type {
  CivilAttributes,
  CivilAttributeKey,
} from "../types/character";
import type { CivilBonusSource } from "../lib/civilBonuses";
import { sumCivilBonusSources } from "../lib/civilBonuses";
import civilData from "../data/constants/civil_attributes.json";

type CivilAttributeDef = {
  id: CivilAttributeKey;
  name: string;
  description: string;
  min: number;
  max: number;
};

type CivilJson = {
  attributes: CivilAttributeDef[];
};

const CIVIL_ATTRIBUTES = (civilData as CivilJson).attributes;

const DEFAULT_SOURCES: CivilBonusSource[] = [];

function getBonus(
  bonuses: Partial<Record<CivilAttributeKey, number>>,
  key: CivilAttributeKey
): number {
  const value = bonuses[key];
  return Number.isFinite(value) ? (value as number) : 0;
}

function getTotal(
  base: CivilAttributes,
  bonuses: Partial<Record<CivilAttributeKey, number>>,
  key: CivilAttributeKey,
  limits: { min: number; max: number }
): number {
  const raw = Number(base[key] ?? 0) + getBonus(bonuses, key);
  return Math.max(limits.min, Math.min(limits.max, raw));
}

type CivilAttributesSectionProps = {
  attributes: CivilAttributes;
  bonusSources?: CivilBonusSource[];
  onChange: (next: CivilAttributes) => void;
};

export function CivilAttributesSection({
  attributes,
  bonusSources = DEFAULT_SOURCES,
  onChange,
}: CivilAttributesSectionProps) {
  const bonusTotals = useMemo(
    () => sumCivilBonusSources(bonusSources),
    [bonusSources]
  );
  const totals = useMemo(() => {
    const next: Record<CivilAttributeKey, number> = {
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
    CIVIL_ATTRIBUTES.forEach(attr => {
      next[attr.id] = getTotal(
        attributes,
        bonusTotals,
        attr.id,
        { min: attr.min, max: attr.max }
      );
    });
    return next;
  }, [attributes, bonusTotals]);

  const [drafts, setDrafts] = useState<Record<CivilAttributeKey, string>>(
    () =>
      Object.fromEntries(
        Object.entries(totals).map(([key, value]) => [
          key,
          String(value),
        ])
      ) as Record<CivilAttributeKey, string>
  );

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        Object.entries(totals).map(([key, value]) => [
          key,
          String(value),
        ])
      ) as Record<CivilAttributeKey, string>
    );
  }, [totals]);

  function clamp(attr: CivilAttributeDef, value: number) {
    return Math.max(attr.min, Math.min(attr.max, value));
  }

  function getCurrentValue(attr: CivilAttributeDef) {
    const n = Number(drafts[attr.id]);
    if (Number.isFinite(n)) return n;
    return getTotal(attributes, bonusTotals, attr.id, {
      min: attr.min,
      max: attr.max,
    });
  }

  function updateAttr(attr: CivilAttributeDef, value: string) {
    setDrafts(prev => ({
      ...prev,
      [attr.id]: value,
    }));

    const n = Number(value);
    if (!Number.isFinite(n)) return;
    if (n < attr.min || n > attr.max) return;

    const bonus = getBonus(bonusTotals, attr.id);
    const nextBase = n - bonus;
    onChange({
      ...attributes,
      [attr.id]: nextBase,
    });
  }

  function commitAttr(attr: CivilAttributeDef) {
    const raw = Number(drafts[attr.id]);
    const bonus = getBonus(bonusTotals, attr.id);
    const currentTotal = getTotal(attributes, bonusTotals, attr.id, {
      min: attr.min,
      max: attr.max,
    });
    const safe = Number.isFinite(raw) ? raw : currentTotal;
    const clamped = clamp(attr, safe);
    const nextBase = clamped - bonus;

    setDrafts(prev => ({
      ...prev,
      [attr.id]: String(clamped),
    }));

    if (nextBase !== attributes[attr.id]) {
      onChange({
        ...attributes,
        [attr.id]: nextBase,
      });
    }
  }

  function stepAttr(attr: CivilAttributeDef, delta: number) {
    const current = getCurrentValue(attr);
    const next = clamp(attr, current + delta);
    updateAttr(attr, String(next));
  }

  return (
    <div className="civil-attributes-block">
      <div className="block-title">Civil Attributes</div>

      {CIVIL_ATTRIBUTES.map(attr => {
        const bonusLines = bonusSources
          .map(source => ({
            label: source.label,
            value: source.values[attr.id] ?? 0,
          }))
          .filter(entry => Number(entry.value) !== 0);
        return (
          <div key={attr.id} className="civil-attribute">
            <div className="civil-attribute-header">
              <label className="label">{attr.name}</label>
              <div className="stepper-controls">
                <button
                  className="stepper-button"
                  type="button"
                  onClick={() => stepAttr(attr, -1)}
                  disabled={getCurrentValue(attr) <= attr.min}
                >
                  -
                </button>
                <input
                  className="input civil-input"
                  type="number"
                  min={attr.min}
                  max={attr.max}
                  value={drafts[attr.id]}
                  onChange={(e) => updateAttr(attr, e.target.value)}
                  onBlur={() => commitAttr(attr)}
                />
                <button
                  className="stepper-button"
                  type="button"
                  onClick={() => stepAttr(attr, 1)}
                  disabled={getCurrentValue(attr) >= attr.max}
                >
                  +
                </button>
              </div>
            </div>
            <div className="civil-attribute-description">
              {attr.description}
            </div>
            {bonusLines.map(entry => (
              <div
                key={`${attr.id}-${entry.label}`}
                className="civil-attribute-bonus"
              >
                {entry.label} bonus:{" "}
                {entry.value > 0 ? "+" : ""}
                {entry.value}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
