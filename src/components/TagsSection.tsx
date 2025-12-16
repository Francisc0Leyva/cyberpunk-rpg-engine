import React, { useState } from "react";
import "./TagsSection.css";
import tagsData from "../data/constants/tags.json";

// tell TS what the JSON shape is
type TagsJson = {
  tags: Record<string, string>;
};

const TAGS = (tagsData as TagsJson).tags;

export function TagsSection() {
  // keep track of which tags are selected (we'll use this later for logic)
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  function toggleTag(tagName: string) {
    setSelected(prev => ({
      ...prev,
      [tagName]: !prev[tagName],
    }));
  }

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
              onChange={() => toggleTag(name)}
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
