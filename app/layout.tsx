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
    default: "Real Duck Distro | Premium Cannabis Lifestyle Brand | USA & AUS | Ships Worldwide",
    template: "%s | Real Duck Distro",
  },
  description:
    "Real Duck Distro is the world's leading premium cannabis lifestyle brand. Designer cannabis packs, exotic top-shelf flower, lab-tested edibles, concentrates, vapes, rosin, pre-rolls & disposables. HQ in Los Angeles USA & Sydney Australia. Fast, discreet shipping across the USA, Australia & worldwide.",
  authors: [{ name: "Real Duck Distro" }],
  creator: "Real Duck Distro",
  publisher: "Real Duck Distro",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/icon-192.png",
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
    title: "Real Duck Distro | Premium Cannabis Lifestyle Brand | USA & AUS | Ships Worldwide",
    description:
      "Real Duck Distro — the world's leading premium cannabis lifestyle brand. HQ in LA, USA & Sydney, Australia. Delivering across the USA, Australia & worldwide.",
    images: [
      {
        url: "/images/hero.webp?v=2",
        width: 1200,
        height: 630,
        alt: "Real Duck Distro product catalog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Real Duck Distro | Premium Cannabis Lifestyle Brand | USA & AUS | Ships Worldwide",
    description:
      "Real Duck Distro — the world's leading premium cannabis lifestyle brand. HQ in LA, USA & Sydney, Australia. Delivering across the USA, Australia & worldwide.",
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
    google: "mkcv_izZVyDLtoaUIC1aAtiXpTU5s1OpwI1DZEXQGOs",
  },
  other: {
    "ahrefs-site-verification": "4c17bfb4bbf0edc9aef3014dcb1c12cd5fb812c12903fe4b82822381d6248fae",
    "msvalidate.01": "A8C9495020F192A25CD68B7F02D73D38",
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
          id="schema-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              name: "Real Duck Distro",
              alternateName: ["Real Duck Distro USA", "Real Duck Distro Australia"],
              description:
                "The world's leading premium cannabis lifestyle brand. HQ in Los Angeles USA & Sydney Australia. Designer cannabis packs, exotic flower, edibles, concentrates, vapes, rosin, pre-rolls & disposables. Delivering across the USA, Australia & worldwide.",
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
