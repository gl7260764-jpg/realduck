/**
 * Product Description Engine
 * Generates unique, SEO-optimized descriptions for each product
 * using product title, category, and attributes to create varied content.
 * Internal links to related products and categories are woven naturally throughout.
 */

interface DescProduct {
  id: string;
  slug?: string | null;
  title: string;
  category: string;
  indoor: boolean;
  rating: string;
}

interface DescriptionBlock {
  heading: string;
  content: string; // may contain {{LINK:index}} placeholders
}

interface GeneratedDescription {
  blocks: DescriptionBlock[];
  qualities: string[];
}

// Simple hash from string to get deterministic but varied selections
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length];
}

function pickN<T>(arr: T[], seed: number, n: number): T[] {
  const result: T[] = [];
  const used = new Set<number>();
  for (let i = 0; i < n && result.length < arr.length; i++) {
    let idx = (seed + i * 7 + i * i) % arr.length;
    while (used.has(idx)) idx = (idx + 1) % arr.length;
    used.add(idx);
    result.push(arr[idx]);
  }
  return result;
}

// Extract meaningful words from product title for personalization
function titleWords(title: string): string[] {
  return title
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.toLowerCase());
}

function isLikelyStrain(title: string): boolean {
  const indicators = ["og", "kush", "haze", "diesel", "cookies", "gelato", "runtz", "zkittlez", "cake", "mints", "jack", "widow", "dream", "purple", "blue", "white", "sour", "gorilla", "wedding", "ice", "cream", "lemon", "cherry", "grape", "mango", "strawberry", "banana", "apple", "pineapple", "watermelon", "gas", "fire", "exotic"];
  const lower = title.toLowerCase();
  return indicators.some((i) => lower.includes(i));
}

