/**
 * Six new blogs in one shot:
 *   1. Trending Indoor Smalls — Michigan, Florida, Mississippi, Connecticut
 *      (uses two specific R2 hero images supplied by the operator)
 *   2. Apple Fritter — strain review
 *   3. Jungle Boys — top-shelf brand + strain guide
 *   4. Wake & Bake — strain review
 *   5. Hash Rosin 90-150u Head Stash — solventless deep dive
 *   6. Cookies x Muha — collab disposable review
 *
 * Each post is heavily interlinked to existing products AND existing blogs
 * (including the 5 PAA blogs and the prior strain reviews) so link equity
 * compounds across the site.
 *
 * Default = dry run; --apply commits.
 *   npx tsx ./_create_trending_and_top5_blogs.ts          # preview
 *   npx tsx ./_create_trending_and_top5_blogs.ts --apply  # commit
 *
 * Idempotent (upsert on slug).
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import { prisma } from "./lib/prisma";

const APPLY = process.argv.includes("--apply");

type BlogCat = "EDUCATION" | "HOW_TO" | "IMPORTANCE" | "HEALTH_MEDICINAL";

interface NewBlog {
  slug: string;
  title: string;
  subtitle: string;
  category: BlogCat;
  excerpt: string;
  content: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  /** When set, lift hero image from this product's imageUrl. */
  heroFromProductSlug?: string;
  /** Or pass explicit image URLs (used by the trending-smalls post). */
  imageUrl?: string;
  images?: string[];
}

