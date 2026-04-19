/**
 * Convert a string into a URL-safe SEO slug.
 * Example: "Pink Versace Indoors 💗" → "pink-versace-indoors"
 */
export function slugify(input: string): string {
  return input
    .toString()
    .toLowerCase()
    .trim()
    // Replace common unicode chars with ASCII equivalents
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Remove emojis and symbols
    .replace(/[^\w\s-]/g, "")
    // Replace whitespace and underscores with hyphens
    .replace(/[\s_]+/g, "-")
    // Remove duplicate hyphens
    .replace(/-+/g, "-")
    // Trim hyphens from start/end
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique slug by appending a numeric suffix if needed.
 * Used when creating/updating products to avoid collisions.
 */
export async function generateUniqueSlug(
  title: string,
  checkExists: (slug: string) => Promise<boolean>,
  excludeId?: string
): Promise<string> {
  const base = slugify(title) || "product";
  let slug = base;
  let counter = 1;

  while (await checkExists(slug)) {
    counter++;
    slug = `${base}-${counter}`;
    if (counter > 100) break; // safety
  }

  return slug;
}
