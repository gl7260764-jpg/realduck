/**
 * Author profiles for blog posts. Provides E-E-A-T signals (Experience,
 * Expertise, Authoritativeness, Trustworthiness) — critical for ranking in
 * the cannabis vertical, which Google treats as YMYL (Your Money Your Life).
 *
 * Used by:
 *   • Blog post pages — visible byline + bio block
 *   • Article JSON-LD schema — author.name, author.url, author.jobTitle
 */

export interface Author {
  name: string;
  role: string;
  bio: string;
  expertise: string[];
  /** Public URL for the author's profile (within this site or external). */
  url: string;
  /** Optional avatar URL — falls back to a default if absent. */
  avatarUrl?: string;
  /** Years in the cannabis industry — adds credibility. */
  yearsInIndustry?: number;
}

const DEFAULT_AVATAR = "https://pub-29aa6546799743b7a432165711f33223.r2.dev/uploads/2026-05-02/d7e43dc5c837.jpg";

export const AUTHORS: Record<string, Author> = {
  "Real Duck Distro": {
    name: "Real Duck Distro Editorial Team",
    role: "Cannabis Editorial Team",
    bio: "The Real Duck Distro editorial team is made up of cultivators, extract chemists, and long-time cannabis writers based in Los Angeles, California. We've been in the California cannabis industry collectively for over 25 years — every product we write about is one we've handled, tested, and stocked. Our reviews are honest, our guides are practical, and our recommendations come from real experience, not affiliate marketing.",
    expertise: [
      "California cannabis cultivation",
      "Extract & concentrate chemistry",
      "Strain genetics and terpene profiling",
      "Disposable vape hardware",
      "Cannabis harm reduction",
      "Edibles dosing and manufacturing",
    ],
    url: "/about",
    avatarUrl: DEFAULT_AVATAR,
    yearsInIndustry: 25,
  },
};

/** Returns author profile for a given byline name; falls back to the default editorial team. */
export function getAuthor(name: string): Author {
  return AUTHORS[name] || AUTHORS["Real Duck Distro"];
}
