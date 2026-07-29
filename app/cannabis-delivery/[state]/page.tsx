import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import prisma from "@/lib/prisma";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ProductGrid from "@/app/components/ProductGrid";
import { getHiddenCategories } from "@/lib/categoryVisibility";
import { dailyShuffle } from "@/lib/dailyShuffle";
import { getStateContent, ALL_STATE_SLUGS } from "@/lib/stateContent";
import { CATEGORY_CONTENT } from "@/lib/categoryContent";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";

export const revalidate = 300;

interface StatePageProps {
  params: Promise<{ state: string }>;
}

export function generateStaticParams() {
  return ALL_STATE_SLUGS.map((state) => ({ state }));
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { state } = await params;
  const c = getStateContent(state);
  if (!c) return { title: "State Not Found" };
  const url = `${SITE_URL}/cannabis-delivery/${c.slug}`;
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: c.metaTitle, description: c.metaDescription, url, type: "website", siteName: "Real Duck Distro" },
    twitter: { card: "summary_large_image", title: c.metaTitle, description: c.metaDescription },
  };
}

async function getFeaturedProducts() {
  const hidden = await getHiddenCategories();
  const products = await prisma.product.findMany({
    where: {
      isSoldOut: false,
      ...(hidden.length ? { NOT: { category: { in: hidden as never } } } : {}),
    },
    select: {
      id: true, slug: true, title: true, category: true, indoor: true, rating: true,
      priceLocal: true, priceShip: true, slashedPriceLocal: true, slashedPriceShip: true,
      isSoldOut: true, imageUrl: true, videoUrl: true,
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  // Flower-first, then a daily-shuffled mix — same feel as the homepage.
  const flower = dailyShuffle(products.filter((p) => p.category === "FLOWER"));
  const other = dailyShuffle(products.filter((p) => p.category !== "FLOWER"));
  return [...flower, ...other].slice(0, 12);
}

export default async function StatePage({ params }: StatePageProps) {
  const { state } = await params;
  const c = getStateContent(state);
  if (!c) notFound();

  const products = await getFeaturedProducts();
  const url = `${SITE_URL}/cannabis-delivery/${c.slug}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: `Cannabis Delivery in ${c.name}`, item: url },
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Cannabis Delivery in ${c.name}`,
    description: c.metaDescription,
    serviceType: "Discreet cannabis shipping",
    provider: { "@type": "Organization", name: "Real Duck Distro", url: SITE_URL },
    areaServed: { "@type": "State", name: c.name },
    url,
  };

  const categories = Object.values(CATEGORY_CONTENT);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Script id={`bc-${c.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id={`faq-${c.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id={`svc-${c.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Navbar />

      <main role="main" className="flex-1">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <nav aria-label="Breadcrumb" className="text-xs text-gray-500 mb-4">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:text-slate-900">Home</Link></li>
              <li aria-hidden>/</li>
              <li className="text-slate-900 font-medium">Cannabis Delivery · {c.name}</li>
            </ol>
          </nav>

          <header className="mb-6 max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Priority delivery state
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              {c.h1}
            </h1>
            <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed">{c.answer}</p>
            <p className="mt-2 text-xs text-gray-400">
              Serving {c.cities.join(" · ")} and all of {c.name}.
            </p>
          </header>

          <ProductGrid products={products} />

          <section className="mt-12 max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
              Cannabis shipping to {c.name}
            </h2>
            {c.body.map((p, i) => (
              <p key={i} className="text-gray-600 text-sm sm:text-base leading-[1.85] mb-4">{p}</p>
            ))}
          </section>

          <section className="mt-10 max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
              {c.name} — Frequently Asked Questions
            </h2>
            <div className="divide-y divide-gray-100 border-y border-gray-100">
              {c.faqs.map((f, i) => (
                <details key={i} className="group py-4">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-slate-900 text-sm sm:text-base list-none">
                    {f.question}
                    <span className="text-gray-400 transition-transform group-open:rotate-45 text-lg leading-none">+</span>
                  </summary>
                  <p className="mt-2.5 text-gray-600 text-sm leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mt-12" aria-label="Shop by category">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Shop by category</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Link key={cat.slug} href={`/category/${cat.slug}`} className="inline-flex items-center rounded-full border border-gray-200 px-4 py-1.5 text-sm text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-colors">
                  {cat.label}
                </Link>
              ))}
              <Link href="/" className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1.5 text-sm text-white hover:opacity-90 transition-opacity">
                View all products
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
