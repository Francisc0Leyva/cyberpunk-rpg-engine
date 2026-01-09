export type AttributeKey =
  | "body"
  | "willpower"
  | "cool"
  | "intelligence"
  | "reflexes"
  | "skill"
  | "technical";

export type Attributes = Record<AttributeKey, number>;

export const WEAPON_TYPES = [
  "Unarmed Melee",
  "Blunt Weapon Melee",
  "Sharp Weapon Melee",
  "Ranged Attack",
  "Kick",
  "Grappling",
] as const;

export type WeaponType = (typeof WEAPON_TYPES)[number];

export type WeaponFlags = {
  smart: boolean;
  arrows: boolean;
  alwaysCrit: boolean;
  returned: boolean;
  first: boolean;
};

export type WeaponConfig = {
  type: WeaponType;
  damage: number;
  flags: WeaponFlags;
};

export type TagSelections = Record<string, boolean>;
export type StatusSelections = Record<string, boolean>;

export type CyberModSystemState = {
  slots: string[];
  tier?: string;
};

export type CyberModsState = Record<string, CyberModSystemState>;

export type Character = {
  id: string;
  name: string;
  attributes: Attributes;
  tags: TagSelections;
  statusEffects: StatusSelections;
  weapon: WeaponConfig;
  cyberMods: CyberModsState;
};
