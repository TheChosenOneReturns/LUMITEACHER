export type GameDifficulty = "explorer" | "adventurer" | "master";

export const gameDifficultyOptions: Array<{ id: GameDifficulty; label: string; description: string; stars: number }> = [
  { id: "explorer", label: "Explorador", description: "Más señales y margen para probar", stars: 1 },
  { id: "adventurer", label: "Aventurero", description: "Pistas equilibradas y más decisiones", stars: 2 },
  { id: "master", label: "Maestro", description: "Más piezas, distractores y conexiones", stars: 3 },
];

export const difficultyIndex: Record<GameDifficulty, number> = {
  explorer: 0,
  adventurer: 1,
  master: 2,
};

function hashSeed(seed: string) {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

export function createSeededRandom(seed: string) {
  let value = hashSeed(seed);
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(items: readonly T[], seed: string) {
  const result = [...items];
  const random = createSeededRandom(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
}

export function sample<T>(items: readonly T[], amount: number, seed: string) {
  return shuffled(items, seed).slice(0, Math.min(amount, items.length));
}

export function rotate<T>(items: readonly T[], seed: string) {
  if (items.length === 0) return [];
  const offset = Math.floor(createSeededRandom(seed)() * items.length);
  return [...items.slice(offset), ...items.slice(0, offset)];
}
