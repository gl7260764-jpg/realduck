/**
 * Ensures a price string always has a $ sign prefix.
 * If the price already starts with $, it is returned as-is.
 * Handles multi-line prices (e.g. "$500/HP\n$875/P").
 */
export function formatPrice(price: string): string {
  return price
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return trimmed;
      return trimmed.startsWith("$") ? trimmed : `$${trimmed}`;
    })
    .join("\n");
}
