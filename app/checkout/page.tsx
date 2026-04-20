"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Mail,
  Truck,
  ShoppingBag,
  CheckCircle,
  Loader2,
  Package,
  ChevronDown,
  Minus,
  Plus,
  Trash2,
  Shield,
  AlertCircle,
  Send,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { optimizeImage, blurUrl } from "@/lib/cloudinary";
import CloudImage from "../components/CloudImage";
import { formatPrice } from "@/lib/formatPrice";

/* ── Payment Methods ── */
const PAYMENT_METHODS = [
  { id: "zelle", label: "Zelle", logo: "/images/payments/zelle.svg", color: "border-purple-500 bg-purple-50", ring: "ring-purple-200" },
  { id: "cashapp", label: "Cash App", logo: "/images/payments/cashapp.svg", color: "border-green-500 bg-emerald-50", ring: "ring-emerald-200" },
  { id: "chime", label: "Chime", logo: "/images/payments/chime.jpg", color: "border-slate-500 bg-slate-50", ring: "ring-slate-200" },
  { id: "crypto", label: "Cryptocurrency", logo: "/images/payments/crypto.svg", color: "border-orange-500 bg-orange-50", ring: "ring-orange-200", discount: 10 },
];

/* ── Shipping Methods (only shown when delivery type = ship) ── */
const SHIPPING_METHODS = [
  { id: "ups", label: "UPS", logo: "/images/shipping/ups.svg", color: "border-amber-700 bg-amber-50", ring: "ring-amber-200" },
  { id: "usps", label: "USPS", logo: "/images/shipping/usps.svg", color: "border-blue-700 bg-blue-50", ring: "ring-blue-200" },
  { id: "fedex", label: "FedEx", logo: "/images/shipping/fedex.svg", color: "border-purple-700 bg-purple-50", ring: "ring-purple-200" },
];

const COUNTRY_STATES: Record<string, string[]> = {
  "United States": [
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
    "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
    "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
    "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
    "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
    "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
    "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
    "Wisconsin","Wyoming","District of Columbia",
  ],
  "Canada": [
    "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador",
    "Northwest Territories","Nova Scotia","Nunavut","Ontario","Prince Edward Island",
    "Quebec","Saskatchewan","Yukon",
  ],
  "United Kingdom": [
    "England","Scotland","Wales","Northern Ireland",
  ],
  "Australia": [
    "Australian Capital Territory","New South Wales","Northern Territory","Queensland",
    "South Australia","Tasmania","Victoria","Western Australia",
  ],
  "Germany": [
    "Baden-Württemberg","Bavaria","Berlin","Brandenburg","Bremen","Hamburg","Hesse",
    "Lower Saxony","Mecklenburg-Vorpommern","North Rhine-Westphalia","Rhineland-Palatinate",
    "Saarland","Saxony","Saxony-Anhalt","Schleswig-Holstein","Thuringia",
  ],
  "France": [
    "Auvergne-Rhône-Alpes","Bourgogne-Franche-Comté","Brittany","Centre-Val de Loire",
    "Corsica","Grand Est","Hauts-de-France","Île-de-France","Normandy",
    "Nouvelle-Aquitaine","Occitanie","Pays de la Loire","Provence-Alpes-Côte d'Azur",
  ],
  "Netherlands": [
    "Drenthe","Flevoland","Friesland","Gelderland","Groningen","Limburg",
    "North Brabant","North Holland","Overijssel","South Holland","Utrecht","Zeeland",
  ],
  "Spain": [
    "Andalusia","Aragon","Asturias","Balearic Islands","Basque Country","Canary Islands",
    "Cantabria","Castile and León","Castile-La Mancha","Catalonia","Extremadura",
    "Galicia","La Rioja","Madrid","Murcia","Navarre","Valencia",
  ],
  "Italy": [
    "Abruzzo","Aosta Valley","Apulia","Basilicata","Calabria","Campania",
    "Emilia-Romagna","Friuli Venezia Giulia","Lazio","Liguria","Lombardy","Marche",
    "Molise","Piedmont","Sardinia","Sicily","Trentino-South Tyrol","Tuscany",
    "Umbria","Veneto",
  ],
  "Other": [],
};

const COUNTRIES = Object.keys(COUNTRY_STATES);

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  telegramUsername: string;
  phone: string;
  country: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  paymentMethod: string;
  shippingMethod: string;
  deliveryNotes: string;
}

