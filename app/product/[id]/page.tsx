import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import ProductDetailClient from "./ProductDetailClient";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { Category } from "@prisma/client";
import Script from "next/script";
import { PRODUCT_FAQS } from "@/lib/productFAQs";
import RecentlyViewed from "@/app/components/RecentlyViewed";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.realduckdistro.com";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(slugOrId: string) {
  // Try slug first (the new SEO-friendly URL format)
  let product = await prisma.product.findUnique({
    where: { slug: slugOrId },
  });
  // Fall back to id for backward compatibility with old cuid URLs
  if (!product) {
    product = await prisma.product.findUnique({
      where: { id: slugOrId },
    });
  }
  return product;
}

async function getRelatedProducts(category: Category, currentId: string) {
  const products = await prisma.product.findMany({
    where: {
      category,
      id: { not: currentId },
    },
    take: 4,
  });
  return products;
}

async function getRelatedBlogs(productSlug: string | null, productTitle: string, category: Category) {
  // Find blog posts that mention this product's category, name tokens, or are
  // semantically related (e.g., a strain review + a strain — internal linking
  // boosts topical authority for both pages).
  const slugTokens = (productSlug || "").split("-").filter((t) => t.length > 3);
  const titleTokens = productTitle
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 3);

  const candidates = await prisma.blogPost.findMany({
    where: {
      published: true,
      OR: [
        // Slug contains a token from the product
        ...slugTokens.map((t) => ({ slug: { contains: t } })),
        // Title contains a token from the product
        ...titleTokens.map((t) => ({ title: { contains: t, mode: "insensitive" as const } })),
        // Tags include any product token
        { tags: { hasSome: [...slugTokens, ...titleTokens] } },
      ],
    },
    select: { slug: true, title: true, excerpt: true, imageUrl: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  // De-dupe and prefer the most recent / topical
  const seen = new Set<string>();
  const out: typeof candidates = [];
  for (const c of candidates) {
    if (!seen.has(c.slug)) { seen.add(c.slug); out.push(c); }
    if (out.length >= 3) break;
  }

  // Fallback: if nothing matched, grab category-relevant guides
  if (out.length === 0) {
    const categoryFallback: Record<string, string[]> = {
      DISPOSABLES: ["how-to-choose-right-vape", "what-are-terpenes-complete-guide"],
      FLOWER: ["how-to-roll-perfect-joint", "how-to-store-cannabis-properly", "what-are-terpenes-complete-guide"],
      EDIBLES: ["cannabis-edibles-dosing-guide"],
      MUSHROOM: ["polkadot-mushroom-gummies-review-amanita-blend-guide"],
      PILLS: ["real-vs-pressed-xanax-percs-counterfeit-pills-guide"],
    };
    const slugs = categoryFallback[category] || ["beginners-guide-to-cannabis-consumption-methods"];
    const fallback = await prisma.blogPost.findMany({
      where: { slug: { in: slugs }, published: true },
      select: { slug: true, title: true, excerpt: true, imageUrl: true, category: true },
      take: 3,
    });
    return fallback;
  }

  return out;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The product you are looking for does not exist.",
    };
  }

  const categoryKeywords: Record<string, string[]> = {
    FLOWER: ["exotic flower", "top shelf flower", "indoor exotic", "zaza", "gas packs", "exotic packs"],
    EDIBLES: ["THC edibles", "cannabis edibles", "infused edibles", "edibles delivery"],
    CONCENTRATES: ["concentrates", "dabs", "wax", "shatter", "live resin", "badder"],
    PREROLLS: ["pre-rolls", "infused pre-rolls", "joints", "blunts", "premium pre-rolls"],
    MUSHROOM: ["mushrooms", "shrooms", "psilocybin", "mushroom delivery"],
    DISPOSABLES: ["disposable vapes", "disposable pen", "all-in-one vape", "rechargeable disposable", "vape cartridges", "THC vape"],
    OTHERS: ["premium products", "exotic products"],
  };

  const catLower = product.category.toLowerCase();
  const catSpecificKeywords = categoryKeywords[product.category] || [];
  const catDisplay = catLower.charAt(0).toUpperCase() + catLower.slice(1);

  // Title: explicit metaTitle wins; else auto-built from product title + category.
  const title =
    product.metaTitle?.trim() ||
    `${product.title} | ${catDisplay} - Real Duck Distro`;

  // Description: explicit metaDescription wins; else truncated description; else boilerplate.
  const description =
    product.metaDescription?.trim() ||
    (product.description
      ? product.description.slice(0, 160)
      : `${product.title} - premium ${catLower} from Real Duck Distro. Delivering across the USA, Australia & worldwide — priority service to Kentucky, Michigan, Florida & Mississippi. HQ in LA & Sydney. ${product.isSoldOut ? "Currently sold out." : "In stock - order now."}`);

  // Keywords: explicit override; else fall back to category keywords.
  const keywords =
    product.metaKeywords?.trim() ||
    catSpecificKeywords.join(", ");

  // OG image: explicit ogImage wins; else main product image.
  const ogImage = product.ogImage?.trim() || product.imageUrl;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: product.metaTitle?.trim() || `${product.title} | Real Duck Distro`,
      description,
      url: `${SITE_URL}/product/${product.slug || product.id}`,
      siteName: "Real Duck Distro",
      images: [
        {
          url: ogImage,
          width: 800,
          height: 800,
          alt: product.title,
        },
      ],
      type: "article",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: product.metaTitle?.trim() || `${product.title} | Real Duck Distro`,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `${SITE_URL}/product/${product.slug || product.id}`,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.category, product.id);
  const relatedBlogs = await getRelatedBlogs(product.slug, product.title, product.category);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || `${product.title} - premium ${product.category.toLowerCase()} from Real Duck Distro. Delivering across the USA, Australia & worldwide — priority service to Kentucky, Michigan, Florida & Mississippi. HQ in Los Angeles & Sydney.`,
    image: product.images?.length
      ? [product.imageUrl, ...product.images]
      : [product.imageUrl],
    brand: {
      "@type": "Brand",
      name: "Real Duck Distro",
    },
    category: product.category,
    sku: product.id,
    url: `${SITE_URL}/product/${product.slug || product.id}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: product.priceLocal.replace(/[^0-9.]/g, "").split("\n")[0] || "0",
      highPrice: product.priceShip.replace(/[^0-9.]/g, "").split("\n")[0] || "0",
      availability: product.isSoldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      offerCount: 2,
      seller: {
        "@type": "Organization",
        name: "Real Duck Distro",
        url: SITE_URL,
      },
      shippingDetails: [
        {
          "@type": "OfferShippingDetails",
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: "US",
          },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
            transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 3, unitCode: "DAY" },
          },
        },
        {
          "@type": "OfferShippingDetails",
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: "AU",
          },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
            transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 5, unitCode: "DAY" },
          },
        },
      ],
    },
  };

  // FAQ schema — only for the 20 priority products with curated FAQ data.
  // FAQPage rich snippets are one of the highest-impact rich-result types.
  const faqEntries = product.slug ? PRODUCT_FAQS[product.slug] : undefined;
  const faqSchema = faqEntries
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqEntries.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category,
        item: `${SITE_URL}/?category=${product.category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: `${SITE_URL}/product/${product.slug || product.id}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Script
        id={`product-schema-${product.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Script
        id={`breadcrumb-schema-${product.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <Script
          id={`faq-schema-${product.id}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <Navbar />
      <main>
        <ProductDetailClient product={product} relatedProducts={relatedProducts} />

        {/* Related reads — internal linking boost (topical silo + dwell time) */}
        {relatedBlogs.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Related Reads</h2>
                <p className="text-sm text-gray-500 mt-1">From the Real Duck Distro cannabis blog.</p>
              </div>
              <Link href="/blog" className="text-sm text-slate-900 font-medium hover:text-slate-600 transition-colors">
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedBlogs.map((b) => (
                <Link
                  key={b.slug}
                  href={`/blog/${b.slug}`}
                  className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.imageUrl}
                      alt={`${b.title} — Real Duck Distro cannabis blog`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                      {b.category.replace(/_/g, " ").toLowerCase()}
                    </span>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mt-1.5 leading-snug line-clamp-2 group-hover:text-slate-700 transition-colors">
                      {b.title}
                    </h3>
                    {b.excerpt && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{b.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {faqEntries && (
          <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 border-t border-gray-100">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-5">
              {faqEntries.map((f, i) => (
                <details key={i} className="group border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <summary className="cursor-pointer font-medium text-sm sm:text-base text-gray-900 list-none flex justify-between items-start gap-2">
                    <span>{f.question}</span>
                    <span className="text-gray-400 text-xs flex-shrink-0 mt-0.5 group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}
        <RecentlyViewed excludeSlug={product.slug ?? undefined} />
      </main>
      <Footer />
    </div>
  );
}
