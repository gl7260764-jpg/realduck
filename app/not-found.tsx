import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import NotFoundContact from "./components/NotFoundContact";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist. Browse our premium product catalog at Real Duck Distro.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-7xl font-bold text-slate-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Page Not Found</h2>
        <p className="text-gray-500 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Check out our latest products instead.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            Browse Products
          </Link>
          <NotFoundContact />
        </div>
      </div>

      {/* SEO Content Block (hidden) */}
      <section className="sr-only" aria-label="About Real Duck Distro">
        <h2>The Best Luxury Cannabis Lifestyle Brand Worldwide</h2>
        <p>
          Real Duck Distro is the world&apos;s leading premium cannabis lifestyle brand — headquartered in Los Angeles, USA and Sydney, Australia, with priority delivery to Kentucky, Michigan, Florida and Mississippi. We deliver across the entire USA and Australia with fast, discreet worldwide shipping. Premium designer cannabis packs, exotic top-shelf flower, lab-tested edibles, concentrates, vapes, rosin and more. Visit our homepage to browse the full collection.
        </p>
        <Image src="/images/hero.webp" alt="Real Duck Distro — Premium Cannabis Lifestyle Brand | HQ in LA USA & Sydney Australia | Priority Delivery KY · MI · FL · MS | Worldwide Shipping" width={800} height={450} />
      </section>
    </div>
  );
}
