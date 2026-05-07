/**
 * FAQ data for priority SEO products.
 * Renders as FAQPage JSON-LD on the product detail page when slug matches.
 *
 * 20 products picked for highest ranking potential:
 *   • Brand recognition (Big Chief, Luigi, Muha Meds, KRT, Mad Labs, etc.)
 *   • Distinctive names (low keyword competition)
 *   • Clear use cases people actually search for
 *
 * Each entry includes 4–6 high-intent questions answered in the product's
 * own voice. Adding FAQPage schema is the easiest path to a rich-snippet
 * (expandable Q&A) listing in Google search results.
 */

export interface ProductFAQ {
  question: string;
  answer: string;
}

export const PRODUCT_FAQS: Record<string, ProductFAQ[]> = {
  "big-chief": [
    { question: "Is this an authentic Big Chief disposable?",
      answer: "Yes. Real Duck Distro carries only authenticated Big Chief stock from verified suppliers. Each pen has a batch number and QR code that resolves on the official Big Chief brand site." },
    { question: "How many puffs does a Big Chief disposable last?",
      answer: "A 1-gram Big Chief All-In-One delivers approximately 600 puffs at a moderate draw, depending on your vaping style and the strain's oil density." },
    { question: "Can I recharge a Big Chief disposable?",
      answer: "No — the battery is sized to outlast the oil supply but is single-use. When the LED stops responding, the device is intentionally end-of-life." },
    { question: "Does Big Chief use real live resin?",
      answer: "Yes. Big Chief blends distillate with strain-specific live resin for terpene flavor, not synthetic flavor catalogs. That's why a Big Chief Wedding Cake actually tastes like Wedding Cake." },
    { question: "How fast does Real Duck Distro ship Big Chief disposables?",
      answer: "Most US orders ship within 24 hours from Los Angeles via discreet packaging, with delivery in 2–5 business days nationwide." } ],

  "luigi-red-box": [
    { question: "What does \"Live Resin Liquid Diamonds\" actually mean?",
      answer: "Live resin is extract from flash-frozen cannabis flower, preserving volatile terpenes. Liquid diamonds are THCa crystals re-suspended in that resin. Combined: heavy potency plus full terpene flavor — the top tier of disposable formats." },
    { question: "Is this 1G or 2G?",
      answer: "Luigi Red Box is a 2G disposable, with adjustable airflow and Type-C charging so the battery comfortably outlasts the full 2G of oil." },
    { question: "How does Luigi compare to Big Chief or Muha Meds?",
      answer: "Big Chief and Muha Meds are tier-2 (live resin). Luigi sits in tier-3 (live resin + liquid diamonds), giving stronger potency and more authentic strain flavor at a higher price point." },
    { question: "Does the strain flavor stay consistent through the whole 2G?",
      answer: "Yes. Luigi's terpene retention is engineered — flavor at the back third of the pen tastes like the front. Cheap pens degrade noticeably; Luigi doesn't." },
    { question: "How should I store Luigi disposables?",
      answer: "Store upright at room temperature, away from sunlight. Refrigeration thickens the oil; heat causes leaking. An unopened Luigi keeps peak quality for months when stored correctly." } ],

  "muha-meds-new-drop": [
    { question: "Is the Muha Meds New Drop authentic?",
      answer: "Yes. Real Duck Distro sources from verified Muha Meds distributors. We do not stock pressed or counterfeit Muha Meds — the difference is real and detectable." },
    { question: "What flavors are available in the new drop?",
      answer: "The current rotation includes liquid-diamond strains across indica, sativa, and hybrid categories — terpene-rich profiles using authentic strain extracts." },
    { question: "How does Muha Meds compare to Cookies X Muha?",
      answer: "Cookies X Muha is a collaboration combining Cookies genetics with Muha hardware. Standard Muha Meds uses Muha's own house strains. Both are tier-2/3 premium disposables." },
    { question: "Does this disposable need a separate battery?",
      answer: "No — Muha Meds is an all-in-one. Pre-charged and pre-filled, it's ready to use the moment you open it." } ],

  "krt-2g": [
    { question: "Is KRT 2G a real cannabis brand?",
      answer: "KRT (Kurupt's Moonrock) is an established California cannabis brand. The 2G disposable format is their flagship, featuring liquid diamonds and rechargeable hardware." },
    { question: "How long does a KRT 2G last on average?",
      answer: "Daily users typically finish a 2G in 7–14 days. Occasional users may stretch to 3–4 weeks. The recharge means you don't run out of battery before oil." },
    { question: "Is KRT stronger than other 2G disposables?",
      answer: "KRT's liquid diamond formulation delivers high-potency hits comparable to Luigi and Cookies X Muha. THC concentration is in the upper tier of disposables." } ],

  "madlabs": [
    { question: "Are Mad Labs disposables tested?",
      answer: "Yes — Mad Labs publishes lab tests for cannabinoid potency and pesticide screening. Real Duck Distro stocks only verified-tested batches." },
    { question: "What makes Mad Labs different from other disposables?",
      answer: "Mad Labs uses a proprietary blend of liquid diamonds and live resin with custom hardware tuned for smoother airflow at low temperatures, preserving terpenes longer." },
    { question: "Are these the same as the Mad Labs cartridges?",
      answer: "The oil formulation is similar, but the disposable hardware is engineered to extract maximum flavor from the same oil at lower wattage than a generic 510 battery." } ],

  "hitz-zeus-series": [
    { question: "What's the HITZ Zeus Series exactly?",
      answer: "The Zeus Series is HITZ's premium line — liquid diamonds, live resin, and rechargeable hardware in a 2G format. Their flagship for connoisseurs." },
    { question: "Is HITZ a tier-3 disposable like Luigi?",
      answer: "Yes — HITZ Zeus Series sits in the same liquid-diamond tier as Luigi and Cookies X Muha, with comparable potency and flavor quality." },
    { question: "How does this compare to standard HITZ disposables?",
      answer: "Standard HITZ disposables are tier-2 (live resin only). The Zeus Series adds liquid diamonds for ~30% higher potency and more pronounced terpene flavor." } ],

  "cookies-x-muha": [
    { question: "What is the Cookies X Muha collaboration?",
      answer: "Cookies — one of the most recognizable cannabis brands globally — partnered with Muha Meds to release disposables featuring Cookies genetics in Muha's hardware. The result combines top-shelf strain expression with proven all-in-one engineering." },
    { question: "What strains are in the Cookies X Muha lineup?",
      answer: "Current strains include Gary Payton, Cereal Milk, Blue Slushie, and Tequila Sunrise — all classic Cookies releases now in disposable format." },
    { question: "Is Cookies X Muha a 2G disposable?",
      answer: "Yes — 2G capacity with liquid diamond formulation, Type-C rechargeable, and adjustable airflow for premium vapor production." },
    { question: "Why is Cookies X Muha priced higher?",
      answer: "You're paying for: (1) authentic Cookies genetics under license, (2) liquid diamond formulation, (3) Muha's premium hardware. Each component costs more than a standard tier-2 disposable." } ],

  "levels-disposables": [
    { question: "What's special about Levels disposables?",
      answer: "Levels uses live resin and liquid diamonds in 2G all-in-one hardware, positioning between mid-tier and top-shelf in price while delivering tier-3 flavor and potency." },
    { question: "Is Levels rechargeable?",
      answer: "Yes — every Levels 2G is rechargeable via Type-C, ensuring the battery outlasts the full 2G of oil." } ],

  "sundae-driver": [
    { question: "Is Sundae Driver an indica or sativa?",
      answer: "Sundae Driver is indica-leaning hybrid — heavy enough for relaxation but social enough for conversation. The Fruity Pebbles OG × Grape Pie cross creates a balanced indica experience." },
    { question: "What does Sundae Driver taste like?",
      answer: "Vanilla and grape jam upfront, creamy butter and caramel mid-palate, herbal pepper finish. Real dessert flavor — not the artificial syrup kind." },
    { question: "How long do the effects last?",
      answer: "Sundae Driver effects last 90 minutes to 2.5 hours depending on dosage. Onset is moderate (5–10 minutes via smoking), peak around 30 minutes." },
    { question: "Is this indoor or outdoor flower?",
      answer: "Real Duck Distro's Sundae Driver is indoor-grown, providing the trichome density and terpene preservation that outdoor batches typically lack." } ],

  "toad-venom-super-nova-indoors": [
    { question: "Why is Toad Venom Super Nova called 'heavy'?",
      answer: "Caryophyllene-dominant terps bind to CB2 receptors, intensifying body effects beyond what THC % alone would suggest. Combined with high trichome density, it's one of the heaviest indoor strains we carry." },
    { question: "Is this strain good for first-time smokers?",
      answer: "No — we don't recommend Toad Venom Super Nova for first-time smokers. It's intended for experienced users with higher tolerance. New smokers should start with milder strains like Sundae Driver." },
    { question: "What does Toad Venom Super Nova smell like?",
      answer: "Gas, fuel, swampy funk — leather-jacket-and-engine-oil notes upfront, with hints of menthol and spice when nugs are broken open." },
    { question: "How should I store this strain to preserve terps?",
      answer: "Glass jar with tight seal, cool dark place, Boveda 62% pack for storage longer than 30 days. Don't refrigerate or freeze — both damage trichomes." } ],

  "ice-cream-gelato": [
    { question: "How is Ice Cream Gelato different from regular Gelato?",
      answer: "Ice Cream Gelato adds creamier dessert notes to the standard Gelato profile — vanilla and butter terps that round out the standard sweet-citrus Gelato flavor." },
    { question: "Is Ice Cream Gelato indoor or outdoor?",
      answer: "Real Duck Distro stocks indoor Ice Cream Gelato for trichome preservation and terpene density." },
    { question: "What category of high does this strain provide?",
      answer: "Hybrid-leaning, slightly indica-dominant. Relaxing without being couch-locking — good for evening unwinding while staying social." } ],

  "oreo-souffle-indoors": [
    { question: "What does Oreo Soufflé taste like?",
      answer: "Cookie-and-cream notes upfront with hints of dark chocolate and vanilla — close to actual Oreo dessert flavor, with a creamy exhale." },
    { question: "Is Oreo Soufflé Indoors strong?",
      answer: "Yes — testing typically shows mid-to-upper 20s THC. The dessert flavor masks the strength; smoke moderate amounts your first session." } ],

  "polkadot-mushie-gummies": [
    { question: "Are Polkadot mushroom gummies psilocybin?",
      answer: "No — Polkadot uses Amanita Muscaria (federally legal in the US) plus a functional mushroom blend (Lion's Mane, Reishi, Cordyceps, Chaga). The experience is fundamentally different from psilocybin — body warmth, social loosening, mild dreamy headspace." },
    { question: "What's the right dose for a first-time user?",
      answer: "Start at half a gummy. Wait 90 minutes before considering more. Edibles' onset is unpredictable and a full gummy can be intense for new users." },
    { question: "Is Amanita Muscaria legal in my state?",
      answer: "Federally legal in the US. State-level there are some restrictions (Louisiana, etc.) — always verify your local laws. Real Duck Distro ships nationwide where permitted." },
    { question: "Can I mix Polkadot with cannabis or alcohol?",
      answer: "Cannabis combinations are common and tolerated by many users at low doses. Alcohol is not recommended — both act on GABA receptors and stack unpredictably. Strong sedatives (benzodiazepines) should also be avoided." } ],

  "devour-1500-mg-edibles": [
    { question: "How many milligrams per gummy in Devour 1500MG?",
      answer: "1500MG total per pack, divided across multiple pieces. Check the package for piece-count and per-gummy mg — typical breakdown is 60–100mg per piece." },
    { question: "How does this compare to Squish Gummies?",
      answer: "Squish are lower-dose, faster-onset thanks to nano-emulsion. Devour 1500MG targets experienced edible users wanting heavy dose-per-piece." },
    { question: "How long do effects last?",
      answer: "Devour effects last 4–8 hours. Eating beforehand slows onset but extends duration. Plan accordingly." } ],

  "pillows-exotic-designer-edition": [
    { question: "What makes Pillows Exotic 'designer edition'?",
      answer: "Limited-batch boutique flower from highly selected pheno-hunts — the kind of indoor that doesn't ship in standard volume. Pillows curates designer batches you won't find in standard exotic menus." },
    { question: "Is this top shelf or super-top shelf?",
      answer: "Pillows Designer Edition sits in the super-top shelf tier alongside Bounty Flower and Sherbinski. Premium pricing reflects the boutique production volume." } ],

  "bounty-flower": [
    { question: "Is Bounty Flower from a licensed California grower?",
      answer: "Yes — Bounty is a recognized California cannabis brand specializing in boutique indoor cultivars. Real Duck Distro stocks authenticated Bounty batches only." },
    { question: "How does Bounty compare to Jungle Boys?",
      answer: "Both are super-top shelf. Bounty leans more boutique-experimental phenos; Jungle Boys offers consistent flagship strains. Connoisseurs often keep both on rotation." } ],

  "sherbinski-preroll": [
    { question: "Are Sherbinski pre-rolls infused?",
      answer: "Sherbinski pre-rolls feature top-shelf flower from the Sherbinski brand. Some SKUs include kief or live-resin infusion — check the specific product variant." },
    { question: "What's special about Sherbinski strains?",
      answer: "Sherbinski is responsible for some of the most influential modern strains (Gelato, Sherbet lineage). Their pre-rolls use the original genetics directly from their cultivation team." } ],

  "jungle-boys": [
    { question: "Is Jungle Boys real or a knockoff?",
      answer: "Jungle Boys is a major California licensed cultivator. Counterfeit Jungle Boys is rampant — Real Duck Distro sources only verified, batch-numbered authentic Jungle Boys flower." },
    { question: "What strains does Jungle Boys carry?",
      answer: "Their lineup includes Animal Mints, Banana Punch, Wedding Cake, Zkittlez, and many proprietary phenos. Strains rotate seasonally — check the listing for current availability." } ],

  "authentic-geek-bars-pulse-x-25000-puffs": [
    { question: "Is Geek Bar Pulse X a cannabis or nicotine vape?",
      answer: "Geek Bar Pulse X is a nicotine disposable, not cannabis. We carry it for customers who want a high-quality nicotine option alongside cannabis purchases." },
    { question: "Does it really do 25,000 puffs?",
      answer: "Yes — that's the stated capacity at moderate inhalation. Heavy chain-vapers may see fewer; light users may exceed. The dual-mesh coil and rechargeable battery support the full count." },
    { question: "How is this different from older Geek Bar models?",
      answer: "Pulse X adds adjustable power modes, a screen display, and dual-mesh coil tech. Hits significantly harder than older Pulse models." } ],

  "whole-melt-extract": [
    { question: "What is Whole Melt extract?",
      answer: "Whole Melt is a high-quality solventless or hydrocarbon concentrate — the brand's signature melts include badder, sugar, and live resin grades. Premium extraction with strong terpene preservation." },
    { question: "How do I dab Whole Melt extract?",
      answer: "Use a quartz banger at 500–550°F (low-temp dab). Drop a rice-grain-sized portion and cap. Higher temps burn off the terpenes Whole Melt is known for." } ],
};
