import React from "react";
import "./CyberModsSection.css";

// 👇 adjust these import paths to match your actual folder structure
import frontalCortexData from "../data/constants/frontal_cortex.json";
import ocularSystemData from "../data/constants/ocular_system.json";
import circulatorySystemData from "../data/constants/circulatory_system.json";
import integumentarySystemData from "../data/constants/integumentary_system.json";
import operatingSystemData from "../data/constants/operating_system.json";
import skeletonData from "../data/constants/skeleton.json";
import handsData from "../data/constants/hands.json";
import armsData from "../data/constants/arms.json";
import legsData from "../data/constants/legs.json";

type CyberMod = {
  id: string;
  name: string;
  desc?: string;
};

type SystemConfig = {
  system: string;       // e.g. "Frontal Cortex"
  slots?: number;       // default 1
  mods: CyberMod[];
};

type SystemJson = SystemConfig; // the JSON matches this

// order to display, like your Python order list
const SYSTEMS: SystemConfig[] = [
  frontalCortexData as SystemJson,
  ocularSystemData as SystemJson,
  circulatorySystemData as SystemJson,
  integumentarySystemData as SystemJson,
  operatingSystemData as SystemJson,
  skeletonData as SystemJson,
  handsData as SystemJson,
  armsData as SystemJson,
  legsData as SystemJson,
];

export function CyberModsSection() {
  return (
    <div className="cybermods-container">
      <h2 className="cybermods-title">Cyber Mods</h2>
      <div className="cybermods-grid">
        {SYSTEMS.map(system => (
          <CyberSystemBlock key={system.system} config={system} />
        ))}
      </div>
    </div>
  );
}

type CyberSystemBlockProps = {
  config: SystemConfig;
};

function CyberSystemBlock({ config }: CyberSystemBlockProps) {
  const isHands = config.system === "Hands";

  const baseSlots = config.slots ?? 1;          // from JSON
  const totalSlots = isHands ? baseSlots + 1 : baseSlots; // +1 extra for Hands

  const [selected, setSelected] = React.useState<string[]>(
    Array(totalSlots).fill("None")
  );

  function handleChange(slotIndex: number, newValue: string) {
    setSelected(prev => {
      const copy = [...prev];
      copy[slotIndex] = newValue;

      // cascade clear *later* base slots if we set one back to None
      // (extra Hands slot is last so this won't affect anything)
      if (newValue === "None") {
        for (let i = slotIndex + 1; i < baseSlots; i++) {
          copy[i] = "None";
        }
      }

      return copy;
    });
  }

  // recompute allowed options for each slot so there are no duplicates
  function optionsForSlot(slotIndex: number): string[] {
    const base = ["None"];
    const taken = new Set(selected.filter(v => v !== "None"));

    return base.concat(
      config.mods
        .map(m => m.name)
        .filter(name => {
          // allow the current value even if it's “taken”
          if (name === selected[slotIndex]) return true;
          return !taken.has(name);
        })
    );
  }

  // Pretty Tattoo logic for Hands extra slot
  const prettyPresent =
    isHands && selected.some(name => name === "Pretty Tattoo");
  const extraIndex = isHands ? totalSlots - 1 : -1;

  return (
    <div className="cyber-system-block">
      <div className="cyber-system-name">{config.system}</div>

      {selected.map((value, idx) => {
        let enabled: boolean;

        if (!isHands || idx < baseSlots) {
          // normal cascade: slot 0 always enabled, others depend on previous
          enabled = idx === 0 || selected[idx - 1] !== "None";
        } else {
          // Hands extra slot
          const extraHasValue = selected[idx] !== "None";
          // Python behavior:
          // - enabled if any slot has Pretty Tattoo
          // - OR if this extra slot already has a value
          enabled = prettyPresent || extraHasValue;
        }

        return (
          <select
            key={idx}
            className="select cyber-select"
            value={value}
            onChange={e => handleChange(idx, e.target.value)}
            disabled={!enabled}
          >
            {optionsForSlot(idx).map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        );
      })}

      {config.system === "Operating System" && (
        <OSTierRow osSelected={selected[0] !== "None"} />
      )}
    </div>
  );
}


type OSTierRowProps = {
  osSelected: boolean;
};

function OSTierRow({ osSelected }: OSTierRowProps) {
  const [tier, setTier] = React.useState<string>("");

  const tiers = ["1", "2", "3", "4", "5", "5A", "5B"];

  return (
    <div className="os-tier-row">
      <span className="os-tier-label">Tier:</span>
      <select
        className="select os-tier-select"
        value={tier}
        onChange={e => setTier(e.target.value)}
        disabled={!osSelected}
      >
        <option value="">–</option>
        {tiers.map(t => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
