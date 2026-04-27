import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientProvider from "./components/ClientProvider";
import prisma from "@/lib/prisma";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";
export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Real Duck Distro — Buy Premium Cannabis Online | Exotic Flower, Edibles, Vapes & Concentrates",
    template: "%s | Real Duck Distro",
  },
  description:
    "Buy premium cannabis online at Real Duck Distro — exotic top-shelf flower, designer cannabis packs, lab-tested edibles, live rosin, concentrates, vapes, pre-rolls, gummies, magic mushrooms & disposables. Fast, discreet shipping across the USA, Australia & worldwide. Trusted cannabis brand — HQ in Los Angeles, USA & Sydney, Australia. Priority delivery to Kentucky, Michigan, Florida & Mississippi.",
  keywords: [
    "buy cannabis online",
    "buy weed online",
    "premium cannabis store",
    "exotic cannabis strains",
    "top shelf flower online",
    "designer cannabis packs",
    "cannabis edibles online",
    "live rosin for sale",
    "cannabis concentrates online",
    "THC vapes online",
    "pre-rolls online",
    "buy magic mushrooms online",
    "THC gummies",
    "discreet cannabis shipping USA",
    "cannabis delivery Australia",
    "cannabis delivery Kentucky",
    "cannabis delivery Michigan",
    "cannabis delivery Florida",
    "cannabis delivery Mississippi",
    "cannabis store Los Angeles",
    "cannabis store Sydney",
    "buy weed Kentucky",
    "buy weed Michigan",
    "buy weed Florida",
    "buy weed Mississippi",
    "buy weed Australia",
    "worldwide cannabis shipping",
    "Real Duck Distro",
  ],
  authors: [{ name: "Real Duck Distro" }],
  creator: "Real Duck Distro",
  publisher: "Real Duck Distro",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Real Duck Distro",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Real Duck Distro",
    title: "Real Duck Distro — Buy Premium Cannabis Online | Exotic Flower, Edibles, Vapes & Concentrates",
    description:
      "Exotic top-shelf flower, designer packs, edibles, live rosin, concentrates, vapes, pre-rolls & gummies. Fast, discreet cannabis shipping across the USA, Australia & worldwide. Priority delivery to Kentucky, Michigan, Florida & Mississippi.",
    images: [
      {
        url: "/images/hero.webp?v=2",
        width: 1200,
        height: 630,
        alt: "Real Duck Distro — premium cannabis online, exotic flower and designer packs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@realduckdistro",
    title: "Real Duck Distro — Buy Premium Cannabis Online | Exotic Flower, Edibles & Vapes",
    description:
      "Exotic top-shelf flower, designer packs, edibles, live rosin, concentrates, vapes, pre-rolls & gummies. Discreet shipping — USA (incl. KY/MI/FL/MS), Australia & worldwide.",
    images: ["/images/hero.webp?v=2"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-US": SITE_URL,
      "en-AU": SITE_URL,
      "x-default": SITE_URL,
    },
  },
  verification: {
    google: [
      "mkcv_izZVyDLtoaUIC1aAtiXpTU5s1OpwI1DZEXQGOs",
      "5wIrY-yhLrsaHy36yp4V_IHGxQ4ko0saT_3FcsCnIXM",
    ],
  },
  other: {
    "ahrefs-site-verification": "4c17bfb4bbf0edc9aef3014dcb1c12cd5fb812c12903fe4b82822381d6248fae",
    "msvalidate.01": "3D2EBB8DBFB339D5FD722F1039A361CC",
  },
  category: "shopping",
};