// ── FLOWER DESCRIPTIONS ──
function flowerDescription(product: DescProduct, seed: number): { blocks: DescriptionBlock[]; qualities: string[] } {
  const name = product.title;
  const indoor = product.indoor;
  const isStrain = isLikelyStrain(name);
  const words = titleWords(name);
  const hasColorWord = ["purple", "blue", "white", "pink", "green", "gold", "red", "orange"].some((c) => words.includes(c));

  const intros = [
    `${name} is one of those rare strains that stops you in your tracks the moment you crack the seal. ${indoor ? "Cultivated indoors under precision LED lighting with carefully controlled temperature and humidity cycles," : "Grown with expert attention to every stage of the plant's lifecycle,"} this flower delivers a sensory experience that starts with its aroma and doesn't let up through the final exhale. The buds are dense, sticky, and absolutely covered in a frost of trichomes that shimmer under any light.`,

    `There's a reason ${name} has earned a reputation among connoisseurs who refuse to settle for anything less than exceptional. ${indoor ? "This indoor-grown flower benefits from a climate-controlled environment where every variable — from light spectrum to CO2 levels — is dialed in to maximize cannabinoid and terpene production." : "Cultivated by experienced growers who understand the genetics inside and out, this flower represents the best expression of its lineage."} From the moment you handle these buds, the quality is unmistakable — they're heavy, aromatic, and cured to absolute perfection.`,

    `If you've been searching for a flower that truly delivers on the promise of "top shelf," ${name} is your answer. ${indoor ? "Indoor cultivation gives growers complete control over the growing environment, and the results speak for themselves — buds that are so frosty they look like they've been dipped in sugar, with a complex aroma that unfolds in layers." : "Expert cultivation techniques bring out the full genetic potential of this strain, producing buds with exceptional bag appeal and a terpene profile that'll have you coming back for more."} This isn't the kind of flower you rush through — it's the kind you savor.`,

    `${name} represents everything we look for when selecting flower for our menu: ${hasColorWord ? "stunning visual appeal with those signature color tones," : "incredible bag appeal with dense bud structure,"} a nose that fills the room, and effects that match the hype. ${indoor ? "Being indoor-grown means this flower was raised in a pristine environment free from pests, mold, and contaminants — resulting in the cleanest smoke possible." : "Careful attention during the grow cycle ensures every bud meets the highest standards for quality and purity."} The cure on this batch is dialed in, providing a smooth burn with thick, flavorful smoke.`,
  ];

  const bodyVariants = [
    `What separates truly premium flower from the rest is the entire journey from seed to sale, and ${name} excels at every step. The growing process focuses on bringing out the strain's natural terpene profile — those aromatic compounds responsible for the unique smell and taste that makes each strain distinct. {{LINK:0}} When you break apart a nug of ${name}, pay attention to the complexity of the aroma: you'll notice layers of scent that evolve as the trichomes are exposed to air. This is a hallmark of properly grown and cured cannabis.

The smoke itself is remarkably smooth, burning to a clean white ash that indicates a thorough flush during the final weeks of cultivation. Many growers cut corners during the flush and cure, but the producers behind ${name} understand that these final stages make or break the end product. {{LINK:1}} The flavor profile carries through from the nose into each hit, with the exhale leaving a pleasant taste that lingers without being harsh.`,

    `Understanding what makes ${name} special requires looking at the fundamentals of quality cannabis cultivation. It starts with genetics — this strain carries a lineage that's known for producing exceptional results in the hands of skilled growers. {{LINK:0}} From there, the growing environment plays a critical role: ${indoor ? "indoor facilities allow for precise control of every environmental factor, from the exact light spectrum during different growth stages to the humidity levels during the crucial drying and curing process" : "experienced cultivators know exactly how to optimize conditions throughout the plant's lifecycle to express the strain's full potential"}.

The trichome development on ${name} is particularly impressive. These tiny, crystal-like structures are where the plant produces its cannabinoids and terpenes — the compounds responsible for both the effects and the flavor. {{LINK:1}} Dense trichome coverage isn't just about potency; it's also an indicator of overall plant health and growing expertise. When you see buds this frosty, you know the grower understood exactly what the plant needed at every stage.`,

    `Cannabis quality is ultimately determined by three pillars: genetics, environment, and post-harvest handling. ${name} scores exceptionally on all three. {{LINK:0}} The genetic foundation provides the blueprint for the strain's potential — its terpene profile, growth characteristics, and effect profile are all encoded in the DNA. But genetics alone aren't enough; it takes a skilled grower to fully express that potential.

${indoor ? "The indoor growing environment for this flower was meticulously controlled, with light cycles, temperatures, and feeding schedules optimized for each stage of growth. This level of precision is reflected in the consistent quality of every bud." : "The cultivation approach for this flower prioritizes plant health and natural expression of the strain's characteristics, resulting in buds that taste and smell exactly as the genetics intend."} {{LINK:1}} The post-harvest process is where many products fall short, but ${name} benefits from a slow dry and extended cure that preserves volatile terpenes while ensuring optimal moisture content for a smooth, even burn.`,
  ];

  const qualityVariants = [
    [
      "Hand-trimmed to preserve trichome integrity and visual appeal",
      "Slow-cured for 2+ weeks to develop maximum flavor complexity",
      "Clean, white ash burn indicating proper cultivation and flush",
      "Airtight, light-proof packaging to preserve freshness",
      "Third-party tested for potency and contaminant screening",
    ],
    [
      "Dense, compact bud structure with minimal stem weight",
      "Rich, layered terpene profile that evolves as you smoke",
      "Grown from premium genetics with proven lineage",
      "No pesticides, heavy metals, or microbial contamination",
      "Humidity-controlled packaging with freshness seal",
    ],
    [
      "Exceptional trichome coverage visible to the naked eye",
      "Perfectly balanced moisture content for ideal grinding",
      "Burns evenly and smoothly with thick, flavorful smoke",
      "Sourced from experienced, quality-focused cultivators",
      "Sealed and stored in optimal conditions until delivery",
    ],
  ];

  const usageVariants = [
    `To get the most out of ${name}, take your time with it. Break the buds apart by hand first to appreciate the stickiness and aroma, then use a quality grinder for an even consistency. {{LINK:2}} If you're rolling, a medium grind works best for airflow. For glass pieces, a slightly coarser grind allows better flavor expression. And if you're using a dry herb vaporizer, experiment with temperatures between 350-410°F to find your sweet spot — lower temps emphasize flavor, while higher temps produce thicker vapor and stronger effects.`,

    `${name} is versatile enough to enjoy however you prefer to consume flower. Roll it in your favorite papers or wraps — the natural flavor shines through without being overpowered. {{LINK:2}} Pack a bowl and take slow, measured hits to really taste the terpene profile on each draw. Or load it into a vaporizer for a cleaner experience that preserves the more delicate flavor notes. Whatever your method, start with a moderate amount and build from there — quality flower like this often delivers more than expected.`,

    `The best way to experience ${name} is to slow down and pay attention to what you're tasting and feeling. Before grinding, squeeze a bud gently and inhale the aroma — this first impression tells you a lot about what's to come. {{LINK:2}} When smoking, draw slowly and let the smoke coat your palate before exhaling. You'll notice flavor notes that you'd miss with quick, aggressive hits. For the smoothest experience, consider using a glass piece with clean water, which cools the smoke without diluting the flavor.`,
  ];

  const storageVariants = [
    `Keep ${name} in its sealed packaging or transfer to a glass mason jar with a tight-fitting lid. Add a humidity control pack (62% RH is ideal for flower) to maintain the perfect moisture level. Store in a cool, dark location — a drawer or cupboard works perfectly. Avoid refrigerators and freezers, as the temperature fluctuations can damage trichomes and affect potency. Properly stored, premium flower maintains its quality for 3-6 months.`,

    `To preserve the quality of ${name}, storage conditions matter more than most people realize. Heat, light, and air exposure are the three enemies of fresh cannabis. Transfer to an airtight glass container if you won't finish it within a week, and keep it somewhere cool and dark. {{LINK:3}} The ideal storage temperature is around 60-70°F with 55-65% relative humidity. Avoid plastic bags, which create static that pulls trichomes off the buds, and never store near electronics or appliances that generate heat.`,
  ];

  const idx = seed;
  return {
    blocks: [
      { heading: "", content: pick(intros, idx) },
      { heading: `What Makes ${name} Special`, content: pick(bodyVariants, idx) },
      { heading: "How to Enjoy", content: pick(usageVariants, idx, 2) },
      { heading: "Storage & Care", content: pick(storageVariants, idx, 3) },
    ],
    qualities: pick(qualityVariants, idx, 1),
  };
}

