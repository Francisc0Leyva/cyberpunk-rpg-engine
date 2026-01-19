import { useEffect, useState } from "react";
import "./AttributesSection.css";

import type { Attributes, AttributeKey } from "../types/character";

type AttributesSectionProps = {
  attributes: Attributes;
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

export function AttributesSection({
  attributes,
  onChange,
}: AttributesSectionProps) {
  const [locked, setLocked] = useState(false);
  const [drafts, setDrafts] = useState<Record<AttributeKey, string>>(
    () =>
      Object.fromEntries(
        Object.entries(attributes).map(([key, value]) => [
          key,
          String(value),
        ])
      ) as Record<AttributeKey, string>
  );

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        Object.entries(attributes).map(([key, value]) => [
          key,
          String(value),
        ])
      ) as Record<AttributeKey, string>
    );
  }, [attributes]);

  function clamp(value: number) {
    return Math.max(10, Math.min(50, value));
  }

  function getCurrentValue(key: AttributeKey) {
    const n = Number(drafts[key]);
    if (Number.isFinite(n)) return n;
    return Number(attributes[key] ?? 10);
  }

  function updateAttr(key: AttributeKey, value: string) {
    setDrafts(prev => ({
      ...prev,
      [key]: value,
    }));

    const n = Number(value);
    if (!Number.isFinite(n)) return;
    if (n < 10 || n > 50) return;

    onChange({
      ...attributes,
      [key]: n,
    });
  }

  function commitAttr(key: AttributeKey) {
    const n = Number(drafts[key]);
    const safe = Number.isFinite(n) ? n : attributes[key];
    const clamped = clamp(safe);

    setDrafts(prev => ({
      ...prev,
      [key]: String(clamped),
    }));

    if (clamped !== attributes[key]) {
      onChange({
        ...attributes,
        [key]: clamped,
      });
    }
  }

  function stepAttr(key: AttributeKey, delta: number) {
    if (locked) return;
    const current = getCurrentValue(key);
    const next = clamp(current + delta);
    updateAttr(key, String(next));
  }

  return (
    <div className="block attributes-block">
      <div className="block-title">Attributes</div>

      {attributeList.map(([label, key]) => (
        <div className="field-row" key={key}>
          <label className="label">{label}:</label>
          <div className="stepper-controls">
            <button
              className="stepper-button"
              type="button"
              onClick={() => stepAttr(key, -1)}
              disabled={locked || getCurrentValue(key) <= 10}
            >
              -
            </button>
            <input
              className="input small-input"
              type="number"
              min={10}
              max={50}
              value={drafts[key]}
              disabled={locked}
              onChange={(e) => updateAttr(key, e.target.value)}
              onBlur={() => commitAttr(key)}
            />
            <button
              className="stepper-button"
              type="button"
              onClick={() => stepAttr(key, 1)}
              disabled={locked || getCurrentValue(key) >= 50}
            >
              +
            </button>
          </div>
        </div>
      ))}

      {/* Lock checkbox */}
      <div className="checkbox-row" style={{ marginTop: 6 }}>
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