type FieldErrors = Partial<Record<keyof FormData, string>>;

const CRYPTO_DISCOUNT = 10;

export default function CheckoutPage() {
  const router = useRouter();
  const settings = useSettings();
  const { items, clearCart, removeItem, updateQuantity, isLowPriceItem, getMinQty, cartMeetsMinimum } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [deliveryType, setDeliveryType] = useState<"local" | "ship">("ship");
  const [isPwa, setIsPwa] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Detect whether the user has installed the PWA — either they are currently
  // browsing in standalone mode, or `PwaManager` flagged them previously.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const flagged = localStorage.getItem("nobu_pwa_discount") === "1";
    if (standalone || flagged) {
      setIsPwa(true);
      // Backfill the flag for standalone users that arrived without it set,
      // so the discount keeps applying if they later use a non-standalone tab.
      if (standalone && !flagged) localStorage.setItem("nobu_pwa_discount", "1");
    }
  }, []);
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    telegramUsername: "",
    phone: "",
    country: "United States",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    paymentMethod: "",
    shippingMethod: "",
    deliveryNotes: "",
  });

  const updateField = (field: keyof FormData, value: string) => {
    if (field === "country") {
      setForm((prev) => ({ ...prev, country: value, state: "", city: "" }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
    if (error) setError("");
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const statesForCountry = COUNTRY_STATES[form.country] || [];

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const getPrice = (item: typeof items[0]) => {
    const priceStr = deliveryType === "local" ? item.priceLocal : item.priceShip;
    return formatPrice(priceStr).split("\n")[0] || priceStr;
  };

  // Calculate numeric total from all items
  const calcSubtotal = (): number => {
    let total = 0;
    for (const item of items) {
      const priceStr = getPrice(item);
      const match = priceStr.match(/\$?([\d,]+(?:\.\d+)?)/);
      if (match) {
        total += parseFloat(match[1].replace(",", "")) * item.quantity;
      }
    }
    return total;
  };

  const subtotal = calcSubtotal();
  const isCrypto = form.paymentMethod === "crypto";
  // PWA-install and crypto each give 10%. They stack (additive), so a user
  // who has installed the app AND pays in crypto gets 20% off.
  const pwaDiscountAmount = isPwa ? subtotal * 0.1 : 0;
  const cryptoDiscountAmount = isCrypto ? subtotal * (CRYPTO_DISCOUNT / 100) : 0;
  const discountAmount = pwaDiscountAmount + cryptoDiscountAmount;
  const hasDiscount = discountAmount > 0;
  const finalTotal = subtotal - discountAmount;
  const hasNumericPrice = subtotal > 0;

  const inputCls = (field: keyof FormData) =>
    `w-full px-3.5 py-3 bg-gray-50/80 border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all duration-200 ${
      fieldErrors[field] ? "border-red-400 bg-red-50/50 ring-1 ring-red-200" : "border-gray-200"
    }`;

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!form.firstName.trim()) errors.firstName = "First name is required";
    if (!form.lastName.trim()) errors.lastName = "Last name is required";
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Invalid email address";
    if (!form.phone.trim()) errors.phone = "Phone number is required";
    else if (form.phone.replace(/\D/g, "").length < 7) errors.phone = "Enter a valid phone number";
    if (!form.country) errors.country = "Select a country";
    if (!form.address.trim()) errors.address = "Street address is required";
    if (!form.city.trim()) errors.city = "City is required";
    if (statesForCountry.length > 0 && !form.state) errors.state = "Select a state/region";
    if (!form.zipCode.trim()) errors.zipCode = "ZIP / Postal code is required";
    if (!form.paymentMethod) errors.paymentMethod = "Select a payment method";
    if (deliveryType === "ship" && !form.shippingMethod) errors.shippingMethod = "Select a shipping carrier";

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      setError(Object.values(errors)[0]);
      // Scroll to the first error field
      const el = formRef.current?.querySelector(`[data-field="${firstErrorField}"]`) as HTMLElement;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const input = el.querySelector("input, select, textarea") as HTMLElement;
        if (input) setTimeout(() => input.focus(), 400);
      }
      return false;
    }

    if (items.length === 0) {
      setError("Your cart is empty");
      return false;
    }

    if (!cartMeetsMinimum) {
      setError("Items under $30 require a minimum order of 5 units, unless your cart total exceeds $300");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const sessionId = sessionStorage.getItem("analytics_session_id") || "";
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          shippingMethod: deliveryType === "ship" ? form.shippingMethod : "",
          isPwa,
          sessionId,
          items: items.map((item) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            imageUrl: item.imageUrl,
            price: getPrice(item),
            quantity: item.quantity,
            deliveryType,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");
      setOrderSuccess(data.orderNumber);
      if (data.emailWarning) setEmailWarning(data.emailWarning);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  /* ── Success Screen ── */
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 sm:p-8 text-center border border-green-100 animate-[fadeInUp_0.5s_ease-out]">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-30" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Order Placed!</h1>
          <p className="text-sm text-gray-500 mb-5">Your order has been received successfully</p>
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl px-5 py-4 mb-5 shadow-lg">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1.5">Order Number</p>
            <p className="text-xl font-mono font-bold text-white tracking-wide">{orderSuccess}</p>
          </div>
          {emailWarning && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed">{emailWarning}</p>
            </div>
          )}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-left">
            <p className="text-xs text-gray-600 leading-relaxed">
              Our team will process your order and contact you through the email or Telegram you provided. Please check it shortly.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 mb-5 text-left">
            <p className="text-xs text-amber-800 leading-relaxed">
              If it takes more than 5 minutes, reach out to us directly:
            </p>
          </div>
          <div className="space-y-2.5 mb-5">
            <a
              href={settings.telegramOrder}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#29B6F6]/10 text-[#0288D1] rounded-xl text-sm font-medium hover:bg-[#29B6F6]/20 transition-colors"
            >
              <Send className="w-4 h-4" />
              Message us on Telegram
            </a>
            <a
              href={`mailto:${settings.companyEmail}`}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              <Mail className="w-4 h-4" />
              {settings.companyEmail}
            </a>
          </div>
          <button
            onClick={() => router.push("/orders")}
            className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3.5 rounded-xl font-semibold hover:from-slate-800 hover:to-slate-700 transition-all text-sm shadow-lg shadow-slate-900/20 active:scale-[0.98] mb-2.5"
          >
            <Package className="w-4 h-4 inline mr-2" />
            Track Your Order
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all text-sm"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  /* ── Empty Cart ── */
  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 sm:p-8 text-center animate-[fadeInUp_0.4s_ease-out]">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">Your cart is empty</h1>
          <p className="text-sm text-gray-500 mb-6">Add some products before checking out.</p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition-all text-sm active:scale-[0.98]"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  /* ── Main Checkout ── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .checkout-section { animation: slideIn 0.35s ease-out both; }
        .checkout-section:nth-child(1) { animation-delay: 0s; }
        .checkout-section:nth-child(2) { animation-delay: 0.06s; }
        .checkout-section:nth-child(3) { animation-delay: 0.12s; }
        .checkout-section:nth-child(4) { animation-delay: 0.18s; }
        .checkout-section:nth-child(5) { animation-delay: 0.24s; }
        .checkout-section:nth-child(6) { animation-delay: 0.3s; }
        .checkout-section:nth-child(7) { animation-delay: 0.36s; }
        .checkout-section:nth-child(8) { animation-delay: 0.42s; }
        .checkout-section:nth-child(9) { animation-delay: 0.48s; }
      `}</style>

      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-all duration-200 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900">Checkout</h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-full text-xs font-medium">
            <ShoppingBag className="w-3 h-3" />
            {totalItems}
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-5 sm:py-6 space-y-3.5 sm:space-y-4 pb-10">

        {/* ── Order Items ── */}
        <details className="checkout-section bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden group" open>
          <summary className="flex items-center gap-2.5 px-4 sm:px-5 py-4 cursor-pointer select-none hover:bg-gray-50/50 transition-colors duration-200">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-sm">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 flex-1">Your Items</span>
            <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-[11px] font-semibold text-gray-600 mr-1">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-300 group-open:rotate-180" />
          </summary>

          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100">
            {/* Delivery Toggle */}
            <div className="flex bg-gray-100/80 rounded-xl p-1 mt-4 mb-4">
              <button
                type="button"
                onClick={() => setDeliveryType("local")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                  deliveryType === "local"
                    ? "bg-white text-green-700 shadow-md shadow-green-100"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <MapPin className={`w-4 h-4 transition-transform duration-300 ${deliveryType === "local" ? "scale-110" : ""}`} />
                Local Pickup
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType("ship")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                  deliveryType === "ship"
                    ? "bg-white text-blue-700 shadow-md shadow-blue-100"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Truck className={`w-4 h-4 transition-transform duration-300 ${deliveryType === "ship" ? "scale-110" : ""}`} />
                Shipped
              </button>
            </div>

            {/* Items list */}
            <div className="space-y-1">
              {items.map((item, idx) => (
                <div
                  key={`${item.id}-${item.priceType}`}
                  className="flex items-center gap-3 py-3 px-1 rounded-xl hover:bg-gray-50/80 transition-all duration-200 group/item"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm ring-1 ring-gray-200/50">
                    <CloudImage src={optimizeImage(item.imageUrl, "thumbnail")} alt={`${item.title} - Real Duck Distro order`} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{item.category}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                      <button type="button" onClick={() => updateQuantity(item.id, item.priceType, item.quantity - 1)}
                        disabled={isLowPriceItem(item) && item.quantity <= getMinQty(item)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-gray-600 transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-6 text-center text-gray-900">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.priceType, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-gray-600 transition-all duration-200 active:scale-90">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {isLowPriceItem(item) && getMinQty(item) > 1 && (
                      <p className="text-[9px] text-amber-600 mt-0.5 text-center">Min: {getMinQty(item)}</p>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 w-16 sm:w-20 text-right flex-shrink-0">{getPrice(item)}</p>
                  <button type="button" onClick={() => removeItem(item.id, item.priceType)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover/item:opacity-100 focus:opacity-100 flex-shrink-0 active:scale-90">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* ── Two-column: Contact + Address ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">

          {/* Contact Information */}
          <div className="checkout-section bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 sm:p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <Mail className="w-4 h-4 text-white" />
              </div>
              Contact Info
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div data-field="firstName">
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    placeholder="First Name *"
                    className={inputCls("firstName")}
                  />
                  {fieldErrors.firstName && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" />{fieldErrors.firstName}</p>}
                </div>
                <div data-field="lastName">
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    placeholder="Last Name *"
                    className={inputCls("lastName")}
                  />
                  {fieldErrors.lastName && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" />{fieldErrors.lastName}</p>}
                </div>
              </div>
              <div data-field="email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="Email Address *"
                  className={inputCls("email")}
                />
                {fieldErrors.email && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" />{fieldErrors.email}</p>}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <input
                  type="text"
                  value={form.telegramUsername}
                  onChange={(e) => updateField("telegramUsername", e.target.value)}
                  placeholder="Telegram Username (optional)"
                  className={`${inputCls("telegramUsername")} pl-8`}
                />
              </div>
              <div data-field="phone">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="Phone Number *"
                  className={inputCls("phone")}
                />
                {fieldErrors.phone && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" />{fieldErrors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="checkout-section bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 sm:p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-sm">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              Delivery Address
            </h2>
            <div className="space-y-3">
              <div data-field="country">
                <select
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  className={`${inputCls("country")} ${!form.country ? "text-gray-400" : ""}`}
                >
                  <option value="">Country *</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {fieldErrors.country && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" />{fieldErrors.country}</p>}
              </div>
              <div data-field="address">
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Street Address *"
                  className={inputCls("address")}
                />
                {fieldErrors.address && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" />{fieldErrors.address}</p>}
              </div>
              <input
                type="text"
                value={form.apartment}
                onChange={(e) => updateField("apartment", e.target.value)}
                placeholder="Apt / Suite (optional)"
                className={inputCls("apartment")}
              />
              <div className="grid grid-cols-3 gap-2">
                <div data-field="city">
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="City *"
                    className={inputCls("city")}
                  />
                  {fieldErrors.city && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" />{fieldErrors.city}</p>}
                </div>
                <div data-field="state">
                  {statesForCountry.length > 0 ? (
                    <select
                      value={form.state}
                      onChange={(e) => updateField("state", e.target.value)}
                      className={`${inputCls("state")} ${!form.state ? "text-gray-400" : ""}`}
                    >
                      <option value="">State/Region *</option>
                      {statesForCountry.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => updateField("state", e.target.value)}
                      placeholder="State/Region"
                      className={inputCls("state")}
                    />
                  )}
                  {fieldErrors.state && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" />{fieldErrors.state}</p>}
                </div>
                <div data-field="zipCode">
                  <input
                    type="text"
                    value={form.zipCode}
                    onChange={(e) => updateField("zipCode", e.target.value)}
                    placeholder="ZIP / Postal *"
                    className={inputCls("zipCode")}
                  />
                  {fieldErrors.zipCode && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" />{fieldErrors.zipCode}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Payment Method ── */}
        <div className="checkout-section bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 sm:p-5" data-field="paymentMethod">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            Payment Method
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {PAYMENT_METHODS.map((method) => {
              const isSelected = form.paymentMethod === method.id;
              const hasDiscount = "discount" in method && (method as { discount?: number }).discount;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => updateField("paymentMethod", method.id)}
                  className={`relative flex flex-col items-center gap-2.5 p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 ${
                    isSelected
                      ? `${method.color} shadow-md ${method.ring} ring-2 scale-[1.02]`
                      : fieldErrors.paymentMethod
                        ? "border-red-200 bg-red-50/20 hover:border-red-300"
                        : "border-gray-100 bg-gray-50/30 hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center shadow-sm animate-[fadeInUp_0.2s_ease-out]">
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  {hasDiscount && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full shadow-md whitespace-nowrap">
                      {(method as { discount?: number }).discount}% OFF
                    </div>
                  )}
                  <img src={method.logo} alt={`${method.label} payment logo`} title={method.label} loading="lazy" className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-contain transition-transform duration-300 hover:scale-105" />
                  <span className={`text-[11px] sm:text-xs font-semibold text-center leading-tight transition-colors duration-200 ${
                    isSelected ? "text-gray-900" : "text-gray-500"
                  }`}>
                    {method.label}
                  </span>
                </button>
              );
            })}
          </div>
          {fieldErrors.paymentMethod && <p className="text-[10px] text-red-500 mt-2 text-center flex items-center justify-center gap-0.5"><AlertCircle className="w-3 h-3" />{fieldErrors.paymentMethod}</p>}
        </div>

        {/* ── Shipping Method (shipped orders only) ── */}
        {deliveryType === "ship" && (
          <div className="checkout-section bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 sm:p-5" data-field="shippingMethod">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm">
                <Truck className="w-4 h-4 text-white" />
              </div>
              Shipping Method
            </h2>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {SHIPPING_METHODS.map((method) => {
                const isSelected = form.shippingMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => updateField("shippingMethod", method.id)}
                    className={`relative flex flex-col items-center justify-center gap-2.5 p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 ${
                      isSelected
                        ? `${method.color} shadow-md ${method.ring} ring-2 scale-[1.02]`
                        : fieldErrors.shippingMethod
                          ? "border-red-200 bg-red-50/20 hover:border-red-300"
                          : "border-gray-100 bg-gray-50/30 hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center shadow-sm animate-[fadeInUp_0.2s_ease-out]">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <img
                      src={method.logo}
                      alt={`${method.label} shipping logo`}
                      title={method.label}
                      loading="lazy"
                      className="h-8 sm:h-10 w-auto max-w-[85%] object-contain transition-transform duration-300 hover:scale-105"
                    />
                    <span className={`text-[11px] sm:text-xs font-semibold text-center leading-tight transition-colors duration-200 ${
                      isSelected ? "text-gray-900" : "text-gray-500"
                    }`}>
                      {method.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {fieldErrors.shippingMethod && <p className="text-[10px] text-red-500 mt-2 text-center flex items-center justify-center gap-0.5"><AlertCircle className="w-3 h-3" />{fieldErrors.shippingMethod}</p>}
            <p className="mt-3 text-[11px] text-gray-400 text-center">Final shipping cost confirmed when we send payment details.</p>
          </div>
        )}

        {/* ── Order Total ── */}
        <div className="checkout-section bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 sm:p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            Order Total
          </h2>
          <div className="space-y-2.5">
            {/* Item breakdown */}
            {items.map((item) => {
              const price = getPrice(item);
              return (
                <div key={`${item.id}-${item.priceType}-total`} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 truncate flex-1 mr-2">
                    {item.title} <span className="text-gray-400">x{item.quantity}</span>
                  </span>
                  <span className="font-medium text-gray-900 flex-shrink-0">{price}</span>
                </div>
              );
            })}

            <div className="border-t border-gray-100 pt-2.5 mt-2.5">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                <span className="font-semibold text-gray-900">
                  {hasNumericPrice ? fmt(subtotal) : "TBD"}
                </span>
              </div>

              {/* PWA App Discount */}
              {isPwa && hasNumericPrice && (
                <div className="flex items-center justify-between text-sm mt-2 animate-[fadeInUp_0.25s_ease-out]">
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <span className="inline-block w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded text-[8px] text-white font-black flex items-center justify-center leading-none">%</span>
                    PWA App Discount (10%)
                  </span>
                  <span className="font-semibold text-emerald-600">-{fmt(pwaDiscountAmount)}</span>
                </div>
              )}

              {/* Crypto Discount */}
              {isCrypto && hasNumericPrice && (
                <div className="flex items-center justify-between text-sm mt-2 animate-[fadeInUp_0.25s_ease-out]">
                  <span className="text-orange-600 font-medium flex items-center gap-1">
                    <span className="inline-block w-4 h-4 bg-gradient-to-br from-orange-400 to-amber-500 rounded text-[8px] text-white font-black flex items-center justify-center leading-none">%</span>
                    Crypto Discount (10%)
                  </span>
                  <span className="font-semibold text-orange-600">-{fmt(cryptoDiscountAmount)}</span>
                </div>
              )}

              {/* Final Total */}
              <div className={`flex items-center justify-between mt-3 pt-3 border-t ${hasDiscount ? "border-emerald-200" : "border-gray-200"}`}>
                <span className="text-base font-bold text-gray-900">Total</span>
                <div className="text-right">
                  {hasDiscount && hasNumericPrice && (
                    <span className="text-xs text-gray-400 line-through mr-2">{fmt(subtotal)}</span>
                  )}
                  <span className={`text-xl font-black ${hasDiscount ? "text-emerald-600" : "text-slate-900"}`}>
                    {hasNumericPrice ? fmt(finalTotal) : "TBD"}
                  </span>
                </div>
              </div>

              {hasDiscount && hasNumericPrice && (
                <div className="mt-2 flex items-center gap-1.5 justify-end animate-[fadeInUp_0.2s_ease-out]">
                  <span className="px-2 py-0.5 text-white text-[10px] font-bold rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600">
                    You save {fmt(discountAmount)}{isPwa && isCrypto ? " (PWA + Crypto)" : ""}!
                  </span>
                </div>
              )}

              {!hasNumericPrice && (
                <p className="text-[10px] text-gray-400 mt-2">Final price will be confirmed when we send payment details.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Delivery Notes ── */}
        <div className="checkout-section bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 sm:p-5">
          <textarea
            value={form.deliveryNotes}
            onChange={(e) => updateField("deliveryNotes", e.target.value)}
            placeholder="Delivery notes (optional) — gate code, special instructions, etc."
            rows={2}
            className={`${inputCls("deliveryNotes")} resize-none`}
          />
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="checkout-section p-3.5 bg-red-50 border border-red-200 rounded-2xl animate-[fadeInUp_0.2s_ease-out] flex items-center gap-2.5 justify-center">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="checkout-section w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed text-white py-4 sm:py-[18px] rounded-2xl font-bold text-sm transition-all duration-300 shadow-xl shadow-slate-900/15 active:scale-[0.98] active:shadow-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Order...
            </>
          ) : (
            <>
              <Truck className="w-5 h-5" />
              Place Order {hasNumericPrice ? `· ${fmt(finalTotal)}` : ""}
            </>
          )}
        </button>

        <p className="text-[10px] text-gray-400 text-center pb-4">
          By placing this order, you agree to our terms of service. Final pricing confirmed via email.
        </p>

        {/* SEO Content Block (hidden for accessibility) */}
        <section className="sr-only" aria-label="About Real Duck Distro Checkout">
          <h2>The Best Premium Cannabis Lifestyle Store Online</h2>
          <p>
            Real Duck Distro is the world&apos;s leading premium cannabis lifestyle store online — headquartered in Los Angeles, USA and Sydney, Australia. We deliver across the entire USA and Australia with fast, secure, discreet worldwide shipping. Designer cannabis packs, luxury cannabis packaging and premium cannabis products. Complete your order now.
          </p>
          <img src="/images/hero.webp" alt="Real Duck Distro — Premium Cannabis Store | HQ in LA USA & Sydney Australia | Worldwide Shipping" />
        </section>
      </form>
    </div>
  );
}