// ── EDIBLES ──
function ediblesDescription(product: DescProduct, seed: number): { blocks: DescriptionBlock[]; qualities: string[] } {
  const name = product.title;
  const intros = [
    `${name} takes the edible experience to a level that most products on the market simply can't match. Every piece is infused using a proprietary process that ensures cannabinoids are evenly distributed throughout — no more playing "edible roulette" where one piece hits like a truck and the next barely registers. {{LINK:0}} The flavor profile has been carefully engineered to complement the cannabis extract rather than try to hide it, resulting in a treat that genuinely tastes good while delivering consistent, predictable effects.`,

    `If you've ever been disappointed by an edible that tasted like lawn clippings or hit inconsistently, ${name} is the antidote. Precision dosing is at the heart of this product — each serving is manufactured to exact specifications with laboratory-grade accuracy. {{LINK:0}} The infusion method uses nano-emulsion technology that not only ensures even distribution but can also result in faster onset times compared to traditional edibles. This means you spend less time waiting and wondering, and more time enjoying the experience.`,

    `${name} represents the new generation of cannabis edibles where quality, taste, and consistency aren't mutually exclusive. Gone are the days of chalky, bitter edibles that you had to force down — this product is genuinely enjoyable to eat. {{LINK:0}} The secret lies in the extraction and infusion process: starting with premium cannabis material, extracting a clean, full-spectrum oil, and then incorporating it into the recipe at precise measurements that guarantee uniform potency across every serving in every batch.`,
  ];

  const bodyVariants = [
    `The science behind edibles is fundamentally different from smoking or vaping, and understanding this helps you get the most from ${name}. When you consume cannabis orally, it passes through your digestive system and liver, where THC is converted into 11-hydroxy-THC — a metabolite that crosses the blood-brain barrier more effectively and can produce stronger, longer-lasting effects. {{LINK:1}} This is why edible experiences feel distinctly different from smoking the same amount of cannabis.

${name} is formulated with this pharmacology in mind. The dosing is designed to account for the amplified potency of oral consumption, giving you a measured, controlled experience. {{LINK:2}} The onset typically ranges from 30 minutes to 2 hours depending on individual factors like metabolism, body composition, and stomach contents. Once effects set in, expect a duration of 4-8 hours — significantly longer than inhaled cannabis. This extended timeline is one of the main reasons people choose edibles for sustained relief or extended recreational enjoyment.`,

    `What most people don't realize about cannabis edibles is that the quality of the extract matters just as much as the quality of the food itself. ${name} uses an extract that retains a broader spectrum of cannabinoids and terpenes than standard distillate-based products. {{LINK:1}} This "entourage effect" — where multiple cannabis compounds work synergistically — produces a more rounded, nuanced experience compared to products made with isolated THC.

The manufacturing process behind ${name} follows pharmaceutical-grade standards for consistency. {{LINK:2}} Each batch is tested at multiple stages: raw material testing, mid-production testing, and final product testing. This triple-verification approach catches any inconsistencies before the product ever reaches your hands. The result is something rare in the edibles market: a product you can trust to deliver the same experience every single time you consume it.`,
  ];

  return {
    blocks: [
      { heading: "", content: pick(intros, seed) },
      { heading: `Understanding ${name}`, content: pick(bodyVariants, seed, 1) },
      { heading: "Dosing & Onset", content: `New to ${name}? Start with a single serving and wait a full 90 minutes before considering more. This patience is crucial with edibles — many negative experiences stem from impatient re-dosing. {{LINK:3}} Eat a light meal 30-60 minutes before consuming for more predictable absorption. Keep water and snacks nearby, and plan your environment in advance. The effects of ${name} can last 4-8 hours, so make sure your schedule allows for the full experience without obligations.` },
      { heading: "Storage", content: `Store ${name} in a cool, dry location away from direct sunlight. Heat can degrade both the cannabinoids and the food product itself. {{LINK:4}} If you live in a warm climate, refrigeration is recommended to maintain both potency and texture. Always keep edibles in child-resistant packaging and clearly labeled — these products look and taste like regular food items, which makes responsible storage essential.` },
    ],
    qualities: pick([
      [
        "Precisely dosed with lab-verified potency per serving",
        "Full-spectrum infusion for enhanced entourage effects",
        "Premium food-grade ingredients with no artificial fillers",
        "Consistent effects from first piece to last",
        "Extended duration of 4-8 hours per serving",
      ],
      [
        "Nano-emulsion infusion for faster, more even absorption",
        "Triple-tested at every stage of production",
        "Genuinely enjoyable flavor — not just tolerable",
        "Individually wrapped servings for portion control",
        "Compliant packaging with clear dosing information",
      ],
    ], seed, 2),
  };
}

