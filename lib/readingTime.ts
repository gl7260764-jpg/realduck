/**
 * Reading-time estimator.
 * Industry standard: 200–230 wpm for adult readers on screen.
 * We use 220 wpm and round to nearest minute (min 1 min).
 */
export function readingTimeMinutes(content: string): number {
  if (!content) return 1;
  // Strip markdown / HTML noise so the count is approximately real words
  const plain = content
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*>`\-_\[\]()!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = plain ? plain.split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / 220));
}