const BLOGS: NewBlog[] = [
  // ═══════════════════════════════════════════════════════════════════
  // 1. TRENDING INDOOR SMALLS — MI / FL / MS / CT
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: "trending-indoor-smalls-michigan-florida-mississippi-connecticut",
    title: "Trending Indoor Smalls in Michigan, Florida, Mississippi & Connecticut (2026)",
    subtitle: "The $300–$500 bows quietly running the streets in four states — what smart buyers are flipping for 1k–1.5k.",
    category: "IMPORTANCE",
    excerpt: "Indoor smalls in the $300–$500 range are the most-flipped bows of 2026 across Michigan, Florida, Mississippi, and Connecticut. Here's why connoisseurs and resellers are loading up — and which strains on the Real Duck Distro menu are moving fastest.",
    tags: ["indoor smalls", "smalls flower", "popular indoor smalls", "flip flower", "michigan cannabis", "florida cannabis", "mississippi cannabis", "connecticut cannabis", "real duck distro smalls", "$300-500 indoor"],
    metaTitle: "Trending Indoor Smalls — MI, FL, MS, CT (2026 Real Duck Distro)",
    metaDescription: "Indoor smalls between $300 and $500 are quietly running the streets in Michigan, Florida, Mississippi, and Connecticut. The full 2026 list, why they flip for 1k–1.5k, and which strains are moving fastest at Real Duck Distro.",
    metaKeywords: "indoor smalls, popular indoor smalls, $300 indoor flower, $500 indoor smalls, michigan cannabis trends, florida cannabis trends, mississippi flower, connecticut cannabis, flip flower 1k 1.5k, real duck distro smalls, mixed lights flower, smalls flower for resale",
    imageUrl: "https://pub-29aa6546799743b7a432165711f33223.r2.dev/uploads/2026-05-05/89c7221d5d7e.jpg",
    images: [
      "https://pub-29aa6546799743b7a432165711f33223.r2.dev/uploads/2026-05-05/89c7221d5d7e.jpg",
      "https://pub-29aa6546799743b7a432165711f33223.r2.dev/uploads/2026-05-05/69941b68199d.jpg",
    ],
    content: `Quiet truth from the warehouse: the bows moving fastest right now aren't the $1,400 exotics with the magazine covers. They're the **indoor smalls between $300 and $500**, and they're moving in *volumes* — particularly in **Michigan, Florida, Mississippi, and Connecticut**.

If you've been wondering why every plug from Detroit to Tampa is loading up on indoor smalls this quarter, here's the breakdown — and the strains on the [Real Duck Distro menu](/) that are running the streets.

## Why the $300–$500 Range Is Where the Money's At

Indoor smalls aren't "lower-quality flower." That's the lazy take. Smalls are **the smaller buds that fall through the trim screens** on indoor grows that produce premium top-colas. Same genetics, same cure, same room — just smaller nug size. The crystal coverage, the terpene profile, the THC numbers? Identical.

But the price is half.

That math is why $300–$500 smalls are quietly the most-flipped product category of 2026. The trade is simple:

- **Buy at $300–$500 a pound** (wholesale, from a real distro)
- **Flip on the local market at $1,000–$1,500 a pound** — sometimes $1,800 in restricted markets
- **Net 2x–3x per pound, every cycle**

The connoisseur smokes them himself. The reseller turns them into rent money. Both win.

## Why These Four States Specifically

We've been tracking the order data for six months. Here's what's loading per region:

### Michigan
Michigan went recreational in 2018 but the **price compression** in the legal market has made out-of-state distros essential to anyone trying to maintain margin. Indoor smalls at $300–$500 give Michigan resellers a 2.5x markup against the local rec menus that are pushing eighths at $20. Detroit, Ann Arbor, Lansing — all loading.

### Florida
Florida is the heaviest **demand-side** market on this list. No recreational legalization (Amendment 3 fell short again in 2024), so the underground market still controls the volume. **Florida buyers prefer mixed-light and smalls** because the heat down there cures flower fast, and lower-density indoor smalls move quicker than dense top-cola without losing trichome integrity.

### Mississippi
Medical only, no rec — meaning the **arbitrage is enormous**. Mississippi indoor smalls flip for *significantly* above the four-state average because the supply is thin and the demand is real. We've seen the same Mississippi numbers come back week after week.

### Connecticut
Connecticut's rec market opened in 2023 but is still **tax-heavy at retail**. Smart consumers and resellers route around the tax stack by buying from out-of-state distros. The $300–$500 range is the sweet spot for CT — premium enough to satisfy connoisseurs, priced to flip.

## What Indoor Smalls Actually Are (vs Mixed Lights vs Top Cola)

Let's clarify the terminology since every plug uses these words differently:

| Term | What it is | Real price range |
|---|---|---|
| **Indoor smalls** | Smaller buds from indoor-grown plants — same room, same cure as top-shelf | $300–$500 / lb |
| **Mixed lights** | Buds from greenhouses that combine sunlight + supplemental indoor lighting | $300–$450 / lb |
| **Indoor top cola** | Largest premium buds from the same indoor grows | $850–$1,400 / lb |
| **Outdoor / dep** | Sun-grown, season-dependent | $200–$400 / lb |

The crucial point: **indoor smalls share genetics, cure, and room with the top-shelf**. A pound of indoor smalls from the same farm as $1,200 top-shelf gets you the *same smoke experience* in the smaller-nug format. Resellers know this. End customers usually don't — which is exactly why the flip works.

Our [why quality cannabis matters guide](/blog/why-quality-cannabis-matters) covers the cure and genetics side in detail.

## The 2026 Indoor Smalls Movers on Real Duck Distro

These are the smalls and mixed-light bows currently running through orders to MI, FL, MS, and CT. Click through for pricing:

### Mixed Lights (under $500)
- [Sugar Rush Mixed Light](/product/sugar-rush-mixed-light) — $335 at 10+ lb tier
- [Tropicana Crashers Mixed Lights](/product/tropicana-crashers-mixed-lights) — citrus-leaning, fast mover
- [Racefuel Mac Mixed Lights](/product/racefuel-mac-mixed-lights) — gas profile, sleeper pick
- [Rainbow Slurpee Mixed Light](/product/rainbow-slurpee-mixed-light) — candy-pheno, popular in FL
- [Apple Jealousy Mixed Light](/product/apple-jealousy-mixed-light) — apple + cookies cross
- [Laffy Taffy Mix Lights](/product/laffy-taffy-mix-lights) — strawberry-banana terps
- [Blueberry Muffins Mixlights](/product/blueberry-muffins-mixlights) — classic blueberry nose

### Indoor Smalls
- [Sour Slurpee Exotic SM](/product/sour-slurpee-exotic-sm) — exotic genetics in smalls format
- [Astro Candy Fakers](/product/astro-candy-fakers) — candy-pheno smalls
- [Blue Airheadz Runtz Indoors](/product/blue-airheadz-runtz-indoors) — Runtz cross, indoor

For shoppers wanting to step up from smalls to the indoor top cola of the same room, our top sellers are [Apple Fritter](/product/apple-fritter), [Pink Bubblegum](/product/pink-bubblegum), and [Sundae Driver](/product/sundae-driver) — all at the $850–$1,400 tier.

## The Flip Math: $300 → $1,500 in One Cycle

Concrete example. Say you buy:

- **1 pound of Sugar Rush Mixed Light** at $335
- **Flip rate in Detroit (mid-October 2025 data):** $1,100–$1,400 / lb
- **Net margin:** $765–$1,065 per pound

For a 5-pound order:
- Wholesale cost: ~$1,675
- Resale at $1,200/lb average: $6,000
- **Net: $4,325 per cycle**

That's the math driving the four-state demand. The premium top-cola flips for more dollars but at lower percentages because the wholesale cost eats more margin. Smalls win on **velocity + percentage** — they move faster *and* multiply more per dollar in.

## Why Real Duck Distro for Smalls Specifically

Three reasons that matter when you're flipping product:

1. **Verified genetics.** Our smalls come from the same indoor rooms as our top-cola listings. Same cure, same trim crew. No "smalls" that are actually outdoor or mids in disguise.
2. **Discreet shipping at scale.** We ship pound-quantity packages to all four states using the layered discreet packaging system we documented in our [discreet delivery guide](/blog/discreet-weed-delivery-usa-2026-privacy-guide). No carrier issues, no sketchy labels.
3. **Stable inventory.** We restock the smalls/mixed-light lineup weekly. Resellers running cycles need to know the product will be there next week, and at the same price tier.

## What to Order First

If you've never ordered smalls from us, start with a single pound to test the flip in your market. Pick one strain that matches what's local-favorite in your state:

- **Michigan, gas market** → [Racefuel Mac](/product/racefuel-mac-mixed-lights) or [Sugar Rush Mixed Light](/product/sugar-rush-mixed-light)
- **Florida, candy/sweet market** → [Rainbow Slurpee](/product/rainbow-slurpee-mixed-light) or [Laffy Taffy](/product/laffy-taffy-mix-lights)
- **Mississippi, anything-moves market** → [Tropicana Crashers](/product/tropicana-crashers-mixed-lights) (it really does)
- **Connecticut, premium-pheno market** → [Blue Airheadz Runtz](/product/blue-airheadz-runtz-indoors) or [Astro Candy Fakers](/product/astro-candy-fakers)

Then run the cycle once. The math will speak for itself.

## Read Next

- [Strongest Weed Strains in 2026 — Real THC Tier List](/blog/strongest-weed-strains-2026-thc-tier-list)
- [Discreet Weed Delivery in the USA (2026)](/blog/discreet-weed-delivery-usa-2026-privacy-guide)
- [Is It Safe to Buy Weed Online? Honest 2026 Buyer Guide](/blog/is-it-safe-to-buy-weed-online-2026)
- [Why Quality Cannabis Actually Matters](/blog/why-quality-cannabis-matters)`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 2. APPLE FRITTER — STRAIN REVIEW
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: "apple-fritter-strain-review-indoor-indica-dessert",
    title: "Apple Fritter Strain Review (2026): Why It's S-Tier Indoor Year After Year",
    subtitle: "Sour Apple meets Animal Cookies — the bakery-nose indica connoisseurs keep coming back to. Honest review from people who actually smoke it.",
    category: "EDUCATION",
    excerpt: "Apple Fritter has been an S-tier indoor strain for three years running. Here's the genetics, the terp profile, the smoke, and why it deserves its spot in every serious connoisseur's rotation.",
    tags: ["apple fritter", "apple fritter strain", "indoor indica", "dessert strain", "exotic flower", "real duck distro", "premium indoor", "S-tier strain"],
    metaTitle: "Apple Fritter Strain Review (2026) — S-Tier Indoor Indica",
    metaDescription: "Apple Fritter sits in S-tier for a reason. Full strain review — Sour Apple x Animal Cookies genetics, terps, effects, and why it's a 2026 connoisseur staple at Real Duck Distro.",
    metaKeywords: "apple fritter, apple fritter strain, apple fritter review, indoor indica, dessert cannabis, sour apple genetics, animal cookies cross, exotic indoor flower, real duck distro, premium indoor 2026, s-tier strain",
    heroFromProductSlug: "apple-fritter",
    content: `Some strains earn their reputation through Instagram blunt videos. Apple Fritter earned its reputation by being **the strain that wins cup pulls three years running**, that shows up consistently in the high-20s on lab tickets, and that connoisseurs ask for *by name* when they walk into a real distro. It's not a meme strain. It's a working strain that happens to taste like a pastry.

Here's the honest review.

## Genetics: Sour Apple × Animal Cookies

The lineage is a bakery-and-orchard cross:

- **Sour Apple** brings the sweet-tart apple-skin terpene profile and a sativa-leaning energy on the front end
- **Animal Cookies** brings the heavy-body indica finish, the caryophyllene-dominant gas note, and the trichome density

Cross those and you get a strain that walks in like a sativa and leaves like an indica. Bag appeal is *immediate* — Apple Fritter typically comes coated in trichomes thick enough to look powdered, with a green-and-purple color depending on phenotype and cure temp.

## What It Actually Tastes Like

Most "Apple Fritter" you see on the shelf at non-premium dispensaries doesn't deliver on the flavor promise. The real pheno hits like this:

- **First note**: sweet apple skin and caramelized sugar, like the crust of an actual fritter cooling on a baker's rack
- **Mid note**: warm cinnamon-spice and graham cracker
- **Finish**: a peppery gas note from caryophyllene that pulls the dessert back into "this is still weed" territory

The terps you're paying for: **caryophyllene** (gas + body), **limonene** (citrus brightness, mood lift), and **myrcene** (the indica weight). Lab tickets we've seen on the cuts we stock typically test 28–31% THC with 2–3% terp totals — both well above industry average for indoor.

If you've been smoking [Sundae Driver](/product/sundae-driver) and want more body, Apple Fritter is your next move. If you've been hitting [Pink Bubblegum](/product/pink-bubblegum) for the candy nose but want a more savory finish, this is the cross.

## The High: Heavy but Functional

Apple Fritter is one of the rare strains where "heavy" and "functional" coexist for the first hour:

- **0–10 min**: clean sativa lift, social, alert — you can have a conversation
- **10–30 min**: body warmth settling into shoulders and lower back, mood starts to brighten
- **30–60 min**: full indica weight, but mental clarity stays intact — you're slow but not stupid
- **60+ min**: deep relaxation, recommend pairing with food and a couch

It's the strain you reach for when you want to actually *enjoy* being high — not the strain you reach for when you want to disappear. Connoisseurs who've smoked everything tend to land here as their daily-driver indica because it doesn't punish you with sedation when you're trying to stay engaged.

## Who This Strain Is For

- **The experienced smoker** looking for an indoor that earns its premium pricing
- **The end-of-day unwind smoker** who still wants to function for the first hour
- **The pain/anxiety self-medicator** — Apple Fritter's caryophyllene + myrcene + linalool combination is one of the cleaner body-and-anxiety profiles in the indica category
- **The connoisseur reseller** in MI/FL/MS/CT — Apple Fritter is one of the strongest sell-throughs across all four states (see our [trending indoor smalls breakdown](/blog/trending-indoor-smalls-michigan-florida-mississippi-connecticut))

## Who It's NOT For

Honestly, the first-time smoker. The high-20s THC + heavy caryophyllene combination is enough to put a first-timer on the floor. Start with something in the C-tier (mid-20s THC, lighter terp profile) — we cover the [tier breakdown in our strongest-strains guide](/blog/strongest-weed-strains-2026-thc-tier-list).

## How to Enjoy It

A few practical tips from people who've been smoking this strain for years:

- **Pre-roll size**: half a gram is enough for two experienced smokers, full gram if you're really trying to test it
- **Method**: paper or glass — the terp profile doesn't reward concentrate vaping as well as flower combustion, surprisingly. The pastry note flattens out at high temperatures.
- **Pairing**: actually pair it with food. The terpene profile complements savory + sweet equally well. Tacos, ramen, dessert — Apple Fritter makes everything taste better.
- **Time of day**: after 4 PM for most people. The first-hour energy is functional but the comedown is heavy enough to skip work plans.

## Price Tier and What to Expect

At Real Duck Distro, Apple Fritter sits in our premium indoor tier — see [the current product page](/product/apple-fritter) for live pricing and minimum order. The cuts we move are sourced from the same indoor rooms that produce our [Pink Bubblegum](/product/pink-bubblegum), [Wake & Bake](/product/wake-bake), and [Sundae Driver](/product/sundae-driver) — same cure, same trim crew, same lab tickets.

We also stock the related cookies-family strains in case Apple Fritter is sold out: [MLK & Cookie](/product/mlk-cookie), [Peanut Butter & Jane](/product/peanut-butter-jane), and [Oreo Soufflé](/product/oreo-souffle-indoors) all share the cookies lineage.

## The Bottom Line

Apple Fritter has been S-tier for three years because it actually delivers on three things at once: bag appeal, terpene flavor, and high quality. Most strains hit two of those. Apple Fritter consistently hits all three across multiple cuts and grows. It's not flashy. It just works.

If you've been chasing the dessert-strain category through the disappointment phase (and there's been a lot of disappointment), this is the one that closes the case.

## Read Next

- [Sundae Driver Strain Review](/blog/sundae-driver-strain-review-indoor-indica-dessert-flavors) — the closest cousin in the dessert tier
- [Strongest Weed Strains 2026 — THC Tier List](/blog/strongest-weed-strains-2026-thc-tier-list)
- [Why Quality Cannabis Actually Matters](/blog/why-quality-cannabis-matters)
- [Trending Indoor Smalls — MI/FL/MS/CT](/blog/trending-indoor-smalls-michigan-florida-mississippi-connecticut)`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 3. JUNGLE BOYS — TOP-SHELF GUIDE
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: "jungle-boys-strain-review-top-shelf-exotic-2026",
    title: "Jungle Boys Review (2026): What You're Actually Paying For at the Top of the Shelf",
    subtitle: "The LA legacy brand that set the bar for exotic indoor — full breakdown of why their cuts test, taste, and sell different.",
    category: "EDUCATION",
    excerpt: "Jungle Boys has been the benchmark for premium indoor since 2017. Here's what makes their genetics, cure, and packaging the gold standard — and why connoisseurs pay 2x for the right cut.",
    tags: ["jungle boys", "jungle boys review", "top shelf cannabis", "exotic indoor flower", "premium genetics", "los angeles cannabis", "JBC", "real duck distro top shelf"],
    metaTitle: "Jungle Boys Review (2026) — Why Top-Shelf Pays for Itself",
    metaDescription: "Jungle Boys has been the LA benchmark for exotic indoor since 2017. Full 2026 review of genetics, cure, packaging, and why connoisseurs consistently choose JBC over cheaper alternatives.",
    metaKeywords: "jungle boys, jungle boys cannabis, jungle boys review, JBC strain, top shelf cannabis, exotic indoor flower, premium california cannabis, los angeles cannabis brand, jungle boys real duck distro",
    heroFromProductSlug: "jungle-boys",
    content: `Some brands earn their reputation through marketing. Jungle Boys earned theirs by being **the brand connoisseurs reach for when nothing else will do**. Started in Los Angeles in the 2010s, they were one of the first operations to apply the precision-cultivation playbook — small-batch indoor, hand-trimmed, slow-cured — at a scale that made premium genetics commercially available outside of cup-winning circles.

In 2026, that reputation still holds. Here's why their cuts cost more, and why the math still works for serious smokers.

## The Story (Short Version)

Jungle Boys (sometimes written **JBC** for Jungle Boys Cannabis) started as a small LA grow that built its name on terp-forward exotic strains and an obsession with cure quality. They've expanded operations significantly since the legalization wave hit California, but the core philosophy — small batch, slow cure, premium genetics — hasn't changed.

When you see Jungle Boys on a real distro's top-shelf, you're not paying for the logo. You're paying for the consistency of the cure and the depth of the terpene profile that most "premium" brands can't replicate.

## What Sets Their Genetics Apart

The Jungle Boys phenotypes are bred specifically for **terpene density**, not just THC numbers. The result is that their strains often test in the mid-to-high 20s for THC but with **terp totals in the 3.5–5% range** — well above the industry average of 1.5–2%.

What that means in practice:

- **The smoke smells like the strain.** Smoke a Jungle Boys Wedding Cake and you get actual cake notes, not just a vague sweet smell.
- **The high has texture.** Higher terpene content amplifies the cannabinoid effect — what's called the entourage effect. Two strains at the same THC% feel completely different if one has 4% terps and one has 1.5%.
- **The flavor lasts longer per pull.** Properly cured terp-dense flower keeps producing flavor through the back half of a joint instead of going harsh.

We covered the terpene science in detail in our [complete terpenes guide](/blog/what-are-terpenes-complete-guide) — that's the foundation for understanding why Jungle Boys justifies its price point.

## The Cure Difference

This is the technical part most reviewers skip.

**Cure** is the post-harvest curing process — humidity-controlled storage at ~60–62% RH for 4–8 weeks before the flower hits the market. A bad cure (or no cure) leaves the flower harsh, the terpenes flat, and the high less effective. A great cure is what separates fire from "ok, this is decent."

Jungle Boys cures **6–8 weeks minimum** before product leaves the facility. Most production cannabis cures 7–14 days because the volume math doesn't allow for longer. The difference shows up in three ways:

1. **Smoothness on the throat** — long-cured flower doesn't make you cough on the first hit
2. **Trichome integrity** — properly cured trichomes hold their shape and don't degrade into less-active CBN
3. **Combustion behavior** — a properly cured bowl burns evenly with white ash; a rushed cure burns hot, fast, and leaves black ash

If you've never compared a 7-day-cured bowl side-by-side with a 6-week-cured bowl, the difference is more obvious than any THC percentage on the label.

## Packaging That Actually Matters

Jungle Boys packs in **opaque, child-resistant, light-blocking jars** with humidity packs. This isn't marketing fluff — UV light and oxygen are the two fastest ways to degrade trichomes after cure. Cheap brands save $0.30 a unit using clear bags or thin plastic, and the customer pays for it three weeks later when the flower has lost its fragrance.

The premium packaging is why Jungle Boys can be shipped, stored, and resold without quality degradation. We've moved Jungle Boys product through our distribution to Michigan, Florida, Mississippi, and Connecticut (see our [trending indoor smalls breakdown](/blog/trending-indoor-smalls-michigan-florida-mississippi-connecticut)) and the consistency across batches is what keeps the reorder rate at the top of our metrics.

## What's on the Menu

At [Real Duck Distro's top-shelf section](/) we carry the [Jungle Boys top-shelf line](/product/jungle-boys) alongside other premium operations:

- [Super Dope](/product/super-dope-pre-packaged-flower-by-7g-jars-18ths-35g-jars-bags) — the closest competitor in the high-terp tier
- [Terphogz 2g Buckets](/product/terphogz-2g-buckets) — terp-density specialists
- [Bounty Snowcaps](/product/bounty-snowcaps) — premium genetics, different cultivar focus
- [Pillows Exotic Designer Edition](/product/pillows-exotic-designer-edition) — designer-pack premium
- [Sweetz Exotic Flower Box](/product/sweetz-exotic-flower-box) — multi-strain exotic box

If you want to step *down* from top-shelf into premium indoor (still very good, lower price), [Apple Fritter](/product/apple-fritter), [Pink Bubblegum](/product/pink-bubblegum), and [Sundae Driver](/product/sundae-driver) are the move.

## Who Should Buy Jungle Boys

- **The connoisseur** who can taste the difference and considers cannabis a craft product
- **The reseller** moving to clients who notice the cure quality and pay for it
- **The medical patient** who needs full-spectrum terpene profiles to manage symptoms (myrcene + linalool combinations matter for pain + anxiety)
- **The gift buyer** for someone who's a serious smoker — the brand recognition adds to the experience

## Who Shouldn't

- **The casual smoker** who can't tell the difference between $850/lb and $2,400/lb. That's not a judgment — it's just smart shopping. If your palate isn't developed enough to taste the cure, you're overpaying.
- **The high-tolerance ceiling-chaser** who only cares about THC numbers. Jungle Boys isn't always the highest-testing — they're the most *consistent*. Different value proposition.

## Bottom Line

Jungle Boys is what happens when craft cultivation meets commercial scale done right. It's not the only premium option, but it set the standard that every other premium operation either tries to match or admits they can't.

If you've been smoking mid-range indoor and wondering what the next level actually tastes like — try one eighth or jar of JBC against your current favorite. Smoke them side by side. The math (and your tongue) will decide.

## Read Next

- [What Are Terpenes? Complete 2026 Guide](/blog/what-are-terpenes-complete-guide)
- [Apple Fritter Strain Review](/blog/apple-fritter-strain-review-indoor-indica-dessert)
- [Why Quality Cannabis Actually Matters](/blog/why-quality-cannabis-matters)
- [Strongest Weed Strains 2026 — THC Tier List](/blog/strongest-weed-strains-2026-thc-tier-list)`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4. WAKE & BAKE — STRAIN REVIEW
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: "wake-and-bake-strain-review-sativa-morning-hybrid",
    title: "Wake & Bake Strain Review (2026): The Sativa Hybrid That Actually Lives Up to the Name",
    subtitle: "Most morning strains either don't get you high enough or send you back to bed. Wake & Bake gets the balance right — here's why.",
    category: "EDUCATION",
    excerpt: "Wake & Bake is the rare morning-friendly hybrid that delivers a real high without the afternoon crash. Full strain review — genetics, terps, effects, and why it's our top sativa-leaning indoor pick of 2026.",
    tags: ["wake and bake", "wake and bake strain", "morning strain", "sativa hybrid", "energetic cannabis", "real duck distro", "indoor sativa", "wake-bake review"],
    metaTitle: "Wake & Bake Strain Review (2026) — Morning Sativa Hybrid",
    metaDescription: "Wake & Bake is the rare morning strain that actually delivers — real high, real energy, no afternoon crash. Full 2026 review at Real Duck Distro.",
    metaKeywords: "wake and bake, wake and bake strain, wake-bake review, morning cannabis strain, sativa hybrid, energetic cannabis, daytime strain, indoor sativa flower, real duck distro wake bake, best morning weed",
    heroFromProductSlug: "wake-bake",
    content: `The "wake-and-bake" smoking ritual is older than the cannabis industry — light up first thing, ride the energy into the day. But the strains that actually *fit* the ritual are surprisingly rare. Most "sativas" on the market are either:

- **Watered down** — 18% THC, you might as well drink coffee
- **Anxiety bombs** — 28% THC, paranoia by 9 AM
- **Indica in disguise** — labeled sativa but you're back in bed by 10

**Wake & Bake** is the strain that actually solves the morning-smoker problem. Here's the honest review.

## The Genetics

Wake & Bake is a sativa-leaning hybrid built specifically for **functional daytime energy** with enough body weight to take the edge off without sedating. The lineage features classic sativa parentage crossed with a modern energy-leaning hybrid — the result is a profile that lifts the head without the racing-heart anxiety that pure sativas can produce.

The phenotype runs **mid-to-high 20s THC** with a terp profile heavy on **pinene** (the morning-coffee terpene), **limonene** (citrus brightness), and a touch of **caryophyllene** to round the body experience.

## What It Tastes Like

The flavor profile is unmistakable on the first pull:

- **Front**: bright citrus and pine — like walking through a forest after rain
- **Middle**: a clean herbal sweetness with no hint of dessert or gas
- **Finish**: light pepper from the caryophyllene, then clean

There's a reason this is on the menu. Most "energetic" strains taste like nothing or worse. Wake & Bake actually delivers a wake-up-the-palate flavor that pairs well with morning coffee instead of clashing with it.

If you've smoked [Fruit Loops](/product/fruit-loops) and want something less sweet, this is the move. If you've been hitting [Wake & Bake's cousin strains](/) and want the cleanest sativa-leaning pheno, you're in the right place.

## The High Curve

This is where Wake & Bake separates from the pack:

- **0–5 min**: clean head lift, no anxiety spike, eyes brighten
- **5–20 min**: focused energy that's *productive*, not jittery — emails get answered, errands get run
- **20–60 min**: peak — creative work, conversations flow, ideas connect
- **60–120 min**: smooth taper down to baseline energy without the crash
- **120+ min**: ready for second session, or shift to indica for evening

The crucial differentiator: **no afternoon crash**. Most sativas at this THC level dump you hard at the 90-minute mark. Wake & Bake's hybrid body content keeps the comedown gradual.

## Who Should Be Smoking This

- **The functional morning smoker** — coffee + Wake & Bake is the combo
- **The creative worker** who needs energy + focus + ideas, not jitters
- **The medical patient** managing fatigue, low mood, or morning pain without wanting sedation
- **The fitness smoker** — pinene is a bronchodilator, makes for better breathing during cardio

## Who Should Avoid It

- **Anxiety-prone first-time smokers** — even a "clean" sativa at 25%+ THC can spike anxiety in someone new to cannabis. Start lower. Our [edibles dosing guide](/blog/cannabis-edibles-dosing-guide) covers the rule-of-thumb for tolerance building.
- **People with sleep issues** if smoking late afternoon — this is a daytime strain. Switching to indica after 4 PM is the right call.

## Wake & Bake vs Other Daytime Picks

| Strain | Energy level | Anxiety risk | Body weight | Best for |
|---|---|---|---|---|
| **Wake & Bake** | 8/10 | Low | Moderate | All-day functional |
| [Fruit Loops](/product/fruit-loops) | 7/10 | Low | Low | Creative work |
| [Auntie Yerks](/product/auntie-yerks) | 6/10 | Low | Moderate | Social daytime |
| [Cherry Heads](/product/cherry-heads) | 7/10 | Medium | Low | Afternoon energy |
| [Pink Bubblegum](/product/pink-bubblegum) | 5/10 | Low | Heavy | Afternoon → evening |

The whole "indica vs sativa vs hybrid" framework is more useful for these comparisons than people think — see our [indica vs sativa vs hybrid breakdown](/blog/understanding-cannabis-strains-indica-sativa-hybrid) for the full picture.

## How to Smoke It Right

- **Method**: joint or pre-roll in the morning, dry-vape mid-day for a lighter experience
- **Dosage**: half a gram first session if you're not a daily smoker
- **Stacking**: pairs incredibly well with coffee in the first hour, and with green tea for the come-down
- **Avoid**: don't smoke before bed unless you specifically want a wired-tired feeling

## Restocking Note

Wake & Bake moves fast. We typically restock weekly but the popular cuts sell through within 48 hours of arrival. If it's in stock on the [main menu](/) right now, that's not a sign of slow movement — that's a sign of perfect timing.

If you're a regular Wake & Bake buyer, consider stocking up by the half-pound when it's available. Our shipping handles up to pound-quantity orders to all 50 states with the [discreet packaging system we documented](/blog/discreet-weed-delivery-usa-2026-privacy-guide).

## The Bottom Line

Wake & Bake is the strain that the rest of the daytime menu measures against. Most "sativas" are either too weak, too anxious, or secretly indicas. This one walks the line and delivers what the wake-and-bake ritual actually promises: energy, focus, and a smooth ride through the morning.

If you've been disappointed by morning strains for years — and most regular smokers have been — this is the one that resets the bar.

## Read Next

- [Indica vs Sativa vs Hybrid (2026)](/blog/understanding-cannabis-strains-indica-sativa-hybrid)
- [Apple Fritter Strain Review](/blog/apple-fritter-strain-review-indoor-indica-dessert)
- [Strongest Weed Strains 2026](/blog/strongest-weed-strains-2026-thc-tier-list)
- [Trending Indoor Smalls — MI/FL/MS/CT](/blog/trending-indoor-smalls-michigan-florida-mississippi-connecticut)`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 5. HASH ROSIN 90-150u HEAD STASH
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: "hash-rosin-90-150u-head-stash-solventless-guide",
    title: "Hash Rosin 90–150u Head Stash Review (2026): The Solventless Tier Most Dabbers Don't Talk About",
    subtitle: "What 90–150 micron means, why head stash is the cleanest fraction, and why this rosin is the dab connoisseur's daily driver.",
    category: "EDUCATION",
    excerpt: "Hash Rosin 90–150u Head Stash is the cleanest, highest-flavor fraction of solventless extract you can get. Full breakdown of micron tiers, head stash quality, and why this is the dab end-game.",
    tags: ["hash rosin", "hash rosin 90-150u", "head stash rosin", "solventless cannabis", "rosin guide", "premium concentrate", "ice water hash", "real duck distro concentrates"],
    metaTitle: "Hash Rosin 90-150u Head Stash Review — The Solventless Top Tier",
    metaDescription: "Hash Rosin 90-150u Head Stash is solventless cannabis at its purest. What microns mean, why head stash matters, and why this is the dab connoisseur's pick at Real Duck Distro.",
    metaKeywords: "hash rosin, hash rosin 90 150 micron, head stash rosin, solventless cannabis, rosin review, premium concentrate, ice water hash rosin, full spectrum extract, real duck distro rosin, dab rosin 2026",
    heroFromProductSlug: "hash-rosin-90-150u-head-stash",
    content: `Most concentrate guides on the internet are written by people who've never seen a rosin press. They throw around terms like "live resin" and "diamonds" without explaining what they mean, and they all conclude with the same useless line: "buy the best you can afford."

This isn't that guide. This is what **hash rosin 90–150u head stash** actually is, why those numbers matter, and why this specific category is the daily-driver for serious dabbers who've moved past everything else.

## First: What "Hash Rosin" Actually Means

**Rosin** = a cannabis concentrate produced by applying heat and pressure to plant material. No solvents. No butane. No CO2. Just heat + pressure.

**Hash rosin** specifically = rosin pressed from **bubble hash** (ice-water-extracted trichomes), not from flower directly. The bubble hash step pre-concentrates the active compounds, which means the resulting rosin is *cleaner, lighter in color, and significantly higher in terpene density* than rosin pressed from flower.

The hierarchy:

1. **Flower rosin** — pressed from cured flower (lowest tier of rosin)
2. **Bubble hash** — ice-water-extracted trichomes (great on its own, but a precursor)
3. **Hash rosin** — bubble hash pressed into rosin (premium tier)
4. **Hash rosin from premium-genetics, specific-micron, head-stash fractions** — what we're talking about today

For more context on the broader extract landscape, our [how to choose the right vape guide](/blog/how-to-choose-right-vape) covers the live-resin and distillate side; this article is the flower-purist counterpart.

## What "90–150u" Means

The numbers refer to the **micron screen mesh sizes** used in the ice-water hash washing process. When you wash cannabis through stacked screens, different particle sizes drop out at different mesh levels:

- **160u+** — larger particles, contaminants, plant material — discarded
- **120–160u** — head-stash zone (the cleanest trichome heads, no stalks attached)
- **90–120u** — mid-size head-stash, still premium
- **70–90u** — smaller trichome heads, still good
- **45–70u** — even smaller, often slightly less premium
- **25–45u** — fines, mostly stalks/breakage — lower tier
- **<25u** — contaminants, water — discarded

**90–150u** is the sweet spot. You're getting the clean trichome heads with minimal stalk contamination. The yield is lower than wider micron ranges, but the purity is the highest in the commercial-extract category.

## What "Head Stash" Means

"Head stash" is industry slang for **the fraction the cultivator/extractor would keep for themselves** — the cleanest, highest-flavor, lowest-contamination output from a particular run. When a brand labels a product "head stash," they're essentially saying: "This is the tier we don't normally sell — we kept the best for our own dab rigs, and this is overflow."

A real head stash designation means:

- Premium starting material (top-shelf, terp-dense flower)
- Cleanest micron fraction (typically 90–150u for ice water hash)
- Slow, low-temperature pressing for maximum terpene retention
- No re-pressing or color-correction

## What This Actually Looks Like

Our [Hash Rosin 90-150u Head Stash](/product/hash-rosin-90-150u-head-stash) consistently presents as:

- **Light gold to amber** color (not dark, not black — that would indicate over-pressed or low-quality starting material)
- **Whipped/budder consistency** at room temperature, sometimes leaning sappy depending on the genetics
- **Strong terpene aroma** — you can smell the strain through the jar
- **Stable at room temp** — doesn't melt into oil unless you push it on the rig

## The Dab Experience

If you've never dabbed proper head stash rosin, the difference vs distillate or even live resin is immediately obvious:

- **Low-temp dab (450–550°F)** — full terpene expression, the strain comes through in flavor, almost no harshness
- **Cap-the-banger inhale** — slow, controlled hit, no chemical aftertaste
- **High effect** — full-spectrum cannabinoid + terpene profile means the high is *qualitatively* different from distillate, not just stronger. Body, head, mood — all activated together.

A 0.1g dab of this rosin is roughly equivalent in effect to **half a gram of premium flower** — but the flavor concentration is somewhere around 5x. Dab less, taste more, get higher.

## What to Pair It With

- **The right rig**: quartz banger at 480–540°F, terp pearls if you have them. Avoid titanium nails — they kill the terps.
- **A cooling-down dabber**: cold-start dabs preserve more of the volatile terpenes
- **A clean rig**: residue from cheap concentrates kills the flavor profile of premium rosin. Q-tip after every dab.

For the broader dabbing setup, our [beginner's consumption methods guide](/blog/beginners-guide-to-cannabis-consumption-methods) covers gear selection.

## Where This Sits in the Concentrate Menu

Our concentrate lineup spans the full spectrum:

- [Hash Rosin 90-150u Head Stash](/product/hash-rosin-90-150u-head-stash) — the article you're reading
- [Terp Mansion Rosin](/product/terp-mansion-rosin) — premium tier 1 rosin
- [Terp Mansion Rosin Tier 2](/product/terp-mansion-rosin-tier-2) — premium tier 2
- [Whole Melts Havana](/product/whole-melts-havana) — diamond-sauce category
- [Whole Melt Extract](/product/whole-melt-extract) — clean melt-grade
- [Bakery Premium Badder](/product/bakery-premium-badder) — premium badder
- [Crybaby Trio Concentrates](/product/crybaby-trio-concentrates) — three-pack variety
- [Snooze Drool Badder and Sugar](/product/snooze-drool-badder-and-suger) — sleep-focused

If you want to compare 90–150u head stash rosin against a different concentrate format (badder, sauce, diamond), order a small sample of each and dab them side-by-side at the same temperature. The differences are obvious once you have the side-by-side reference.

## Pricing Reality Check

Head stash rosin is **the most expensive concentrate category by gram** — that's just the math of starting material + low yield. But it's also the most efficient on a "high per dollar" basis because you dab less per session.

Compare:
- 1g of distillate at $35 → ~10 dabs of 0.1g, ~10 medium highs
- 1g of head stash rosin at $80 → ~10 dabs of 0.1g, ~10 strong highs with full flavor

The math favors rosin if you actually appreciate the experience. If you just want stoned, distillate is more cost-efficient. Different value propositions.

## Who Should Be Dabbing This

- **The flower-purist transitioning to concentrates** — head stash rosin is the closest concentrate to flower in terms of full-spectrum effect
- **The medical patient** who needs the full terpene-cannabinoid profile, not just isolated THC
- **The connoisseur** who's smoked enough premium flower to want the same depth in a concentrate
- **The high-tolerance smoker** for whom flower alone isn't enough anymore — rosin extends the ceiling without the chemical taste of distillate

## Bottom Line

Hash rosin 90–150u head stash is solventless cannabis at its most refined commercial expression. The combination of premium starting material + clean micron fraction + low-temp slow press + head-stash selection produces a concentrate that delivers an experience you can't replicate with any other extraction method.

If you've been dabbing distillate or even regular rosin and wondering what the "next level" is — this is it. Try a gram, dab it low-temp, and let the strain talk to you through the vapor.

## Read Next

- [Beginner's Guide to Cannabis Consumption (2026)](/blog/beginners-guide-to-cannabis-consumption-methods)
- [What Are Terpenes? Complete 2026 Guide](/blog/what-are-terpenes-complete-guide)
- [Why Quality Cannabis Actually Matters](/blog/why-quality-cannabis-matters)
- [Jungle Boys Review](/blog/jungle-boys-strain-review-top-shelf-exotic-2026)`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 6. COOKIES X MUHA — COLLAB DISPOSABLE
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: "cookies-x-muha-collab-disposable-review-2026",
    title: "Cookies x Muha Collab Disposable Review (2026): What Happens When Two Heavyweights Co-Brand",
    subtitle: "The cult cookies genetics meet the proven Muha hardware — full breakdown of why this collab outperforms either brand solo.",
    category: "EDUCATION",
    excerpt: "Cookies x Muha is the rare disposable collab that delivers on both sides — the genetics pedigree of Cookies, the hardware reliability of Muha Meds. Here's the honest review.",
    tags: ["cookies x muha", "cookies disposable", "muha meds disposable", "collab disposable vape", "cannabis disposable review", "real duck distro disposable", "cookies cannabis"],
    metaTitle: "Cookies x Muha Disposable Review (2026) — Collab Done Right",
    metaDescription: "Cookies x Muha collab disposables combine the cookies genetic pedigree with Muha's hardware. Full 2026 review at Real Duck Distro — taste, hardware, hit, and authenticity.",
    metaKeywords: "cookies x muha, cookies disposable, muha meds disposable, cookies vape pen, muha meds new drop, collab disposable, cannabis disposable review 2026, real cookies disposable, real duck distro disposable",
    heroFromProductSlug: "cookies-x-muha",
    content: `Collabs are the easiest way for two cannabis brands to disappoint everybody. Most of them are co-branded packaging slapped onto someone else's mid-tier product, charge a premium, and hope the logo combination sells through before the customers realize what happened.

**Cookies x Muha** is the rare exception. The collab works because both brands brought their actual strengths to the table — Cookies brought genetics, Muha brought hardware — and the result is a disposable that outperforms either brand's solo lineup.

Here's the honest 2026 review from people who've put dozens of these through their daily rotation.

## Who Brought What

**Cookies** is the cannabis brand with one of the strongest genetic libraries in the industry. Founded around the Girl Scout Cookies strain phenotype, the brand has spent a decade building a stable of cookies-family cultivars — Wedding Cake, Gelato, Cereal Milk, Pink Rozay, and dozens more — that are some of the most recognizable strains on the market.

**Muha Meds** is a disposable hardware specialist. Their pens are known for **consistent voltage delivery, reliable airflow geometry, and ceramic coil technology** that doesn't burn out before the cart does. Most disposable failures come from cheap hardware — Muha has built a reputation specifically by *not* failing.

Cross those, and you get:

- **Cookies' premium oil** in a vehicle that doesn't break in week two
- **Muha's hardware** filled with a verifiable genetic profile instead of mystery distillate

That's why this collab matters.

## What's in the Cart

Each Cookies x Muha disposable contains **live resin oil from a Cookies-genetic strain**, not generic distillate. The strain selection rotates — recent batches have featured Wedding Cake, Cereal Milk, and Gelato 33 cuts. Lab testing on the cuts we've moved has shown:

- **80–86% total cannabinoids** (THC + minor cannabinoids combined)
- **8–12% terpenes** (extremely high for a disposable — most distillate carts are 2–4%)
- **Full-spectrum profile** retained through the live-resin extraction process

The high terpene content is what makes the difference. You're not just inhaling THC + flavoring; you're getting the actual strain expression — flavor, effect, and entourage.

## The Hardware

Muha's disposable hardware on this collab includes:

- **Ceramic coil** — better flavor retention than cotton wick, doesn't burn through high-terp oil
- **Rechargeable battery** with USB-C charging — extends life past first depletion
- **3-position airflow** on some units — controls hit size
- **Auto-shutoff** to prevent overheating
- **Clear oil window** — you can see the level (important for catching empty pens before they dry-hit)

Compare against generic disposables which typically have:
- Cheap cotton wick
- Non-rechargeable battery
- Fixed airflow (often restrictive)
- No auto-shutoff
- Opaque body — can't see oil level

## The Hit and the Flavor

First pull from a fresh Cookies x Muha:

- **Smooth on the throat** — minimal harshness even with full-power inhale
- **Strain-accurate flavor** — Wedding Cake actually tastes like Wedding Cake, not generic "sweet"
- **Vapor density** — produces visible vapor (proof of live resin oil; distillate vapor is much thinner)
- **No mouth numbness** — the #1 fake-vape red flag is absent (see our [fake disposable detection guide](/blog/how-to-spot-fake-disposable-vapes-2026))

The high curve is what you'd expect from premium flower of the same genetics:

- **0–3 min**: bright head lift, mood-positive
- **3–15 min**: building euphoria, full-body warmth
- **15–45 min**: peak high — strain-specific (Wedding Cake heavy, Gelato moderate, Cereal Milk energetic)
- **45–90 min**: gradual comedown to baseline

## How to Authenticate Yours

Counterfeits exist for any popular collab. Our [7-point counterfeit test](/blog/how-to-spot-fake-disposable-vapes-2026) applies, but specific to Cookies x Muha:

- **Box**: crisp foil on both brand logos, no print bleeding
- **QR code**: scan it — real ones go to cookies.co/authenticate or muhameds.com/verify
- **Oil color**: amber gold, never dark brown or black, never clear
- **Hardware feel**: heavy, flush mouthpiece, centered USB-C port
- **Source**: only buy from verified distros — sketchy IG accounts run more counterfeits on Cookies than any other brand because of the brand recognition

At Real Duck Distro, we batch-test before any Cookies x Muha unit ships. Same for every disposable we move — see our [main menu](/) for the full disposable lineup.

## How It Compares to Other Disposables

| Pen | Cartridge | Hardware | Best For |
|---|---|---|---|
| **Cookies x Muha** | Live resin, 80–86% cannabinoids | Premium ceramic, rechargeable | Connoisseurs who want strain accuracy |
| [Big Chief](/product/big-chief) | Distillate, mid-tier | Solid, no-frills | Reliable daily driver |
| [Luigi Red Box](/product/luigi-red-box) | Live resin liquid diamonds | Premium hardware | Power users wanting maximum density |
| [Madlabs](/product/madlabs) | Clean lab-tested distillate | Standard | Budget-conscious cleanliness |
| [Heaters Disposables](/product/heaters-disposables) | Strong distillate | Reliable | Repeat-order daily drivers |
| [Stealthy](/product/stealthy) | Distillate | Discreet form factor | Low-profile carry |

If you want a side-by-side, we covered the broader disposable category in our [Big Chief deep dive](/blog/big-chief-disposable-vape-review-all-in-one-cannabis-pen) and [Luigi Live Resin Liquid Diamonds review](/blog/luigi-live-resin-liquid-diamonds-review-premium-disposable).

## Who Should Buy This

- **The Cookies fan** who's been smoking the flower for years and wants the equivalent in vape format
- **The disposable user** ready to graduate from distillate to live resin
- **The discreet smoker** in a state where flower scent is a problem — live resin disposable gives flower-equivalent experience with zero combustion
- **The traveler** — disposables don't smell, work universally, and don't require any gear

## Who Should Skip

- **The flower purist** who doesn't actually want a vape — no shame, smoke flower instead
- **The price-conscious buyer** — Cookies x Muha is premium-tier disposable pricing. If you want the cheapest reliable option, [Big Chief](/product/big-chief) or [Madlabs](/product/madlabs) are the move.
- **The high-tolerance dabber** — if you're already on rosin, disposables won't satisfy you. Skip ahead to our [hash rosin head stash guide](/blog/hash-rosin-90-150u-head-stash-solventless-guide).

## Bottom Line

Cookies x Muha is what the disposable category should be doing more of: **real genetics in real hardware**. Most disposables are one or the other — premium hardware filled with junk oil, or premium oil in cheap hardware that fails halfway through. The collab format here actually delivers both, and the result is one of the cleanest disposable experiences on our menu.

If you've been disappointed by collab releases (and most disposable collabs disappoint), this is the one that resets the bar.

## Read Next

- [How to Spot Fake Disposable Vapes (2026)](/blog/how-to-spot-fake-disposable-vapes-2026)
- [Big Chief Disposable Review](/blog/big-chief-disposable-vape-review-all-in-one-cannabis-pen)
- [Luigi Live Resin Liquid Diamonds Review](/blog/luigi-live-resin-liquid-diamonds-review-premium-disposable)
- [How to Choose the Right Vape (2026)](/blog/how-to-choose-right-vape)`,
  },
];