// ── CONCENTRATES ──
function concentratesDescription(product: DescProduct, seed: number): { blocks: DescriptionBlock[]; qualities: string[] } {
  const name = product.title;
  const isWax = name.toLowerCase().includes("wax") || name.toLowerCase().includes("badder") || name.toLowerCase().includes("butter");
  const isShatter = name.toLowerCase().includes("shatter");
  const isLive = name.toLowerCase().includes("live");

  const intros = [
    `${name} pushes the boundaries of what a cannabis concentrate can deliver in terms of both potency and flavor. ${isLive ? "Made from fresh-frozen plant material that was harvested and immediately frozen to preserve the living terpene profile, this concentrate captures the essence of the plant at its peak — something that's impossible to achieve with dried and cured material." : "Extracted from premium starting material that was specifically selected for its cannabinoid and terpene content, this concentrate delivers a flavor and potency level that flower alone can't match."} {{LINK:0}} Every gram represents the concentrated essence of significantly more raw plant material, making it one of the most efficient ways to consume cannabis.`,

    `For those who appreciate cannabis at its most potent and flavorful, ${name} is exactly what you've been looking for. ${isWax ? "The buttery, easy-to-handle consistency makes it perfect for both beginners to concentrates and experienced dabbers alike." : isShatter ? "The glass-like consistency and clarity of this shatter are visual indicators of a well-executed extraction process." : "The consistency and appearance of this concentrate immediately communicate quality — this is not a product that was rushed through production."} {{LINK:0}} The extraction process prioritizes terpene preservation alongside cannabinoid concentration, resulting in a product that tastes as good as it hits.`,

    `${name} is the kind of concentrate that reminds you why you started dabbing in the first place. In a market flooded with mediocre extracts that sacrifice flavor for potency or vice versa, this product refuses to compromise on either. {{LINK:0}} ${isLive ? "The live extraction process — starting from fresh-frozen material rather than dried and cured flower — preserves monoterpenes and other volatile compounds that are typically lost during traditional drying. The result is an aroma and flavor that's startlingly close to smelling the living plant." : "The extraction methodology behind this concentrate balances aggressive cannabinoid recovery with gentle terpene preservation, achieving the best of both worlds."}`,
  ];

  const bodyVariants = [
    `The world of cannabis concentrates can be overwhelming for newcomers, but the fundamentals are straightforward: take cannabis flower, remove everything that isn't cannabinoids and terpenes, and you're left with a product that's dramatically more potent per gram. {{LINK:1}} ${name} achieves this through an extraction process that selectively targets the desirable compounds while leaving behind plant fats, chlorophyll, and other unwanted material.

What distinguishes high-quality concentrates from the rest is the post-processing refinement. ${name} undergoes careful purging to remove any residual solvents well below safety thresholds, followed by a controlled process that achieves the desired consistency. {{LINK:2}} The color, clarity, and aroma of the final product tell the story — golden, translucent concentrates with a strong terpene nose indicate clean extraction from quality starting material.`,

    `Cannabis concentrates exist on a spectrum of purity and complexity, and ${name} sits firmly at the premium end. The starting material is the foundation — you can't extract quality that wasn't there to begin with. {{LINK:1}} The flower selected for this extraction was chosen for its exceptional trichome development and terpene expression, ensuring that the final concentrate carries a complex, layered flavor profile rather than a one-dimensional taste.

The potency of ${name} means that a little goes a long way. A single dab — roughly the size of a grain of rice — is sufficient for most consumers. {{LINK:2}} This efficiency is one of the key advantages of concentrates: despite the higher per-gram cost compared to flower, the cost per dose is often comparable or even lower. For medical patients who require higher cannabinoid intake for symptom management, concentrates like ${name} provide a practical solution without the need to smoke large quantities of flower.`,
  ];

  return {
    blocks: [
      { heading: "", content: pick(intros, seed) },
      { heading: `Inside ${name}`, content: pick(bodyVariants, seed, 1) },
      { heading: "Dabbing Tips", content: `Getting the most from ${name} is all about temperature control. Heat your banger or nail and then let it cool — the ideal dabbing temperature for maximum flavor is around 450-550°F. {{LINK:3}} At these lower temperatures, you'll taste individual terpene notes that get destroyed at higher temps. Use a carb cap to trap heat and create convection, ensuring complete vaporization of your dab. Start with a small amount — concentrates are significantly more potent than flower, and it's always better to add more than to overdo it on the first hit.` },
      { heading: "Handling & Storage", content: `${name} should be stored in its original container in a cool location away from heat and light. ${isWax ? "If the consistency becomes too soft in warm weather, a brief stint in the refrigerator will firm it up for easier handling." : "Avoid touching the product with bare hands — the oils from your skin can contaminate the surface and affect flavor."} {{LINK:4}} For long-term storage, refrigeration extends the shelf life significantly. Always allow refrigerated concentrates to reach room temperature before opening the container to prevent moisture condensation, which can degrade quality.` },
    ],
    qualities: pick([
      [
        "Extracted from hand-selected, trichome-rich starting material",
        "Exceptional terpene retention for complex flavor profiles",
        "Residual solvent levels well below safety thresholds",
        "Potency verified through independent lab analysis",
        "Proper consistency for easy handling and dosing",
      ],
      [
        "Clean extraction process preserving the full terpene spectrum",
        "Golden clarity indicating purity of extraction",
        "High cannabinoid concentration for efficient consumption",
        "Sourced from strains selected specifically for extraction",
        "Professional-grade packaging to maintain quality",
      ],
    ], seed, 2),
  };
}

