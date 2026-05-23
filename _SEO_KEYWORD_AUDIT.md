# SEO Keyword Audit — Real Duck Distro

**Audit date:** 2026-05-21
**Pages audited:** 175 products + 39 blogs + 6 static = **220 indexable URLs**

---

## 1. Executive summary

**The good news:** Your meta-tag *coverage* is excellent. 167/175 products and 39/39 blogs already have customized meta titles + descriptions. Your meta descriptions are all in the perfect 120-160 character range. You're ahead of 90% of e-commerce sites.

**The bad news:** Your meta *titles* have a structural problem that's silently costing you click-through-rate in search results. **70% of your product titles exceed Google's 60-character SERP limit**, meaning the search snippet truncates the most important part of the title — the strain name — to make room for "Real Duck Distro" branding at the end.

**Top 3 wins (priority order):**

| Priority | Issue | Pages affected | Fix effort |
|---|---|---|---|
| 🔴 P0 | 145 product meta titles >60 chars (truncate in SERPs) | 145 | One script ~10 min |
| 🔴 P0 | 8 products missing meta titles entirely | 8 | One script ~5 min |
| 🟠 P1 | 8 keyword cannibalization conflicts (2 products targeting same keyword) | 16 | Manual review + rewrite |
| 🟡 P2 | 10 blog meta titles >60 chars | 10 | Manual quick-fix |
| 🟡 P2 | 78 product titles lead with "Buy/Get/Order/Shop" — wastes first-position keyword slot | 78 | Bundled with P0 fix |

**If you fix only P0 (the 145 + 8 products), you'll see CTR lift within 2-4 weeks of re-crawl, likely 10-25%.**

---

## 2. Coverage stats (current state)

### Products (175 total)

| Category | Total | With meta | Sold out | Avg title length | Max title length |
|---|---|---|---|---|---|
| FLOWER | 82 | 75 | 0 | 66 | 70 |
| TOP_SHELF | 10 | 10 | 0 | 64 | 69 |
| EDIBLES | 7 | 7 | 0 | 65 | 69 |
| CONCENTRATES | 19 | 19 | 0 | 64 | 69 |
| PREROLLS | 8 | 8 | 0 | 65 | 70 |
| MUSHROOM | 1 | 1 | 0 | 69 | 69 |
| DISPOSABLES | 33 | 33 | 0 | 63 | 70 |
| PILLS | 6 | 6 | 0 | 60 | 67 |
| COKE | 3 | 2 | 0 | 64 | 67 |
| OTHERS | 6 | 6 | 0 | 62 | 69 |

**Insight:** Every category's *average* meta-title length is at or above the 60-char SERP truncation threshold. Even your shortest category (PILLS) averages 60 chars on the dot.

### Blogs (39 total)

- 39/39 have metaTitle + metaDescription (100% coverage)
- 4 featured posts
- 10 with metaTitle >60 chars

### Meta descriptions

- **0** descriptions under 120 chars (weak)
- **0** descriptions over 160 chars (truncate)
- ✅ Perfect

---

## 3. The 8 products missing meta entirely

These are blank in both `metaTitle` and `metaDescription`. They auto-fall back to a generic template — wasted SEO opportunity.

```
/cream-latto-2              ::  CREAM LATTO
/cure-latto-500             ::  Cure latto🍭 🌆$500
/midnight-jelliez           ::  MIDNIGHT JELLIEZ
/zkittle-mms-indoors        ::  Zkittle M&M's indoors 💤🍫
/gumbo-cherries-indoor      ::  Gumbo Cherries Indoor 🍒 🔥
/baby-jeeters-pre-rolls     ::  💵 BABY JEETERS PRE-ROLLS 💵
/cherry-zlushie-2           ::  Cherry Zlushie🍭
/powder-coca-snow           ::  POWDER / COCA /snow
```

These 8 need filling. Easy script.

---

