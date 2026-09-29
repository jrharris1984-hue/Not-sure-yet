const MAX_SEED = 2147483647;

export function batchSeed(baseSeed, index, mode = "explore") {
  const base = Math.abs(Math.trunc(Number(baseSeed) || 0)) % MAX_SEED;
  if (mode === "nearby") return (base + index) % MAX_SEED;
  // A fixed large step samples distant seeds while keeping the recipe unchanged.
  return (base + index * 104729) % MAX_SEED;
}