// ── VAPES ──
function vapesDescription(product: DescProduct, seed: number): { blocks: DescriptionBlock[]; qualities: string[] } {
  const name = product.title;
  const is510 = name.toLowerCase().includes("cart") || name.toLowerCase().includes("510");

  const intros = [
    `${name} delivers a vaping experience that prioritizes purity and flavor above all else. The oil inside this cartridge is extracted from strain-specific cannabis and refined to remove impurities while retaining the natural terpene profile that gives each strain its unique character. {{LINK:0}} There are no cutting agents, no vitamin E acetate, no PG or VG — just clean cannabis oil that produces smooth, flavorful vapor with every draw. In an industry where transparency about ingredients is still lacking, ${name} stands out by keeping it simple: cannabis oil and cannabis-derived terpenes, nothing more.`,

    `In the crowded vape market, ${name} distinguishes itself through uncompromising quality at every level — from the oil formulation to the hardware it's housed in. {{LINK:0}} The cannabis oil is processed using methods that preserve a broader spectrum of cannabinoids beyond just THC, contributing to a more well-rounded effect profile. The terpenes you taste aren't synthetic replicas added for marketing purposes — they're derived from the actual cannabis plant, capturing authentic strain characteristics that artificial terpenes can only approximate.`,

    `${name} was designed for people who want the convenience of vaping without sacrificing the quality they'd expect from premium flower. The oil formulation starts with carefully selected cannabis that's processed to concentrate the most desirable compounds while filtering out plant material, lipids, and other unwanted elements. {{LINK:0}} The result is a golden, viscous oil that moves slowly in the cartridge — a visual indicator of purity and proper formulation. Each draw delivers consistent vapor production and flavor, from the first puff of a fresh cartridge to the very last.`,
  ];

  const bodyVariants = [
    `The hardware matters as much as the oil when it comes to vape quality, and ${name} uses ceramic coil technology that outperforms traditional cotton-wicked cartridges in every measurable way. {{LINK:1}} Ceramic coils heat oil more evenly across a larger surface area, producing smoother vapor without the risk of burnt hits that plague inferior hardware. The ceramic material is also inert — it doesn't interact chemically with the oil at operating temperatures, ensuring that what you inhale is pure cannabis vapor without any off-flavors from the heating element.

Vapor production from ${name} is impressive without being excessive. {{LINK:2}} The airflow is calibrated for a draw resistance that feels natural — not too tight, not too airy. This careful engineering means you get satisfying clouds without needing to take uncomfortably long draws. Battery compatibility is straightforward: any standard 510-thread battery will work, though we recommend using a battery with adjustable voltage set to the 3.3V-3.8V range for optimal performance with this particular oil formulation.`,

    `What happens inside a vape cartridge during each draw is a carefully controlled process: the battery provides power to the heating element, which brings the oil to its vaporization point — hot enough to create vapor but cool enough to preserve terpenes and avoid combustion. {{LINK:1}} ${name} is optimized for this process, with an oil viscosity calibrated to wick properly at the recommended voltage range. This prevents both dry hits (too little oil reaching the coil) and flooding (too much oil overwhelming the coil).

The convenience factor of ${name} is undeniable. No grinding, no rolling, no cleaning — just attach to a battery and go. {{LINK:2}} But convenience doesn't mean compromise. The flavor and effect profile of this cartridge rivals what you'd experience from high-quality flower, just in a more portable and discreet package. Whether you're stepping outside during a social event or unwinding at home, ${name} delivers a consistent experience every time.`,
  ];

  return {
    blocks: [
      { heading: "", content: pick(intros, seed) },
      { heading: `${name}: Quality Inside & Out`, content: pick(bodyVariants, seed, 1) },
      { heading: "Getting the Best Experience", content: `For optimal flavor from ${name}, keep your battery voltage between 3.3V and 3.8V. Higher voltages produce more vapor but can burn terpenes, resulting in a harsh, less flavorful hit. {{LINK:3}} Take moderate draws of 2-3 seconds — marathon hits overheat the coil and can degrade the oil. If the cartridge has been sitting unused for a while, take a few gentle primer puffs to re-saturate the coil before taking a full draw. ${is510 ? "Make sure your 510 connection is clean and tightened properly — a loose connection can cause inconsistent heating." : "Follow the device's specific instructions for optimal use."}` },
      { heading: "Care & Storage", content: `Store ${name} upright in a cool, dry place. Upright storage keeps the oil in contact with the intake ports and prevents air bubbles from forming at the coil. {{LINK:4}} Avoid leaving cartridges in cars, near windows, or anywhere they might be exposed to temperature extremes. Heat thins the oil and can cause leaking, while extreme cold thickens it and restricts flow. If you notice reduced vapor production, the cartridge may simply need to warm to room temperature — hold it in your closed hand for a minute or two.` },
    ],
    qualities: pick([
      [
        "Pure cannabis oil with no cutting agents or additives",
        "Ceramic coil technology for smooth, even heating",
        "Cannabis-derived terpenes for authentic strain flavor",
        "Consistent vapor production throughout cartridge life",
        "Independently tested for potency and purity",
      ],
      [
        "Strain-specific formulation capturing unique terpene profiles",
        "Calibrated airflow for natural, comfortable draw resistance",
        "No PG, VG, MCT, or vitamin E acetate — ever",
        "Compatible with all standard 510-thread batteries",
        "Leak-resistant design with quality hardware construction",
      ],
    ], seed, 2),
  };
}

