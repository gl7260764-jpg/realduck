import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, FlaskConical, Truck, Wallet, ArrowRight } from "lucide-react";

// Compact, conversion-first hero + trust strip that sits above the catalog.
// Server component (no client JS) with the local hero as a priority LCP image.
// Trust points are the real buying signals a first-time, pay-first buyer needs
// before they'll add to cart.
const TRUST = [
  { icon: ShieldCheck, label: "Discreet, vacuum-sealed packaging" },
  { icon: FlaskConical, label: "Lab-tested · COA on request" },
  { icon: Truck, label: "Nationwide 1–3 day shipping" },
  { icon: Wallet, label: "Zelle · Cash App · Chime · Crypto" },
];

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-slate-900">
      {/* Background image + gradient wash for legibility */}
      <div className="absolute inset-0" aria-hidden>
        <Image
          src="/images/hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900/70" />
      </div>

      {/* Copy */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-11 sm:py-14 lg:py-20">
        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
          Premium cannabis · shipped discreetly across the USA
        </span>
        <h1 className="mt-4 max-w-3xl text-[26px] leading-[1.12] sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
          Exotic, top-shelf cannabis — delivered to your door, discreetly.
        </h1>
        <p className="mt-3.5 max-w-xl text-sm sm:text-base leading-relaxed text-white/60">
          Designer flower, edibles, concentrates, vapes &amp; more — lab-tested, vacuum-sealed and shipped nationwide in 1–3 days. Priority delivery to Kentucky, Michigan, Florida &amp; Mississippi.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="#catalog"
            className="group inline-flex items-center gap-2 rounded-full bg-white pl-6 pr-2 py-2 text-sm font-semibold text-slate-900 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
          >
            Shop the collection
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/10 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          <Link
            href="/faq"
            className="inline-flex items-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/80 hover:bg-white/5 transition-colors duration-300"
          >
            How ordering works
          </Link>
        </div>
      </div>

      {/* Trust strip — hairline dividers via 1px grid gap over a light bg */}
      <div className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
          {TRUST.map((t) => (
            <div
              key={t.label}
              className="flex items-center justify-center gap-2 bg-slate-900 px-3 py-3.5 text-center"
            >
              <t.icon className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="text-[11px] sm:text-xs font-medium leading-tight text-white/75">
                {t.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