// ── Apply ──

async function main() {
  console.log(`\n${APPLY ? "🚀 APPLYING" : "🔍 PREVIEW"} — ${BLOGS.length} new blog posts\n`);

  // Resolve hero images from products for the 5 product blogs
  const heroSlugs = BLOGS.map((b) => b.heroFromProductSlug).filter((s): s is string => !!s);
  const heroProducts = await prisma.product.findMany({
    where: { slug: { in: heroSlugs } },
    select: { slug: true, imageUrl: true },
  });
  const heroMap = new Map(heroProducts.map((p) => [p.slug, p]));

  for (const blog of BLOGS) {
    let imageUrl = blog.imageUrl ?? "";
    let images = blog.images ?? [];
    if (blog.heroFromProductSlug) {
      const hero = heroMap.get(blog.heroFromProductSlug);
      if (!hero) {
        console.warn(`  ⚠ ${blog.slug} — hero product '${blog.heroFromProductSlug}' not found`);
      }
      imageUrl = hero?.imageUrl || "https://pub-29aa6546799743b7a432165711f33223.r2.dev/realduck/hero/default.jpg";
    }
    const data = {
      slug: blog.slug,
      title: blog.title,
      subtitle: blog.subtitle,
      category: blog.category,
      content: blog.content,
      excerpt: blog.excerpt,
      imageUrl,
      images,
      author: "Real Duck Distro Editorial Team",
      published: true,
      featured: false,
      tags: blog.tags,
      metaTitle: blog.metaTitle,
      metaDescription: blog.metaDescription,
      metaKeywords: blog.metaKeywords,
    };

    const wordCount = blog.content.split(/\s+/).length;
    console.log(`  • ${blog.slug}`);
    console.log(`    Title: ${blog.title}`);
    console.log(`    Words: ${wordCount}  |  Cat: ${blog.category}  |  Hero: ${blog.heroFromProductSlug || "explicit"}`);

    if (APPLY) {
      const existing = await prisma.blogPost.findUnique({ where: { slug: blog.slug } });
      if (existing) {
        await prisma.blogPost.update({ where: { slug: blog.slug }, data });
        console.log(`    ↻ Updated`);
      } else {
        await prisma.blogPost.create({ data });
        console.log(`    + Created`);
      }
    }
  }

  if (!APPLY) {
    console.log(`\n[dry run] Re-run with --apply to commit.\n`);
  } else {
    console.log(`\n✅ Applied ${BLOGS.length} blog posts.\n`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