// ── PREROLLS ──
function prerollsDescription(product: DescProduct, seed: number): { blocks: DescriptionBlock[]; qualities: string[] } {
  const name = product.title;
  const isInfused = name.toLowerCase().includes("infused") || name.toLowerCase().includes("diamond") || name.toLowerCase().includes("hash");

  const intros = [
    `${name} is a pre-roll built for people who appreciate quality but value their time. Every joint is packed with the same premium flower you'd select from our top-shelf menu — carefully ground to a consistency that promotes even airflow and a steady, controlled burn from tip to filter. {{LINK:0}} ${isInfused ? "This particular pre-roll takes things further with an infusion of concentrate that elevates both the potency and flavor beyond what flower alone can deliver." : "No trim, no shake, no floor sweepings — just quality ground flower rolled with the same care you'd put into rolling your own, minus the effort."}`,

    `There's an art to rolling the perfect joint, and ${name} nails it. The grind consistency, the pack density, the paper selection — every detail contributes to a smoking experience that burns evenly and draws smoothly from the first light to the final puff. {{LINK:0}} ${isInfused ? "The concentrate infusion is applied evenly throughout the joint, ensuring that every section delivers the enhanced potency and flavor rather than concentrating it all in one spot." : "The flower inside is ground fresh from whole buds, maintaining the trichome integrity that's lost when flower is pre-ground and stored for extended periods."}`,
  ];

  return {
    blocks: [
      { heading: "", content: pick(intros, seed) },
      { heading: `Why ${name} Hits Different`, content: `The quality gap between a premium pre-roll and a budget option is enormous, and it all comes down to what's inside. ${name} uses exclusively top-shelf flower — the same buds we sell by the gram at full price. {{LINK:1}} Many pre-roll brands use trim, small buds, or "shake" — the loose material that falls off during handling — because it's cheaper. The result is a harsh, fast-burning joint with minimal flavor. ${name} takes the opposite approach: premium input produces a premium output. {{LINK:2}} The rolling paper is also carefully chosen — thin enough to let the flower's flavor dominate, but strong enough to maintain structural integrity throughout the entire smoke session.` },
      { heading: "Lighting & Smoking", content: `For the best experience with ${name}, toast the tip by holding a flame close without directly touching the paper. Rotate the joint slowly as you light it — this creates an even cherry that tracks straight down the joint. {{LINK:3}} Take slow, moderate draws. Puffing too hard creates a hot cherry that burns through flower too quickly, wasting product and producing harsher smoke. If the joint begins to canoe (burn unevenly), gently wet the faster-burning side with a fingertip to slow it down.` },
      { heading: "Freshness", content: `${name} arrives sealed in an airtight tube that preserves freshness during transit and storage. Keep it sealed until you're ready to smoke. {{LINK:4}} Once opened, pre-rolls are best enjoyed within a few days — ground flower loses moisture and terpenes faster than whole buds. If you need to store a partially smoked joint, extinguish it cleanly and seal it in the tube, but be aware that relit joints will taste harsher than the initial session.` },
    ],
    qualities: [
      `Rolled with premium ground flower — never trim or shake`,
      `${isInfused ? "Enhanced with concentrate infusion for elevated potency" : "Even pack density for consistent burn rate throughout"}`,
      "Clean-burning paper that doesn't affect the flavor",
      "Individually sealed in airtight tubes for freshness",
      "Ready to enjoy — no prep, no cleanup required",
    ],
  };
}

// ── ROSIN ──
function rosinDescription(product: DescProduct, seed: number): { blocks: DescriptionBlock[]; qualities: string[] } {
  const name = product.title;
  const intros = [
    `${name} is solventless perfection — produced using nothing but heat, pressure, and premium starting material. No butane, no propane, no CO2, no ethanol — just the pure, unadulterated essence of the cannabis plant extracted through mechanical means. {{LINK:0}} For health-conscious consumers and flavor purists, rosin represents the pinnacle of cannabis extraction because nothing is introduced to the process that wasn't already in the plant. What you're tasting when you dab ${name} is the true, unaltered flavor of the strain.`,

    `In the hierarchy of cannabis concentrates, solventless rosin sits at the very top — and ${name} exemplifies why. The process seems simple on paper — apply heat and pressure to cannabis material and collect what squeezes out — but the reality requires enormous skill, patience, and high-quality starting material. {{LINK:0}} The temperature, pressure, time, and humidity of the input material all affect the yield, consistency, and terpene profile of the final product. Getting it right is an art form, and ${name} is the work of a skilled artist.`,
  ];

  return {
    blocks: [
      { heading: "", content: pick(intros, seed) },
      { heading: `The Craft Behind ${name}`, content: `Rosin quality starts with the input material, and ${name} is pressed from premium flower or hash that was specifically selected for extraction. {{LINK:1}} The selection criteria goes beyond just potency — terpene content, trichome morphology, and how the material responds to heat and pressure all factor into the decision. Not every strain presses well, and experienced rosin makers know which cultivars yield the best results.

The pressing process for ${name} uses carefully calibrated temperature and pressure profiles that vary depending on the input material. {{LINK:2}} Lower temperatures preserve more of the delicate monoterpenes responsible for the brightest, most aromatic notes in the flavor profile. Higher pressures increase yield but can push through unwanted plant material. Finding the sweet spot between these variables is what separates craft rosin from commercial product — and ${name} clearly sits in the craft category.` },
      { heading: "Temperature & Consumption", content: `Solventless concentrates like ${name} deserve low-temperature dabbing. Set your e-rig to 450-520°F, or if using a torch and banger, heat until the bottom just begins to glow, then let it cool for 45-60 seconds before dropping your dab. {{LINK:3}} At these temperatures, you'll experience the full terpene expression — flavors and aromas that get incinerated at higher temps. Use a directional carb cap and swirl it gently to move the rosin around the heated surface for complete vaporization. The vapor should taste smooth and flavorful, not harsh or burnt.` },
      { heading: "Storage", content: `${name} should be stored in the refrigerator for optimal preservation. Cold storage slows the natural degradation of terpenes and prevents the rosin from "buddering" or changing consistency prematurely. {{LINK:4}} Always let the container reach room temperature before opening — opening cold rosin introduces warm, moist air that condenses on the surface and degrades quality. For daily use, keeping a small portion at room temperature while storing the bulk in the fridge is a practical approach.` },
    ],
    qualities: [
      "100% solventless — extracted with only heat and pressure",
      "Made from hand-selected premium starting material",
      "Full-spectrum terpene and cannabinoid preservation",
      "No chemicals, solvents, or additives of any kind",
      "Artisan-crafted in small batches for maximum quality",
    ],
  };
}