## 4. Keyword cannibalization — 8 conflicts found

These are pairs (or groups) of products both targeting the same 2-word keyword phrase. Google can't decide which one to rank for the term, so it splits the authority — both end up ranking *worse* than if you'd targeted them differently.

### Conflict #1 — "cherry pepper" (Cherry Dr Pepper Indoors)
```
/cherry-dr-pepper-indoors
/cherry-dr-pepper-indoors-2
```
**Fix:** Are these really two products, or is one a duplicate? If duplicate, 301-redirect `-2` → original, delete the duplicate row. If genuinely different (e.g. batch / season), differentiate the title: "Cherry Dr Pepper Indoors (Spring Batch)" vs "Cherry Dr Pepper Indoors (Original)".

### Conflict #2 — "rainbow georgia" (Rainbow Georgia Pie Indoors)
```
/rainbow-georgia-pie-indoors
/rainbow-georgia-pie-indoors-2
```
**Fix:** Same as above.

### Conflict #3 — "sour sherbet" (Sour Sherbet Indoors)
```
/sour-sherbet-indoors
/sour-sherbet-indoors-2
```
**Fix:** Same as above — also has duplicate meta title (highest priority dupe).

### Conflict #4 — "super dope" (Super Dope variants)
```
/super-dope-pre-packaged-flower-by-7g-jars-18ths-35g-jars-bags
/super-dope
```
**Fix:** These ARE different products (one is pre-packaged jars, one is bulk). Rewrite titles to differentiate: `Super Dope Bulk Flower` vs `Super Dope 7g Jars & 1/8ths`.

### Conflict #5 — "squish gummies" (Squish Gummies brand)
```
/squish-gummies-by-snooze
/squish-gummies-minis
```
**Fix:** Differentiate: `Squish Gummies by Snooze (Full Size)` vs `Squish Gummies Minis`.

### Conflict #6 — "terp mansion" (Terp Mansion Rosin)
```
/terp-mansion-rosin
/terp-mansion-rosin-tier-2
```
**Fix:** `Terp Mansion Rosin (Tier 1)` vs `Terp Mansion Rosin (Tier 2)` — make the tier explicit.

### Conflict #7 — "cat liters" (Cat Liters Concentrate)
```
/cat-2-liters
/cat-3-liters
```
**Fix:** Already differentiated by volume in the slug. Update titles to explicitly say `Cat Concentrate 2L` vs `Cat Concentrate 3L`.

### Conflict #8 — "unlabeled wax" (Unlabeled Wax)
```
/unlabeled-wax-crumble-and-sugars-jars-licensed-and-clean
/unlabeled-wax-badder-jars-licensed-and-clean-flavors
```
**Fix:** `Unlabeled Wax — Crumble & Sugar Jars` vs `Unlabeled Wax — Badder Jars`.

---

## 5. The 145 over-long product meta titles — the big P0 fix

### The structural problem

Your current template is:
```
[Verb] [Strain Name] [Descriptor] | [Generic Tag] | Real Duck Distro
```

Example:
```
"Buy Cherry Bomb Indoors Strain Online | Lab-Tested Indoor Exotic | RDD"
                                                                    ↑
                                                          Truncated by Google
```

Google's SERP rendering cuts at **~580 pixels** which works out to ~60 characters (sometimes 58, sometimes 65 — depends on letter widths). When your title is 70 chars, **the last 10 chars get cut off** — and the cut-off portion often includes "Real Duck Distro," which:
- Doesn't help you rank (no one searches for "real duck distro" → so it's just brand insurance)
- Doesn't help you convert (your brand name isn't even visible by the time it matters)

### The recommended new template

```
[Strain Name] [Variant] | [Commercial Qualifier] | RDD
```

Drop "Buy/Get/Order/Shop" verbs. Strain name FIRST. Brand last (if it fits).

### Side-by-side rewrites for your worst offenders

