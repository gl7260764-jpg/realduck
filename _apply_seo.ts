/**
 * Bulk-apply SEO data to every Product in the catalog.
 *
 *   • Products in USER_SEO get the user's exact title + description.
 *   • All other products get auto-drafted SEO using the same template.
 *   • Every product gets metaKeywords built from base + category + product
 *     keywords pulled from the user's targeted keyword list.
 *   • ogImage defaults to the product's main imageUrl.
 *
 * Default = dry run. Pass --apply to write to DB.
 *   npx tsx ./_apply_seo.ts          # preview
 *   npx tsx ./_apply_seo.ts --apply  # commit
 *
 * Idempotent — re-running with the same data writes the same values.
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import { prisma } from "./lib/prisma";

const APPLY = process.argv.includes("--apply");

// ── User-provided SEO data ──
// Each entry: matchSlugs is the list of DB slugs (or substrings) we'll try
// to match against; the first matching product gets the title + description.
type UserEntry = { matchSlugs: string[]; title: string; description: string };

const USER_SEO: UserEntry[] = [
  { matchSlugs: ["big-chief"], title: "Big Chief Disposable Vape | Buy Big Chief All-In-One Vape Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Big Chief premium all-in-one disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Crafted to meet exacting quality standards with smooth vapor production, premium cannabis oil, flavorful terpene profiles, and reliable all-in-one convenience. Order Big Chief disposable vapes online today." },
  { matchSlugs: ["krt-2g"], title: "KRT 2G Disposable | Buy KRT 2G Disposable Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop KRT 2G disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium all-in-one disposable vapes featuring live diamonds, terpene-rich flavors, smooth vapor production, rechargeable hardware, and high-potency cannabis oil for long-lasting performance. Order authentic KRT 2G disposables online today." },
  { matchSlugs: ["hitz-limited-series"], title: "HITZ Infinity Disposable Vape | Buy HITZ Infinity Online Los Angeles | Nationwide Shipping Available",
    description: "Shop HITZ Infinity disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium all-in-one disposable vapes featuring live resin, liquid diamonds, rich terpene flavor profiles, smooth vapor production, and powerful long-lasting performance. Order authentic HITZ Infinity disposables online today." },
  { matchSlugs: ["besos-2g-switch-device"], title: "Besos 2G Switch Device | Buy Besos Switch Disposable Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Besos 2G Switch Devices from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium dual-chamber and multi-flavor disposable vape devices crafted with liquid diamonds, terpene-rich oil, smooth airflow technology, and powerful long-lasting performance. Designed for flavor switching, vapor consistency, and premium all-in-one convenience. Order authentic Besos 2G Switch disposables online today." },
  { matchSlugs: ["madlabs"], title: "Mad Labs Disposables | Buy Mad Labs Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Mad Labs disposables from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium all-in-one disposable vapes crafted with high-quality extracts, liquid diamonds, rich terpene flavors, smooth airflow technology, and powerful long-lasting performance. Order authentic Mad Labs disposable vapes online today." },
  { matchSlugs: ["bodega-2g-duel"], title: "Bodega 2G Dual Disposable | Buy Bodega Boyz Deuces Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Bodega Boyz Deuces 2G dual chamber disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium dual-flavor disposable vapes featuring live resin oil, terpene-rich flavor combinations, rechargeable hardware, and smooth high-potency performance. Designed for switching between strains or blending flavors in one device. Order authentic Bodega 2G Dual disposables online today." },
  { matchSlugs: ["hitz-zeus-series"], title: "HITZ Zeus Series Disposable | Buy HITZ Zeus Series Online Los Angeles | Nationwide Shipping Available",
    description: "Shop HITZ Zeus Series disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium all-in-one disposable vapes crafted with liquid diamonds, live resin oil, terpene-rich flavor profiles, smooth airflow technology, and powerful long-lasting performance. Designed for premium flavor, potency, and convenience. Order authentic HITZ Zeus Series disposables online today." },
  { matchSlugs: ["fade"], title: "Fade Disposable Vapes | Buy Fade Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Fade disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium all-in-one disposable vapes crafted with high-quality cannabis oil, terpene-rich flavors, smooth vapor production, and long-lasting rechargeable performance. Designed for convenience, flavor, and premium vaping experiences. Order authentic Fade disposables online today." },
  { matchSlugs: ["push-disposables"], title: "Push Disposables | Buy Push Disposable Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Push disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium all-in-one disposable vapes featuring terpene-rich cannabis oil, smooth airflow technology, flavorful vapor production, and long-lasting rechargeable performance. Designed for convenience, potency, and premium vaping experiences. Order authentic Push disposables online today." },
  { matchSlugs: ["heaters-disposables"], title: "Heaters Disposables | Buy Heaters Disposable Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Heaters disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium all-in-one disposable vapes crafted with terpene-rich cannabis oil, smooth vapor production, rechargeable hardware, and long-lasting performance. Designed for bold flavor profiles, convenience, and premium vaping experiences. Order authentic Heaters disposables online today." },
  { matchSlugs: ["ghost-2g"], title: "Ghost 2G Disposable | Buy Ghost 2G Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Ghost 2G disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium all-in-one disposable vapes crafted with high-quality cannabis oil, terpene-rich flavor profiles, smooth airflow technology, and powerful long-lasting performance. Designed for convenience, potency, and premium vaping experiences. Order authentic Ghost 2G disposables online today." },
  { matchSlugs: ["dranks"], title: "Dranks Disposable Vapes | Buy Dranks Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Dranks disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium all-in-one disposable vapes crafted with terpene-rich cannabis oil, flavorful vapor production, smooth airflow technology, and long-lasting rechargeable performance. Designed for convenience, potency, and premium vaping experiences. Order authentic Dranks disposables online today." },
  { matchSlugs: ["wholemelts-2g"], title: "Whole Melt 2G Disposable | Buy Whole Melt 2G Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Whole Melt 2G disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium all-in-one disposable vapes crafted with high-quality live resin oil, terpene-rich flavor profiles, smooth airflow technology, and long-lasting rechargeable performance. Designed for convenience, potency, and premium vaping experiences. Order authentic Whole Melt 2G disposables online today." },
  { matchSlugs: ["blinkers"], title: "Blinkers Disposable Vapes | Buy Blinkers Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Blinkers disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium all-in-one disposable vapes crafted with high-quality cannabis oil, terpene-rich flavor profiles, smooth airflow technology, and long-lasting rechargeable performance. Designed for convenience, potency, and premium vaping experiences. Order authentic Blinkers disposables online today." },
  { matchSlugs: ["muha-meds-new-drop"], title: "Muha Meds Disposables | Buy Muha Meds Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Muha Meds disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium all-in-one disposable vapes crafted with high-quality cannabis oil, terpene-rich flavor profiles, smooth airflow technology, and long-lasting rechargeable performance. Designed for convenience, potency, and premium vaping experiences. Order authentic Muha Meds disposables online today." },
  { matchSlugs: ["stealthy"], title: "Stealthy Disposables | Buy Stealthy Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Stealthy disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium all-in-one disposable vapes crafted with terpene-rich cannabis oil, smooth airflow technology, flavorful vapor production, and long-lasting rechargeable performance. Designed for discreet convenience, potency, and premium vaping experiences. Order authentic Stealthy disposables online today." },
  { matchSlugs: ["luigi-red-box", "luigi"], title: "Luigi Live Resin Liquid Diamonds Disposable Vape | Buy Luigi 2G Disposable Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Luigi Live Resin Liquid Diamonds disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium 2G disposable vapes crafted with live resin and liquid diamond extracts for bold terpene flavor, smooth vapor production, and powerful long-lasting performance. Designed with high-quality cannabis-derived ingredients and rechargeable all-in-one hardware for premium vaping experiences. Order authentic Luigi Live Resin Liquid Diamonds disposables online today." },
  { matchSlugs: ["minaj"], title: "Minaj Disposable Vapes | Buy Minaj Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Minaj disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium all-in-one disposable vapes crafted with high-quality cannabis oil, terpene-rich flavor profiles, smooth airflow technology, and long-lasting rechargeable performance. Designed for convenience, potency, and premium vaping experiences. Order authentic Minaj disposables online today." },
  { matchSlugs: ["switch-orb"], title: "Switch ORB Disposable | Buy Switch ORB V5 Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Switch ORB V5 disposables from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium triple-tank disposable vapes crafted with liquid live diamonds, terpene-rich flavor profiles, smooth airflow technology, and advanced multi-strain switching functionality. Designed for powerful long-lasting performance, premium vapor production, and all-in-one convenience. Order authentic Switch ORB disposables online today." },
  { matchSlugs: ["craves-fidget-vape"], title: "Craves Fidget Vape | Buy Craves Spinning Disposable Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Craves Fidget Vape disposables from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium spinning disposable vapes featuring innovative fidget spinner technology, live resin and liquid diamond extracts, terpene-rich flavor profiles, interactive LED displays, and smooth long-lasting performance. Designed for premium vaping experiences, stress-relief functionality, and all-in-one convenience. Order authentic Craves Spinning disposables online today." },
  { matchSlugs: ["cookies-x-muha"], title: "Cookies X Muha Disposable Vape | Buy Cookies X Muha Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Cookies X Muha disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium collaboration disposable vapes featuring top-shelf Cookies genetics combined with Muha Meds liquid diamond and distillate technology for rich terpene flavor, smooth vapor production, and powerful long-lasting performance. Designed with premium all-in-one hardware and exclusive strain profiles including Gary Payton, Cereal Milk, Blue Slushie, and Tequila Sunrise. Order authentic Cookies X Muha disposables online today." },
  { matchSlugs: ["new-stoner-stixx"], title: "NEW Stoner Stix Disposable | Buy Stoner Stix Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop NEW Stoner Stix disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium 2G disposable vapes crafted with live resin, live rosin, melted diamonds, and terpene-rich flavor profiles for smooth vapor production and long-lasting performance. Designed with rechargeable all-in-one hardware for premium vaping experiences and authentic cannabis flavor. Order authentic NEW Stoner Stix disposables online today." },
  { matchSlugs: ["authentic-geek-bars-pulse-x-25000-puffs"], title: "Geek Bar Pulse X Nicotine Vape | Buy Authentic Geek Bar Pulse X Online Los Angeles | Nationwide Shipping Available",
    description: "Shop authentic Geek Bar Pulse X nicotine vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium disposable nicotine vapes featuring up to 25,000 puffs, dual mesh coil technology, adjustable power modes, rechargeable convenience, and bold flavor profiles for smooth long-lasting performance. Designed for premium vapor production and advanced disposable vape experiences. Order authentic Geek Bar Pulse X nicotine disposables online today." },
  { matchSlugs: ["new-fade"], title: "NEW FADE Disposable | Buy NEW FADE Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop NEW FADE disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium all-in-one disposable vapes crafted with high-quality cannabis oil, terpene-rich flavor profiles, smooth airflow technology, and long-lasting rechargeable performance. Designed for convenience, potency, and premium vaping experiences. Order authentic NEW FADE disposables online today." },
  { matchSlugs: ["alien-labs-connected-1g-cartridges"], title: "Alien Labs & Connected 1G Cartridges | Buy Authentic Alien Labs Carts Online Los Angeles | Nationwide Shipping Available",
    description: "Shop authentic Alien Labs and Connected 1G cartridges from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium cannabis vape cartridges crafted with high-quality live resin oil, terpene-rich strain profiles, and smooth vapor production for powerful flavor and potency. Designed for premium vaping experiences with authentic California cannabis genetics. Order Alien Labs and Connected 1G cartridges online today." },
  { matchSlugs: ["grab-n-dab-new-drop", "grab-n-dab"], title: "Grab N Dab Concentrates | Buy Grab N Dab Extracts Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Grab N Dab concentrates from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium live resin, badder, sugar, and diamond extracts crafted for rich terpene flavor, smooth consistency, and high-quality concentrate experiences. Designed for powerful potency and authentic extract flavor profiles. Order Grab N Dab concentrates online today." },
  { matchSlugs: ["clean-meds"], title: "Clean Meds Concentrates | Buy Clean Meds Extracts Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Clean Meds concentrates from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium cannabis extracts crafted for clean flavor profiles, smooth consistency, terpene-rich experiences, and high-quality concentrate performance. Designed for authentic extract quality and powerful potency. Order Clean Meds concentrates online today." },
  { matchSlugs: ["levels-disposables"], title: "Levels Disposables | Buy Levels Disposable Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Levels disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium 2G disposable vapes crafted with live resin, liquid diamonds, and terpene-rich cannabis oil for smooth vapor production and powerful long-lasting performance. Designed with rechargeable all-in-one hardware for premium vaping experiences and authentic flavor profiles. Order authentic Levels disposables online today." },
  { matchSlugs: ["new-og-cake"], title: "OG Cake Disposable | Buy OG Cake Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop OG Cake disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium disposable vapes crafted with terpene-rich cannabis oil, smooth airflow technology, flavorful vapor production, and long-lasting rechargeable performance. Designed for premium potency, convenience, and authentic strain-inspired flavor profiles. Order authentic OG Cake disposables online today." },
  { matchSlugs: ["mfkn-disposables"], title: "MFKN Disposables | Buy MFKN Disposable Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop MFKN disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium all-in-one disposable vapes crafted with high-quality cannabis oil, terpene-rich flavor profiles, smooth airflow technology, and long-lasting rechargeable performance. Designed for convenience, potency, and premium vaping experiences. Order authentic MFKN disposables online today." },
  { matchSlugs: ["splitz-2g"], title: "Splitz 2G Disposable | Buy Splitz 2G Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Splitz 2G disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium dual-flavor disposable vapes crafted with terpene-rich cannabis oil, smooth airflow technology, rechargeable hardware, and powerful long-lasting performance. Designed for flavor switching, convenience, and premium vaping experiences. Order authentic Splitz 2G disposables online today." },
  { matchSlugs: ["polkadot-mushie-gummies", "polka-dot-gummies"], title: "Polkadot Mushroom Gummies | Buy Polkadot Gummies Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Polkadot Mushroom Gummies from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium mushroom blend gummies crafted with Amanita Muscaria and functional mushroom ingredients for flavorful edible experiences and convenient dosing. Available in multiple flavors with high-potency mushroom blend formulas. Order authentic Polkadot Mushroom Gummies online today." },
  { matchSlugs: ["terp-burst"], title: "Terp Burst Disposables | Buy Terp Burst Vapes Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Terp Burst disposable vapes from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium disposable vapes crafted with terpene-rich cannabis oil, bold flavor profiles, smooth airflow technology, and long-lasting rechargeable performance. Designed for powerful flavor, convenience, and premium vaping experiences. Order authentic Terp Burst disposables online today." },
  { matchSlugs: ["devour-1500-mg-edibles"], title: "Devour 1500MG Edibles | Buy Devour THC Gummies Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Devour 1500MG edibles from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium THC-infused gummies crafted with bold flavor profiles, consistent dosing, and high-potency edible formulations for long-lasting experiences. Available in multiple flavors with powerful 1500MG blends. Order Devour edibles online today." },
  { matchSlugs: ["squish-gummies-minis"], title: "Squish Gummies Minis | Buy Squish Mini Gummies Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Squish Gummies Minis from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium mini gummy edibles crafted with flavorful fruit blends, consistent dosing, and high-quality infused ingredients for smooth and enjoyable edible experiences. Available in multiple flavors and convenient bite-sized pieces. Order Squish Gummies Minis online today." },
  { matchSlugs: ["authentic-fusion-boutique-box"], title: "Fusion Boutique Box | Buy Fusion Boutique Edibles Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Fusion Boutique Box edibles from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium infused edible boxes crafted with flavorful blends, high-quality ingredients, and consistent potency for smooth long-lasting experiences. Designed for premium edible enjoyment and boutique flavor profiles. Order Fusion Boutique Box edibles online today." },
  { matchSlugs: ["squish-gummies-by-snooze"], title: "Squish Gummies by Snooze | Buy Snooze Squish Gummies Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Squish Gummies by Snooze from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium live resin infused gummies crafted with bold fruit flavors, smooth texture, and high-quality cannabis extracts for long-lasting edible experiences. Designed with consistent dosing, terpene-rich infusion, and powerful effects for premium edible enjoyment. Order authentic Squish Gummies by Snooze online today." },
  { matchSlugs: ["fetty-wap-ing-stamp-extremely-potent-half-kg"], title: "Fetty Wap “ING” Stamp | Buy Premium Fetty Wap Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Fetty Wap “ING” Stamp exotic from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Available in half kilogram quantities for premium bulk flower sourcing. Order exotic indoor flower online today." },
  { matchSlugs: ["lavada-washed-coke"], title: "Lavada Washed Coke | Buy Lavada Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Lavada washed exotic from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium quality crafted for purity and powerful long-lasting performance. Order authentic Lavada online today." },
  { matchSlugs: ["buddah-bear-concentrate"], title: "Buddah Bear Concentrates | Buy Buddah Bear Extracts Online Los Angeles | Nationwide Shipping Available",
    description: "Shop authentic Buddah Bear concentrates in Los Angeles, California with nationwide shipping available. Premium live resin, badder, sugar, and diamond extracts crafted for rich terpene flavor, smooth consistency, and high-potency cannabis concentrate quality. Order online today." },
  { matchSlugs: ["phaded-concentrate"], title: "Phaded Concentrates | Buy Phaded Extracts Online Los Angeles | Nationwide Shipping Available",
    description: "Shop authentic Phaded concentrates in Los Angeles, California with nationwide shipping available. Premium live resin, badder, sugar, and diamond extracts crafted for rich terpene flavor, smooth consistency, and high-quality cannabis concentrate experiences. Order Phaded premium extracts online today." },
  { matchSlugs: ["unlabeled-wax-badder-jars-licensed-and-clean-flavors"], title: "Real Duck Distro Unlabeled Wax Badder Jars | Buy Premium Wax Badder Online Los Angeles | Nationwide Shipping Available",
    description: "Shop premium unlabeled wax badder jars from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Licensed and clean concentrates crafted for rich terpene flavor, smooth consistency, and high-quality extract experiences. Multiple flavors available. Order premium wax badder online today." },
  { matchSlugs: ["snooze-drool-badder-and-suger"], title: "Snooze Drool Badder and Sugar | Buy Snooze Drool Concentrates Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Snooze Drool badder and sugar concentrates from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium badder and sugar extracts crafted for rich terpene flavor, smooth consistency, and top-quality concentrate experiences. Order Snooze Drool concentrates online today." },
  { matchSlugs: ["gemz-concentrate"], title: "Gemz Concentrates | Buy Gemz Extracts Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Gemz concentrates from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium live resin, badder, sugar, and diamond extracts crafted for rich terpene flavor, smooth consistency, and high-quality concentrate experiences. Order Gemz premium extracts online today." },
  { matchSlugs: ["wax-sugar"], title: "Wax Sugar Concentrates | Buy Premium Wax Sugar Online Los Angeles | Nationwide Shipping Available",
    description: "Shop premium wax sugar concentrates from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Terpene-rich sugar extracts crafted for smooth consistency, bold flavor profiles, and high-quality concentrate experiences. Order premium wax sugar online today." },
  { matchSlugs: ["cat-3-liters"], title: "Cat 3 Distillate Liters | Buy Premium Cat 3 Distillate Online Los Angeles | Nationwide Shipping Available",
    description: "Shop premium Cat 3 distillate liters from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Highly refined cannabis distillate that meets California Category 3 safety standards and passes DCC66 testing for pesticides, heavy metals, residual solvents, and microbial impurities. Crafted for purity, potency, and premium-quality cannabis oil applications. Order Cat 3 distillate liters online today." },
  { matchSlugs: ["bakery-premium-badder"], title: "Bakery Premium Badder | Buy Bakery Concentrates Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Bakery Premium Badder from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium badder concentrates crafted for rich terpene flavor, smooth consistency, and high-quality extract experiences. Order Bakery premium badder online today." },
  { matchSlugs: ["whole-melt-extract", "whole-melts-havana"], title: "Whole Melt Extracts | Buy Whole Melt Concentrates Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Whole Melt extracts from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium live resin, badder, sugar, and melt concentrates crafted for rich terpene flavor, smooth consistency, and high-quality extract experiences. Order Whole Melt premium concentrates online today." },
  { matchSlugs: ["wax-batter"], title: "Wax Badder Concentrates | Buy Premium Wax Badder Online Los Angeles | Nationwide Shipping Available",
    description: "Shop premium wax badder concentrates from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Terpene-rich badder extracts crafted for smooth consistency, bold flavor profiles, and high-quality concentrate experiences. Order premium wax badder online today." },
  { matchSlugs: ["unlabeled-wax-crumble-and-sugars-jars-licensed-and-clean"], title: "Unlabeled Wax Crumble and Sugar Jars | Buy Premium Concentrates Online Los Angeles | Nationwide Shipping Available",
    description: "Shop premium unlabeled wax crumble and sugar jars from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Licensed and clean concentrates crafted for rich terpene flavor, smooth texture, and high-quality extract experiences. Order premium crumble and sugar concentrates online today." },
  { matchSlugs: ["crybaby-trio-concentrates"], title: "Crybaby Trio Concentrates | Buy Crybaby Trio Extracts Online Los Angeles | Nationwide Shipping Available",
    description: "Shop Crybaby Trio concentrates from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium badder, sugar, and live resin extracts crafted for rich terpene flavor, smooth consistency, and high-quality concentrate experiences. Order Crybaby Trio concentrates online today." },
  { matchSlugs: ["terp-mansion-rosin-tier-2"], title: "Terp Mansion Rosin Tier 2 | Buy Terp Mansion Rosin Online Los Angeles | Nationwide Shipping Available",
    description: "Shop authentic Terp Mansion Rosin Tier 2 from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. Premium solventless rosin crafted for rich terpene flavor, smooth texture, and top-quality concentrate experiences. Order Terp Mansion Rosin Tier 2 online today." },
];

// ── Targeted keyword pool from the user. Used in metaKeywords selection. ──
const BASE_KEYWORDS = [
  "real duck distro", "Los Angeles cannabis", "nationwide shipping",
  "buy cannabis online", "premium cannabis", "exotic cannabis", "farmers Los Angeles",
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  FLOWER: [
    "exotic flower", "indoor exotic", "top shelf flower", "indoor cannabis",
    "moonrocks", "candy smalls", "real za", "zaza", "real zaza", "deps",
    "candy bags", "china packs", "bowls for the low", "exotics under 1k",
    "cheap indoors", "gas for the low", "indoors", "cannabis flower",
  ],
  TOP_SHELF: [
    "top shelf cannabis", "boutique flower", "exotic indoor", "premium cannabis",
    "pillows exotics", "sweets exotics", "high tolerance", "scumbagsla",
    "bounty flower", "jungle boys", "terphogz", "sherbinski",
  ],
  CONCENTRATES: [
    "live resin", "badder", "concentrates", "extracts", "rosin",
    "cannabis concentrates", "wax badder", "live diamonds", "hash",
    "bubble hash", "moon rocks",
  ],
  PREROLLS: [
    "pre-rolls", "infused pre-rolls", "premium prerolls", "terps",
    "live diamond prerolls", "sherbinski preroll",
  ],
  EDIBLES: ["thc edibles", "cannabis edibles", "infused gummies", "thc gummies", "live resin gummies"],
  DISPOSABLES: [
    "disposable vapes", "2g disposable", "all-in-one vape", "live resin disposable",
    "live diamonds vape", "rechargeable disposable", "muhameds", "madlabs",
    "luigi", "boutique switch", "grab and dab", "dranks",
  ],
  MUSHROOM: ["mushroom edibles", "amanita gummies", "psilocybin", "polkadot mushroom"],
  PILLS: ["delta 9", "thc pills", "molly", "xanax", "percs", "xans", "acid"],
  COKE: ["fetty wap", "exotic flower", "premium kilo"],
  OTHERS: ["premium exotic", "specialty cannabis", "thc drinks", "ketamine", "mdma", "moonrocks"],
};

// Brand/strain → keywords. If a product slug or title contains the key, the keywords are added.
const BRAND_STRAIN_KEYWORDS: { match: string; keywords: string[] }[] = [
  { match: "luigi", keywords: ["luigi", "luigi disposable", "luigi liquid diamonds", "live resin disposable"] },
  { match: "muha", keywords: ["muhameds", "muha meds", "muha disposable"] },
  { match: "madlab", keywords: ["madlabs", "mad labs disposable"] },
  { match: "big-chief", keywords: ["big chief", "big chief vape"] },
  { match: "krt", keywords: ["krt 2g", "krt disposable"] },
  { match: "hitz", keywords: ["hitz disposable", "hitz infinity", "hitz zeus"] },
  { match: "besos", keywords: ["besos switch", "besos 2g"] },
  { match: "bodega", keywords: ["bodega boyz", "bodega 2g", "deuces"] },
  { match: "ghost", keywords: ["ghost 2g", "ghost disposable"] },
  { match: "wholemelts", keywords: ["whole melt", "whole melts disposable"] },
  { match: "stealthy", keywords: ["stealthy disposable", "discreet vape"] },
  { match: "blinkers", keywords: ["blinkers disposable"] },
  { match: "minaj", keywords: ["minaj disposable"] },
  { match: "switch-orb", keywords: ["switch orb", "switch v5", "boutique switch"] },
  { match: "craves", keywords: ["craves fidget vape", "spinning disposable"] },
  { match: "cookies", keywords: ["cookies cannabis", "cookies x muha", "gary payton"] },
  { match: "stoner-stixx", keywords: ["stoner stix", "live resin disposable"] },
  { match: "geek-bar", keywords: ["geek bar pulse x", "nicotine vape", "25000 puffs"] },
  { match: "alien-labs", keywords: ["alien labs", "connected cartridges", "live resin cart"] },
  { match: "grab-n-dab", keywords: ["grab n dab", "grab and dab", "live resin badder"] },
  { match: "clean-meds", keywords: ["clean meds", "premium concentrate"] },
  { match: "levels", keywords: ["levels disposable", "live diamonds"] },
  { match: "og-cake", keywords: ["og cake", "og cake disposable"] },
  { match: "mfkn", keywords: ["mfkn disposable"] },
  { match: "splitz", keywords: ["splitz 2g", "dual flavor disposable"] },
  { match: "polkadot", keywords: ["polkadot mushroom", "amanita gummies"] },
  { match: "polka-dot", keywords: ["polkadot mushroom", "polka dot gummies"] },
  { match: "terp-burst", keywords: ["terp burst", "terpene rich vape"] },
  { match: "devour", keywords: ["devour edibles", "1500mg gummies"] },
  { match: "squish", keywords: ["squish gummies", "squish minis"] },
  { match: "snooze", keywords: ["snooze drool", "snooze gummies"] },
  { match: "fusion-boutique", keywords: ["fusion boutique", "boutique edibles"] },
  { match: "fetty-wap", keywords: ["fetty wap", "ing stamp", "half kg"] },
  { match: "lavada", keywords: ["lavada", "washed coke"] },
  { match: "buddah-bear", keywords: ["buddah bear concentrate"] },
  { match: "phaded", keywords: ["phaded concentrate"] },
  { match: "unlabeled-wax", keywords: ["unlabeled wax", "wax badder", "wax sugar"] },
  { match: "snooze-drool", keywords: ["snooze drool", "badder and sugar"] },
  { match: "gemz", keywords: ["gemz concentrate"] },
  { match: "wax-sugar", keywords: ["wax sugar"] },
  { match: "wax-batter", keywords: ["wax badder"] },
  { match: "cat-3", keywords: ["cat 3 distillate", "DCC66 tested", "category 3 distillate"] },
  { match: "bakery", keywords: ["bakery badder", "premium badder"] },
  { match: "whole-melt", keywords: ["whole melt extracts", "whole melts havana"] },
  { match: "crybaby", keywords: ["crybaby trio"] },
  { match: "terp-mansion", keywords: ["terp mansion rosin"] },
  { match: "fade", keywords: ["fade disposable"] },
  { match: "push-disposables", keywords: ["push disposable"] },
  { match: "heaters", keywords: ["heaters disposable"] },
  { match: "dranks", keywords: ["dranks disposable"] },
  // Strains
  { match: "gumbo", keywords: ["gumbo strain", "gumbo flower"] },
  { match: "lcg", keywords: ["lcg strain", "lcg flower"] },
  { match: "georgia-pie", keywords: ["georgia pie", "georgia pie strain"] },
  { match: "rs11", keywords: ["rs11 strain"] },
  { match: "gmo", keywords: ["gmo strain"] },
  { match: "runtz", keywords: ["runtz strain", "exotic runtz"] },
  { match: "animal-mintz", keywords: ["animal mintz"] },
  { match: "sherbinski", keywords: ["sherbinski strain", "sherbinski exotic"] },
  { match: "london-pound-cake", keywords: ["london pound cake"] },
  { match: "oreo-souffle", keywords: ["oreo souffle", "oreo soufflé"] },
  { match: "blueberry-muffin", keywords: ["blueberry muffins"] },
  { match: "rainbow-slurpee", keywords: ["rainbow slurpee"] },
  { match: "sour-diesel", keywords: ["sour diesel"] },
  { match: "blue-wasabi", keywords: ["blue wasabi"] },
  { match: "ice-cream-gelato", keywords: ["ice cream gelato"] },
  { match: "sundae-driver", keywords: ["sundae driver"] },
  { match: "laffy-taffy", keywords: ["laffy taffy"] },
  { match: "toad-venom", keywords: ["toad venom", "exotic indoor"] },
  { match: "moon-rocks", keywords: ["moonrocks", "moon rocks"] },
  { match: "moonrock", keywords: ["moonrocks", "moon rocks"] },
  { match: "kaws", keywords: ["kaws moonrocks", "moon rocks"] },
];

// ── Helpers ──

function findUserEntry(slug: string, title: string): UserEntry | undefined {
  const normTitle = title.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  for (const entry of USER_SEO) {
    for (const m of entry.matchSlugs) {
      if (slug === m) return entry;
      if (slug.includes(m)) return entry;
      if (m.includes(slug) && slug.length > 4) return entry;
      if (normTitle.includes(m.replace(/-/g, " "))) return entry;
    }
  }
  return undefined;
}

function autoDraft(productTitle: string, category: string): { title: string; description: string } {
  const cleaned = productTitle.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").replace(/\s+/g, " ").trim();
  const cat = category.toLowerCase().replace(/_/g, " ");
  const title = `${cleaned} | Buy ${cleaned} Online Los Angeles | Nationwide Shipping Available`;
  const tagline: Record<string, string> = {
    FLOWER: "premium indoor exotic flower crafted with rich terpene profiles, dense bag appeal, and authentic top-shelf cannabis genetics for powerful long-lasting effects",
    TOP_SHELF: "premium top-shelf cannabis crafted with exotic indoor genetics, rich terpene profiles, and boutique-grade quality for connoisseur experiences",
    EDIBLES: "premium THC-infused edibles crafted with consistent dosing, bold flavor profiles, and high-quality cannabis ingredients for long-lasting edible experiences",
    CONCENTRATES: "premium cannabis extracts crafted for rich terpene flavor, smooth consistency, and high-quality concentrate experiences",
    DISPOSABLES: "premium all-in-one disposable vapes crafted with terpene-rich cannabis oil, smooth airflow technology, and long-lasting rechargeable performance",
    PREROLLS: "premium pre-rolls crafted with top-shelf cannabis, smooth burn quality, and rich terpene flavor profiles for premium smoking experiences",
    MUSHROOM: "premium mushroom blend products crafted with functional ingredients for flavorful experiences and convenient dosing",
    PILLS: "premium pharmaceutical-grade products crafted for consistent quality and reliable performance",
    COKE: "premium exotic product crafted for purity and powerful long-lasting performance",
    OTHERS: "premium specialty cannabis products crafted with high-quality ingredients and unique flavor profiles",
  };
  const desc = `Shop ${cleaned} from REAL DUCK DISTRO in Los Angeles, California with nationwide shipping available. ${tagline[category] || tagline.OTHERS}. Order ${cleaned} online today.`;
  return { title: title.length > 200 ? title.slice(0, 200) : title, description: desc };
}

function buildKeywords(slug: string, title: string, category: string): string {
  const set = new Set<string>();
  for (const k of BASE_KEYWORDS) set.add(k.toLowerCase());
  for (const k of (CATEGORY_KEYWORDS[category] || [])) set.add(k.toLowerCase());
  const haystack = (slug + " " + title).toLowerCase();
  for (const { match, keywords } of BRAND_STRAIN_KEYWORDS) {
    if (haystack.includes(match)) {
      for (const k of keywords) set.add(k.toLowerCase());
    }
  }
  // Cap at 18 keywords to stay reasonable
  return [...set].slice(0, 18).join(", ");
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}\n`);
  const products = await prisma.product.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
    select: {
      id: true, slug: true, title: true, category: true, imageUrl: true,
      metaTitle: true, metaDescription: true, metaKeywords: true, ogImage: true,
    },
  });

  let userMatched = 0;
  let autoDrafted = 0;
  const updates: { id: string; data: Record<string, string> }[] = [];

  for (const p of products) {
    if (!p.slug) continue;
    const userEntry = findUserEntry(p.slug, p.title);
    let title: string;
    let description: string;
    if (userEntry) {
      title = userEntry.title;
      description = userEntry.description;
      userMatched++;
    } else {
      const drafted = autoDraft(p.title, p.category);
      title = drafted.title;
      description = drafted.description;
      autoDrafted++;
    }
    const keywords = buildKeywords(p.slug, p.title, p.category);
    const ogImage = p.imageUrl;

    updates.push({
      id: p.id,
      data: {
        metaTitle: title,
        metaDescription: description,
        metaKeywords: keywords,
        ogImage,
      },
    });
  }

  console.log(`Total products:           ${products.length}`);
  console.log(`Matched user-provided:    ${userMatched}`);
  console.log(`Auto-drafted from name:   ${autoDrafted}\n`);

  // Show sample
  console.log("Sample (first 8 products):");
  for (const p of products.slice(0, 8)) {
    const u = updates.find((x) => x.id === p.id)!;
    console.log(`\n  [${p.category}] ${p.slug}`);
    console.log(`    title: ${u.data.metaTitle.slice(0, 100)}`);
    console.log(`    desc:  ${u.data.metaDescription.slice(0, 100)}…`);
    console.log(`    kw:    ${u.data.metaKeywords.slice(0, 100)}…`);
  }

  if (!APPLY) {
    console.log("\n" + "─".repeat(70));
    console.log("DRY RUN — no changes written. Re-run with --apply to commit.");
    await prisma.$disconnect();
    return;
  }

  console.log("\nApplying…");
  for (const u of updates) {
    await prisma.product.update({ where: { id: u.id }, data: u.data });
  }
  console.log(`✓ Updated ${updates.length} products with SEO metadata.`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
