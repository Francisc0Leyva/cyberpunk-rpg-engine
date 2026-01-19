import { useEffect, useMemo } from "react";
import "./WeaponSection.css";

import type {
  CyberModSystemState,
  CyberModsState,
  TagSelections,
  WeaponConfig,
  WeaponFlags,
  WeaponType,
} from "../types/character";
import { WEAPON_TYPES } from "../types/character";

type WeaponSectionProps = {
  weapon: WeaponConfig;
  tags: TagSelections;
  cyberMods: CyberModsState;
  onChange: (next: WeaponConfig) => void;
};

export function WeaponSection({
  weapon,
  tags,
  cyberMods,
  onChange,
}: WeaponSectionProps) {
  const isUnarmed = ["Unarmed Melee", "Grappling", "Kick"].includes(weapon.type);

  const systemLookup = useMemo(() => {
    const lookup: Record<string, CyberModSystemState | undefined> = {};
    Object.entries(cyberMods).forEach(([key, value]) => {
      lookup[key] = value;
      lookup[key.toLowerCase()] = value;
    });
    return lookup;
  }, [cyberMods]);

  const armsSlots = systemLookup["arms"]?.slots ?? [];
  const hasMantis = armsSlots.some(slot => slot === "Mantis Blades");
  const hasMonowire = armsSlots.some(slot => slot === "Monowire");
  const hasPLS = armsSlots.some(
    slot => slot === "Projectile Launch System"
  );

  const allowedTypes = useMemo(() => {
    return WEAPON_TYPES.filter(type => {
      if (type === "Kick") {
        return Boolean(tags["Thai Kick Boxing"]);
      }
      if (type === "Grappling") {
        return Boolean(tags["Wrestling"]);
      }
      if (type === "Slice") {
        return hasMantis;
      }
      if (type === "Whip") {
        return hasMonowire;
      }
      if (type === "Blast") {
        return hasPLS;
      }
      return true;
    });
  }, [tags, hasMantis, hasMonowire, hasPLS]);

  useEffect(() => {
    if (allowedTypes.length === 0) return;
    if (!allowedTypes.includes(weapon.type)) {
      const fallback = allowedTypes[0];
      onChange({
        ...weapon,
        type: fallback,
        damage: fallback === "Unarmed Melee" ? 0 : weapon.damage,
      });
    }
  }, [allowedTypes, weapon, onChange]);

  function updateWeapon(partial: Partial<WeaponConfig>) {
    onChange({
      ...weapon,
      ...partial,
    });
  }

  function handleDamageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    if (Number.isNaN(value)) return;
    updateWeapon({ damage: Math.max(0, Math.min(1000, value)) });
  }

  function stepDamage(delta: number) {
    if (isUnarmed) return;
    const next = Math.max(0, Math.min(1000, weapon.damage + delta));
    updateWeapon({ damage: next });
  }

  function handleTypeChange(nextType: WeaponType) {
    updateWeapon({
      type: nextType,
      damage: nextType === "Unarmed Melee" ? 0 : weapon.damage,
    });
  }

  function toggleFlag(key: keyof WeaponFlags) {
    updateWeapon({
      flags: { ...weapon.flags, [key]: !weapon.flags[key] },
    });
  }

  return (
    <div className="weapon-container">
      <h2 className="section-title">Weapon</h2>

      {/* Weapon Type */}
      <div className="field-row">
        <label className="label">Weapon Type</label>
        <select
          className="select"
          value={weapon.type}
          onChange={e => handleTypeChange(e.target.value as WeaponType)}
        >
          {allowedTypes.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Weapon Damage */}
      <div className="field-row">
        <label className="label">Weapon Damage</label>
        <div className="stepper-controls">
          <button
            className="stepper-button"
            type="button"
            onClick={() => stepDamage(-1)}
            disabled={isUnarmed || weapon.damage <= 0}
          >
            -
          </button>
          <input
            type="number"
            min={0}
            max={1000}
            className="input small-input weapon-damage-input"
            value={weapon.damage}
            onChange={handleDamageChange}
            disabled={isUnarmed}
          />
          <button
            className="stepper-button"
            type="button"
            onClick={() => stepDamage(1)}
            disabled={isUnarmed || weapon.damage >= 1000}
          >
            +
          </button>
        </div>
      </div>

      {/* Flags */}
      <div className="weapon-flags">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={weapon.flags.smart}
            onChange={() => toggleFlag("smart")}
          />
          <span>Smart Weapon</span>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={weapon.flags.arrows}
            onChange={() => toggleFlag("arrows")}
          />
          <span>Uses Arrows</span>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={weapon.flags.alwaysCrit}
            onChange={() => toggleFlag("alwaysCrit")}
          />
          <span>Always Crit</span>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={weapon.flags.returned}
            onChange={() => toggleFlag("returned")}
          />
          <span>Returned Attack</span>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={weapon.flags.first}
            onChange={() => toggleFlag("first")}
          />
          <span>Attacking First</span>
        </label>
      </div>

      {/* Debug preview for now – easy to delete later */}
      {/* <pre className="weapon-debug">{JSON.stringify(weaponData, null, 2)}</pre> */}
    </div>
  );
}
