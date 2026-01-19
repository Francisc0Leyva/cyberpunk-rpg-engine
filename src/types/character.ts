export type AttributeKey =
  | "body"
  | "willpower"
  | "cool"
  | "intelligence"
  | "reflexes"
  | "skill"
  | "technical";

export type Attributes = Record<AttributeKey, number>;

export const ATTRIBUTE_KEYS: AttributeKey[] = [
  "body",
  "willpower",
  "cool",
  "intelligence",
  "reflexes",
  "skill",
  "technical",
];

export type CivilAttributeKey =
  | "reputation"
  | "empathy"
  | "appeal"
  | "performance"
  | "crafting"
  | "driving"
  | "evasion"
  | "intimidation"
  | "luck"
  | "perception"
  | "persuasion"
  | "tolerance";

export type CivilAttributes = Record<CivilAttributeKey, number>;

export const CIVIL_ATTRIBUTE_KEYS: CivilAttributeKey[] = [
  "reputation",
  "empathy",
  "appeal",
  "performance",
  "crafting",
  "driving",
  "evasion",
  "intimidation",
  "luck",
  "perception",
  "persuasion",
  "tolerance",
];

export const WEAPON_TYPES = [
  "Unarmed Melee",
  "Blunt Weapon Melee",
  "Sharp Weapon Melee",
  "Ranged Attack",
  "Kick",
  "Grappling",
  "Slice",
  "Whip",
  "Blast",
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
export type TagChoices = Record<string, string>;
export type StatusSelections = Record<string, boolean>;

export type CyberModSystemState = {
  slots: string[];
  tier?: string;
};

export type CyberModsState = Record<string, CyberModSystemState>;

export type OriginSelection = {
  id: string | null;
  allocations: Partial<Record<CivilAttributeKey, number>>;
  choiceTags: string[];
};

export type Character = {
  id: string;
  name: string;
  attributes: Attributes;
  civilAttributes: CivilAttributes;
  tags: TagSelections;
  tagChoices: TagChoices;
  statusEffects: StatusSelections;
  weapon: WeaponConfig;
  cyberMods: CyberModsState;
  origin: OriginSelection;
};
