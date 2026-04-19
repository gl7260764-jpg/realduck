"use client";

import CloudImage from "../components/CloudImage";
import { Bell, Clock, Megaphone } from "lucide-react";
import Link from "next/link";

interface Announcement {
  id: string;
  title: string;
  message: string;
  content: string;
  imageUrl: string | null;
  link: string | null;
  createdAt: string;
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AnnouncementsClient({ announcements }: { announcements: Announcement[] }) {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-900 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Announcements</h1>
          <p className="text-sm sm:text-base text-white/50">Latest news, offers, and updates from Real Duck Distro</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No Announcements Yet</h2>
            <p className="text-sm text-gray-500 mb-6">Check back soon for updates and special offers.</p>
            <Link href="/" className="inline-flex px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((a, i) => (
              <article
                key={a.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-300"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {a.imageUrl && (
                  <div className="relative w-full h-40 sm:h-52 overflow-hidden bg-gray-100">
                    <CloudImage src={a.imageUrl} alt={a.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" loading="lazy" />
                  </div>
                )}
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">{a.title}</h2>
                    <span className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(a.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">{a.content}</p>
                  {a.link && a.link !== "/announcements" && (
                    <Link
                      href={a.link}
                      className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      Learn More
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
