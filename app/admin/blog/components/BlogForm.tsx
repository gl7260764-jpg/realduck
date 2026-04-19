"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Eye, Image as ImageIcon, X, Plus } from "lucide-react";
import Link from "next/link";

interface BlogFormData {
  title: string;
  subtitle: string;
  category: string;
  content: string;
  excerpt: string;
  imageUrl: string;
  images: string[];
  author: string;
  published: boolean;
  featured: boolean;
  tags: string[];
}

interface BlogFormProps {
  initialData?: BlogFormData & { id?: string };
  isEdit?: boolean;
}

const CATEGORIES = [
  { value: "EDUCATION", label: "Education" },
  { value: "HOW_TO", label: "How To" },
  { value: "IMPORTANCE", label: "Importance" },
  { value: "HEALTH_MEDICINAL", label: "Health & Medicinal" },
];

export default function BlogForm({ initialData, isEdit }: BlogFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState<BlogFormData>({
    title: initialData?.title || "",
    subtitle: initialData?.subtitle || "",
    category: initialData?.category || "",
    content: initialData?.content || "",
    excerpt: initialData?.excerpt || "",
    imageUrl: initialData?.imageUrl || "",
    images: initialData?.images || [],
    author: initialData?.author || "Real Duck Distro",
    published: initialData?.published ?? false,
    featured: initialData?.featured ?? false,
    tags: initialData?.tags || [],
  });
  const [imageInput, setImageInput] = useState("");

  const updateField = (field: keyof BlogFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      updateField("tags", [...form.tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    updateField("tags", form.tags.filter((t) => t !== tag));
  };

  const addImage = () => {
    const url = imageInput.trim();
    if (url && !form.images.includes(url)) {
      updateField("images", [...form.images, url]);
    }
    setImageInput("");
  };

  const removeImage = (url: string) => {
    updateField("images", form.images.filter((i) => i !== url));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.category) { setError("Category is required"); return; }
    if (!form.content.trim()) { setError("Content is required"); return; }

    setSaving(true);
    setError("");

    try {
      const url = isEdit ? `/api/admin/blog/${initialData?.id}` : "/api/admin/blog";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.status === 401) { router.push("/admin/login"); return; }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save post");
      }

      router.push("/admin/blog");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <Link
          href="/admin/blog"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
            {isEdit ? "Edit Post" : "New Blog Post"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {isEdit ? "Update your blog post" : "Create a new blog post"}
          </p>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {/* Title & Subtitle */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-1.5">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Your blog post title"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-1.5">Subtitle</label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => updateField("subtitle", e.target.value)}
              placeholder="A brief subtitle or tagline"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={`${inputCls} ${!form.category ? "text-gray-400" : ""}`}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-1.5">Author</label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => updateField("author", e.target.value)}
                placeholder="Author name"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Cover Image */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
          <label className="block text-sm font-semibold text-gray-900">Cover Image URL</label>
          <input
            type="text"
            value={form.imageUrl}
            onChange={(e) => updateField("imageUrl", e.target.value)}
            placeholder="https://res.cloudinary.com/..."
            className={inputCls}
          />
          {form.imageUrl && (
            <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100">
              <img src={form.imageUrl} alt="Cover" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Additional Images */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
          <label className="block text-sm font-semibold text-gray-900">Additional Images</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }}
              placeholder="Paste image URL and press Enter"
              className={`flex-1 ${inputCls}`}
            />
            <button onClick={addImage} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          {form.images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {form.images.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={url} alt={`Image ${idx + 1}`} className="w-full h-20 object-cover rounded-lg bg-gray-100" />
                  <button
                    onClick={() => removeImage(url)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Excerpt */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
          <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-1.5">
            Excerpt <span className="text-gray-400 font-normal">(shown on cards)</span>
          </label>
          <textarea
            value={form.excerpt}
            onChange={(e) => updateField("excerpt", e.target.value)}
            placeholder="Brief summary for blog listing cards (auto-generated from content if empty)"
            rows={2}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
          <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-1.5">Content *</label>
          <p className="text-xs sm:text-sm text-gray-500 mb-3">
            Use Markdown: **bold**, *italic*, ## headings, - lists, [links](url)
          </p>
          <textarea
            value={form.content}
            onChange={(e) => updateField("content", e.target.value)}
            placeholder="Write your blog post content here using Markdown..."
            rows={16}
            className={`${inputCls} resize-y font-mono text-xs sm:text-sm leading-relaxed`}
          />
        </div>

        {/* Tags */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <label className="block text-sm font-semibold text-gray-900">Tags</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Add a tag and press Enter"
              className={`flex-1 ${inputCls}`}
            />
            <button onClick={addTag} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Publish Settings */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => updateField("published", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
              />
              <div>
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> Published
                </span>
                <p className="text-xs text-gray-500">Make visible to public</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => updateField("featured", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" /> Featured
                </span>
                <p className="text-xs text-gray-500">Show prominently on blog page</p>
              </div>
            </label>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pb-8">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm sm:text-base font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : isEdit ? "Update Post" : "Create Post"}
          </button>
          <Link href="/admin/blog" className="text-center px-6 py-3 text-gray-600 text-sm sm:text-base font-medium hover:text-gray-900 transition-colors">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
