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

  // Daily shuffle — randomizes product order every 24 hours to keep content fresh
  // Shuffle within each category so the structure stays consistent but the order varies
  const flowerProducts = dailyShuffle(products.filter((p) => p.category === "FLOWER"));
  const otherProducts = dailyShuffle(products.filter((p) => p.category !== "FLOWER"));

  // Ensure first 6 products are always FLOWER (now in daily-shuffled order)
  const featuredFlower = flowerProducts.slice(0, 6);
  const restFlower = flowerProducts.slice(6);
  // Mix remaining flower with other categories, still shuffled daily
  const remaining = dailyShuffle([...restFlower, ...otherProducts]);

  return [...featuredFlower, ...remaining];
}

export default async function Home() {
  const products = await getProducts();

  const catalogSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Real Duck Distro - Premium Cannabis Lifestyle Brand | USA & AUS | Worldwide Shipping",
    description: "The world's leading premium cannabis lifestyle brand. Designer cannabis packs, exotic flower, edibles, concentrates, vapes, rosin, pre-rolls & disposables. HQ in Los Angeles USA & Sydney Australia. Delivering across the USA, Australia & worldwide.",
    numberOfItems: products.length,
    itemListElement: products.slice(0, 30).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/product/${product.slug || product.id}`,
      name: product.title,
      image: product.imageUrl,
    })),
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Script
        id="catalog-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogSchema) }}
      />
      <Navbar />
      <main role="main">
        <h1 className="sr-only">
          Real Duck Distro — The World&apos;s Leading Premium Cannabis Lifestyle Brand | USA &amp; Australia | Worldwide Shipping
        </h1>
        <CatalogClient initialProducts={products} />
        <SEOBlock
          heading="The World's Leading Premium Cannabis Lifestyle Brand"
          content="Real Duck Distro is a world leading premium cannabis lifestyle brand, trusted by thousands of customers across the United States, Australia, and worldwide. Headquartered in Los Angeles, USA and Sydney, Australia — we deliver across the entire USA and Australia with fast, discreet worldwide shipping. From designer cannabis packs and exotic top-shelf flower to lab-tested edibles, concentrates, vapes, rosin, pre-rolls and disposables Real Duck Distro sets the standard. Browse our collection and experience what it means to shop with the best."
          imageSrc="/images/logo.jpg"
          imageAlt="Real Duck Distro — Premium Cannabis Lifestyle Brand | HQ in LA USA & Sydney Australia | Worldwide Shipping"
          headingLevel="h2"
        />
      </main>
      <Footer />
    </div>
  );
}
