import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import prisma from "@/lib/prisma";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ProductGrid from "@/app/components/ProductGrid";
import { getHiddenCategories } from "@/lib/categoryVisibility";
import {
  getCategoryContentBySlug,
  ALL_CATEGORY_SLUGS,
  CATEGORY_CONTENT,
  type CategoryContent,
} from "@/lib/categoryContent";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";

export const revalidate = 300;

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

// Pre-render the authored category pages at build for instant, cacheable HTML.
export function generateStaticParams() {
  return ALL_CATEGORY_SLUGS.map((category) => ({ category }));
}

async function resolve(slug: string): Promise<CategoryContent | null> {
  const content = getCategoryContentBySlug(slug);
  if (!content) return null;
  // Respect the site-wide hidden-category setting — a hidden category's
  // landing page should 404 like its products do.
  const hidden = await getHiddenCategories();
  if (hidden.includes(content.category)) return null;
  return content;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const content = await resolve(category);
  if (!content) return { title: "Category Not Found" };

  const url = `${SITE_URL}/category/${content.slug}`;
  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      url,
      type: "website",
      siteName: "Real Duck Distro",
    },
    twitter: {
      card: "summary_large_image",
      title: content.metaTitle,
      description: content.metaDescription,
    },
  };
}

async function getCategoryProducts(category: string) {
  return prisma.product.findMany({
    where: { category: category as never, isSoldOut: false },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      indoor: true,
      rating: true,
      priceLocal: true,
      priceShip: true,
      slashedPriceLocal: true,
      slashedPriceShip: true,
      isSoldOut: true,
      imageUrl: true,
      videoUrl: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const content = await resolve(category);
  if (!content) notFound();

  const products = await getCategoryProducts(content.category);
  const url = `${SITE_URL}/category/${content.slug}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: content.label, item: url },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: content.h1,
    description: content.metaDescription,
    url,
    isPartOf: { "@type": "WebSite", name: "Real Duck Distro", url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 30).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/product/${p.slug || p.id}`,
        name: p.title,
        image: p.imageUrl,
      })),
    },
  };

  // Sibling categories for internal linking (crawlable category-to-category).
  const siblings = Object.values(CATEGORY_CONTENT).filter((c) => c.slug !== content.slug);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Script id={`breadcrumb-${content.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id={`faq-${content.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id={`collection-${content.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />

      <Navbar />

      <main role="main" className="flex-1">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="text-xs text-gray-500 mb-4">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:text-slate-900">Home</Link></li>
              <li aria-hidden>/</li>
              <li className="text-slate-900 font-medium">{content.label}</li>
            </ol>
          </nav>

          {/* H1 + answer block */}
          <header className="mb-6 max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              {content.h1}
            </h1>
            <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed">
              {content.answer}
            </p>
          </header>

          {/* Product grid */}
          <ProductGrid products={products} />

          {/* Supporting E-E-A-T copy */}
          <section className="mt-12 max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
              About {content.label} at Real Duck Distro
            </h2>
            {content.body.map((p, i) => (
              <p key={i} className="text-gray-600 text-sm sm:text-base leading-[1.85] mb-4">
                {p}
              </p>
            ))}
          </section>

          {/* Visible FAQ (also emitted as FAQPage JSON-LD above) */}
          <section className="mt-10 max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <div className="divide-y divide-gray-100 border-y border-gray-100">
              {content.faqs.map((f, i) => (
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

          {/* Internal links to sibling categories */}
          <section className="mt-12" aria-label="Shop other categories">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
              Shop other categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {siblings.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="inline-flex items-center rounded-full border border-gray-200 px-4 py-1.5 text-sm text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-colors"
                >
                  {c.label}
                </Link>
              ))}
              <Link
                href="/"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1.5 text-sm text-white hover:opacity-90 transition-opacity"
              >
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