async function getSettings() {
  try {
    const rows = await prisma.siteSetting.findMany();
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value;
    return {
      telegramChannel: map.telegramChannel || "https://t.me/realduckdistrola",
      snapchatLink: map.snapchatLink || "https://snapchat.com/t/QVHfSVoo",
    };
  } catch {
    return {
      telegramChannel: "https://t.me/realduckdistrola",
      snapchatLink: "https://snapchat.com/t/QVHfSVoo",
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  return (
    <html lang="en">
      <head>
        {/* Resource hints — open early TCP/TLS to image and analytics origins so first paint is faster */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://analytics.ahrefs.com" />
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="awWcY/FuVfVDJgvn2CIiiw"
          strategy="afterInteractive"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RH5BCFNM1L"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RH5BCFNM1L');
          `}
        </Script>
        <Script
          id="schema-brand-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: "Real Duck Distro",
              alternateName: "RDD",
              url: SITE_URL,
              logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/images/logo.jpg`,
                width: 1111,
                height: 874,
                caption: "Real Duck Distro logo",
              },
              image: `${SITE_URL}/images/hero.webp?v=2`,
              description:
                "Real Duck Distro — premium cannabis online. Exotic top-shelf flower, designer packs, edibles, live rosin, concentrates, vapes, pre-rolls & gummies, shipped discreetly across the USA (with priority service to Kentucky, Michigan, Florida and Mississippi), Australia and worldwide.",
              sameAs: [settings.telegramChannel, settings.snapchatLink],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                email: "contact@realduckdistro.com",
                url: settings.telegramChannel,
                availableLanguage: "English",
              },
            }),
          }}
        />
        <Script
          id="schema-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              name: "Real Duck Distro",
              alternateName: ["Real Duck Distro USA", "Real Duck Distro Australia"],
              description:
                "The world's leading premium cannabis lifestyle brand. HQ in Los Angeles USA & Sydney Australia, with priority delivery across Kentucky, Michigan, Florida and Mississippi. Designer cannabis packs, exotic flower, edibles, concentrates, vapes, rosin, pre-rolls & disposables. Delivering across the USA, Australia & worldwide.",
              url: SITE_URL,
              logo: `${SITE_URL}/images/logo.jpg`,
              image: `${SITE_URL}/images/hero.webp?v=2`,
              address: [
                {
                  "@type": "PostalAddress",
                  addressLocality: "Los Angeles",
                  addressRegion: "CA",
                  postalCode: "90001",
                  addressCountry: "US",
                },
                {
                  "@type": "PostalAddress",
                  addressLocality: "Sydney",
                  addressRegion: "NSW",
                  postalCode: "2000",
                  addressCountry: "AU",
                },
              ],
              geo: [
                {
                  "@type": "GeoCoordinates",
                  latitude: 34.0522,
                  longitude: -118.2437,
                },
                {
                  "@type": "GeoCoordinates",
                  latitude: -33.8688,
                  longitude: 151.2093,
                },
              ],
              areaServed: [
                { "@type": "Country", name: "United States" },
                { "@type": "Country", name: "Australia" },
                { "@type": "State", name: "California" },
                { "@type": "State", name: "Kentucky" },
                { "@type": "State", name: "Michigan" },
                { "@type": "State", name: "Florida" },
                { "@type": "State", name: "Mississippi" },
                { "@type": "State", name: "New South Wales" },
                { "@type": "City", name: "Los Angeles" },
                { "@type": "City", name: "Sydney" },
              ],
              priceRange: "$$",
              currenciesAccepted: "USD, AUD",
              openingHoursSpecification: {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                opens: "09:00",
                closes: "23:00",
              },
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Real Duck Distro Product Catalog",
                itemListElement: [
                  { "@type": "OfferCatalog", name: "Exotic Flower" },
                  { "@type": "OfferCatalog", name: "Edibles" },
                  { "@type": "OfferCatalog", name: "Concentrates" },
                  { "@type": "OfferCatalog", name: "Vapes & Disposables" },
                  { "@type": "OfferCatalog", name: "Pre-Rolls" },
                  { "@type": "OfferCatalog", name: "Live Rosin" },
                  { "@type": "OfferCatalog", name: "Gummies" },
                  { "@type": "OfferCatalog", name: "Mushrooms" },
                ],
              },
              sameAs: [settings.telegramChannel, settings.snapchatLink],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                url: settings.telegramChannel,
                availableLanguage: "English",
              },
            }),
          }}
        />
        <Script
          id="schema-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Real Duck Distro",
              url: SITE_URL,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${SITE_URL}/?search={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className={`${dmSans.variable} font-sans antialiased`}>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
