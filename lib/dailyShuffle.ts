/**
 * Deterministic daily shuffle.
 * Shuffles an array using the current date as a seed so that:
 * - All users see the same order within the same 24-hour window
 * - The order automatically changes once per day
 * - The shuffle is reproducible for caching and SEO consistency
 */

// Seeded random number generator (mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getDailySeed(): number {
  const now = new Date();
  // Use UTC date as seed (YYYYMMDD) so all timezones get the same shuffle per day
  const seed =
    now.getUTCFullYear() * 10000 +
    (now.getUTCMonth() + 1) * 100 +
    now.getUTCDate();
  return seed;
}

/**
 * Shuffle an array using the current day as a deterministic seed.
 * The same array shuffled on the same day will always produce the same result.
 */
export function dailyShuffle<T>(arr: T[]): T[] {
  const seed = getDailySeed();
  const random = mulberry32(seed);
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Returns the current daily shuffle seed — useful for cache busting.
 */
export function getDailySeedString(): string {
  return String(getDailySeed());
}