// ── Generic categories (MUSHROOM, DISPOSABLES, GUMMIES, OTHERS) ──
function genericDescription(product: DescProduct, seed: number, cat: string): { blocks: DescriptionBlock[]; qualities: string[] } {
  const name = product.title;

  const catInfo: Record<string, { type: string; focus: string; tips: string; store: string; quals: string[] }> = {
    MUSHROOM: {
      type: "functional mushroom product",
      focus: `${name} comes from a trusted source that prioritizes proper cultivation conditions, harvesting timing, and post-harvest handling. {{LINK:0}} Every batch is inspected for consistency and quality before being packaged in conditions designed to preserve potency and freshness. {{LINK:1}} The growing interest in mushroom-based wellness reflects decades of traditional use now being validated by modern research. Whether you're an experienced enthusiast or approaching this category for the first time, ${name} provides a reliable, quality-assured starting point.`,
      tips: `Start with a smaller amount of ${name} than you think you need and assess how it affects you before adjusting. {{LINK:2}} Environment matters significantly — choose a setting where you feel comfortable and safe. {{LINK:3}} Stay hydrated, have light snacks available, and consider having a trusted companion present. Allow several hours for the full experience, and avoid mixing with other substances, especially alcohol.`,
      store: `Keep ${name} in its original sealed packaging in a cool, dark, dry location. {{LINK:4}} Moisture is the primary enemy — consider adding a food-grade desiccant pack to the storage container. Avoid freezing, as ice crystals can damage cell structure. Properly stored product maintains its quality for an extended period.`,
      quals: ["Sourced from experienced, vetted cultivators", "Inspected for quality, consistency, and authenticity", "Dried and prepared using proven preservation methods", "Sealed in moisture-resistant packaging", "Detailed guidance included with every order"],
    },
    DISPOSABLES: {
      type: "all-in-one disposable vape",
      focus: `${name} combines premium oil with purpose-built hardware in a single device that's ready to use the moment you open it. {{LINK:0}} The internal battery is engineered to outlast the oil supply — you'll never be stuck with a dead device and leftover product. {{LINK:1}} The draw-activated mechanism eliminates buttons and settings, making it the most approachable format for vaping cannabis. Inside, the same quality standards apply as our cartridge line: pure cannabis oil with strain-specific terpenes, zero cutting agents, and rigorous potency testing.`,
      tips: `Using ${name} couldn't be simpler — remove it from the packaging and take a gentle 2-3 second draw. The device activates automatically. {{LINK:2}} Wait a few minutes between sessions to gauge effects. {{LINK:3}} If vapor decreases temporarily, give the device 30 seconds to re-saturate the wick. Avoid chain-vaping, which overheats the coil and affects flavor. The LED indicator (if equipped) will signal when the device is nearing depletion.`,
      store: `Store ${name} upright at room temperature. {{LINK:4}} Extreme heat can thin the oil and cause leaking, while extreme cold thickens it and restricts airflow. Keep the mouthpiece clean and avoid leaving the device in direct sunlight, hot cars, or humid environments. The device is designed for single use — do not attempt to recharge or refill.`,
      quals: ["Pre-charged and pre-filled for immediate use", "Draw-activated — no buttons or settings to manage", "Premium cannabis oil with natural terpenes", "Battery designed to outlast the oil supply", "Pocket-sized and discreet for any situation"],
    },
    GUMMIES: {
      type: "cannabis-infused gummy",
      focus: `${name} solves the two biggest problems in the edible market: inconsistent dosing and terrible taste. Each gummy contains a precisely measured amount of cannabinoids, distributed evenly through advanced infusion techniques that eliminate hot spots. {{LINK:0}} The flavor development goes beyond simply masking the cannabis taste — these gummies are formulated to taste genuinely great, using quality ingredients that complement rather than fight the natural extract. {{LINK:1}} Whether you're managing daily wellness routines or looking for a reliable recreational option, ${name} delivers predictable results you can count on.`,
      tips: `Begin with one gummy from ${name} and wait at least 90 minutes before consuming additional pieces. {{LINK:2}} Edibles process through your digestive system, resulting in slower onset but longer duration compared to inhalation methods. Eating a small meal beforehand can help with more consistent absorption. {{LINK:3}} Effects typically last 4-8 hours, so plan your schedule accordingly. Stay hydrated and keep regular snacks nearby.`,
      store: `Store ${name} in a cool, dry location — refrigeration is ideal, especially in warm climates. {{LINK:4}} Heat causes gummies to melt, stick together, and potentially lose their individual dosing accuracy. Always store in child-resistant packaging, as these products look and taste identical to regular candy. Check packaging for specific expiration dates.`,
      quals: ["Precisely dosed for reliable, repeatable effects", "Even cannabinoid distribution — no hot spots", "Gourmet flavor profiles using quality ingredients", "Lab tested for potency, purity, and consistency", "Individually portioned for easy dose management"],
    },
    OTHERS: {
      type: "premium cannabis product",
      focus: `${name} has been selected for the Real Duck Distro catalog through our rigorous vetting process. {{LINK:0}} We work directly with producers who share our standards for quality, testing, and transparency. {{LINK:1}} Every product we carry has been evaluated not just for its quality in isolation, but for how it serves our customers' needs and expectations. ${name} met every criterion and earned its place on our menu.`,
      tips: `Please refer to the specific packaging of ${name} for detailed usage guidelines. {{LINK:2}} Each product may have unique instructions for optimal enjoyment. {{LINK:3}} When in doubt, start with less and adjust based on your experience. Feel free to reach out to our team with any questions about this or any other product.`,
      store: `Store ${name} according to the instructions on its packaging. {{LINK:4}} As a general rule, cool, dark, and dry conditions extend the life of most cannabis products. Avoid heat, direct sunlight, and humidity.`,
      quals: ["Hand-selected through rigorous quality evaluation", "Sourced from trusted, vetted producers", "Meets Real Duck Distro' strict quality standards", "Tested for safety, potency, and purity", "Backed by our satisfaction commitment"],
    },
  };

  const info = catInfo[cat] || catInfo.OTHERS;
  return {
    blocks: [
      { heading: "", content: `${name} is a premium ${info.type} that meets the exacting standards Real Duck Distro is known for. {{LINK:0}} Every product on our menu goes through a thorough evaluation process before we're willing to put our name behind it, and ${name} passed with flying colors. Quality, consistency, and customer satisfaction aren't just marketing words — they're the criteria that determine what makes it onto our shelves and what doesn't.` },
      { heading: `About ${name}`, content: info.focus },
      { heading: "How to Enjoy", content: info.tips },
      { heading: "Storage & Care", content: info.store },
    ],
    qualities: info.quals,
  };
}

