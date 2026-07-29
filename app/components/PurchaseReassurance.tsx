import { Lock } from "lucide-react";

// Small trust line shown at the point of purchase (buy modals + cart). Directly
// answers the pay-first buyer's #1 fear: "am I about to get charged / scammed?"
export default function PurchaseReassurance() {
  return (
    <div className="mb-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 text-left">
      <div className="flex items-start gap-2">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <p className="text-[11px] leading-relaxed text-emerald-900">
          <span className="font-semibold">Nothing is charged now.</span> We&apos;ll message you within ~10 min with payment details (Zelle · Cash App · Chime · Crypto). Discreet, vacuum-sealed shipping — lab-tested, COA on request.
        </p>
      </div>
    </div>
  );
}
