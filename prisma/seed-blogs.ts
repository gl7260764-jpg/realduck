import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const blogs = [
  // ═══ EDUCATION ═══
  {
    slug: "understanding-cannabis-strains-indica-sativa-hybrid",
    title: "Understanding Cannabis Strains: Indica, Sativa, and Hybrid Explained",
    subtitle: "A comprehensive guide to the three main types of cannabis and how they affect you differently",
    category: "EDUCATION",
    imageUrl: "https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=1200&q=80",
    published: true,
    featured: true,
    tags: ["strains", "indica", "sativa", "hybrid", "terpenes"],
    excerpt: "Not all cannabis is created equal. Understanding the difference between Indica, Sativa, and Hybrid strains is the first step to finding your perfect match.",
    content: `## The Foundation of Cannabis Knowledge

Whether you are new to cannabis or a seasoned enthusiast, understanding the distinction between **Indica**, **Sativa**, and **Hybrid** strains is essential. Each type offers a unique experience, and knowing what to expect can help you make informed choices.

According to [Leafly](https://www.leafly.com/news/cannabis-101/sativa-indica-and-hybrid-differences-between-cannabis-types), the classification of cannabis into these three categories has been the standard for decades, though modern research suggests the experience has more to do with **terpene profiles** and **cannabinoid ratios** than the plant structure alone.

## Indica: The Relaxation Strain

Indica strains are traditionally associated with:

- Deep body relaxation
- Stress and anxiety relief
- Sleep aid and insomnia treatment
- Pain management
- Evening and nighttime use

> Indica strains are often described as providing a body high, perfect for unwinding after a long day.

Check out our premium indoor strains like [Pink Versace Indoors](/product/cmm1qpzr000009edrwryqbzq3) for a top-tier indica experience.

## Sativa: The Energy Strain

Sativa strains are known for:

- Cerebral, uplifting effects
- Enhanced creativity and focus
- Social energy and conversation
- Daytime use
- Mood elevation

According to [NORML](https://norml.org/marijuana/fact-sheets/), sativa-dominant strains have been used historically for their energizing and mood-enhancing properties.

## Hybrid: The Best of Both Worlds

Hybrid strains are created by crossing Indica and Sativa genetics, offering balanced effects. Our [Blue Candy Lemons](/product/cmm1qkzk900001tn1irw1n1b4) is a perfect example of a well-balanced hybrid that delivers both relaxation and mental clarity.

## The Role of Terpenes

Research from [Project CBD](https://www.projectcbd.org/science/terpenes-and-entourage-effect) shows that terpenes play a significant role in determining the effects of each strain:

- **Myrcene** — Sedating, found in indica-dominant strains
- **Limonene** — Uplifting, common in sativa strains
- **Pinene** — Alertness and memory retention
- **Linalool** — Calming, anti-anxiety properties
- **Caryophyllene** — Anti-inflammatory, spicy aroma

## How to Choose the Right Strain

1. Consider your goal — Relaxation? Creativity? Pain relief?
2. Check the terpene profile — This matters more than the indica/sativa label
3. Start low, go slow — Especially with new strains
4. Ask your source — Quality matters as much as strain type

Browse our full collection of [premium flowers](/product/cmlwr7hjy00057kxm57vr8d86) to find your perfect strain.

---

*This article is for educational purposes only. Always consume cannabis responsibly and in accordance with local laws.*`,
  },
  {
    slug: "what-are-terpenes-complete-guide",
    title: "What Are Terpenes? The Complete Guide to Cannabis Aromatics",
    subtitle: "How these powerful compounds shape your cannabis experience beyond THC and CBD",
    category: "EDUCATION",
    imageUrl: "https://images.unsplash.com/photo-1585063560633-8cac9e67e5b6?w=1200&q=80",
    published: true,
    featured: false,
    tags: ["terpenes", "cannabis science", "aromatics", "entourage effect"],
    excerpt: "Terpenes are the unsung heroes of cannabis. These aromatic compounds do far more than create flavor — they actively shape your experience.",
    content: `## Beyond THC: The Terpene Revolution

When most people think about cannabis potency, they think THC percentage. But research increasingly shows that **terpenes** — the aromatic compounds found in all plants — play an equally important role in your cannabis experience.

The [entourage effect](https://www.projectcbd.org/science/terpenes-and-entourage-effect), first described by Dr. Raphael Mechoulam, suggests that cannabis compounds work better together than in isolation.

## The Top Cannabis Terpenes

### Myrcene — The Relaxer
The most abundant terpene in cannabis. Found in mangoes, lemongrass, and hops.

- Sedating and muscle-relaxing
- Enhances THC absorption
- Earthy, musky aroma
- Dominant in indica strains

### Limonene — The Uplifter
Found in citrus rinds, juniper, and peppermint.

- Mood elevation and stress relief
- Anti-anxiety properties
- Bright, citrusy aroma
- Common in sativa strains

Try our [Orange Creamsicle](/product/cmlwr3z1b00047kxm5es2ihc9) for a limonene-rich experience.

### Pinene — The Focuser
The most common terpene in nature, found in pine trees and rosemary.

- Mental clarity and alertness
- Anti-inflammatory
- Fresh, pine-forest aroma
- Counteracts some THC side effects

### Caryophyllene — The Healer
Found in black pepper, cloves, and cinnamon.

- The only terpene that binds to CB2 receptors
- Anti-inflammatory and pain relief
- Spicy, peppery aroma
- Studied for [anti-anxiety effects](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7763918/)

### Linalool — The Calmer
Found in lavender and birch bark.

- Calming and sedative
- Anti-anxiety
- Floral, sweet aroma
- Great for evening use

## How Terpenes Work With Cannabinoids

According to [Leafly's terpene guide](https://www.leafly.com/news/cannabis-101/terpenes-the-flavors-of-cannabis-aromatherapy), terpenes modulate how cannabinoids interact with your endocannabinoid system. This is why two strains with identical THC levels can produce vastly different effects.

## Reading Terpene Profiles

When shopping for cannabis, look for:

1. **Lab test results** showing terpene percentages
2. **Dominant terpenes** listed on packaging
3. **Aroma descriptions** that match your desired effects
4. **Total terpene content** — higher usually means more flavor and effect

Explore our [concentrate collection](/product/cmlulrsc40001fh6xcf3rbx1i) for the most terpene-rich products available.

---

*Sources: Project CBD, Leafly, National Center for Biotechnology Information (NCBI)*`,
  },

  // ═══ HOW TO ═══
  {
    slug: "beginners-guide-to-cannabis-consumption-methods",
    title: "A Beginner's Guide to Cannabis Consumption Methods",
    subtitle: "From smoking to edibles — find the method that works best for you",
    category: "HOW_TO",
    imageUrl: "https://images.unsplash.com/photo-1616345840969-855ef4730a81?w=1200&q=80",
    published: true,
    featured: true,
    tags: ["beginners", "consumption methods", "smoking", "edibles", "vaping"],
    excerpt: "There are more ways to consume cannabis than ever before. This guide breaks down each method so you can find what works for you.",
    content: `## Finding Your Perfect Method

Cannabis consumption has evolved dramatically. Gone are the days when smoking a joint was the only option. Today, you can choose from a variety of methods, each with its own onset time, duration, and experience.

## Smoking: The Classic

**Onset:** 1-5 minutes | **Duration:** 1-3 hours

The most traditional method. Options include:

- **Joints** — Rolled cannabis in paper. Check out our [Sherbinski Prerolls](/product/cmlwrpdzy0000grnhbs8cyda3) for premium pre-rolled convenience
- **Blunts** — Cannabis rolled in tobacco leaf or hemp wrap
- **Pipes** — Simple, portable, reusable
- **Bongs** — Water filtration for smoother hits

**Pros:** Fast onset, easy to dose, social
**Cons:** Smoke inhalation, smell, short duration

## Vaping: The Modern Choice

**Onset:** 1-5 minutes | **Duration:** 1-3 hours

Vaporizers heat cannabis to release cannabinoids without combustion. According to [Leafly](https://www.leafly.com/news/health/vaping-vs-smoking-marijuana-safety), vaping produces fewer harmful byproducts than smoking.

Types of vapes:

- **Dry herb vaporizers** — Use ground flower
- **Oil cartridges** — Pre-filled with cannabis oil
- **Disposable pens** — Ready to use, no charging needed

Explore our [vape collection](/product/cmlwtv6nz00008k7n3tji9os0) for top-quality cartridges and disposables.

## Edibles: The Long Game

**Onset:** 30 minutes - 2 hours | **Duration:** 4-8 hours

Cannabis-infused food and drinks. The effects are processed through your digestive system and liver, producing a different, often more intense experience.

> The golden rule of edibles: Start with 5mg or less and wait at least 2 hours before taking more.

Browse our [edibles selection](/product/cmltjcuya0001y9jr4axdnm90) for carefully dosed options.

[NORML's consumption guide](https://norml.org/marijuana/personal-use/responsible-marijuana-use/) recommends always starting with a low dose when trying edibles for the first time.

## Concentrates: For the Experienced

**Onset:** Instant | **Duration:** 1-3 hours

Highly potent cannabis extracts including:

- **Wax and shatter** — Dabbed using a special rig
- **Rosin** — Solventless extract, pressed from flower
- **Live resin** — Preserves maximum terpenes

Check out our [premium concentrates](/product/cmlulp8ve0000fh6x978oca69) for the most potent experience.

## Choosing the Right Method

| Method | Onset | Duration | Potency Control | Best For |
|--------|-------|----------|-----------------|----------|
| Smoking | Fast | Short | Moderate | Social, quick relief |
| Vaping | Fast | Short | Good | Discretion, flavor |
| Edibles | Slow | Long | Challenging | Extended relief, no smoke |
| Concentrates | Instant | Medium | Difficult | Experienced users |

## Safety Tips for Beginners

1. **Start low, go slow** — You can always take more, never less
2. **Know your source** — Quality matters for safety
3. **Stay hydrated** — Have water nearby
4. **Choose a comfortable setting** — Especially for your first time
5. **Don't mix with alcohol** — It intensifies effects unpredictably

---

*Always consume responsibly. Know your local laws regarding cannabis consumption.*`,
  },
  {
    slug: "how-to-store-cannabis-properly",
    title: "How to Store Cannabis Properly: Keep Your Flower Fresh",
    subtitle: "Expert tips on preserving potency, flavor, and quality for months",
    category: "HOW_TO",
    imageUrl: "https://images.unsplash.com/photo-1587754608683-65ce9292a20c?w=1200&q=80",
    published: true,
    featured: false,
    tags: ["storage", "freshness", "quality", "flower care"],
    excerpt: "Proper storage can mean the difference between premium cannabis and dried-out disappointment. Learn how to keep your flower at its best.",
    content: `## Why Storage Matters

You invested in premium cannabis — do not let improper storage ruin it. Exposure to light, air, heat, and moisture can degrade cannabinoids and terpenes, reducing both potency and flavor.

According to research cited by [Leafly](https://www.leafly.com/news/cannabis-101/how-to-store-cannabis), THC can degrade into CBN (a less desirable cannabinoid) when exposed to light and heat over time.

## The Four Enemies of Cannabis

### 1. Light
UV rays break down cannabinoids rapidly. A study published in the [Journal of Pharmacy and Pharmacology](https://pubmed.ncbi.nlm.nih.gov/11933122/) found that light is the single greatest factor in cannabinoid degradation.

### 2. Air
Oxygen oxidizes THC and terpenes. Too much air exposure leads to harsh, flavorless cannabis.

### 3. Heat
Temperatures above 77F (25C) can dry out cannabis and encourage mold growth. The [sweet spot is 60-70F](https://www.projectcbd.org/guidance/cannabis-storage).

### 4. Moisture
Too much moisture breeds mold. Too little dries out trichomes. Ideal relative humidity is **55-62%**.

## Best Storage Practices

- **Use glass jars** — Mason jars with airtight seals are ideal
- **Keep it dark** — Store in a cabinet or drawer, away from windows
- **Maintain cool temperatures** — Room temperature or slightly below
- **Use humidity packs** — Boveda or Integra Boost packs maintain perfect humidity
- **Do not use plastic bags** — Static can pull trichomes off the flower
- **Do not refrigerate or freeze** — The cold makes trichomes brittle

## Storage Timeline

| Method | Freshness Duration |
|--------|-------------------|
| Open bag | 1-2 weeks |
| Sealed plastic | 2-4 weeks |
| Glass jar (dark) | 3-6 months |
| Glass jar + humidity pack | 6-12 months |

## Signs Your Cannabis Has Gone Bad

- Crumbles to dust when touched (too dry)
- Smells musty or like hay (mold or degradation)
- No aroma at all (terpenes gone)
- Harsh, unpleasant smoke

## Pro Tips

1. **Label your jars** with strain name and date
2. **Do not grind until ready to use** — Ground cannabis degrades faster
3. **Separate strains** to preserve individual terpene profiles
4. **Check weekly** for any signs of mold

Keep your [premium flower](/product/cmlwr7hjy00057kxm57vr8d86) fresh and potent with these simple storage techniques.

---

*Proper storage is the simplest way to protect your investment in quality cannabis.*`,
  },

  // ═══ IMPORTANCE ═══
  {
    slug: "cannabis-legalization-movement-why-it-matters",
    title: "The Cannabis Legalization Movement: Why It Matters",
    subtitle: "Understanding the social, economic, and personal impact of cannabis reform",
    category: "IMPORTANCE",
    imageUrl: "https://images.unsplash.com/photo-1589827992972-ef0e1fdf2cb1?w=1200&q=80",
    published: true,
    featured: false,
    tags: ["legalization", "cannabis reform", "social justice", "legislation"],
    excerpt: "Cannabis legalization is about more than just recreational use. It touches on social justice, economic opportunity, medical access, and personal freedom.",
    content: `## More Than Just Getting High

The cannabis legalization movement represents one of the most significant policy shifts in modern history. As of 2024, [24 states have legalized recreational cannabis](https://norml.org/laws/), with more considering reform every year.

But legalization is not just about access — it is about righting historical wrongs, creating economic opportunity, and ensuring safe access for medical patients.

## The Social Justice Dimension

According to the [ACLU](https://www.aclu.org/issues/smart-justice/sentencing-reform/war-marijuana-black-and-white), Black Americans are 3.73 times more likely to be arrested for cannabis possession despite similar usage rates across races. Legalization with equity provisions aims to address this disparity through:

- **Expungement programs** — Clearing past cannabis convictions
- **Social equity licenses** — Prioritizing communities disproportionately affected by the war on drugs
- **Reinvestment funds** — Directing tax revenue back into affected neighborhoods
- **Reducing incarceration** — Keeping people out of prison for non-violent offenses

## Economic Impact

The legal cannabis industry has become an economic powerhouse:

- **$33 billion** in legal sales in 2023 alone
- **440,000+** full-time jobs created
- **Billions** in state tax revenue
- Small business opportunities in cultivation, retail, and ancillary services

[Leafly's Jobs Report](https://www.leafly.com/news/industry/cannabis-jobs-report) tracks employment growth across the industry year over year.

## Medical Access

For millions of patients, cannabis is not recreational — it is medicine. Legalization ensures:

- Consistent, lab-tested products
- Doctor-patient relationships around cannabis
- Insurance and access pathways
- Research opportunities for new treatments

[Project CBD](https://www.projectcbd.org/) documents the growing body of research supporting cannabis for conditions from epilepsy to chronic pain.

## What You Can Do

1. **Stay informed** — Follow [NORML](https://norml.org/) for legislative updates
2. **Vote** — Support candidates who back cannabis reform
3. **Support equity** — Buy from social equity-licensed businesses
4. **Educate others** — Share factual information, not stigma
5. **Know your rights** — Understand your local cannabis laws

---

*Supporting responsible cannabis reform benefits everyone — patients, communities, and the economy.*`,
  },
  {
    slug: "why-quality-cannabis-matters",
    title: "Why Quality Cannabis Matters: You Get What You Pay For",
    subtitle: "The difference between premium and low-grade cannabis goes far beyond the high",
    category: "IMPORTANCE",
    imageUrl: "https://images.unsplash.com/photo-1586282023358-9515f8e3bf0d?w=1200&q=80",
    published: true,
    featured: false,
    tags: ["quality", "premium", "safety", "lab testing", "contaminants"],
    excerpt: "Choosing quality cannabis is not just about a better high — it is about safety, consistency, and getting the full therapeutic benefit of the plant.",
    content: `## The Quality Gap

Not all cannabis is created equal. The difference between premium, craft-grown cannabis and mass-produced or black-market product is enormous — and it goes far beyond THC percentage.

## What Makes Cannabis Premium

### Genetics
Everything starts with the seed. Premium cultivators work with stable, proven genetics that produce consistent effects, flavors, and potency. Our [Purple Bubbalato](/product/cmlwr7hjy00057kxm57vr8d86) is an example of carefully selected genetics.

### Growing Conditions
**Indoor vs. outdoor** growing produces dramatically different results:

- **Indoor** — Controlled environment, consistent quality, higher trichome production
- **Greenhouse** — Natural light with environmental control
- **Outdoor** — Larger yields but less control over quality

### Curing Process
Proper curing (2-4 weeks minimum) allows:

- Chlorophyll to break down (smoother smoke)
- Terpenes to develop fully (better flavor)
- Moisture to equalize (proper burn)
- Cannabinoids to mature (stronger effects)

### Lab Testing
According to [Leafly](https://www.leafly.com/news/health/why-lab-testing-matters-for-cannabis-consumers), lab testing is critical for ensuring:

- Accurate THC/CBD percentages
- Absence of pesticides and heavy metals
- No mold or microbial contamination
- Proper terpene profile documentation

## Dangers of Low-Quality Cannabis

Unregulated cannabis may contain:

- **Pesticides** — Harmful chemicals used during growth
- **Heavy metals** — Absorbed from contaminated soil
- **Mold and mildew** — From improper drying and storage
- **Synthetic additives** — Added to increase weight or appearance
- **Residual solvents** — In poorly made concentrates

The [CDC](https://www.cdc.gov/marijuana/health-effects/index.html) has documented health incidents linked to contaminated cannabis products.

## How to Identify Quality

1. **Appearance** — Dense, trichome-covered buds with vibrant color
2. **Aroma** — Strong, distinct terpene profile (not hay-like)
3. **Texture** — Slightly sticky, not crumbly or wet
4. **Lab results** — Always available for inspection
5. **Source reputation** — Buy from trusted, reviewed sources

## Why We Invest in Quality

At Real Duck Distro, every product we carry meets strict quality standards. From our [indoor flowers](/product/cmm1qpzr000009edrwryqbzq3) to our [premium vapes](/product/cmlwtv6nz00008k7n3tji9os0), we source only from cultivators who share our commitment to excellence.

---

*Your health is worth the investment. Choose quality every time.*`,
  },

  // ═══ HEALTH & MEDICINAL ═══
  {
    slug: "cannabis-and-pain-management-what-research-says",
    title: "Cannabis and Pain Management: What the Research Says",
    subtitle: "A science-backed look at how cannabis is being used to treat chronic pain",
    category: "HEALTH_MEDICINAL",
    imageUrl: "https://images.unsplash.com/photo-1559757175-7cb036a2e3e7?w=1200&q=80",
    published: true,
    featured: true,
    tags: ["pain management", "chronic pain", "medical cannabis", "CBD", "research"],
    excerpt: "Chronic pain affects millions worldwide. Research increasingly supports cannabis as an effective tool for pain management with fewer side effects than traditional medications.",
    content: `## The Pain Epidemic

Chronic pain affects an estimated **50 million Americans**, according to the [CDC](https://www.cdc.gov/mmwr/volumes/67/wr/mm6736a2.htm). Traditional treatments often rely on opioids, which carry significant risks of addiction and overdose.

Cannabis is emerging as a safer alternative for many patients.

## What the Science Says

### The Endocannabinoid System

Your body has a built-in system designed to interact with cannabinoids — the **endocannabinoid system (ECS)**. According to [Project CBD](https://www.projectcbd.org/science/endocannabinoid-system), the ECS regulates:

- Pain perception
- Inflammation
- Mood and stress
- Sleep cycles
- Immune response

### Clinical Evidence

A comprehensive review by the [National Academies of Sciences](https://nap.nationalacademies.org/catalog/24625/the-health-effects-of-cannabis-and-cannabinoids-the-current-state) found **substantial evidence** that cannabis is effective for:

- Chronic pain in adults
- Chemotherapy-induced nausea
- Multiple sclerosis spasticity

Additional research from [Harvard Medical School](https://www.health.harvard.edu/blog/medical-marijuana-2018011513085) supports cannabis for neuropathic pain specifically.

## How Cannabis Helps Pain

### THC for Pain
THC interacts with CB1 receptors in the brain and nervous system to:

- Reduce pain signal transmission
- Alter pain perception
- Provide anti-inflammatory effects
- Promote muscle relaxation

### CBD for Inflammation
CBD works differently, offering:

- Anti-inflammatory action without the high
- Anxiety reduction (which can worsen pain perception)
- Neuroprotective properties
- Synergy with THC through the entourage effect

### The Best Approach
Research suggests a **combination of THC and CBD** often works better than either alone. This is known as the entourage effect.

## Cannabis vs. Opioids

| Factor | Cannabis | Opioids |
|--------|----------|---------|
| Addiction risk | Low | High |
| Overdose risk | Extremely low | Significant |
| Side effects | Mild | Severe |
| Long-term use | Generally safe | Tolerance/dependence |
| Organ damage | Minimal | Liver, kidney risk |

A [study published in JAMA Internal Medicine](https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2718518) found that states with legal cannabis access saw a **14.4% reduction** in opioid prescriptions.

## Finding the Right Product

For pain management, consider:

- **Full-spectrum flower** for whole-plant benefits — browse our [flower collection](/product/cmlwr7hjy00057kxm57vr8d86)
- **Edibles** for extended relief — check our [edibles](/product/cmltjcuya0001y9jr4axdnm90)
- **Topicals** for localized pain
- **Tinctures** for precise dosing

## Important Disclaimers

- Always consult with a healthcare provider before using cannabis for pain
- Cannabis is not a replacement for emergency medical care
- Effects vary by individual
- Start with low doses and adjust gradually
- Check your local laws regarding medical cannabis

---

*Sources: CDC, Project CBD, National Academies of Sciences, Harvard Medical School, JAMA Internal Medicine*`,
  },
  {
    slug: "cannabis-for-sleep-natural-remedy-insomnia",
    title: "Cannabis for Sleep: A Natural Remedy for Insomnia",
    subtitle: "How cannabinoids and terpenes can help you get the rest you deserve",
    category: "HEALTH_MEDICINAL",
    imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=1200&q=80",
    published: true,
    featured: false,
    tags: ["sleep", "insomnia", "CBN", "indica", "natural remedy"],
    excerpt: "Struggling with sleep? Cannabis has been used as a sleep aid for centuries. Modern science is now confirming what traditional users have always known.",
    content: `## The Sleep Crisis

Over **70 million Americans** suffer from chronic sleep disorders, according to the [American Sleep Association](https://www.sleepassociation.org/about-sleep/sleep-statistics/). Prescription sleep aids carry risks of dependency, next-day grogginess, and serious side effects.

Cannabis offers a natural alternative that millions are turning to.

## How Cannabis Promotes Sleep

### The Cannabinoids That Help

**THC** — The primary psychoactive compound:
- Reduces time to fall asleep (sleep latency)
- Increases deep sleep phases
- May reduce REM sleep (fewer dreams)

**CBD** — The non-psychoactive helper:
- Reduces anxiety that keeps you awake
- Promotes relaxation without sedation
- May improve sleep quality at higher doses

**CBN** — The sleepy cannabinoid:
- Created when THC ages and oxidizes
- Mildly psychoactive with strong sedating effects
- Often called the most sedating cannabinoid
- Research from [Steep Hill Labs](https://steephill.com/) suggests CBN may be the most sedating cannabinoid known

### The Terpenes That Help

- **Myrcene** — The most sedating terpene, found in indica strains and mangoes
- **Linalool** — The lavender terpene, promotes calm and relaxation
- **Terpinolene** — Found in some strains, associated with drowsiness

## Best Strains for Sleep

Look for strains that are:

- **Indica-dominant** — Body-heavy effects promote physical relaxation
- **High in myrcene** — Check terpene profiles
- **Moderate THC** — Too much can actually increase alertness
- **Some CBD** — Helps with anxiety-related insomnia

Our [Purple Pop Rox](/product/cmlwqv8hr00027kxmh4zg0cr8) and [Diesel Fuel](/product/cmlwr051v00037kxm2i64rv0g) are excellent choices for evening use.

## Timing Your Dose

According to [Leafly's guide on cannabis and sleep](https://www.leafly.com/news/health/cannabis-and-sleep):

- **Smoking/Vaping** — Use 30-60 minutes before bed
- **Edibles** — Take 1-2 hours before bed due to slower onset
- **Tinctures** — Sublingual use 30-45 minutes before bed

## Building a Sleep Routine

Cannabis works best as part of a comprehensive sleep routine:

1. Set a consistent bedtime
2. Reduce screen time 1 hour before bed
3. Keep your room cool and dark
4. Use cannabis 30-60 minutes before sleep
5. Start with a low dose — 2.5-5mg THC
6. Track what works in a sleep journal

## What the Research Shows

A [study in the Journal of Clinical Pharmacology](https://pubmed.ncbi.nlm.nih.gov/31383997/) found that:
- 66.7% of cannabis users reported improved sleep
- CBD doses of 25mg reduced anxiety and improved sleep
- Effects were most consistent when used regularly

[Harvard Health](https://www.health.harvard.edu/blog/medical-marijuana-2018011513085) notes that while more research is needed, preliminary evidence is promising for cannabis as a sleep aid.

## Precautions

- **Tolerance can develop** — Take breaks to maintain effectiveness
- **Do not drive** — Wait until effects fully wear off
- **Avoid mixing** with other sleep medications without medical advice
- **Talk to your doctor** if you have a diagnosed sleep disorder

Explore our indica-dominant [flower collection](/product/cmm1qpzr000009edrwryqbzq3) for the best sleep support.

---

*This content is for informational purposes only and is not medical advice. Consult a healthcare professional for sleep disorders.*`,
  },
];

async function main() {
  console.log("Seeding blog posts...");

  for (const blog of blogs) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: blog.slug } });
    if (existing) {
      console.log(`  Skipping: ${blog.title} (already exists)`);
      continue;
    }

    await prisma.blogPost.create({
      data: {
        ...blog,
        author: blog.published ? "Real Duck Distro" : "Real Duck Distro",
      },
    });
    console.log(`  Created: ${blog.title}`);
  }

  console.log(`\nDone! ${blogs.length} blog posts seeded.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