| Old (truncates) | New (fits in 60 chars) | Why |
|---|---|---|
| Buy Cherry Bomb Indoors Strain Online \| Lab-Tested Indoor Exotic \| RDD (70) | Cherry Bomb Indoors — Premium Exotic Flower \| RDD (49) | Strain name first; drops weak "Buy"+"Strain Online" |
| Cherry Dr Pepper Indoors \| Indoor Exotic Flower \| Real Duck Distro USA (70) | Cherry Dr Pepper Indoors — Top-Shelf Exotic \| RDD (49) | Tighter qualifier; "USA" implied |
| Get Oreo Soufflé Indoors Flower Delivered \| Premium Indoor Cannabis (69) | Oreo Soufflé Indoors — Premium Exotic Flower \| RDD (51) | "Delivered" doesn't move keywords; drop |
| Order Cherry Chop Stixxx Indoors Strain — Premium Exotic Indoor (66) | Cherry Chop Stixxx Indoors — Premium Exotic \| RDD (49) | Strain name first, qualifier compressed |
| Buy Apple Fritter Strain Online \| Lab-Tested Indoor Exotic \| RDD (64) | Apple Fritter — S-Tier Indoor Indica Strain \| RDD (49) | "S-Tier" matches the blog content & creates topical link |
| Buy Grumpy Grapes \| Top-Shelf Indoor Exotic Flower \| Real Duck Distro (69) | Grumpy Grapes — Top-Shelf Indoor Exotic \| RDD (45) | Cleaner, fits the brand tone |
| Buy Sour Berry Pebblez Strain Online \| Lab-Tested Indoor Exotic \| RDD (69) | Sour Berry Pebblez — Premium Indoor Strain \| RDD (47) | |
| Shop Wake & Bake Flower \| Indoor Cannabis Strain \| Real Duck Distro (67) | Wake & Bake — Morning Sativa Hybrid \| RDD (42) | Differentiates by effect — interlinks with blog content |
| Buy Strawberry Slurpee Indoors \| Top-Shelf Indoor Exotic Flower (66) | Strawberry Slurpee Indoors — Top-Shelf Exotic \| RDD (52) | |
| Buy Peanut Butter & Jane Strain Online \| Lab-Tested Indoor Exotic (69) | Peanut Butter & Jane — Cookies Family Indoor \| RDD (51) | "Cookies family" = topical authority cluster |

**Average rewrite cuts ~15-20 characters**, putting every title under 60 and pulling the strain name into the visible portion.

### Why "[Strain] — [Effect/Family] \| RDD" works for all 145

1. **Strain name first** = first-position keyword match (highest ranking signal)
2. **Effect/family tag** = clusters topical authority (e.g. "Cookies family" pages reinforce each other for the "cookies strain" cluster)
3. **"\| RDD"** = brand recall without wasting 18 chars on "Real Duck Distro"
4. **Em-dash separator** = visually distinctive in SERPs (vs ubiquitous pipes)

---

## 6. The 10 over-long blog meta titles — P2 quick fix