// ── Main Export ──
export function generateProductDescription(
  product: DescProduct,
  relatedProducts: DescProduct[]
): GeneratedDescription {
  const seed = hashStr(product.id + product.title);

  const generators: Record<string, (p: DescProduct, s: number) => { blocks: DescriptionBlock[]; qualities: string[] }> = {
    FLOWER: flowerDescription,
    EDIBLES: ediblesDescription,
    CONCENTRATES: concentratesDescription,
    VAPES: vapesDescription,
    PREROLLS: prerollsDescription,
    ROSIN: rosinDescription,
  };

  const gen = generators[product.category] || ((p, s) => genericDescription(p, s, product.category));
  const result = gen(product, seed);

  // Replace {{LINK:N}} placeholders with actual related product references
  const linkProducts = [...relatedProducts];
  // Add more variety by shuffling based on seed
  const shuffled = pickN(linkProducts, seed, Math.min(10, linkProducts.length));

  const categoryLinks: Record<string, { label: string; cat: string }[]> = {
    FLOWER: [
      { label: "exotic flower collection", cat: "FLOWER" },
      { label: "edibles menu", cat: "EDIBLES" },
      { label: "concentrate selection", cat: "CONCENTRATES" },
    ],
    EDIBLES: [
      { label: "gummies collection", cat: "GUMMIES" },
      { label: "flower menu", cat: "FLOWER" },
      { label: "vape cartridges", cat: "VAPES" },
    ],
    CONCENTRATES: [
      { label: "rosin selection", cat: "ROSIN" },
      { label: "flower menu", cat: "FLOWER" },
      { label: "vape collection", cat: "VAPES" },
    ],
    VAPES: [
      { label: "disposable vapes", cat: "DISPOSABLES" },
      { label: "flower menu", cat: "FLOWER" },
      { label: "concentrate selection", cat: "CONCENTRATES" },
    ],
    PREROLLS: [
      { label: "flower collection", cat: "FLOWER" },
      { label: "edibles menu", cat: "EDIBLES" },
      { label: "vape selection", cat: "VAPES" },
    ],
    ROSIN: [
      { label: "concentrate collection", cat: "CONCENTRATES" },
      { label: "flower menu", cat: "FLOWER" },
      { label: "edibles selection", cat: "EDIBLES" },
    ],
  };

  const catLinks = categoryLinks[product.category] || [
    { label: "flower collection", cat: "FLOWER" },
    { label: "edibles menu", cat: "EDIBLES" },
    { label: "concentrate selection", cat: "CONCENTRATES" },
  ];

  // Process link placeholders
  const processedBlocks = result.blocks.map((block) => {
    let content = block.content;
    // Replace {{LINK:N}} with product links or category links
    for (let i = 0; i <= 9; i++) {
      const placeholder = `{{LINK:${i}}}`;
      if (!content.includes(placeholder)) continue;

      if (i < shuffled.length) {
        // Link to a related product
        const rp = shuffled[i];
        content = content.replace(
          placeholder,
          `If you enjoy this kind of quality, you might also want to check out [PRODUCT:${rp.slug || rp.id}:${rp.title}].`
        );
      } else {
        // Link to a category
        const cl = catLinks[i % catLinks.length];
        content = content.replace(
          placeholder,
          `Explore our full [CATEGORY:${cl.cat}:${cl.label}] for more options.`
        );
      }
    }
    return { ...block, content };
  });

  return {
    blocks: processedBlocks,
    qualities: result.qualities,
  };
}
