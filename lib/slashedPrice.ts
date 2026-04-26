/**
 * Resolve the "compare-at" / slashed price for a single price line.
 *
 *   - If a matching manual override line is provided, use it (after
 *     ensuring it has a `$` prefix and is a different number than the
 *     real price). Returns null if the manual value equals the real
 *     price (so we don't draw a useless line-through over the same
 *     number).
 *   - Otherwise auto-calculates as `realPrice × 1.3` rounded to int.
 *
 * Both `priceLine` and the optional `manualLine` are single lines from
 * the product's multi-line `priceLocal` / `priceShip` (split on "\n").
 *
 * Returns either a formatted string (e.g. `"$650"`) or `null` when
 * there's nothing meaningful to show.
 */
export function slashedPrice(
  priceLine: string,
  manualLine?: string | null
): string | null {
  // Helper: parse a money-ish string into a number
  const parseAmount = (s: string): number | null => {
    const m = s.match(/\$?([\d,]+(?:\.\d+)?)/);
    if (!m) return null;
    const n = parseFloat(m[1].replace(/,/g, ""));
    return isNaN(n) || n <= 0 ? null : n;
  };

  const realAmount = parseAmount(priceLine);
  if (realAmount === null) return null;

  // Manual override path
  if (manualLine && manualLine.trim()) {
    const manualAmount = parseAmount(manualLine);
    if (manualAmount !== null && manualAmount !== realAmount) {
      // Preserve the original manual string verbatim (with any unit suffix
      // like "/HP" or "/P"), just ensure $ prefix.
      const trimmed = manualLine.trim();
      return trimmed.startsWith("$") ? trimmed : `$${trimmed}`;
    }
    // Manual was provided but invalid or equal to real price — fall through
    // to the auto-calculation rather than showing nothing
  }

  // Auto-calc fallback (existing behavior — 30% markup)
  const original = Math.round(realAmount * 1.3);
  return `$${original.toLocaleString()}`;
}

/**
 * Convenience: pick the Nth line from a multi-line manual override
 * string, used when iterating over `priceLocal.split("\n")` arrays.
 * Returns undefined for missing/empty lines.
 */
export function nthLine(s: string | null | undefined, n: number): string | undefined {
  if (!s) return undefined;
  const lines = s.split("\n");
  const line = lines[n];
  if (!line || !line.trim()) return undefined;
  return line;
}
