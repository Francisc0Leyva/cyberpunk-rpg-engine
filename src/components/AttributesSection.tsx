import { useState } from "react";
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

  function updateAttr(key: AttributeKey, value: string) {
    const n = Number(value);

    // Optional: keep it sane if user deletes the input ("" -> NaN)
    const safe = Number.isFinite(n) ? n : 0;

    onChange({
      ...attributes,
      [key]: safe,
    });
  }

  return (
    <div className="block attributes-block">
      <div className="block-title">Attributes</div>

      {attributeList.map(([label, key]) => (
        <div className="field-row" key={key}>
          <label className="label">{label}:</label>
          <input
            className="input small-input"
            type="number"
            value={attributes[key]}
            disabled={locked}
            onChange={(e) => updateAttr(key, e.target.value)}
          />
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
