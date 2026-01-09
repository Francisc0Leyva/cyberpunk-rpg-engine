import "./TagsSection.css";
import tagsData from "../data/constants/tags.json";
import type { TagSelections } from "../types/character";

// tell TS what the JSON shape is
type TagsJson = {
  tags: Record<string, string>;
};

const TAGS = (tagsData as TagsJson).tags;

type TagsSectionProps = {
  selected: TagSelections;
  onToggle: (tagName: string) => void;
  onSelectInfo?: (info: string) => void;
};

export function TagsSection({
  selected,
  onToggle,
  onSelectInfo,
}: TagsSectionProps) {
  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="tags-container">
      <div className="tags-header">
        <h2 className="section-title">Character Tags</h2>
        <span className="tags-count">{selectedCount} selected</span>
      </div>

      <div className="tags-list">
        {Object.entries(TAGS).map(([name, description]) => (
          <label key={name} className="tag-row">
            <input
              type="checkbox"
              checked={!!selected[name]}
              onChange={() => {
                onToggle(name);
                onSelectInfo?.(`${name}: ${description}`);
              }}
            />
            <div className="tag-text">
              <div className="tag-name">{name}</div>
              <div className="tag-description">{description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
