import { ShoppingBag, MessageCircle, Truck } from "lucide-react";

// "How ordering works" explainer. For a pay-first brand, spelling out the flow
// (nothing charged up front → we message you → discreet shipping) is the biggest
// trust/scam-fear reducer. All copy reflects the real order flow — no invented
// guarantees.
const STEPS = [
  {
    icon: ShoppingBag,
    title: "1 · Place your order",
    body: "Pick Express (just email & phone) or Full Checkout. Nothing is charged when you order.",
  },
  {
    icon: MessageCircle,
    title: "2 · We message you",
    body: "Within ~10 minutes we send payment details — Zelle, Cash App, Chime or Crypto. Pay in crypto for 10% off.",
  },
  {
    icon: Truck,
    title: "3 · Discreet delivery",
    body: "Vacuum-sealed, plain-labelled and tracked — 1–3 day US shipping, priority to KY · MI · FL · MS.",
  },
];

export default function HowItWorks() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="mb-8 text-center">
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          How ordering works
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Simple, discreet, and nothing charged up front
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {STEPS.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_8px_24px_rgba(15,23,42,0.05)]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900">
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        Lab-tested products · Certificates of Analysis (COA) on request · Secure, discreet packaging on every order.
      </p>
    </section>
  );
}
