import Navbar from "./components/Navbar";
import CatalogClient from "./components/CatalogClient";
import Footer from "./components/Footer";
import SEOBlock from "./components/SEOBlock";
import prisma from "@/lib/prisma";
import Script from "next/script";
import { dailyShuffle } from "@/lib/dailyShuffle";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";

export const dynamic = 'force-dynamic';

async function getProducts() {
  const products = await prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  // Pinned top three — matched by title (case-insensitive substring), order preserved
  const pinnedMatchers = [
    (t: string) => t.includes("blue candy lemons"),
    (t: string) => t.includes("raspberry airheadz"),
    (t: string) => t.includes("gumbo 88g"),
  ];
  const pinned = pinnedMatchers
    .map((match) => products.find((p) => match(p.title.toLowerCase())))
    .filter((p): p is (typeof products)[number] => Boolean(p));
  const pinnedIds = new Set(pinned.map((p) => p.id));

  // Next slots: products with a video (hover-to-play) — shuffled daily, excluding pinned
  const withVideo = dailyShuffle(
    products.filter((p) => !pinnedIds.has(p.id) && p.videoUrl && p.videoUrl.trim() !== "")
  );
  const videoFeatured = withVideo.slice(0, 4);
  const videoFeaturedIds = new Set(videoFeatured.map((p) => p.id));

  // Remaining go through the original FLOWER-first logic, excluding pinned and video-featured
  const rest = products.filter((p) => !pinnedIds.has(p.id) && !videoFeaturedIds.has(p.id));
  const flowerProducts = dailyShuffle(rest.filter((p) => p.category === "FLOWER"));
  const otherProducts = dailyShuffle(rest.filter((p) => p.category !== "FLOWER"));

  const featuredFlower = flowerProducts.slice(0, 6);
  const restFlower = flowerProducts.slice(6);
  const remaining = dailyShuffle([...restFlower, ...otherProducts]);

  return [...pinned, ...videoFeatured, ...featuredFlower, ...remaining];
}

export default async function Home() {
  const products = await getProducts();

  const catalogSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Real Duck Distro - Premium Cannabis Lifestyle Brand | USA & AUS | Worldwide Shipping",
    description: "The world's leading premium cannabis lifestyle brand. Designer cannabis packs, exotic flower, edibles, concentrates, vapes, rosin, pre-rolls & disposables. HQ in Los Angeles USA & Sydney Australia, with priority delivery to Kentucky, Michigan, Florida and Mississippi. Delivering across the USA, Australia & worldwide.",
    numberOfItems: products.length,
    itemListElement: products.slice(0, 30).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/product/${product.slug || product.id}`,
      name: product.title,
      image: product.imageUrl,
    })),
  };

  // FAQPage schema — unlocks the "People Also Ask" rich snippet in SERP
  // and captures long-tail informational queries that often have low
  // competition for cannabis lifestyle brands.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Where does Real Duck Distro ship?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Real Duck Distro ships cannabis products across the entire United States, Australia, and worldwide. Orders are packaged discreetly and dispatched from our HQ in Los Angeles, USA and Sydney, Australia, with priority delivery to customers in Kentucky, Michigan, Florida, and Mississippi. Most domestic US orders arrive in 1–3 business days.",
        },
      },
      {
        "@type": "Question",
        name: "What payment methods are accepted?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We accept Zelle, Cash App, Chime, and Cryptocurrency (Bitcoin, Ethereum, USDT). Customers paying in crypto automatically receive a 10% discount on their entire order.",
        },
      },
      {
        "@type": "Question",
        name: "Is my order packaged discreetly?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Every order ships in smell-proof, vacuum-sealed, plain-labelled packaging with no reference to Real Duck Distro, cannabis, or product contents on the exterior. Shipping labels use neutral return addresses.",
        },
      },
      {
        "@type": "Question",
        name: "What kind of cannabis products do you sell?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Real Duck Distro carries exotic top-shelf indoor flower, designer cannabis packs, lab-tested edibles and THC gummies, live rosin, concentrates (wax, shatter, badder, live resin), vape cartridges and disposables, pre-rolls and infused pre-rolls, plus magic mushroom products — all sourced from trusted US and Australian growers.",
        },
      },
      {
        "@type": "Question",
        name: "How do I get a discount on my order?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "There are two automatic discounts. (1) Install the Real Duck Distro app to your home screen for a flat 10% off every order. (2) Pay in crypto for an additional 10% off. Both stack — install the app AND pay in crypto for 20% off your entire order.",
        },
      },
      {
        "@type": "Question",
        name: "Are Real Duck Distro products lab-tested?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. All cannabis products sold by Real Duck Distro are sourced from licensed growers and processors, lab-tested for potency and contaminants (pesticides, heavy metals, residual solvents), and come with published COAs (Certificates of Analysis) on request.",
        },
      },
      {
        "@type": "Question",
        name: "What is the minimum order for fast checkout?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our fast checkout (express order) requires a minimum cart total of $200. For any order below $200, please use the detailed checkout, which has no minimum.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Script
        id="catalog-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogSchema) }}
      />
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <main role="main">
        <h1 className="sr-only">
          Real Duck Distro — The World&apos;s Leading Premium Cannabis Lifestyle Brand | USA &amp; Australia | Priority Delivery to Kentucky, Michigan, Florida &amp; Mississippi | Worldwide Shipping
        </h1>
        <CatalogClient initialProducts={products} />
        <SEOBlock
          heading="The World's Leading Premium Cannabis Lifestyle Brand"
          content="Real Duck Distro is a world leading premium cannabis lifestyle brand, trusted by thousands of customers across the United States, Australia, and worldwide. Headquartered in Los Angeles, USA and Sydney, Australia — with priority delivery to Kentucky, Michigan, Florida and Mississippi — we deliver across the entire USA and Australia with fast, discreet worldwide shipping. From designer cannabis packs and exotic top-shelf flower to lab-tested edibles, concentrates, vapes, rosin, pre-rolls and disposables, Real Duck Distro sets the standard. Browse our collection and experience what it means to shop with the best."
          imageSrc="/images/logo.jpg"
          imageAlt="Real Duck Distro — Premium Cannabis Lifestyle Brand | HQ in LA USA & Sydney Australia | Priority Delivery to Kentucky, Michigan, Florida & Mississippi | Worldwide Shipping"
          headingLevel="h2"
        />
      </main>
      <Footer />
    </div>
  );
}
