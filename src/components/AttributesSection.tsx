import React from "react";
import "./AttributesSection.css";
export function AttributesSection() {
  return (
    <div className="block attributes-block">
      <div className="block-title">Attributes</div>

      <div className="field-row">
        <label className="label">Body:</label>
        <input className="input small-input" type="number" defaultValue={10} />
      </div>

      <div className="field-row">
        <label className="label">Willpower:</label>
        <input className="input small-input" type="number" defaultValue={10} />
      </div>

      <div className="field-row">
        <label className="label">Cool:</label>
        <input className="input small-input" type="number" defaultValue={10} />
      </div>

      <div className="field-row">
        <label className="label">Intelligence:</label>
        <input className="input small-input" type="number" defaultValue={10} />
      </div>

      <div className="field-row">
        <label className="label">Reflexes:</label>
        <input className="input small-input" type="number" defaultValue={10} />
      </div>

      <div className="field-row">
        <label className="label">Skill:</label>
        <input className="input small-input" type="number" defaultValue={10} />
      </div>

      <div className="field-row">
        <label className="label">Technical Ability:</label>
        <input className="input small-input" type="number" defaultValue={10} />
      </div>

      {/* Lock checkbox */}
      <div className="checkbox-row" style={{ marginTop: 6 }}>
        <input id="lock-attrs" type="checkbox" />
        <label htmlFor="lock-attrs">Lock Attributes</label>
      </div>
    </div>
  );
}
