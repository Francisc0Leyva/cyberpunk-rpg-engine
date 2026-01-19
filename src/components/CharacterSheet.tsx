import { useMemo, useState } from "react";
import {
  type Attributes,
  type Character,
  type CivilAttributes,
  type CyberModSystemState,
  type OriginSelection,
  type TagChoices,
  type TagSelections,
  type StatusSelections,
  type WeaponConfig,
} from "../types/character";
import { createDefaultCyberModsState, CYBER_SYSTEMS } from "../data/cyberSystems";
import originsData from "../data/constants/origins.json";
import tagsData from "../data/constants/tags.json";

import { AttributesSection } from "./AttributesSection";
import { CivilAttributesSection } from "./CivilAttributesSection";
import { TagsSection } from "./TagsSection";
import { StatusEffectsSection } from "./StatusEffectSection";
import { WeaponSection } from "./WeaponSection";
import CyberModsSection from "./CyberModsSection";
import { InfoAndResultSection } from "./InfoandResultSection";
import { ReadOnlyCharacter } from "./ReadOnlyCharacter";
import { CyberModsOverview } from "./CyberModsOverview";
import { DiceRollSection } from "./DiceRollSection";
import { OriginsSection } from "./OriginsSection";
import {
  getCivilTagBonusSources,
  type CivilBonusSource,
} from "../lib/civilBonuses";

type TagInfo = {
  description: string;
  choices?: Array<{ id: string; label: string }>;
};

type TagsJson = {
  items?: Record<string, TagInfo & { name?: string }>;
};

const TAG_INFO_BY_NAME = Object.values(
  (tagsData as TagsJson).items ?? {}
).reduce<Record<string, TagInfo>>((acc, item) => {
  if (item?.name) {
    acc[item.name] = {
      description: item.description ?? "",
      choices: item.choices ?? [],
    };
  }
  return acc;
}, {});

const CYBERMOD_DESC_BY_NAME = CYBER_SYSTEMS.reduce<Record<string, string>>(
  (acc, system) => {
    system.mods.forEach(mod => {
      if (mod.name && mod.desc) {
        acc[mod.name] = mod.desc;
      }
    });
    return acc;
  },
  {}
);

type OriginData = {
  id: string;
  grants: {
    tags: string[];
  };
};

const ORIGINS = (originsData as { origins: OriginData[] }).origins;

function getOriginAutoTags(
  originId: string | null,
  choiceTags: string[]
): string[] {
  if (!originId) return [...choiceTags];
  const origin = ORIGINS.find(item => item.id === originId);
  const tags = origin?.grants?.tags ?? [];
  return [...tags, ...choiceTags];
}

function buildSelectionInfo(character: Character): string {
  const lines: string[] = [];

  Object.values(character.cyberMods).forEach(data => {
    (data?.slots ?? []).forEach(slot => {
      if (!slot || slot === "None") return;
      const desc = CYBERMOD_DESC_BY_NAME[slot];
      lines.push(desc ? `${slot}: ${desc}` : slot);
    });
  });

  Object.entries(character.tags).forEach(([name, active]) => {
    if (!active) return;
    const info = TAG_INFO_BY_NAME[name];
    let line = info?.description ? `${name}: ${info.description}` : name;
    const choiceId = character.tagChoices[name];
    if (choiceId && info?.choices?.length) {
      const choice =
        info.choices.find(option => option.id === choiceId) ??
        info.choices.find(option => option.label === choiceId);
      if (choice?.label) {
        line += ` (Choice: ${choice.label})`;
      }
    }
    lines.push(line);
  });

  return lines.length > 0
    ? lines.join("\n")
    : "Select an item to view its description.";
}

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

function defaultTagChoices(): TagChoices {
  return {};
}

function defaultStatusSelections(): StatusSelections {
  return {};
}

function defaultCivilAttributes(): CivilAttributes {
  return {
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
}

function defaultOrigin(): OriginSelection {
  return {
    id: null,
    allocations: {},
    choiceTags: [],
  };
}

export function CharacterSheet() {
  const [character, setCharacter] = useState<Character>(() => ({
    id: crypto.randomUUID(),
    name: "New Character",
    attributes: defaultAttributes(),
    civilAttributes: defaultCivilAttributes(),
    tags: defaultSelections(),
    tagChoices: defaultTagChoices(),
    statusEffects: defaultStatusSelections(),
    weapon: defaultWeapon(),
    cyberMods: createDefaultCyberModsState(),
    origin: defaultOrigin(),
  }));
  const [activeTab, setActiveTab] = useState<
    "edit" | "summary" | "cybermods" | "tags" | "origins"
  >("edit");

  function setAttributes(next: Attributes) {
    setCharacter(prev => ({ ...prev, attributes: next }));
  }

  function setCivilAttributes(next: CivilAttributes) {
    setCharacter(prev => ({ ...prev, civilAttributes: next }));
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
      tagChoices: prev.tags[tagName]
        ? Object.fromEntries(
            Object.entries(prev.tagChoices).filter(
              ([key]) => key !== tagName
            )
          )
        : prev.tagChoices,
    }));
  }

  function setTagChoice(tagName: string, choiceId: string) {
    setCharacter(prev => ({
      ...prev,
      tagChoices: {
        ...prev.tagChoices,
        [tagName]: choiceId,
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

  function handleOriginConfirm(
    nextOrigin: OriginSelection,
    autoTags: string[]
  ) {
    setCharacter(prev => {
      const nextTags = { ...prev.tags };
      const nextChoices = { ...prev.tagChoices };
      const previousAutoTags = getOriginAutoTags(
        prev.origin.id,
        prev.origin.choiceTags
      );
      previousAutoTags.forEach(tag => {
        delete nextTags[tag];
        delete nextChoices[tag];
      });
      autoTags.forEach(tag => {
        nextTags[tag] = true;
      });
      return {
        ...prev,
        origin: nextOrigin,
        tags: nextTags,
        tagChoices: nextChoices,
      };
    });
  }

  const civilBonusSources: CivilBonusSource[] = [
    {
      label: "Origin",
      values: character.origin.allocations,
    },
    ...getCivilTagBonusSources(character.tags, character.tagChoices),
  ];
  const selectionInfo = useMemo(
    () => buildSelectionInfo(character),
    [character]
  );

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
        <button
          className={`tab-button ${
            activeTab === "tags" ? "active" : ""
          }`}
          onClick={() => setActiveTab("tags")}
        >
          Tags
        </button>
        <button
          className={`tab-button ${
            activeTab === "origins" ? "active" : ""
          }`}
          onClick={() => setActiveTab("origins")}
        >
          Origins
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
              <CivilAttributesSection
                attributes={character.civilAttributes}
                bonusSources={civilBonusSources}
                onChange={setCivilAttributes}
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
      ) : activeTab === "cybermods" ? (
        <div className="cybermods-tab">
          <CyberModsSection
            selections={character.cyberMods}
            onSystemChange={updateCyberSystem}
          />
          <CyberModsOverview selections={character.cyberMods} />
        </div>
      ) : activeTab === "tags" ? (
        <div className="tags-tab">
          <TagsSection
            selected={character.tags}
            choices={character.tagChoices}
            onToggle={toggleTag}
            onChoiceChange={setTagChoice}
          />
        </div>
      ) : (
        <div className="origins-tab">
          <OriginsSection
            selected={character.origin}
            baseAttributes={character.civilAttributes}
            onConfirm={handleOriginConfirm}
          />
        </div>
      )}
    </div>
  );
}
