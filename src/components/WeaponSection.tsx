import React, { useEffect, useState } from "react";
import "./WeaponSection.css";

const WEAPON_TYPES = [
  "Unarmed Melee",
  "Blunt Weapon Melee",
  "Sharp Weapon Melee",
  "Ranged Attack",
  "Kick",
  "Grappling",
] as const;

type WeaponType = (typeof WEAPON_TYPES)[number];

type WeaponFlags = {
  smart: boolean;
  arrows: boolean;
  alwaysCrit: boolean;
  returned: boolean;
  first: boolean;
};

export function WeaponSection() {
  const [weaponType, setWeaponType] = useState<WeaponType>("Unarmed Melee");
  const [weaponDamage, setWeaponDamage] = useState<number>(0);

  const [flags, setFlags] = useState<WeaponFlags>({
    smart: false,
    arrows: false,
    alwaysCrit: false,
    returned: false,
    first: false,
  });

  const isUnarmed = weaponType === "Unarmed Melee";

  // Mimic toggle_weapon_damage: when unarmed, force damage to 0 & disable input
  useEffect(() => {
    if (isUnarmed) {
      setWeaponDamage(0);
    }
  }, [isUnarmed]);

  function handleDamageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    if (Number.isNaN(value)) return;
    setWeaponDamage(Math.max(0, Math.min(1000, value)));
  }

  function toggleFlag(key: keyof WeaponFlags) {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // Later we can lift this up to parent via props
  const weaponData = {
    type: weaponType,
    damage: isUnarmed ? 0 : weaponDamage,
    ...flags,
  };

  return (
    <div className="weapon-container">
      <h2 className="section-title">Weapon</h2>

      {/* Weapon Type */}
      <div className="field-row">
        <label className="label">Weapon Type</label>
        <select
          className="select"
          value={weaponType}
          onChange={e => setWeaponType(e.target.value as WeaponType)}
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
          value={weaponDamage}
          onChange={handleDamageChange}
          disabled={isUnarmed}
        />
      </div>

      {/* Flags */}
      <div className="weapon-flags">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={flags.smart}
            onChange={() => toggleFlag("smart")}
          />
          <span>Smart Weapon</span>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={flags.arrows}
            onChange={() => toggleFlag("arrows")}
          />
          <span>Uses Arrows</span>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={flags.alwaysCrit}
            onChange={() => toggleFlag("alwaysCrit")}
          />
          <span>Always Crit</span>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={flags.returned}
            onChange={() => toggleFlag("returned")}
          />
          <span>Returned Attack</span>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={flags.first}
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
