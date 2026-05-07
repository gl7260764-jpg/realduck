"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Lightbulb, Heart, GraduationCap, ArrowRight, Clock, User, Search, ChevronRight } from "lucide-react";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string;
  excerpt: string | null;
  imageUrl: string;
  author: string;
  featured: boolean;
  tags: string[];
  createdAt: string;
}

interface BlogClientProps {
  posts: BlogPost[];
}

const CATEGORIES = [
  { key: "ALL", label: "All Posts", icon: BookOpen, color: "from-slate-800 to-slate-900", accent: "bg-slate-100 text-slate-700", border: "border-slate-200" },
  { key: "EDUCATION", label: "Education", icon: GraduationCap, color: "from-blue-600 to-blue-800", accent: "bg-blue-100 text-blue-700", border: "border-blue-200", description: "Deep dives into cannabis science, strains, terpenes, and the industry." },
  { key: "HOW_TO", label: "How To", icon: Lightbulb, color: "from-amber-500 to-amber-700", accent: "bg-amber-100 text-amber-700", border: "border-amber-200", description: "Step-by-step guides on consumption, storage, dosing, and more." },
  { key: "IMPORTANCE", label: "Importance", icon: BookOpen, color: "from-purple-600 to-purple-800", accent: "bg-purple-100 text-purple-700", border: "border-purple-200", description: "Why cannabis matters — culture, legislation, and social impact." },
  { key: "HEALTH_MEDICINAL", label: "Health & Medicinal", icon: Heart, color: "from-green-600 to-green-800", accent: "bg-green-100 text-green-700", border: "border-green-200", description: "Research-backed health benefits and medicinal applications." },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.unobserve(el); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function BlogCard({ post, index }: { post: BlogPost; index: number }) {
  const { ref, inView } = useInView();
  const cat = CATEGORIES.find((c) => c.key === post.category) || CATEGORIES[0];

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <Link href={`/blog/${post.slug}`} className="group block h-full">
        <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-500 h-full flex flex-col">
          <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
            {post.imageUrl ? (
              <img
                src={post.imageUrl}
                alt={post.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                <cat.icon className="w-12 h-12 text-white/60" />
              </div>
            )}
            <div className="absolute top-3 left-3">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${cat.accent}`}>
                {cat.label}
              </span>
            </div>
            {post.featured && (
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-400 text-amber-900 uppercase tracking-wider">
                  Featured
                </span>
              </div>
            )}
          </div>
          <div className="p-5 flex-1 flex flex-col">
            <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-slate-600 transition-colors leading-snug">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed flex-1">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {post.author}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(post.createdAt)}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </article>
      </Link>
    </div>
  );
}

function FeaturedCard({ post }: { post: BlogPost }) {
  const { ref, inView } = useInView();
  const cat = CATEGORIES.find((c) => c.key === post.category) || CATEGORIES[0];

  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
      <Link href={`/blog/${post.slug}`} className="group block">
        <article className="relative rounded-3xl overflow-hidden bg-gray-900 min-h-[400px] sm:min-h-[480px] flex items-end">
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="relative p-6 sm:p-10 w-full">
            <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 ${cat.accent}`}>
              {cat.label}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight max-w-2xl">
              {post.title}
            </h2>
            {post.subtitle && (
              <p className="text-base sm:text-lg text-white/70 mb-4 max-w-xl">{post.subtitle}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {post.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {timeAgo(post.createdAt)}
              </span>
              <span className="flex items-center gap-1 text-white/80 font-medium group-hover:gap-2 transition-all">
                Read More <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </article>
      </Link>
    </div>
  );
}

export default function BlogClient({ posts }: BlogClientProps) {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [search, setSearch] = useState("");

  const featured = posts.filter((p) => p.featured);
  const filtered = posts.filter((p) => {
    if (activeCategory !== "ALL" && p.category !== activeCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
      );
    }
    return true;
  });

  const categoryPosts = (cat: string) => posts.filter((p) => p.category === cat);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://res.cloudinary.com/dewstyanq/image/upload/v1772006100/ubx928a54bhxdreliymy.jpg"
            alt="Cannabis Knowledge Hub"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/85 via-slate-900/75 to-slate-900/95" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest bg-white/10 text-white/70 mb-6 border border-white/10">
              Real Duck Distro Blog
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-5 tracking-tight text-white leading-tight">
              Cannabis Knowledge Hub
            </h1>
            <p className="text-base sm:text-xl text-white/60 mb-10 leading-relaxed max-w-xl mx-auto">
              Education, guides, health insights, and everything you need to know — backed by research and real experience.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/20 focus:outline-none backdrop-blur-sm transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && !search && activeCategory === "ALL" && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-12 relative z-10">
          {featured.length === 1 ? (
            <FeaturedCard post={featured[0]} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featured.slice(0, 2).map((post) => (
                <FeaturedCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Category Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const count = cat.key === "ALL" ? posts.length : categoryPosts(cat.key).length;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => { setActiveCategory(cat.key); setSearch(""); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Category Sections (when ALL is selected and no search) */}
      {activeCategory === "ALL" && !search ? (
        <div className="space-y-16 pb-20">
          {CATEGORIES.filter((c) => c.key !== "ALL").map((cat) => {
            const catPosts = categoryPosts(cat.key);
            if (catPosts.length === 0) return null;

            return (
              <section key={cat.key} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                        <cat.icon className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{cat.label}</h2>
                    </div>
                    {cat.description && (
                      <p className="text-sm text-gray-500 mt-1 max-w-lg">{cat.description}</p>
                    )}
                  </div>
                  {catPosts.length > 4 && (
                    <button
                      onClick={() => setActiveCategory(cat.key)}
                      className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
                    >
                      View All <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {catPosts.slice(0, 4).map((post, i) => (
                    <BlogCard key={post.id} post={post} index={i} />
                  ))}
                </div>
              </section>
            );
          })}

          {posts.length === 0 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
              <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h2>
              <p className="text-gray-500">We&apos;re working on some great content. Check back soon!</p>
            </div>
          )}
        </div>
      ) : (
        /* Filtered Grid */
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-900 mb-2">No posts found</h2>
              <p className="text-gray-500 text-sm">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((post, i) => (
                <BlogCard key={post.id} post={post} index={i} />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