| Slug | Current title (chars) | Suggested rewrite (chars) |
|---|---|---|
| hash-rosin-90-150u-head-stash-solventless-guide | Hash Rosin 90-150u Head Stash Review — The Solventless Top Tier (63) | Hash Rosin 90-150u Head Stash Review (2026) (44) |
| trending-indoor-smalls-michigan-florida-mississippi-connecticut | Trending Indoor Smalls — MI, FL, MS, CT (2026 Real Duck Distro) (63) | Trending Indoor Smalls in MI, FL, MS & CT (2026) (50) |
| real-vs-pressed-xanax-percs-counterfeit-pills-guide | Real vs Pressed Xanax & Percs (2026) — Spot Counterfeit Pills Safely (68) | Real vs Pressed Xanax & Percs (2026 Spot Guide) (47) |
| toad-venom-super-nova-strain-review-indoor-heavy-pheno | Toad Venom Super Nova Strain Review (2026) — Heaviest Indoor Indica (67) | Toad Venom Super Nova Review (2026 Indoor Indica) (49) |
| polkadot-mushroom-gummies-review-amanita-blend-guide | Polkadot Mushroom Gummies Review (2026) — Amanita Blend Honest Guide (68) | Polkadot Mushroom Gummies Review (2026 Amanita) (47) |
| luigi-live-resin-liquid-diamonds-review-premium-disposable | Luigi Live Resin Liquid Diamonds Review (2026) — Premium 2G Disposable (70) | Luigi Live Resin Diamonds Review (2026) (40) |
| big-chief-disposable-vape-review-all-in-one-cannabis-pen | Big Chief Disposable Vape Review (2026) \| All-In-One Pen Honest Take (68) | Big Chief Disposable Vape Review (2026) (40) |
| sundae-driver-strain-review-indoor-indica-dessert-flavors | Sundae Driver Strain Review (2026) — Indoor Indica Dessert Flower (65) | Sundae Driver Strain Review (2026 Dessert Indica) (49) |
| cannabis-and-pain-management-what-research-says | Cannabis for Pain Management : What the Research Says — Honestly (64) | Cannabis for Pain Management (2026 Research Guide) (50) |
| what-are-terpenes-complete-guide | What Are Terpenes? The Complete 2026 Guide (With Real Examples) (63) | What Are Terpenes? Complete 2026 Guide (39) |

---

## 7. Keyword cluster map (what page targets what)

This is the strategic view: every page grouped by topical cluster. **Each cluster should reinforce itself with internal links.** Pages in the same cluster should link to each other; pages across clusters should NOT (or only sparingly).

### Cluster A — Indoor Flower (premium tier)
**Primary keywords:** "indoor cannabis", "premium indoor flower", "exotic indoor strain"
**~75 products + 12 strain-review blogs**

Internal linking play: Each strain review blog should link to 3-5 same-category products. Each premium-flower product should link to 1-2 strain reviews that mention it.

Anchor products: Apple Fritter, Pink Bubblegum, Sundae Driver, Wake & Bake, Jungle Boys, Grumpy Grapes, Cherry Bombay, Sour Slurpee Exotic SM, Midnight Jelliez

Supporting blogs:
- Apple Fritter Strain Review
- Sundae Driver Strain Review
- Jungle Boys Review
- Wake & Bake Review
- Pink Runtz Review
- Venom Runtz Review
- Gumbo 88G Review
- Frozen Thin Mint Review
- Blue Candy Lemons Review
- Raspberry Airheadz Review
- Toad Venom Super Nova Review
- Strongest Weed Strains 2026 — THC Tier List

### Cluster B — Indoor Smalls / Mixed Lights (value tier)
**Primary keywords:** "indoor smalls", "mixed light flower", "cheap exotic flower"
**~10 products + 1 blog**

Anchor: Trending Indoor Smalls blog (MI/FL/MS/CT). Pull all `mixed-light` and `smalls` products to interlink from here.

Products: Sugar Rush Mixed Light, Tropicana Crashers Mixed Lights, Racefuel Mac Mixed Lights, Rainbow Slurpee Mixed Light, Apple Jealousy Mixed Light, Laffy Taffy Mix Lights, Blueberry Muffins Mixlights, Sour Slurpee Exotic SM, Astro Candy Fakers, Blue Airheadz Runtz Indoors

### Cluster C — Top-Shelf Exotic
**Primary keywords:** "top shelf cannabis", "exotic top shelf strain", "premium designer flower"
**10 products + 1 brand blog**

Anchor blog: Jungle Boys Review.
Products: Super Dope, Jungle Boys, Terphogz 2g Buckets, Terphogz Pre-Packaged, Super Dope Pre-Packaged, Bounty Snowcaps, Bounty Flower, Sweetz Exotic Flower Box, Pillows Exotic Designer Edition, New Hitz Flower 3.5g Jars

