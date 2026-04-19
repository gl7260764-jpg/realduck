"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, FileText, Trash2, Edit2, Eye, EyeOff, Loader2, Star, Clock } from "lucide-react";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  published: boolean;
  featured: boolean;
  author: string;
  imageUrl: string;
  createdAt: string;
}

const CAT_LABEL: Record<string, string> = {
  EDUCATION: "Education", HOW_TO: "How To", IMPORTANCE: "Importance", HEALTH_MEDICINAL: "Health & Medicinal",
};
const CAT_COLOR: Record<string, string> = {
  EDUCATION: "bg-blue-100 text-blue-700", HOW_TO: "bg-amber-100 text-amber-700",
  IMPORTANCE: "bg-purple-100 text-purple-700", HEALTH_MEDICINAL: "bg-green-100 text-green-700",
};

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/blog")
      .then((r) => { if (r.status === 401) { router.push("/admin/login"); return null; } return r.json(); })
      .then((data) => { if (data) setPosts(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {}
    setDeleting(null);
    setDeleteId(null);
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !post.published }),
      });
      if (res.ok) setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, published: !p.published } : p));
    } catch {}
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-gray-400 animate-spin" /></div>;

  const published = posts.filter((p) => p.published).length;
  const drafts = posts.length - published;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 lg:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {posts.length} total &middot; {published} published &middot; {drafts} drafts
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Post</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 sm:p-14 text-center">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-500 mb-4">No blog posts yet</p>
          <Link href="/admin/blog/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800">
            <Plus className="w-4 h-4" /> Create your first post
          </Link>
        </div>
      ) : (
        <>
          {/* ── Mobile Cards ── */}
          <div className="sm:hidden space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex gap-3 p-3">
                  {/* Thumbnail */}
                  {post.imageUrl ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-gray-300" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{post.title}</h3>
                      {post.featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0 mt-0.5" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_COLOR[post.category] || "bg-gray-100 text-gray-600"}`}>
                        {CAT_LABEL[post.category] || post.category}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {timeAgo(post.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center border-t border-gray-100">
                  <button
                    onClick={() => togglePublish(post)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                      post.published ? "text-green-700 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    {post.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {post.published ? "Published" : "Draft"}
                  </button>
                  <div className="w-px h-6 bg-gray-100" />
                  <Link
                    href={`/admin/blog/${post.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <div className="w-px h-6 bg-gray-100" />
                  <button
                    onClick={() => setDeleteId(post.id)}
                    disabled={deleting === post.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deleting === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden sm:block bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 lg:px-5 py-3 text-xs lg:text-sm font-semibold text-gray-500 uppercase tracking-wide">Post</th>
                  <th className="text-left px-4 py-3 text-xs lg:text-sm font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-center px-4 py-3 text-xs lg:text-sm font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs lg:text-sm font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-4 lg:px-5 py-3 text-xs lg:text-sm font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 lg:px-5 py-3 lg:py-4">
                      <div className="flex items-center gap-3">
                        {post.imageUrl ? (
                          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {post.featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
                            <span className="text-sm lg:text-base font-semibold text-gray-900 line-clamp-1">{post.title}</span>
                          </div>
                          <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{post.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 lg:py-4">
                      <span className={`text-xs lg:text-sm font-semibold px-2.5 py-1 rounded-full ${CAT_COLOR[post.category] || "bg-gray-100 text-gray-600"}`}>
                        {CAT_LABEL[post.category] || post.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 lg:py-4 text-center">
                      <button
                        onClick={() => togglePublish(post)}
                        className={`inline-flex items-center gap-1.5 text-xs lg:text-sm font-semibold px-3 py-1.5 rounded-full transition-colors ${
                          post.published
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {post.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {post.published ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="px-4 py-3 lg:py-4 text-sm lg:text-base text-gray-500">
                      {timeAgo(post.createdAt)}
                    </td>
                    <td className="px-4 lg:px-5 py-3 lg:py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="p-2 lg:p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 lg:w-5 lg:h-5" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(post.id)}
                          disabled={deleting === post.id}
                          className="p-2 lg:p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deleting === post.id ? <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" /> : <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-base font-semibold text-gray-900 mb-1">Delete this post?</p>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
