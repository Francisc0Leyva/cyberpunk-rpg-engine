import { useState } from "react";
import {
  type Attributes,
  type Character,
  type CyberModSystemState,
  type TagSelections,
  type StatusSelections,
  type WeaponConfig,
} from "../types/character";
import { createDefaultCyberModsState } from "../data/cyberSystems";

import { AttributesSection } from "./AttributesSection";
import { TagsSection } from "./TagsSection";
import { StatusEffectsSection } from "./StatusEffectSection";
import { WeaponSection } from "./WeaponSection";
import CyberModsSection from "./CyberModsSection";
import { InfoAndResultSection } from "./InfoandResultSection";
import { ReadOnlyCharacter } from "./ReadOnlyCharacter";
import { CyberModsOverview } from "./CyberModsOverview";
import { DiceRollSection } from "./DiceRollSection";

function defaultAttributes(): Attributes {
  return {
    body: 10,
    willpower: 10,
    cool: 10,
    intelligence: 10,
    reflexes: 10,
    skill: 10,
    technical: 10,
  };
}

function defaultWeapon(): WeaponConfig {
  return {
    type: "Unarmed Melee",
    damage: 0,
    flags: {
      smart: false,
      arrows: false,
      alwaysCrit: false,
      returned: false,
      first: false,
    },
  };
}

function defaultSelections(): TagSelections {
  return {};
}

function defaultStatusSelections(): StatusSelections {
  return {};
}

export function CharacterSheet() {
  const [character, setCharacter] = useState<Character>(() => ({
    id: crypto.randomUUID(),
    name: "New Character",
    attributes: defaultAttributes(),
    tags: defaultSelections(),
    statusEffects: defaultStatusSelections(),
    weapon: defaultWeapon(),
    cyberMods: createDefaultCyberModsState(),
  }));
  const [selectionInfo, setSelectionInfo] = useState(
    "Select an item to view its description."
  );
  const [activeTab, setActiveTab] = useState<
    "edit" | "summary" | "cybermods"
  >("edit");

  function setAttributes(next: Attributes) {
    setCharacter(prev => ({ ...prev, attributes: next }));
  }

  function handleNameChange(value: string) {
    setCharacter(prev => ({ ...prev, name: value }));
  }

  function toggleTag(tagName: string) {
    setCharacter(prev => ({
      ...prev,
      tags: {
        ...prev.tags,
        [tagName]: !prev.tags[tagName],
      },
    }));
  }

  function toggleStatus(name: string) {
    setCharacter(prev => ({
      ...prev,
      statusEffects: {
        ...prev.statusEffects,
        [name]: !prev.statusEffects[name],
      },
    }));
  }

  function updateWeapon(weapon: WeaponConfig) {
    setCharacter(prev => ({ ...prev, weapon }));
  }

  function updateCyberSystem(
    systemName: string,
    next: CyberModSystemState
  ) {
    setCharacter(prev => ({
      ...prev,
      cyberMods: {
        ...prev.cyberMods,
        [systemName]: next,
      },
    }));
  }

  function handleSelectionInfo(info?: string) {
    if (info && info.trim().length > 0) {
      setSelectionInfo(info);
    } else {
      setSelectionInfo("Select an item to view its description.");
    }
  }

  return (
    <div className="character-sheet-wrapper">
      <div className="tab-row">
        <button
          className={`tab-button ${
            activeTab === "edit" ? "active" : ""
          }`}
          onClick={() => setActiveTab("edit")}
        >
          Builder View
        </button>
        <button
          className={`tab-button ${
            activeTab === "summary" ? "active" : ""
          }`}
          onClick={() => setActiveTab("summary")}
        >
          Read-Only Summary
        </button>
        <button
          className={`tab-button ${
            activeTab === "cybermods" ? "active" : ""
          }`}
          onClick={() => setActiveTab("cybermods")}
        >
          Cyber Mods
        </button>
      </div>

      {activeTab === "edit" ? (
        <div className="app-layout">
          <div className="main-column">
            <div className="sheet-header">
              <label className="label" htmlFor="character-name">
                Character Name
              </label>
              <input
                id="character-name"
                className="input"
                type="text"
                value={character.name}
                onChange={e => handleNameChange(e.target.value)}
              />
            </div>

            <div className="app-row">
              <AttributesSection
                attributes={character.attributes}
                onChange={setAttributes}
              />
              <TagsSection
                selected={character.tags}
                onToggle={toggleTag}
                onSelectInfo={handleSelectionInfo}
              />
              <StatusEffectsSection
                selected={character.statusEffects}
                onToggle={toggleStatus}
              />
              <div className="stack-column">
                <DiceRollSection />
                <WeaponSection
                  weapon={character.weapon}
                  tags={character.tags}
                  cyberMods={character.cyberMods}
                  onChange={updateWeapon}
                />
              </div>
            </div>
          </div>

          <div className="side-column">
            <InfoAndResultSection
              character={character}
              selectionInfo={selectionInfo}
            />
          </div>
        </div>
      ) : activeTab === "summary" ? (
        <div className="read-only-container">
          <ReadOnlyCharacter character={character} />
        </div>
      ) : (
        <div className="cybermods-tab">
          <CyberModsSection
            selections={character.cyberMods}
            onSystemChange={updateCyberSystem}
            onSelectInfo={handleSelectionInfo}
          />
          <CyberModsOverview selections={character.cyberMods} />
        </div>
      )}
    </div>
  );
}
