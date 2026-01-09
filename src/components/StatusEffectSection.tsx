import "./StatusEffectSection.css";
import statusData from "../data/constants/status_effects.json";
import type { StatusSelections } from "../types/character";

type StatusJson = {
  status_effects: string[];
};

const STATUS_EFFECTS = (statusData as StatusJson).status_effects;

type StatusEffectsSectionProps = {
  selected: StatusSelections;
  onToggle: (name: string) => void;
};

export function StatusEffectsSection({
  selected,
  onToggle,
}: StatusEffectsSectionProps) {
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
              onChange={() => onToggle(name)}
            />
            <span className="status-name">{name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
