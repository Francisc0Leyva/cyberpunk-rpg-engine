// src/lib/damage.ts
export function rollDamageString(damage: string): number {
  // supports strings like "3d6+2", "2d10", "4d6-1"
  const match = damage.match(/(\d+)d(\d+)([+-]\d+)?/);
  if (!match) {
    throw new Error(`Invalid damage string: ${damage}`);
  }

  const [, diceCountStr, facesStr, modStr] = match;
  const diceCount = parseInt(diceCountStr, 10);
  const faces = parseInt(facesStr, 10);
  const mod = modStr ? parseInt(modStr, 10) : 0;

  let total = 0;
  for (let i = 0; i < diceCount; i++) {
    total += 1 + Math.floor(Math.random() * faces);
  }
  return total + mod;
}

