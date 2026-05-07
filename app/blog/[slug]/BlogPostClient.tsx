"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, User, Tag, ArrowRight, Share2, Check, ExternalLink, BookOpen } from "lucide-react";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string;
  content: string;
  excerpt: string | null;
  imageUrl: string;
  images: string[];
  author: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string | null;
  imageUrl: string;
  author: string;
  createdAt: string;
}

interface Product {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  priceShip: string;
}

const CAT_LABEL: Record<string, string> = {
  EDUCATION: "Education", HOW_TO: "How To", IMPORTANCE: "Importance", HEALTH_MEDICINAL: "Health & Medicinal",
};
const CAT_COLOR: Record<string, string> = {
  EDUCATION: "bg-blue-100 text-blue-700", HOW_TO: "bg-amber-100 text-amber-700",
  IMPORTANCE: "bg-purple-100 text-purple-700", HEALTH_MEDICINAL: "bg-green-100 text-green-700",
};

/* ── Markdown Renderer ── */
function render(content: string): string {
  const lines = content.split("\n");
  const out: string[] = [];
  let inList = false, lt = "";

  const close = () => { if (inList) { out.push(lt === "ul" ? "</ul>" : "</ol>"); inList = false; } };

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim()) { close(); continue; }

    // Headings
    if (l.startsWith("### ")) { close(); out.push(`<h3 class="text-[15px] lg:text-lg font-bold text-gray-900 mt-6 lg:mt-8 mb-2">${il(l.slice(4))}</h3>`); continue; }
    if (l.startsWith("## "))  { close(); out.push(`<h2 class="text-base lg:text-xl font-bold text-gray-900 mt-8 lg:mt-10 mb-2.5 pb-2 border-b border-gray-100">${il(l.slice(3))}</h2>`); continue; }
    if (l.startsWith("# "))   { close(); out.push(`<h1 class="text-lg lg:text-2xl font-bold text-gray-900 mt-8 lg:mt-10 mb-3">${il(l.slice(2))}</h1>`); continue; }

    if (l.trim() === "---") { close(); out.push('<hr class="my-6 lg:my-8 border-gray-100" />'); continue; }

    // Blockquote
    if (l.startsWith("> ")) {
      close();
      out.push(`<blockquote class="border-l-3 border-slate-800 bg-slate-50 rounded-r-lg pl-4 lg:pl-5 pr-4 py-3 my-4 lg:my-5"><p class="text-sm lg:text-base text-slate-600 italic leading-relaxed">${il(l.slice(2))}</p></blockquote>`);
      continue;
    }

    // Image
    const img = l.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img) { close(); out.push(`<figure class="my-5 lg:my-6"><img src="${img[2]}" alt="${img[1]}" class="w-full rounded-xl" loading="lazy" />${img[1] ? `<figcaption class="text-center text-xs text-gray-400 mt-2">${img[1]}</figcaption>` : ""}</figure>`); continue; }

    // Lists
    if (l.startsWith("- ")) {
      if (!inList || lt !== "ul") { close(); out.push('<ul class="my-3 lg:my-4 ml-5 space-y-1.5">'); inList = true; lt = "ul"; }
      out.push(`<li class="text-sm lg:text-base text-gray-600 list-disc pl-1 leading-relaxed">${il(l.slice(2))}</li>`);
      continue;
    }
    const ol = l.match(/^\d+\. (.+)$/);
    if (ol) {
      if (!inList || lt !== "ol") { close(); out.push('<ol class="my-3 lg:my-4 ml-5 space-y-1.5">'); inList = true; lt = "ol"; }
      out.push(`<li class="text-sm lg:text-base text-gray-600 list-decimal pl-1 leading-relaxed">${il(ol[1])}</li>`);
      continue;
    }

    // Table
    if (l.includes("|") && l.trim().startsWith("|")) {
      close();
      const tl: string[] = [l];
      while (i + 1 < lines.length && lines[i + 1].includes("|")) { i++; tl.push(lines[i]); }
      out.push(tbl(tl));
      continue;
    }

    // Paragraph
    close();
    out.push(`<p class="text-sm lg:text-base text-gray-600 leading-relaxed mb-3 lg:mb-4">${il(l)}</p>`);
  }
  close();
  return out.join("\n");
}

