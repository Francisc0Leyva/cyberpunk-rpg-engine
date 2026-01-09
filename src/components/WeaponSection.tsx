import React from "react";
import "./WeaponSection.css";

import type {
  WeaponConfig,
  WeaponFlags,
  WeaponType,
} from "../types/character";
import { WEAPON_TYPES } from "../types/character";

type WeaponSectionProps = {
  weapon: WeaponConfig;
  onChange: (next: WeaponConfig) => void;
};

export function WeaponSection({ weapon, onChange }: WeaponSectionProps) {
  const isUnarmed = weapon.type === "Unarmed Melee";

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
          {WEAPON_TYPES.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Weapon Damage */}
      <div className="field-row">
        <label className="label">Weapon Damage</label>
        <input
          type="number"
          min={0}
          max={1000}
          className="input small-input"
          value={weapon.damage}
          onChange={handleDamageChange}
          disabled={isUnarmed}
        />
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