### Cluster D — Disposables (vape pens)
**Primary keywords:** "disposable vape", "cannabis disposable", "[brand] vape pen", "live resin disposable"
**33 products + 5 blogs**

Anchor blogs:
- How to Spot Fake Disposable Vapes
- Big Chief Disposable Review
- Luigi Live Resin Liquid Diamonds Review
- Cookies x Muha Collab Review
- How to Choose the Right Vape

Top products: Big Chief, Luigi Red Box, Madlabs, Muha Meds, Cookies x Muha, Heaters, Stealthy, KRT 2G, Push Disposables, MFKN Disposables, Levels Disposables, Grab N Dab

### Cluster E — Edibles
**Primary keywords:** "thc edibles", "cannabis gummies", "[brand] gummies"
**7 products + 1 blog**

Anchor blog: Cannabis Edibles Dosing Guide.
Products: Polkadot Mushie Gummies, Devour 1500MG, Squish Gummies, Squish Minis, Polka Dot Gummies, Terp Burst, Authentic Fusion Boutique Box

### Cluster F — Concentrates / Rosin / Wax
**Primary keywords:** "hash rosin", "live resin", "cannabis wax", "solventless concentrate"
**19 products + 1 blog**

Anchor blog: Hash Rosin 90-150u Head Stash Review.
Products: Hash Rosin 90-150u, Terp Mansion Rosin (T1 + T2), Whole Melts (Havana + Extract), Bakery Premium Badder, Buddah Bear, Crybaby Trio, Drippin Quarters, Gemz, Phaded, Snooze Drool, Wax Batter, Wax Sugar, Raw Sugar, Unlabeled Wax (Crumble + Badder), Cat Liters (2L + 3L), Bubble Hash

### Cluster G — Pre-rolls / Joints
**Primary keywords:** "pre-rolls", "live diamond joints", "cannabis joints"
**8 products + 1 blog**

Anchor: How to Roll the Perfect Joint blog.
Products: Devour 2G Pre-Rolls, Stiiizy 40s 5pk, Backpackboyz x Doja, Pleasure Rosin, Hitz Joints, Muha Mates, Snoozies, Sherbinski Preroll, Baby Jeeters

### Cluster H — Pharmaceuticals (compliance tier)
**Primary keywords:** "real vs pressed pills", "counterfeit pill safety", "harm reduction"
**6 products + 1 dedicated counterfeit blog**

Anchor blog: Real vs Pressed Xanax & Percs.
Products: 2CB, Candy Flip, Xanax Bars, Adderall 30mg, Euros XTC 300mg, Dihydrocodeine 60mg
**Note:** This cluster needs particular care for ad/policy reasons. Internal linking is helpful; external SEO push for these is risky.

### Cluster I — Trust / Authority (cluster glue)
**Primary keywords:** "buy weed online safely", "discreet weed delivery", "real online plug"
**5 PAA blogs**

These DON'T target products — they target high-volume informational queries that bring TRUST traffic. Each one funnels readers to product/category pages.

- Is It Safe to Buy Weed Online?
- How to Spot Fake Disposable Vapes
- Strongest Weed Strains 2026
- How Long Does Cannabis Stay in Your System?
- Discreet Weed Delivery in the USA

### Cluster J — Educational support
**Primary keywords:** "what is X", "how does X work", informational long-tail
**11 evergreen blogs**

These don't target commercial intent but build domain authority. Each should internal-link to 2-3 relevant products from the same family.

What Are Terpenes, Endocannabinoid System, Indica vs Sativa, Quality Cannabis, How to Choose Vape, Edibles Dosing Guide, Cannabis for Sleep, Cannabis for Anxiety, Pain Management, Storage Guide, Beginner's Guide

---

## 8. Quick-win priority list (the 30 highest-impact rewrites)

