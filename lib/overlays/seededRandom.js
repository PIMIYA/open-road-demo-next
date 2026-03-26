/**
 * Deterministic PRNG utilities for stable scatter positioning.
 * Ensures overlay dot positions don't shift across re-renders.
 */

/** Hash a string to a 32-bit integer seed */
export function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return h;
}

/** Return a seeded PRNG function (LCG) that yields values in [0, 1) */
export function seededRandom(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}
