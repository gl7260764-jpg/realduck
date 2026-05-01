"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface State {
  enabled: boolean;
  soldOutCount: number;
  minOrderCount: number;
}

export default function FlowerDescriptionToggle() {
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/products/flower-descriptions")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setState(data);
      })
      .catch((e) => setError(String(e)));
  }, []);

  async function toggle() {
    if (!state || loading) return;
    setLoading(true);
    setError(null);
    const next = !state.enabled;
    try {
      const res = await fetch("/api/admin/products/flower-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: next ? "apply" : "revert" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Update failed");
      } else {
        setState({
          enabled: next,
          soldOutCount: data.soldOutCount,
          minOrderCount: data.minOrderCount,
        });
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  if (!state) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading flower description toggle…</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">
            Flower price-range descriptions
          </h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Auto-applies a red note under the price on FLOWER products based on
            <span className="font-medium"> shipping price</span>:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-gray-600">
            <li>
              <span className="font-medium">$300 – $499</span> →{" "}
              <span className="text-red-600 font-semibold">Sold Out</span>{" "}
              <span className="text-gray-400">({state.soldOutCount} products)</span>
            </li>
            <li>
              <span className="font-medium">$500 – $800</span> →{" "}
              <span className="text-red-600 font-semibold">Minimum order is 2 Pounds</span>{" "}
              <span className="text-gray-400">({state.minOrderCount} products)</span>
            </li>
          </ul>
          {error && (
            <p className="mt-2 text-xs text-red-600">Error: {error}</p>
          )}
        </div>

        <button
          type="button"
          onClick={toggle}
          disabled={loading}
          aria-pressed={state.enabled}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${
            state.enabled ? "bg-slate-900" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
              state.enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
          {loading && (
            <Loader2 className="absolute -right-6 w-4 h-4 animate-spin text-gray-500" />
          )}
        </button>
      </div>
    </div>
  );
}
