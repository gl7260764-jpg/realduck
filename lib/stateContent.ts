// CRAFTED By W1C3
// SEO/AEO content for state landing pages (/cannabis-delivery/[state]).
// Targets high-intent, buyer searches like "buy cannabis online kentucky" /
// "cannabis delivery michigan" that the homepage was forced to rank for alone.
// Each page is UNIQUE (state-specific cities, shipping notes, FAQ) — never the
// same text with the state swapped, which would be thin/duplicate content.
//
// USA-only, discreet-shipping brand. Start with the 4 priority states; adding
// more is just another entry here + it flows to the route, sitemap and llms.txt.

export interface StateFAQ {
  question: string;
  answer: string;
}

export interface StateContent {
  slug: string;
  name: string;
  abbr: string;
  cities: string[];
  metaTitle: string;
  metaDescription: string;
  h1: string;
  answer: string; // 40–60 word AI-extractable direct answer
  body: string[];
  faqs: StateFAQ[];
}

const shipLine = (name: string) =>
  `Real Duck Distro ships premium cannabis to ${name} discreetly — smell-proof, vacuum-sealed and plain-labelled, with 1–3 day priority delivery. All products are lab-tested with COAs on request.`;

export const STATE_CONTENT: Record<string, StateContent> = {
  kentucky: {
    slug: "kentucky",
    name: "Kentucky",
    abbr: "KY",
    cities: ["Louisville", "Lexington", "Bowling Green", "Owensboro"],
    metaTitle: "Buy Cannabis Online in Kentucky | Discreet Shipping — Real Duck Distro",
    metaDescription:
      "Buy premium cannabis online in Kentucky — exotic flower, edibles, concentrates & vapes shipped discreetly to Louisville, Lexington & statewide. Lab-tested, 1–3 day priority delivery.",
    h1: "Buy Cannabis Online in Kentucky",
    answer:
      "Kentucky is a priority delivery state for Real Duck Distro. " + shipLine("Kentucky") + " Orders reach Louisville, Lexington and the rest of the state fast.",
    body: [
      "Kentucky is one of our four fastest-shipping states, so orders to Louisville, Lexington, Bowling Green and Owensboro are prioritized and typically arrive in 1–3 business days. Every package is discreet — no branding, no reference to the contents, neutral return address.",
      "Our full catalog is available to Kentucky customers: exotic top-shelf indoor flower, THC edibles and gummies, live rosin and concentrates, vape cartridges and disposables, and pre-rolls. Everything is lab-tested for potency and contaminants, with Certificates of Analysis available on request.",
    ],
    faqs: [
      { question: "Do you ship cannabis to Kentucky?", answer: "Yes — Kentucky is a priority delivery state. We ship discreetly statewide, including Louisville, Lexington, Bowling Green and Owensboro, typically in 1–3 business days." },
      { question: "How long does delivery to Kentucky take?", answer: "Most Kentucky orders arrive within 1–3 business days as a priority route. Tracking is provided after dispatch." },
      { question: "Is shipping to Kentucky discreet?", answer: "Yes. Every order ships smell-proof, vacuum-sealed and plain-labelled with a neutral return address — nothing on the outside references the contents or the brand." },
      { question: "What payment methods can I use in Kentucky?", answer: "Zelle, Cash App, Chime and Cryptocurrency (BTC, ETH, USDT). Pay in crypto for 10% off. We send payment details after you order — nothing is charged up front." },
    ],
  },

  michigan: {
    slug: "michigan",
    name: "Michigan",
    abbr: "MI",
    cities: ["Detroit", "Grand Rapids", "Ann Arbor", "Lansing"],
    metaTitle: "Buy Cannabis Online in Michigan | Discreet Shipping — Real Duck Distro",
    metaDescription:
      "Buy premium cannabis online in Michigan — exotic flower, edibles, concentrates & vapes shipped discreetly to Detroit, Grand Rapids & statewide. Lab-tested, 1–3 day priority delivery.",
    h1: "Buy Cannabis Online in Michigan",
    answer:
      "Michigan is a priority delivery state for Real Duck Distro. " + shipLine("Michigan") + " Orders reach Detroit, Grand Rapids and Ann Arbor quickly.",
    body: [
      "Michigan orders are prioritized, so shipments to Detroit, Grand Rapids, Ann Arbor and Lansing typically land in 1–3 business days, discreetly packaged and tracked. Michigan customers have full access to our catalog.",
      "From exotic indoor flower and designer packs to live rosin, concentrates, THC edibles, vapes and pre-rolls — every product is lab-tested for potency and purity, with COAs on request. Crypto payments get 10% off, stackable with our app-install discount.",
    ],
    faqs: [
      { question: "Do you ship cannabis to Michigan?", answer: "Yes — Michigan is a priority delivery state. We ship discreetly statewide, including Detroit, Grand Rapids, Ann Arbor and Lansing, typically in 1–3 business days." },
      { question: "How long does delivery to Michigan take?", answer: "Most Michigan orders arrive within 1–3 business days on our priority route, with tracking after dispatch." },
      { question: "Is shipping to Michigan discreet?", answer: "Yes — smell-proof, vacuum-sealed, plain-labelled packaging with a neutral return address on every order." },
      { question: "What can I buy in Michigan?", answer: "Our full catalog: exotic top-shelf flower, edibles & THC gummies, concentrates (live rosin, wax, shatter), vapes & disposables, and pre-rolls — all lab-tested with COAs on request." },
    ],
  },

  florida: {
    slug: "florida",
    name: "Florida",
    abbr: "FL",
    cities: ["Miami", "Orlando", "Tampa", "Jacksonville"],
    metaTitle: "Buy Cannabis Online in Florida | Discreet Shipping — Real Duck Distro",
    metaDescription:
      "Buy premium cannabis online in Florida — exotic flower, edibles, concentrates & vapes shipped discreetly to Miami, Orlando, Tampa & statewide. Lab-tested, 1–3 day priority delivery.",
    h1: "Buy Cannabis Online in Florida",
    answer:
      "Florida is a priority delivery state for Real Duck Distro. " + shipLine("Florida") + " Orders reach Miami, Orlando, Tampa and Jacksonville fast.",
    body: [
      "Florida is one of our highest-volume priority states. Orders to Miami, Orlando, Tampa and Jacksonville are fast-tracked and typically arrive in 1–3 business days, always in discreet, smell-proof packaging.",
      "Florida customers get the full range: exotic top-shelf indoor flower, designer cannabis packs, lab-tested edibles and gummies, live rosin and concentrates, THC vapes and disposables, and pre-rolls. COAs are available on request, and crypto payments save you 10%.",
    ],
    faqs: [
      { question: "Do you ship cannabis to Florida?", answer: "Yes — Florida is a priority delivery state. We ship discreetly statewide, including Miami, Orlando, Tampa and Jacksonville, typically in 1–3 business days." },
      { question: "How fast is delivery to Florida?", answer: "Most Florida orders arrive within 1–3 business days on our priority route, with tracking provided after dispatch." },
      { question: "Is Florida shipping discreet?", answer: "Yes — every order is smell-proof, vacuum-sealed and plain-labelled with a neutral return address." },
      { question: "How do I pay for a Florida order?", answer: "Zelle, Cash App, Chime or Crypto (10% off for crypto). We message you payment details after you order; nothing is charged up front." },
    ],
  },

  mississippi: {
    slug: "mississippi",
    name: "Mississippi",
    abbr: "MS",
    cities: ["Jackson", "Gulfport", "Hattiesburg", "Biloxi"],
    metaTitle: "Buy Cannabis Online in Mississippi | Discreet Shipping — Real Duck Distro",
    metaDescription:
      "Buy premium cannabis online in Mississippi — exotic flower, edibles, concentrates & vapes shipped discreetly to Jackson, Gulfport & statewide. Lab-tested, 1–3 day priority delivery.",
    h1: "Buy Cannabis Online in Mississippi",
    answer:
      "Mississippi is a priority delivery state for Real Duck Distro. " + shipLine("Mississippi") + " Orders reach Jackson, Gulfport and Hattiesburg quickly.",
    body: [
      "Mississippi is a priority route, so orders to Jackson, Gulfport, Hattiesburg and Biloxi are prioritized and typically arrive in 1–3 business days — discreet, sealed and tracked.",
      "The full catalog ships to Mississippi: exotic indoor flower, edibles and THC gummies, live rosin and concentrates, vapes and disposables, and pre-rolls. Every item is lab-tested with COAs on request, and crypto payments earn a 10% discount.",
    ],
    faqs: [
      { question: "Do you ship cannabis to Mississippi?", answer: "Yes — Mississippi is a priority delivery state. We ship discreetly statewide, including Jackson, Gulfport, Hattiesburg and Biloxi, typically in 1–3 business days." },
      { question: "How long does delivery to Mississippi take?", answer: "Most Mississippi orders arrive within 1–3 business days on our priority route, with tracking after dispatch." },
      { question: "Is shipping to Mississippi discreet?", answer: "Yes — smell-proof, vacuum-sealed, plain-labelled packaging with a neutral return address on every order." },
      { question: "What payment methods work in Mississippi?", answer: "Zelle, Cash App, Chime and Crypto (10% off for crypto). Payment details are sent after you order — nothing is charged up front." },
    ],
  },
};

export const ALL_STATE_SLUGS = Object.keys(STATE_CONTENT);

export function getStateContent(slug: string): StateContent | null {
  return STATE_CONTENT[slug] ?? null;
}
