"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import FileUpload from "../../components/FileUpload";

const CATEGORIES = [
  { value: "FLOWER", label: "Flower" },
  { value: "TOP_SHELF", label: "Top Shelf" },
  { value: "EDIBLES", label: "Edibles" },
  { value: "CONCENTRATES", label: "Concentrates" },
  { value: "VAPES", label: "Vapes" },
  { value: "PREROLLS", label: "Prerolls" },
  { value: "ROSIN", label: "Rosin" },
  { value: "MUSHROOM", label: "Mushroom" },
  { value: "DISPOSABLES", label: "Disposables" },
  { value: "GUMMIES", label: "Gummies" },
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
  isSoldOut: boolean;
  imageUrl: string;
  images?: string[];
  videoUrl?: string | null;
}

interface ProductFormProps {
  product?: Product;
  isEditing?: boolean;
}

export default function ProductForm({ product, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: product?.title || "",
    description: product?.description || "",
    category: product?.category || "FLOWER",
    indoor: product?.indoor ?? true,
    rating: product?.rating || "10/10",
    priceLocal: product?.priceLocal || "",
    priceShip: product?.priceShip || "",
    isSoldOut: product?.isSoldOut ?? false,
    imageUrl: product?.imageUrl || "",
    images: product?.images || [] as string[],
    videoUrl: product?.videoUrl || "",
  });

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

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Pricing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Local Price *
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
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Shipped Price *
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
            </div>
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
