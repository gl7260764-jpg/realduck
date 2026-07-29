import { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.realduckdistro.com";

export const metadata: Metadata = {
  title: "FAQ — Shipping, Payments, Lab Testing & Ordering | Real Duck Distro",
  description:
    "Answers to common questions about Real Duck Distro: what we sell, discreet shipping across the USA, Australia & worldwide, lab testing & COAs, payment methods, discounts and how to order.",
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    title: "FAQ | Real Duck Distro",
    description:
      "Shipping, payments, lab testing and ordering — answered. Real Duck Distro ships discreetly across the USA, Australia & worldwide.",
    url: `${SITE_URL}/faq`,
    type: "website",
    siteName: "Real Duck Distro",
  },
};

interface QA {
  q: string;
  a: string;
}

interface FAQSection {
  heading: string;
  items: QA[];
}

const SECTIONS: FAQSection[] = [
  {
    heading: "Products & Quality",
    items: [
      { q: "What does Real Duck Distro sell?", a: "Real Duck Distro sells exotic top-shelf cannabis flower, edibles and THC gummies, concentrates (live rosin, wax, shatter, live resin), THC vapes and disposables, pre-rolls and infused joints, and magic mushroom products — sourced from licensed US and Australian growers." },
      { q: "Are your products lab-tested?", a: "Yes. Every product is sourced from licensed growers and lab-tested for potency and contaminants (pesticides, heavy metals, residual solvents). Certificates of Analysis (COAs) are available on request for any item." },
      { q: "What does 'exotic' or 'top-shelf' mean?", a: "Exotic/top-shelf refers to indoor-grown, high-terpene designer strains with dense structure and strong potency — the highest quality tier. We grade every strain on a 10-point scale so ratings reflect genuine quality, not marketing." },
    ],
  },
  {
    heading: "Shipping & Delivery",
    items: [
      { q: "Where does Real Duck Distro ship?", a: "We ship across the entire United States, Australia, and worldwide. Orders dispatch from Los Angeles, USA and Sydney, Australia, with 1–3 day priority delivery to Kentucky, Michigan, Florida and Mississippi." },
      { q: "How long does delivery take?", a: "Most US orders arrive in 1–3 business days, with priority states fastest. Australian orders take 1–5 business days. International times vary by destination. Tracking is provided after dispatch." },
      { q: "Is my order packaged discreetly?", a: "Yes. Every order ships smell-proof, vacuum-sealed and plain-labelled, with a neutral return address and no reference to Real Duck Distro or the contents on the exterior." },
    ],
  },
  {
    heading: "Payments & Discounts",
    items: [
      { q: "What payment methods do you accept?", a: "We accept Zelle, Cash App, Chime, and Cryptocurrency (Bitcoin, Ethereum, USDT). After you order, we send payment details for your chosen method; the order ships once payment is confirmed." },
      { q: "How do I get a discount?", a: "Two automatic, stackable discounts: install our web app to your home screen for 10% off every order, and pay in crypto for another 10% off. Combined, that's 20% off your entire order." },
      { q: "Is there a minimum order?", a: "Express (fast) checkout requires a $200 minimum cart total. Detailed checkout has no minimum. Disposables have a minimum order quantity shown at checkout." },
    ],
  },
  {
    heading: "Ordering & Trust",
    items: [
      { q: "How do I place an order?", a: "Add items to your cart and check out. You can use express checkout (fast, $200 minimum) or detailed checkout (no minimum). We then send payment instructions; once confirmed, your order ships discreetly." },
      { q: "Is Real Duck Distro legit?", a: "Real Duck Distro is an established premium cannabis brand (since 2019) with HQ in Los Angeles and Sydney, lab-tested products, published COAs on request, discreet tracked shipping, and thousands of customers across the USA and Australia." },
      { q: "What if I need help with my order?", a: "Email contact@realduckdistro.com and our team will assist. If you don't receive payment details within about 10 minutes of ordering, reach out and we'll follow up right away." },
    ],
  },
];

export default function FAQPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SECTIONS.flatMap((s) =>
      s.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    ),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "FAQ", item: `${SITE_URL}/faq` },
    ],
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Script id="faq-page-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="faq-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <Navbar />

      <main role="main" className="flex-1">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <nav aria-label="Breadcrumb" className="text-xs text-gray-500 mb-4">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:text-slate-900">Home</Link></li>
              <li aria-hidden>/</li>
              <li className="text-slate-900 font-medium">FAQ</li>
            </ol>
          </nav>

          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h1>
            <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed">
              Everything about products, lab testing, discreet shipping across the USA, Australia &amp; worldwide, payments, discounts and ordering with Real Duck Distro.
            </p>
          </header>

          {SECTIONS.map((section) => (
            <section key={section.heading} className="mb-9">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">{section.heading}</h2>
              <div className="divide-y divide-gray-100 border-y border-gray-100">
                {section.items.map((item, i) => (
                  <details key={i} className="group py-4">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-slate-900 text-sm sm:text-base list-none">
                      {item.q}
                      <span className="text-gray-400 transition-transform group-open:rotate-45 text-lg leading-none">+</span>
                    </summary>
                    <p className="mt-2.5 text-gray-600 text-sm leading-relaxed">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <div className="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-gray-600">
            Still have a question? Email{" "}
            <a href="mailto:contact@realduckdistro.com" className="font-medium text-slate-900 underline">contact@realduckdistro.com</a>{" "}
            or browse the{" "}
            <Link href="/" className="font-medium text-slate-900 underline">full catalog</Link>.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
