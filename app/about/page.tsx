import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Script from "next/script";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";

export const metadata: Metadata = {
  title: "About Real Duck Distro — Premium Cannabis from Los Angeles, USA",
  description:
    "Real Duck Distro is a premium cannabis distributor based in Los Angeles, California with 25+ years of combined industry experience. Authentic products, lab-tested supply chain, nationwide US shipping.",
  keywords: [
    "about real duck distro",
    "premium cannabis Los Angeles",
    "California cannabis distributor",
    "authentic cannabis supplier",
    "lab-tested cannabis USA",
    "cannabis nationwide shipping",
  ],
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: "About Real Duck Distro — Premium Cannabis from Los Angeles, USA",
    description:
      "Real Duck Distro is a premium cannabis distributor based in Los Angeles, California with 25+ years of combined industry experience.",
    url: `${SITE_URL}/about`,
    siteName: "Real Duck Distro",
    type: "website",
    locale: "en_US",
  },
};

export default function AboutPage() {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Real Duck Distro",
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.jpg`,
    description:
      "Premium cannabis distributor based in Los Angeles, California. Authentic products, verified supply chain, nationwide US shipping.",
    foundingDate: "2019",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Los Angeles",
      addressRegion: "CA",
      addressCountry: "US",
    },
    knowsAbout: [
      "Cannabis flower",
      "Cannabis concentrates",
      "Cannabis vape disposables",
      "Cannabis edibles",
      "Cannabis pre-rolls",
      "Functional mushrooms",
      "Authentic pharmaceutical products",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "contact@realduckdistro.com",
      areaServed: "US",
      availableLanguage: "English",
    },
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Script
        id="about-org-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <Navbar />
      <main className="flex-1">
        {/* Hero — background image + gradient wash */}
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0" aria-hidden>
            <Image
              src="/images/hero.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/85 to-slate-900/50" />
          </div>
          <div className="relative max-w-5xl mx-auto px-5 sm:px-6 py-16 sm:py-24 lg:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> About
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Real Duck Distro
            </h1>
            <p className="mt-4 max-w-2xl text-base sm:text-lg text-white/70 leading-relaxed">
              Premium cannabis from Los Angeles, California — with 25+ years of combined industry experience and a verified supply chain that ships nationwide across the USA.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
              <span>Los Angeles, USA</span>
              <span className="text-white/20">•</span>
              <span>Lab-tested · COA on request</span>
              <span className="text-white/20">•</span>
              <span>Discreet nationwide shipping</span>
            </div>
          </div>
        </section>

        <div className="h-[3px] w-full bg-slate-900" aria-hidden />

        {/* Story — white */}
        <section className="bg-white px-5 sm:px-6 py-10 sm:py-16">
          <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Why we exist</h2>
          <div className="space-y-4 text-base text-gray-700 leading-relaxed">
            <p>
              The premium cannabis market is full of counterfeit products, mislabeled potencies, and supply chains that nobody can vouch for. Real Duck Distro was started because the people who actually <em>use</em> cannabis daily — connoisseurs, patients, and recreational consumers — deserved a source they could trust.
            </p>
            <p>
              We're based in Los Angeles, the center of California's cannabis industry. Every product we stock comes through verified suppliers we've vetted personally. Every batch is lab-tested before it hits the shelf. Every brand we carry is authenticated against the manufacturer's verification system.
            </p>
            <p>
              When we say "authentic," we don't mean "we hope so" — we mean we've physically traced the supply chain.
            </p>
          </div>
          </div>
        </section>

        <div className="h-[3px] w-full bg-slate-900" aria-hidden />

        {/* Expertise grid — light grey */}
        <section className="bg-slate-50 px-5 sm:px-6 py-10 sm:py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Our expertise</h2>
            <p className="text-gray-600 mb-8 max-w-2xl">
              The Real Duck Distro team brings real industry experience across every category we stock. This isn't a reseller masquerading as experts — it's people who know their stuff.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  area: "California Cultivation",
                  desc: "Years working alongside California's licensed indoor cultivators. We know what real top-shelf indoor looks, smells, and smokes like.",
                },
                {
                  area: "Extract Chemistry",
                  desc: "Hands-on experience with hydrocarbon extraction, solventless rosin, and live resin processes. We can spot bad concentrate from across the room.",
                },
                {
                  area: "Strain Genetics",
                  desc: "Pheno hunting, terpene profiling, and breeding lineage knowledge — we don't just sell strain names, we understand them.",
                },
                {
                  area: "Disposable Hardware",
                  desc: "Engineering knowledge of ceramic coils, airflow design, battery sizing, and oil viscosity. We know which brands cut corners and which don't.",
                },
                {
                  area: "Harm Reduction",
                  desc: "Proudly publish harm-reduction content (e.g., real-vs-pressed-pills guide). Customer safety beats marketing copy, every time.",
                },
                {
                  area: "Customer Trust",
                  desc: "Discreet packaging, tracked nationwide US shipping, responsive customer support, no surprises on what you ordered vs what arrived.",
                },
              ].map((x) => (
                <div key={x.area} className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{x.area}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{x.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="h-[3px] w-full bg-slate-900" aria-hidden />

        {/* Standards — white */}
        <section className="bg-white px-5 sm:px-6 py-10 sm:py-16">
          <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Our standards</h2>
          <div className="space-y-5">
            <div className="border-l-4 border-emerald-500 pl-5 py-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Authentic supply chain</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Every product is sourced from verified manufacturers or licensed distributors. We turn down counterfeit stock no matter how cheap it is.
              </p>
            </div>
            <div className="border-l-4 border-emerald-500 pl-5 py-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Lab-tested batches</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Concentrates, edibles, and disposables come with verified COAs (Certificates of Analysis). Pharmaceutical-grade products are sourced from licensed manufacturers, never pressed.
              </p>
            </div>
            <div className="border-l-4 border-emerald-500 pl-5 py-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Discreet US-wide shipping</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                All orders ship from Los Angeles in plain, unmarked packaging via tracked services. Same-day handling for orders placed before 2 PM PT.
              </p>
            </div>
            <div className="border-l-4 border-emerald-500 pl-5 py-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Real customer support</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Email and Telegram support staffed by humans, not bots. Order issues are solved the same day in most cases.
              </p>
            </div>
          </div>
          </div>
        </section>

        <div className="h-[3px] w-full bg-slate-900" aria-hidden />

        {/* Coverage — light grey */}
        <section className="bg-slate-50 px-5 sm:px-6 py-10 sm:py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Where we ship</h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Real Duck Distro ships discreetly across <strong>all 50 US states</strong>. Our highest-volume regions are California, Florida, Texas, New York, Illinois, Michigan, Colorado, Washington, Oregon, Nevada, Arizona, Pennsylvania, Ohio, Georgia, and North Carolina — but we deliver coast to coast.
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              <Link href="/" className="text-slate-900 font-medium underline underline-offset-2">Browse our catalog</Link> or <Link href="/blog" className="text-slate-900 font-medium underline underline-offset-2">read our cannabis education blog</Link> to learn more about what we carry and why.
            </p>
          </div>
        </section>

        <div className="h-[3px] w-full bg-slate-900" aria-hidden />

        {/* CTA — white */}
        <section className="bg-white px-5 sm:px-6 py-10 sm:py-16 text-center">
          <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Real cannabis. Real source. Real delivered.</h2>
          <p className="text-base text-gray-600 mb-6">
            Browse our full catalog of premium flower, concentrates, disposables, edibles, and pharmaceutical-grade products.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
              Shop catalog
            </Link>
            <Link href="/blog" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Read the blog
            </Link>
          </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
