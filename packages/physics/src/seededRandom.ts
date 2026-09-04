/**
 * Deterministic pseudo-randomness for sampled populations.
 *
 * Extracted from the private copy inside `hrInferencePopulationModel.ts`, which is now a
 * consumer rather than an owner. Anything that samples — IMF masses, cluster positions,
 * photometric noise — draws from here, never from `Math.random`, so "same seed, same
 * population" is a property a demo can promise and a test can assert.
 *
 * `mulberry32` and `xmur3` are public-domain generators. The implementation of
 * `mulberry32` is unchanged from the one that shipped in the HR model, so every existing
 * expectation pinned to a seed still holds.
 */

/** FNV-1a over the seed's string form, so a label or a number both work. */
export function hashSeed(seed: string | number): number {
  const text = String(seed);
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Seeded uniform generator on [0, 1). Public-domain mulberry32. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** String to a well-separated 32-bit seed. Public-domain xmur3. */
export function xmur3(text: string): number {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * An independent stream for one named quantity, derived from a master seed.
 *
 * The point is determinism *under feature growth*. If masses and positions shared one
 * stream, adding a third sampled quantity later would reshuffle both, and every seed a
 * student had written down would name a different cluster. With named sub-streams,
 * `subStream(seed, "velocity")` can be added without moving a single existing draw.
 */
export function subStream(masterSeed: string | number, label: string): () => number {
  return mulberry32(xmur3(`${hashSeed(masterSeed)}:${label}`));
}