function il(t: string): string {
  return t
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline decoration-blue-200 underline-offset-2 transition-colors">$1</a>')
    .replace(/\[([^\]]+)\]\(\/([^)]+)\)/g, '<a href="/$2" class="text-slate-900 hover:text-slate-600 font-semibold underline decoration-slate-200 underline-offset-2 transition-colors">$1</a>');
}

function tbl(lines: string[]): string {
  const rows = lines.filter((l) => !l.match(/^\|[\s-|]+\|$/)).map((l) => l.split("|").filter((c) => c.trim()).map((c) => c.trim()));
  if (!rows.length) return "";
  let h = '<div class="overflow-x-auto my-5 lg:my-6"><table class="w-full text-sm lg:text-base border border-gray-200 rounded-xl overflow-hidden">';
  h += "<thead><tr>";
  rows[0].forEach((c) => { h += `<th class="text-left px-4 py-2.5 bg-slate-50 text-slate-600 font-semibold text-sm">${c}</th>`; });
  h += "</tr></thead><tbody>";
  rows.slice(1).forEach((r, i) => { h += `<tr class="${i % 2 ? "bg-gray-50/50" : ""}">`; r.forEach((c) => { h += `<td class="px-4 py-2.5 text-gray-600 border-t border-gray-100">${il(c)}</td>`; }); h += "</tr>"; });
  h += "</tbody></table></div>";
  return h;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/* ── Component ── */
export default function BlogPostClient({ post, relatedPosts, products }: { post: BlogPost; relatedPosts: RelatedPost[]; products: Product[] }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { await navigator.share({ title: post.title, url }); }
    else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <main className="min-h-screen bg-white">

      {/* ── Hero Banner ── */}
      {post.imageUrl && (
        <div className="relative w-full h-56 sm:h-72 lg:h-[420px] bg-gray-900 overflow-hidden">
          <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 lg:p-12">
            <div className="max-w-5xl mx-auto">
              <span className={`inline-block px-3 py-1 rounded-full text-[11px] lg:text-xs font-bold mb-3 lg:mb-4 ${CAT_COLOR[post.category] || "bg-gray-100 text-gray-600"}`}>
                {CAT_LABEL[post.category] || post.category}
              </span>
              <h1 className="text-xl sm:text-3xl lg:text-5xl font-bold text-white leading-tight max-w-3xl">
                {post.title}
              </h1>
              {post.subtitle && (
                <p className="text-sm sm:text-base lg:text-xl text-white/60 mt-2 lg:mt-3 max-w-2xl">{post.subtitle}</p>
              )}
              <div className="flex items-center gap-4 mt-3 lg:mt-5 text-xs lg:text-sm text-white/50">
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{post.author}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{fmtDate(post.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── No-image header ── */}
      {!post.imageUrl && (
        <div className="bg-slate-900 py-12 sm:py-16 lg:py-20 px-5">
          <div className="max-w-5xl mx-auto">
            <span className={`inline-block px-3 py-1 rounded-full text-[11px] lg:text-xs font-bold mb-3 ${CAT_COLOR[post.category]}`}>
              {CAT_LABEL[post.category] || post.category}
            </span>
            <h1 className="text-xl sm:text-3xl lg:text-5xl font-bold text-white leading-tight max-w-3xl">{post.title}</h1>
            {post.subtitle && <p className="text-sm lg:text-xl text-white/50 mt-2 max-w-2xl">{post.subtitle}</p>}
            <div className="flex items-center gap-4 mt-3 text-xs lg:text-sm text-white/40">
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{post.author}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{fmtDate(post.createdAt)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Nav Bar ── */}
      <div className="sticky top-16 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/blog" className="flex items-center gap-1.5 text-slate-900 hover:text-slate-600 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Blog
            </Link>
          </div>
          <button onClick={share} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition-colors">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Link copied" : "Share"}
          </button>
        </div>
      </div>

      {/* ── Content + Sidebar ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="lg:flex lg:gap-12">

          {/* Article */}
          <article className="lg:flex-1 lg:min-w-0">
            <div dangerouslySetInnerHTML={{ __html: render(post.content) }} />

            {/* Gallery */}
            {post.images.length > 0 && (
              <div className={`grid gap-3 mt-8 ${post.images.length === 1 ? "grid-cols-1" : post.images.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
                {post.images.map((img, i) => (
                  <div key={i} className={`rounded-xl overflow-hidden bg-gray-100 ${post.images.length === 1 ? "aspect-video" : "aspect-[4/3]"}`}>
                    <img src={img} alt={`${post.title} ${i + 1}`} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-8 pt-6 border-t border-gray-100">
                <Tag className="w-4 h-4 text-gray-300" />
                {post.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs lg:text-sm font-medium rounded-full hover:bg-gray-200 transition-colors">{tag}</span>
                ))}
              </div>
            )}

            {/* Author bio — E-E-A-T signal for Google's YMYL evaluation */}
            <div className="mt-10 pt-8 border-t border-gray-100">
              <div className="bg-slate-50 rounded-2xl p-5 lg:p-6 border border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-700 font-semibold text-lg">
                    RDD
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Written by</p>
                    <p className="text-base lg:text-lg font-bold text-slate-900">Real Duck Distro Editorial Team</p>
                    <p className="text-xs lg:text-sm text-slate-600 mt-2 leading-relaxed">
                      Cultivators, extract chemists, and cannabis writers based in Los Angeles, California — collectively 25+ years in the California cannabis industry. Every product we write about is one we've handled, tested, and stocked. Honest reviews, practical guides, real experience.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-3">
                      Specialties: California cultivation · Extract chemistry · Strain genetics · Disposable hardware · Harm reduction · Edibles dosing
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-6 pt-4 text-xs lg:text-sm text-gray-400 italic">
              This content is for educational purposes only. Always consume cannabis responsibly and in accordance with local laws.
            </div>
          </article>

          {/* ── Sidebar ── */}
          <aside className="mt-10 lg:mt-0 lg:w-72 xl:w-80 lg:flex-shrink-0 space-y-6">

            {/* Products */}
            {products.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm lg:text-base font-bold text-gray-900">Our Products</h3>
                  <Link href="/" aria-label="View all Real Duck Distro products" className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">Shop all products →</Link>
                </div>
                <div className="grid grid-cols-3 lg:grid-cols-2 gap-2.5">
                  {products.slice(0, 6).map((p) => (
                    <Link key={p.id} href={`/product/${p.id}`} className="group">
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-200 mb-1.5 ring-1 ring-gray-200 group-hover:ring-slate-300 transition-all">
                        <img src={p.imageUrl} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <p className="text-[11px] lg:text-xs font-medium text-gray-700 line-clamp-1 group-hover:text-slate-900 transition-colors">{p.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Articles */}
            {relatedPosts.length > 0 && (
              <div>
                <h3 className="text-sm lg:text-base font-bold text-gray-900 mb-3">Related Articles</h3>
                <div className="space-y-3">
                  {relatedPosts.slice(0, 4).map((rp) => (
                    <Link key={rp.id} href={`/blog/${rp.slug}`} className="group flex gap-3 items-start">
                      {rp.imageUrl && (
                        <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 ring-1 ring-gray-200">
                          <img src={rp.imageUrl} alt={rp.title} loading="lazy" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 py-0.5">
                        <p className="text-xs lg:text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-slate-600 transition-colors leading-snug">{rp.title}</p>
                        {rp.excerpt && <p className="text-[11px] lg:text-xs text-gray-400 line-clamp-1 mt-1">{rp.excerpt}</p>}
                        <p className="text-[10px] lg:text-[11px] text-gray-300 mt-1.5">{new Date(rp.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Resources */}
            <div className="bg-slate-900 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-white/50" />
                <h3 className="text-sm font-bold text-white">Research Resources</h3>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Leafly", url: "https://www.leafly.com", desc: "Strains & reviews" },
                  { name: "NORML", url: "https://norml.org", desc: "Cannabis law reform" },
                  { name: "Project CBD", url: "https://www.projectcbd.org", desc: "CBD science" },
                  { name: "Harvard Health", url: "https://www.health.harvard.edu", desc: "Medical research" },
                ].map((link) => (
                  <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                    <div>
                      <p className="text-xs lg:text-sm font-medium text-white group-hover:text-blue-300 transition-colors">{link.name}</p>
                      <p className="text-[10px] lg:text-[11px] text-white/30">{link.desc}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
                  </a>
                ))}
              </div>
            </div>

          </aside>
        </div>
      </div>
    </main>
  );
}