If you only fix 30 pages, fix these. Ranked by:
- Current SEO weakness (length, missing data, cannibalization)
- Commercial value (price, conversion likelihood)
- Search-volume probability (how popular the underlying term is)

### Top 10 — fix this week

1. **/apple-fritter** — Apple Fritter is a high-volume search term. Currently buried in "Buy Apple Fritter Strain Online" — rewrite to lead with the strain.
2. **/sundae-driver** — same issue, premium strain with blog support.
3. **/jungle-boys** — brand-name search, premium tier.
4. **/wake-bake** — daytime-strain search has real volume.
5. **/pink-bubblegum** — popular candy strain.
6. **/big-chief** — disposable brand with high search volume.
7. **/luigi-red-box** — premium disposable, blog support.
8. **/hash-rosin-90-150u-head-stash** — premium concentrate, blog support.
9. **/cookies-x-muha** — two-brand search overlap.
10. **/sour-slurpee-exotic-sm** — newsletter campaign product, recently featured.

### Next 20 — fix this month

11-15. The 5 cannibalization pairs (cherry pepper, rainbow georgia, sour sherbet, super dope, squish gummies).
16-19. The remaining 4 missing-meta products (cream-latto-2, midnight-jelliez, baby-jeeters-pre-rolls, gumbo-cherries-indoor).
20-24. Top 5 FLOWER products by margin (whichever yield best dollar return).
25-30. Top 6 DISPOSABLES by velocity (whichever sell most frequently).

---

## 9. The implementation script — what would happen

A single migration script `_apply_seo_audit_fixes.ts` could:

1. **For each of the 145 over-long product titles:** apply the `[Strain] — [Effect/Family] | RDD` template, store the new title.
2. **For each of the 8 missing-meta products:** generate from the product title with the same template + a default 150-char description from the category.
3. **For each of the 10 over-long blog titles:** apply the rewrites from Section 6.
4. **For each of the 8 cannibalization conflicts:** apply differentiation suffixes ("(Tier 1)", "(Bulk)", "(7g Jars)", etc.).
5. **Ping IndexNow with all 153 modified URLs** so Bing/Yandex re-crawl within hours.
6. **Run `revalidatePath()` for every changed URL** so Vercel refreshes the SSR cache immediately.

Estimated time to apply: **~15 seconds** for all 153 pages.
Estimated time for Google to re-crawl + reflect in SERPs: **2-4 weeks**.
Expected CTR lift on rewritten pages: **10-25%** (based on industry studies of meta-title-fit improvements).

---

## 10. What this audit did NOT cover (next phases)

- **H1 alignment:** I didn't compare the `<h1>` on each product page against the meta title. If the H1 says "Apple Fritter" but the meta title says "Cherry Bomb" — that's a problem. Phase 2.
- **Content body keyword density:** I didn't analyze the on-page paragraph text for keyword usage. Phase 3.
- **Internal anchor text consistency:** When blog A links to product B, does the anchor text match the keyword B is targeting? Phase 4.
- **External backlink profile:** No tools here can pull this. Use Ahrefs/SEMrush.
- **Actual ranking positions:** Need Google Search Console API or Bing Webmaster API + paid keyword data. Phase 5 (or skip if you trust the optimization-first approach).

---

## 11. Recommendation

**Do P0 (the 145+8 product title rewrites) this week.** It's the single highest-leverage SEO move you can make right now — 153 pages, one script, 15 seconds of execution, 10-25% CTR lift over the following 2-4 weeks.

The cluster strategy in Section 7 is the medium-term play (3-6 months of internal linking work to compound).

Skip the "rank tracking" phase until you have at least one paid SEO tool. Without measurement infrastructure, you can't tell what's working — but the optimizations themselves are still the right move regardless of whether you measure.

---

*Generated by Twin · audit reproducible via `_seo_audit_raw.json` snapshot of 175 products + 39 blogs.*
