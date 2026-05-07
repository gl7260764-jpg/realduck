"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X, Pencil } from "lucide-react";
import FileUpload from "../../components/FileUpload";

// Apply a numeric transform to each line of a multi-line price string.
// Preserves the "$" prefix and any text after the number ("/HP", "/P", etc.).
function transformPriceLines(price: string, fn: (n: number) => number): string {
  if (!price) return "";
  return price
    .split("\n")
    .map((line) => {
      const m = line.match(/^(\s*\$?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
      if (!m) return line;
      const prefix = m[1];
      const num = parseFloat(m[2].replace(/,/g, ""));
      const suffix = m[3];
      if (!Number.isFinite(num)) return line;
      return `${prefix}${Math.round(fn(num))}${suffix}`;
    })
    .join("\n");
}

// Auto-calculation rules:
//   • FLOWER:     ship = local + $100
//   • Non-flower: ship = local × 1.10  (+10%)
//   • Slashed = active × 1.30 for both local and ship.
function autoCalcPrices(priceLocal: string, category: string) {
  const priceShip =
    category === "FLOWER"
      ? transformPriceLines(priceLocal, (n) => n + 100)
      : transformPriceLines(priceLocal, (n) => n * 1.1);
  const slashedPriceLocal = transformPriceLines(priceLocal, (n) => n * 1.3);
  const slashedPriceShip = transformPriceLines(priceShip, (n) => n * 1.3);
  return { priceShip, slashedPriceLocal, slashedPriceShip };
}

const CATEGORIES = [
  { value: "FLOWER", label: "Flower" },
  { value: "TOP_SHELF", label: "Top Shelf" },
  { value: "EDIBLES", label: "Edibles" },
  { value: "CONCENTRATES", label: "Concentrates" },
  { value: "PREROLLS", label: "Prerolls" },
  { value: "MUSHROOM", label: "Mushroom" },
  { value: "DISPOSABLES", label: "Disposables" },
  { value: "PILLS", label: "Pills" },
  { value: "COKE", label: "Coke" },
  { value: "OTHERS", label: "Others" },
];

interface Product {
  id: string;
  title: string;
  description: string | null;
  category: string;
  indoor: boolean;
  rating: string;
  priceLocal: string;
  priceShip: string;
  slashedPriceLocal?: string | null;
  slashedPriceShip?: string | null;
  isSoldOut: boolean;
  imageUrl: string;
  images?: string[];
  videoUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogImage?: string | null;
}

interface ProductFormProps {
  product?: Product;
  isEditing?: boolean;
}

export default function ProductForm({ product, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Default to auto-calc on new products. For edits, switch on if existing
  // priceShip / slashed values don't match what auto-calc would produce — so
  // we don't silently overwrite a custom price.
  const [manualPricing, setManualPricing] = useState(() => {
    if (!isEditing || !product) return false;
    const { priceShip, slashedPriceLocal, slashedPriceShip } = autoCalcPrices(
      product.priceLocal,
      product.category,
    );
    return (
      (product.priceShip || "") !== priceShip ||
      (product.slashedPriceLocal || "") !== slashedPriceLocal ||
      (product.slashedPriceShip || "") !== slashedPriceShip
    );
  });

  const [formData, setFormData] = useState({
    title: product?.title || "",
    description: product?.description || "",
    category: product?.category || "FLOWER",
    indoor: product?.indoor ?? true,
    rating: product?.rating || "10/10",
    priceLocal: product?.priceLocal || "",
    priceShip: product?.priceShip || "",
    slashedPriceLocal: product?.slashedPriceLocal || "",
    slashedPriceShip: product?.slashedPriceShip || "",
    isSoldOut: product?.isSoldOut ?? false,
    imageUrl: product?.imageUrl || "",
    images: product?.images || [] as string[],
    videoUrl: product?.videoUrl || "",
    metaTitle: product?.metaTitle || "",
    metaDescription: product?.metaDescription || "",
    metaKeywords: product?.metaKeywords || "",
    ogImage: product?.ogImage || "",
  });

  const [seoOpen, setSeoOpen] = useState(false);

  const addAdditionalImage = (url: string) => {
    setFormData((prev) => ({ ...prev, images: [...prev.images, url] }));
  };

  const removeAdditionalImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/admin/products/${product?.id}`
        : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";

      // When auto-calc is on, derive priceShip and slashed prices from
      // priceLocal at submit time so the saved data is always consistent.
      const payload = manualPricing
        ? formData
        : { ...formData, ...autoCalcPrices(formData.priceLocal, formData.category) };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save product");
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {isEditing ? "Edit Product" : "Add Product"}
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">
              {isEditing ? "Update product info" : "Create new listing"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 pl-10 sm:pl-0">
          <Link
            href="/admin/products"
            className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors"
                    placeholder="Product title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full h-9 px-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors bg-white"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Rating
                    </label>
                    <input
                      type="text"
                      name="rating"
                      value={formData.rating}
                      onChange={handleChange}
                      className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors"
                      placeholder="10/10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors resize-none"
                  placeholder="Product description"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-900">Pricing</h2>
              <button
                type="button"
                onClick={() => setManualPricing((v) => !v)}
                className="text-[11px] text-slate-600 hover:text-slate-900 underline underline-offset-2 inline-flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" />
                {manualPricing ? "Use auto-calculated prices" : "Customise prices manually"}
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
              {manualPricing ? (
                <>You&apos;re entering all four prices manually.</>
              ) : formData.category === "FLOWER" ? (
                <>Enter the local price only. Shipping = local + <strong>$100</strong>. Slashed prices auto-calculated as <strong>+30%</strong>.</>
              ) : (
                <>Enter the local price only. Shipping = local <strong>+10%</strong>. Slashed prices auto-calculated as <strong>+30%</strong>.</>
              )}
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Local Price (Intown) — <span className="text-emerald-600 font-semibold">active</span> *
              </label>
              <textarea
                name="priceLocal"
                value={formData.priceLocal}
                onChange={handleChange}
                required
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors resize-none"
                placeholder="$600/HP&#10;$1100/P"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Multi-line for tiered pricing (HP / P / etc.) — one tier per line.
              </p>
            </div>

            {!manualPricing && formData.priceLocal.trim().length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                {(() => {
                  const calc = autoCalcPrices(formData.priceLocal, formData.category);
                  const cells: { label: string; value: string }[] = [
                    { label: "Shipped (active)", value: calc.priceShip },
                    { label: "Slashed local", value: calc.slashedPriceLocal },
                    { label: "Slashed shipped", value: calc.slashedPriceShip },
                  ];
                  return cells.map((c) => (
                    <div key={c.label}>
                      <div className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">
                        {c.label}
                      </div>
                      <pre className="mt-1 text-xs font-mono text-gray-900 whitespace-pre-wrap break-words">
                        {c.value || "—"}
                      </pre>
                    </div>
                  ));
                })()}
              </div>
            )}

            {manualPricing && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Shipped Price — <span className="text-emerald-600 font-semibold">active</span> *
                  </label>
                  <textarea
                    name="priceShip"
                    value={formData.priceShip}
                    onChange={handleChange}
                    required
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors resize-none"
                    placeholder="$650/HP&#10;$1200/P"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Slashed Local <span className="text-gray-400 font-normal">(higher than active)</span>
                    </label>
                    <textarea
                      name="slashedPriceLocal"
                      value={formData.slashedPriceLocal}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors resize-none"
                      placeholder="$780/HP&#10;$1430/P"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Slashed Shipped <span className="text-gray-400 font-normal">(higher than active)</span>
                    </label>
                    <textarea
                      name="slashedPriceShip"
                      value={formData.slashedPriceShip}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors resize-none"
                      placeholder="$845/HP&#10;$1560/P"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SEO — collapsed by default; per-product overrides for meta tags */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <button
              type="button"
              onClick={() => setSeoOpen((v) => !v)}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <h2 className="text-sm font-semibold text-gray-900">SEO</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Optional — overrides for search-engine title, description, and social card. Leave blank to use auto-generated values.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-600 hover:text-slate-900">
                {seoOpen ? "Hide" : "Show"} ▾
              </span>
            </button>

            {seoOpen && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Meta Title <span className="text-gray-400 font-normal">(50–60 chars ideal)</span>
                  </label>
                  <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleChange}
                    maxLength={120}
                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors"
                    placeholder="Leave blank to use product title"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">{formData.metaTitle.length} / 60 characters</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Meta Description <span className="text-gray-400 font-normal">(150–160 chars ideal)</span>
                  </label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleChange}
                    rows={2}
                    maxLength={300}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors resize-none"
                    placeholder="Leave blank to use the product description"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">{formData.metaDescription.length} / 160 characters</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Meta Keywords <span className="text-gray-400 font-normal">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    name="metaKeywords"
                    value={formData.metaKeywords}
                    onChange={handleChange}
                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors"
                    placeholder="exotic flower, indoor exotic, top shelf"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Open Graph Image URL <span className="text-gray-400 font-normal">(social-card image)</span>
                  </label>
                  <input
                    type="url"
                    name="ogImage"
                    value={formData.ogImage}
                    onChange={handleChange}
                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors"
                    placeholder="Leave blank to reuse the main product image"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Optional. 1200×630 px works best for Facebook / Twitter / LinkedIn.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Media - Combined Image & Video */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Media</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Main Image *
                </label>
                <FileUpload
                  value={formData.imageUrl}
                  onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
                  type="image"
                  compact
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Video <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <FileUpload
                  value={formData.videoUrl}
                  onChange={(url) => setFormData((prev) => ({ ...prev, videoUrl: url }))}
                  type="video"
                  compact
                />
              </div>
            </div>

            {/* Additional Images */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-gray-700">
                  Additional Images <span className="text-gray-400 font-normal">(optional - gallery photos)</span>
                </label>
                <span className="text-[10px] text-gray-400">{formData.images.length} added</span>
              </div>

              {/* Show existing additional images */}
              {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                      <img src={img} alt={`Additional ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeAdditionalImage(idx)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload new additional image */}
              {formData.images.length < 5 && (
                <FileUpload
                  value=""
                  onChange={(url) => {
                    if (url) addAdditionalImage(url);
                  }}
                  type="image"
                  compact
                />
              )}
              {formData.images.length >= 5 && (
                <p className="text-xs text-gray-400 text-center py-2">Maximum 5 additional images reached</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Status</h2>
            <div className="space-y-3">
              {formData.category === "FLOWER" && (
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="indoor"
                    checked={formData.indoor}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-sm text-gray-700">Indoor Product</span>
                </label>
              )}

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="isSoldOut"
                  checked={formData.isSoldOut}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-sm text-gray-700">Sold Out</span>
              </label>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 rounded-lg border border-blue-100 p-4">
            <h3 className="text-xs font-semibold text-blue-900 mb-2">Tips</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Use high-quality images</li>
              <li>• Include HP & P prices</li>
              <li>• Keep titles concise</li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
}
