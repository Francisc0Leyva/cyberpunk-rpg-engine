import frontalCortexData from "./constants/frontal_cortex.json";
import ocularSystemData from "./constants/ocular_system.json";
import circulatorySystemData from "./constants/circulatory_system.json";
import integumentarySystemData from "./constants/integumentary_system.json";
import operatingSystemData from "./constants/operating_system.json";
import nervousSystemData from "./constants/nervous_system.json";
import skeletonData from "./constants/skeleton.json";
import handsData from "./constants/hands.json";
import armsData from "./constants/arms.json";
import legsData from "./constants/legs.json";

import type { CyberModsState } from "../types/character";

type EffectValues = number | string | boolean | undefined;

export type CyberMod = {
  id: string;
  name: string;
  desc?: string;
  effects?: Record<string, EffectValues>;
  base_effects?: Record<string, EffectValues>;
  tiers?: Record<string, Record<string, EffectValues> | undefined>;
  condition?: string;
  on_roll?: number;
};

export type SystemConfig = {
  system: string;
  slots?: number;
  mods: CyberMod[];
};

export type SystemJson = SystemConfig;

export const CYBER_SYSTEMS: SystemConfig[] = [
  frontalCortexData as SystemJson,
  circulatorySystemData as SystemJson,
  integumentarySystemData as SystemJson,
  operatingSystemData as SystemJson,
  nervousSystemData as SystemJson,
  skeletonData as SystemJson,
  handsData as SystemJson,
  ocularSystemData as SystemJson,
  armsData as SystemJson,
  legsData as SystemJson,
];

export function createDefaultCyberModsState(): CyberModsState {
  return CYBER_SYSTEMS.reduce<CyberModsState>((acc, config) => {
    const baseSlots = config.slots ?? 1;
    const totalSlots = config.system === "Hands" ? baseSlots + 1 : baseSlots;

    acc[config.system] = {
      slots: Array(totalSlots).fill("None"),
      tier: config.system === "Operating System" ? "" : undefined,
    };

    return acc;
  }, {});
}
