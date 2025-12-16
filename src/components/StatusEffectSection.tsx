import React, { useState } from "react";
import "./StatusEffectSection.css";
import statusData from "../data/constants/status_effects.json";

type StatusJson = {
  status_effects: string[];
};

const STATUS_EFFECTS = (statusData as StatusJson).status_effects;

export function StatusEffectsSection() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  function toggleStatus(name: string) {
    setSelected(prev => ({
      ...prev,
      [name]: !prev[name],
    }));
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="status-container">
      <div className="status-header">
        <h2 className="section-title">Status Effects</h2>
        <span className="status-count">{selectedCount} active</span>
      </div>

      <div className="status-list">
        {STATUS_EFFECTS.map(name => (
          <label key={name} className="status-row">
            <input
              type="checkbox"
              checked={!!selected[name]}
              onChange={() => toggleStatus(name)}
            />
            <span className="status-name">{name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
