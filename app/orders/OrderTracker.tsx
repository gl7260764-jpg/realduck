"use client";

import { useState } from "react";
import { Search, Package, Clock, CheckCircle, Truck, MapPin, Loader2, AlertCircle, ShoppingBag } from "lucide-react";

interface OrderItem {
  title: string;
  quantity: number;
  price: string;
  imageUrl?: string;
}

interface OrderData {
  orderNumber: string;
  firstName: string;
  status: string;
  paymentMethod: string;
  totalItems: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  city: string;
  state: string;
  country: string;
}

const STATUS_STEPS = [
  { key: "pending", label: "Order Received", icon: Clock, description: "We received your order and are reviewing it" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle, description: "Payment verified, preparing your order" },
  { key: "shipped", label: "Shipped", icon: Truck, description: "Your order is on its way" },
  { key: "delivered", label: "Delivered", icon: MapPin, description: "Order has been delivered" },
];

function getPaymentLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: "Cash on Delivery",
    zelle: "Zelle",
    cashapp: "Cash App",
    chime: "Chime",
    crypto: "Cryptocurrency",
  };
  return labels[method] || method;
}

export default function OrderTracker() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);

    if (!orderNumber.trim() || !email.trim()) {
      setError("Please enter both your order number and email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/orders/lookup?order=${encodeURIComponent(orderNumber.trim())}&email=${encodeURIComponent(email.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Order not found.");
        return;
      }
      setOrder(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order?.status);

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package className="w-7 h-7 text-slate-700" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>
        <p className="text-sm text-gray-500 mt-2">
          Enter your order number and the email you used at checkout.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="space-y-3 mb-8">
        <div>
          <input
            type="text"
            placeholder="Order number (e.g. NP-XXXX)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-slate-900 focus:outline-none transition-all placeholder:text-gray-400 font-mono"
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-slate-900 focus:outline-none transition-all placeholder:text-gray-400"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {loading ? "Looking up..." : "Track Order"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Order Result */}
      {order && (
        <div className="animate-[fadeIn_0.3s_ease-out]">
          {/* Order header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 mb-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Order Number</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <p className="text-xl font-mono font-bold tracking-wide">{order.orderNumber}</p>
            <p className="text-sm text-slate-300 mt-1">
              Hi {order.firstName}, here is your order status.
            </p>
          </div>

          {/* Status Timeline */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
            <h2 className="text-sm font-bold text-gray-900 mb-5">Order Status</h2>
            <div className="space-y-0">
              {STATUS_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isComplete = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const isLast = i === STATUS_STEPS.length - 1;

                return (
                  <div key={step.key} className="flex gap-3">
                    {/* Dot + Line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          isCurrent
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                            : isComplete
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 h-8 ${
                            isComplete && i < currentStepIndex ? "bg-green-500" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                    {/* Label */}
                    <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                      <p
                        className={`text-sm font-semibold ${
                          isCurrent ? "text-slate-900" : isComplete ? "text-green-700" : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      {(isCurrent || isComplete) && (
                        <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Order Details</h2>
            <div className="space-y-3">
              {(order.items as OrderItem[]).map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 flex-shrink-0">{item.price}</p>
                </div>
              ))}
            </div>

            <div className="h-px bg-gray-100 my-4" />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-500">Payment</p>
                <p className="font-medium text-gray-900 mt-0.5">{getPaymentLabel(order.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-gray-500">Items</p>
                <p className="font-medium text-gray-900 mt-0.5">{order.totalItems} item{order.totalItems !== 1 ? "s" : ""}</p>
              </div>
              <div>
                <p className="text-gray-500">Shipping to</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {order.city}, {order.state}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Last updated</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {new Date(order.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
