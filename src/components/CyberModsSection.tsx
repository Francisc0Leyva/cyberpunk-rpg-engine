import "./CyberModsSection.css";

import { CYBER_SYSTEMS, type SystemConfig } from "../data/cyberSystems";
import type {
  CyberModSystemState,
  CyberModsState,
} from "../types/character";

type CyberModsSectionProps = {
  selections: CyberModsState;
  onSystemChange: (systemName: string, next: CyberModSystemState) => void;
  onSelectInfo?: (info: string) => void;
};

function CyberModsSection({
  selections,
  onSystemChange,
  onSelectInfo,
}: CyberModsSectionProps) {
  return (
    <div className="cybermods-container">
      <h2 className="cybermods-title">Cyber Mods</h2>
      <div className="cybermods-grid">
        {CYBER_SYSTEMS.map(system => (
          <CyberSystemBlock
            key={system.system}
            config={system}
            value={selections[system.system]}
            onChange={next => onSystemChange(system.system, next)}
            onSelectInfo={onSelectInfo}
          />
        ))}
      </div>
    </div>
  );
}

type CyberSystemBlockProps = {
  config: SystemConfig;
  value: CyberModSystemState | undefined;
  onChange: (next: CyberModSystemState) => void;
  onSelectInfo?: (info: string) => void;
};

function CyberSystemBlock({
  config,
  value,
  onChange,
  onSelectInfo,
}: CyberSystemBlockProps) {
  const isHands = config.system === "Hands";

  const baseSlots = config.slots ?? 1;
  const totalSlots = isHands ? baseSlots + 1 : baseSlots;

  const selected = value?.slots ?? Array(totalSlots).fill("None");
  const showExtraSlot =
    isHands && selected.some(name => name === "Pretty Tattoo");

  function handleChange(slotIndex: number, newValue: string) {
    const copy = [...selected];
    copy[slotIndex] = newValue;

    if (newValue === "None") {
      for (let i = slotIndex + 1; i < baseSlots; i++) {
        copy[i] = "None";
      }
    }

    if (isHands) {
      const hasPretty = copy.some(name => name === "Pretty Tattoo");
      if (!hasPretty) {
        copy[totalSlots - 1] = "None";
      }
    }

    onChange({
      slots: copy,
      tier: value?.tier,
    });

    if (newValue === "None") {
      onSelectInfo?.(`${config.system}: Slot cleared`);
    } else {
      const modInfo = config.mods.find(m => m.name === newValue);
      if (modInfo?.desc) {
        onSelectInfo?.(`${modInfo.name}: ${modInfo.desc}`);
      } else {
        onSelectInfo?.(`${config.system}: ${newValue}`);
      }
    }
  }

  function optionsForSlot(slotIndex: number): string[] {
    const base = ["None"];
    const taken = new Set(selected.filter(v => v !== "None"));

    return base.concat(
      config.mods
        .map(m => m.name)
        .filter(name => {
          if (name === selected[slotIndex]) return true;
          return !taken.has(name);
        })
    );
  }

  const prettyPresent = showExtraSlot;

  return (
    <div className="cyber-system-block">
      <div className="cyber-system-name">{config.system}</div>

      {selected.map((value, idx) => {
        if (isHands && idx === totalSlots - 1 && !showExtraSlot) {
          return null;
        }
        let enabled: boolean;

        if (!isHands || idx < baseSlots) {
          enabled = idx === 0 || selected[idx - 1] !== "None";
        } else {
          const extraHasValue = selected[idx] !== "None";
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
        <OSTierRow
          osSelected={selected[0] !== "None"}
          tier={value?.tier ?? ""}
          onTierChange={tier =>
            onChange({
              slots: [...selected],
              tier,
            })
          }
          onSelectInfo={onSelectInfo}
        />
      )}
    </div>
  );
}

type OSTierRowProps = {
  osSelected: boolean;
  tier: string;
  onTierChange: (tier: string) => void;
  onSelectInfo?: (info: string) => void;
};

function OSTierRow({
  osSelected,
  tier,
  onTierChange,
  onSelectInfo,
}: OSTierRowProps) {
  const tiers = ["1", "2", "3", "4", "5", "5A", "5B"];

  return (
    <div className="os-tier-row">
      <span className="os-tier-label">Tier:</span>
      <select
        className="select os-tier-select"
        value={tier}
        onChange={e => {
          onTierChange(e.target.value);
          if (e.target.value) {
            onSelectInfo?.(`Operating System Tier set to ${e.target.value}`);
          } else {
            onSelectInfo?.("Operating System Tier cleared");
          }
        }}
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

export default CyberModsSection;
