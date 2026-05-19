# Real Duck Distro — Complete Admin Dashboard Blueprint

> **Purpose of this document.** Hand this to a Claude (or any developer) who is building a *different* website and needs the **same admin dashboard, with the same features, the same design language, the same data model, and the same supporting infrastructure**. Every section below is concrete enough that the implementer should not need to make architectural decisions — only adapt names/branding.

---

## Table of Contents

1. [What this admin dashboard does (one paragraph)](#1-what-this-admin-dashboard-does-one-paragraph)
2. [Tech stack reference card](#2-tech-stack-reference-card)
3. [Repository layout](#3-repository-layout)
4. [Authentication architecture](#4-authentication-architecture)
5. [Design system — colors, type, components](#5-design-system--colors-type-components)
6. [Reusable patterns that show up everywhere](#6-reusable-patterns-that-show-up-everywhere)
7. [Section-by-section feature map](#7-section-by-section-feature-map)
8. [Database schema — every model](#8-database-schema--every-model)
9. [External services & integrations](#9-external-services--integrations)
10. [The 15-step implementation guide](#10-the-15-step-implementation-guide)
11. [Final notes & gotchas](#11-final-notes--gotchas)

---

## 1. What this admin dashboard does (one paragraph)

A single-admin (or small-team) e-commerce control center for a content-driven storefront. It manages **products** (with multi-tier pricing, R2-uploaded media, SEO meta, category visibility), **orders** (both formal checkout and Telegram fast-orders with full source attribution), **blog posts** (markdown, gallery, SEO), **announcements** (with web-push fan-out), **newsletter subscribers** (CSV export, segmentation), **promoter campaign links** (UTM-tagged tracked links with click/conversion analytics), **PWA installs** (with one-time discount tracking), and **site settings** (Telegram bot, SMTP, social links, category visibility). It uses session-cookie auth, server-side render with client islands, server actions for forms, and a single Postgres database via Prisma. Every operator action that creates/updates public content auto-pings IndexNow so Bing/Yandex re-crawl within minutes.

---

## 2. Tech stack reference card

| Layer | Choice | Notes |
|---|---|---|
| **Framework** | Next.js 14.2.x — App Router | Server components everywhere; client components marked with `"use client"` only when needed (forms, drawers, interactive tables) |
| **Language** | TypeScript (strict) | `tsc --noEmit` is the typecheck command — runs cleanly on every commit |
| **Styling** | Tailwind CSS v4 + `tw-animate-css` | Custom classes under the `admin-*` prefix in `globals.css` |
| **Icons** | `lucide-react` (latest) | Always rendered with `strokeWidth={2.2}`–`2.4` |
| **DB** | Postgres (Neon serverless in production) | Cold start friendly — see autosuspend retry pattern below |
| **ORM** | Prisma (latest) | Singleton client pattern with hot-reload safety in dev |
| **Auth** | Custom cookie session backed by Prisma table | Plain-text env-var password compared with `crypto.timingSafeEqual`. No JWT, no bcrypt |
| **File uploads** | Cloudflare R2 via presigned PUT URLs | Browser uploads direct — bypasses Vercel's 4.5 MB body cap |
| **Image optimization** | Cloudinary URL transforms (for thumbnails) on already-R2-hosted images | `optimizeImage()` rewrites R2 URL to a Cloudinary `fetch/` URL |
| **Email** | nodemailer for transactional (orders, welcome) via SiteSetting-stored SMTP creds; **Resend** for newsletter blasts | Hostinger-style SMTP fails to Gmail for bulk; Resend free tier solves it |
| **Push notifications** | `web-push` library, VAPID-signed, fan-out parallel sends | Marks `410 Gone` subscriptions as inactive automatically |
| **Telegram** | Direct Bot API call from `/api/orders/telegram` | Bot token + chat ID stored in SiteSetting |
| **Search engine pings** | IndexNow protocol via `lib/indexNow.ts` | Triggered on every product/blog/announcement create+update |
| **Deployment** | Vercel (hobby tier OK) | `revalidate = 60` on data-driven pages |
| **Hosting domain** | `realduckdistro.com` (root) with DKIM at `resend._domainkey` | Always serve content from `www.` (canonicalize) |

**Required env vars (production):**
```
DATABASE_URL=postgresql://...
ADMIN_USERNAME=youradminusername
ADMIN_PASSWORD=yourplainpassword
NEXT_PUBLIC_SITE_URL=https://www.yoursite.com
RESEND_API_KEY=re_...                              # newsletter blasts
R2_ACCOUNT_ID=...                                  # Cloudflare R2
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=your-bucket-name
R2_PUBLIC_URL=https://pub-xxxx.r2.dev              # public R2 host
VAPID_PUBLIC_KEY=...                               # web push
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@yoursite.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=                      # same as VAPID_PUBLIC_KEY
TELEGRAM_BOT_TOKEN=                                # fallback if SiteSetting empty
TELEGRAM_CHAT_ID=
SMTP_HOST=                                         # fallbacks if SiteSetting empty
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_FROM=                                         # display name + email
```

---

## 3. Repository layout

```
app/
├── admin/
│   ├── layout.tsx                        # auth check + sidebar shell
│   ├── page.tsx                          # dashboard home (KPIs)
│   ├── login/page.tsx                    # login form
│   ├── analytics/page.tsx                # traffic + revenue + device dashboards
│   ├── announcements/
│   │   ├── page.tsx                      # list + send push
│   │   ├── new/page.tsx
│   │   └── [id]/edit/page.tsx
│   ├── blog/
│   │   ├── page.tsx                      # list + toggle publish
│   │   ├── new/page.tsx
│   │   ├── [id]/edit/page.tsx
│   │   └── components/BlogForm.tsx
│   ├── links/
│   │   ├── page.tsx                      # promoter + campaign tracker
│   │   └── LinksClient.tsx
│   ├── newsletter/page.tsx
│   ├── orders/
│   │   ├── page.tsx
│   │   └── components/OrdersTable.tsx    # search + filter + expand
│   ├── products/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   ├── [id]/edit/page.tsx
│   │   └── components/
│   │       ├── ProductForm.tsx
│   │       ├── ProductsTable.tsx
│   │       ├── CategoryVisibilityToggle.tsx
│   │       └── FlowerDescriptionToggle.tsx
│   ├── pwa/page.tsx                      # install + push analytics
│   ├── settings/page.tsx                 # social/SMTP/Telegram config
│   ├── components/
│   │   ├── AdminSidebar.tsx
│   │   └── FileUpload.tsx                # R2-backed reusable uploader
│   └── context/SidebarContext.tsx        # mobile menu state
│
├── api/admin/
│   ├── login/route.ts                    # POST verify creds
│   ├── logout/route.ts                   # POST clear cookie + session
│   ├── analytics/route.ts                # GET aggregated dashboard data
│   ├── announcements/route.ts            # GET/POST
│   ├── announcements/[id]/route.ts       # PUT/DELETE + sendPush
│   ├── blog/route.ts                     # GET/POST
│   ├── blog/[id]/route.ts                # GET/PUT/DELETE
│   ├── campaigns/route.ts                # GET/POST tracked links
│   ├── campaigns/[id]/route.ts           # PUT/DELETE archive
│   ├── category-visibility/route.ts      # GET/PUT hidden categories
│   ├── newsletter/route.ts               # GET (list + CSV)
│   ├── newsletter/[id]/route.ts          # PATCH active/DELETE
│   ├── orders/route.ts                   # GET/PATCH status/DELETE
│   ├── products/route.ts                 # GET/POST
│   ├── products/[id]/route.ts            # GET/PUT/DELETE
│   ├── products/flower-descriptions/route.ts  # batch toggle
│   ├── promoters/route.ts                # GET/POST
│   ├── promoters/[id]/route.ts           # PUT/DELETE archive
│   ├── pwa/route.ts                      # GET aggregated install data
│   ├── settings/route.ts                 # GET/PUT
│   ├── upload/route.ts                   # POST small files (server-side)
│   └── upload-url/route.ts               # POST → presigned R2 PUT URL

lib/
├── auth.ts                # session + creds verification
├── adminConfig.ts         # SiteSetting → typed config
├── prisma.ts              # singleton
├── r2.ts                  # presigned URL builder, list, delete
├── indexNow.ts            # POST to Bing IndexNow API
├── webpush.ts             # web-push init + fanOutPush()
├── orderAttribution.ts    # session → "source verdict"
├── orderRules.ts          # business rules (disposables 50-min, etc.)
├── categoryVisibility.ts  # hidden-categories cache
├── rateLimit.ts           # in-memory IP rate limit
├── slug.ts                # title → slug
├── slashedPrice.ts        # auto-calc compare-at price
├── descriptionEngine.ts   # auto-generate flower descriptions by price
├── formatPrice.ts         # multi-line "$600/HP\n$1100/P" parse
└── videoTrim.ts           # ffmpeg-style video shortening helper

middleware.ts              # 410 Gone for deleted slugs (not auth)

prisma/schema.prisma       # full schema (see Section 8)
```

---

## 4. Authentication architecture

### Concept (in plain English)

- **One admin** (you). Username + password sit in env vars as **plain text**.
- On `/admin/login` POST, the route uses `crypto.timingSafeEqual()` to compare against env vars (not bcrypt — overkill for a single-user dashboard, and timing-safe comparison is sufficient protection against side-channel attacks).
- On success, generate a 32-byte hex token, **store it in `AdminSession` table** with a 4-hour expiry, and set an `httpOnly` cookie called `admin_session`.
- On every admin page load, `isAuthenticated()` reads the cookie, looks up the token in `AdminSession`, and validates that `expiresAt > now`. If anything fails, return false.
- **No middleware** for auth. Protection happens in `app/admin/layout.tsx`: if not authenticated, the layout just renders `children` (which resolves to `/admin/login/page.tsx`). If authenticated, it renders the full sidebar + content shell.
- **Rate limit** the login endpoint: 5 attempts/minute per IP, then 5-minute block. In-memory map is fine for single-instance Vercel; if you scale to multiple instances later, move to Upstash Redis.

### Why this design (and not NextAuth/Clerk/etc.)

- Single admin. NextAuth's OAuth/email-link flows are overhead.
- Server-component-friendly. The layout's `await isAuthenticated()` is a single DB query — no provider tree, no client-side state.
- Cookie + DB session means **revocation works**. Logging out deletes the DB row, so the token is dead immediately, even if the cookie is still in the browser.

### Exact `lib/auth.ts` skeleton

```typescript
import { cookies } from "next/headers";
import crypto from "crypto";
import prisma from "./prisma";

const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 4; // 4 hours

export function verifyCredentials(username: string, password: string): boolean {
  const a = process.env.ADMIN_USERNAME ?? "";
  const b = process.env.ADMIN_PASSWORD ?? "";
  if (!a || !b) return false;
  if (a.length !== username.length || b.length !== password.length) return false;
  return (
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(username)) &&
    crypto.timingSafeEqual(Buffer.from(b), Buffer.from(password))
  );
}

export async function createSession(username: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);
  await prisma.adminSession.create({ data: { token, username, expiresAt } });
  return token;
}

export async function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function isAuthenticated(): Promise<boolean> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return false;
  const session = await prisma.adminSession.findUnique({ where: { token } });
  if (!session) return false;
  if (session.expiresAt < new Date()) {
    await prisma.adminSession.delete({ where: { token } }).catch(() => {});
    return false;
  }
  return true;
}

export async function clearSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) await prisma.adminSession.delete({ where: { token } }).catch(() => {});
  cookies().delete(COOKIE_NAME);
}

export async function cleanupExpiredSessions() {
  await prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
```

### Login route (`app/api/admin/login/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, createSession, setSessionCookie, cleanupExpiredSessions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim()
       ?? req.headers.get("x-real-ip")
       ?? "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const limit = checkRateLimit(`login:${ip}`, 5, 60_000, 5 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }
  const { username, password } = await req.json();
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (!verifyCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const token = await createSession(username);
  await setSessionCookie(token);
  cleanupExpiredSessions().catch(() => {});
  return NextResponse.json({ success: true });
}
```

### Layout (`app/admin/layout.tsx`)

```tsx
import { isAuthenticated } from "@/lib/auth";
import { SidebarProvider } from "./context/SidebarContext";
import AdminSidebar from "./components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ok = await isAuthenticated();
  if (!ok) return <>{children}</>; // resolves to login/page.tsx
  return (
    <SidebarProvider>
      <div className="h-screen flex overflow-hidden bg-slate-50">
        <AdminSidebar />
        <main className="flex-1 lg:ml-64 2xl:ml-72 overflow-y-auto admin-scrollbar admin-main">
          <div className="admin-page">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
```

### Sidebar nav array (use the exact structure)

```typescript
const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/admin",           label: "Dashboard",    icon: LayoutDashboard, accent: "from-violet-500 to-purple-600" },
      { href: "/admin/analytics", label: "Analytics",    icon: BarChart3,       accent: "from-blue-500 to-cyan-500" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/admin/orders",   label: "Orders",   icon: ShoppingBag, accent: "from-emerald-500 to-teal-600" },
      { href: "/admin/products", label: "Products", icon: Package,     accent: "from-amber-500 to-orange-600" },
    ],
  },
  {
    label: "Content & Reach",
    items: [
      { href: "/admin/blog",          label: "Blog Posts",     icon: FileText,  accent: "from-rose-500 to-pink-600" },
      { href: "/admin/announcements", label: "Announcements",  icon: Megaphone },
      { href: "/admin/newsletter",    label: "Newsletter",     icon: Mail },
      { href: "/admin/links",         label: "Link Tracking",  icon: Link2 },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/pwa",      label: "PWA & Push", icon: Smartphone },
      { href: "/admin/settings", label: "Settings",   icon: Settings },
    ],
  },
];
```

---

## 5. Design system — colors, type, components

### CSS framework

- **Tailwind CSS v4** (using `@tailwindcss/postcss`)
- One global stylesheet: `app/globals.css`
- Plugin: `tw-animate-css` for the extra animation utilities

### Color tokens (Tailwind palette use)

The dashboard uses the **Tailwind default palette** (no custom colors), specifically:

| Use | Palette + shade |
|---|---|
| Backgrounds (light) | `slate-50` (main), `white` (cards) |
| Background (sidebar) | `slate-900` to `slate-950` gradient |
| Text primary | `slate-900` |
| Text secondary | `slate-500`, `slate-600` |
| Text tertiary / labels | `slate-400` |
| Borders | `slate-100`, `slate-200`, `gray-100`, `gray-200` |
| Primary action | `slate-900` (buttons, active states) |
| Success / In stock | `emerald-500`, `emerald-50` bg, `emerald-200` ring |
| Warning / Pending | `amber-500`, `amber-50` bg, `amber-200` ring |
| Danger / Sold out | `rose-500`, `rose-50` bg, `rose-200` ring |
| Info / Confirmed | `blue-500`, `blue-50` bg |
| Newsletter / Email channel | `rose-50`/`rose-200`/`rose-500` (rose family) |
| Tracked link / Promoter | `emerald-50`/`emerald-200`/`emerald-500` |
| Social channel | `purple-50`/`purple-200`/`purple-500` |
| Search channel | `blue-50`/`blue-200`/`blue-500` |
| Direct visit | `gray-50`/`gray-200`/`gray-500` |

### Typography

- Font stack: system stack (`-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif`) — no Google Fonts to keep CLS clean
- Sizes:
  - Page titles: `text-2xl` (1.75rem) `font-extrabold` `tracking-tight`
  - Section labels: `text-[11px]` `uppercase` `tracking-widest` `font-semibold`
  - Body: `text-sm` (14px)
  - Table cells: `text-sm`
  - Micro/meta: `text-[11px]`, `text-xs`
- All numeric stats use `tabular-nums` so digits line up

### Spacing rhythm

- Page padding: `px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14` + `py-5 sm:py-6 lg:py-8 xl:py-10`
- Section gaps: `gap-6 lg:gap-7 xl:gap-8`
- Card padding: `p-4 lg:p-5`
- Form field gap: `space-y-4`
- Grid gaps: `gap-2 lg:gap-3` (compact) or `gap-4 lg:gap-6` (loose)

### Required shared CSS classes (paste into `globals.css`)

```css
/* Page shell */
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 2200px;
  padding: 1.25rem 1rem 2rem;
}
@media (min-width: 1024px) {
  .admin-page { gap: 1.75rem; padding: 1.5rem 2rem 2rem; }
}
@media (min-width: 1536px) {
  .admin-page { gap: 2rem; padding: 2rem 2.5rem 2rem; }
}

.admin-page-title {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.admin-page-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.25rem;
}

/* Buttons */
.admin-btn-primary {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem; font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 0.75rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08), 0 8px 24px -8px rgba(15, 23, 42, 0.5);
  transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
}
.admin-btn-primary:hover { transform: translateY(-1px); }
.admin-btn-primary:active { transform: translateY(0); }

.admin-btn-secondary {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #fff; color: #0f172a;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  transition: all 180ms ease;
}
.admin-btn-secondary:hover { border-color: #94a3b8; background: #f8fafc; }

/* Card */
.admin-card {
  background: #fff;
  border-radius: 1rem;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px -4px rgba(15, 23, 42, 0.04);
  transition: box-shadow 200ms ease, transform 200ms ease;
}

/* Page-load animation */
@keyframes adminFadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.admin-fade-in {
  animation: adminFadeUp 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* Scoped thin scrollbar */
.admin-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
.admin-scrollbar::-webkit-scrollbar-track { background: transparent; }
.admin-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.15);
  border-radius: 4px;
}
.admin-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 23, 42, 0.3);
}

/* Sidebar dark variant */
.admin-sidebar {
  background:
    radial-gradient(circle at top right, rgba(99, 102, 241, 0.08), transparent 60%),
    linear-gradient(180deg, #0f172a 0%, #0a0f1e 100%);
}

/* Main content area soft tint */
.admin-main {
  background:
    radial-gradient(circle at 10% 0%, rgba(99, 102, 241, 0.04), transparent 50%),
    radial-gradient(circle at 90% 100%, rgba(168, 85, 247, 0.03), transparent 50%),
    #f8fafc;
}

/* Sidebar nav item */
.admin-nav-item { /* state classes applied conditionally in JSX */ }
```

### Component patterns (copy/paste templates)

**Stat card (KPI):**
```tsx
<div className="admin-card p-5">
  <div className="flex items-start justify-between mb-3">
    <div>
      <p className="text-[12px] font-medium text-slate-500">{label}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{period}</p>
    </div>
    {delta !== 0 && (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
        delta > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}>
        {delta > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(delta).toFixed(1)}%
      </span>
    )}
  </div>
  <p className="text-[26px] sm:text-[28px] font-semibold text-slate-900 tracking-tight tabular-nums">
    {value}
  </p>
  <p className="text-[11px] text-slate-500 mt-2">{subValue}</p>
</div>
```

**Status pill / badge:**
```tsx
<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${classes}`}>
  <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
  {label}
</span>
```
Color map (every channel/status uses the `bg-{color}-50` + `border-{color}-200` + `bg-{color}-500` for the dot pattern):
```
pending   → amber-{50,200,400}
confirmed → blue-{50,200,400}
shipped   → purple-{50,200,400}
delivered → green-{50,200,400}
cancelled → red-{50,200,400}

email/Newsletter → rose-{50,200,500}
tracked-link     → emerald-{50,200,500}
search           → blue-{50,200,500}
social           → purple-{50,200,500}
direct           → gray-{50,200,500}
internal         → amber-{50,200,500}
unknown          → gray-{50,200,400}
```

**Toggle chip row (filter):**
```tsx
{options.map(([key, label, activeBg, activeBorder]) => (
  <button
    key={key}
    onClick={() => setFilter(key)}
    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
      filter === key
        ? `${activeBg} ${activeBorder} shadow-sm`
        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
    }`}
  >{label}</button>
))}
```

**Form field block:**
```tsx
<label className="block">
  <span className="block text-xs font-medium text-gray-700 mb-1">{label}</span>
  <input
    type="text"
    value={v}
    onChange={(e) => setV(e.target.value)}
    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
  />
</label>
```

**Delete confirmation modal:**
```tsx
{deleteId && (
  <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 lg:p-8 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Trash2 className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-base font-semibold mb-1">Delete this item?</h3>
      <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
      <div className="flex gap-3">
        <button onClick={() => setDeleteId(null)} className="flex-1 admin-btn-secondary">Cancel</button>
        <button onClick={() => handleDelete(deleteId)} className="flex-1 admin-btn-primary !bg-red-600 !bg-none">Delete</button>
      </div>
    </div>
  </div>
)}
```

---

## 6. Reusable patterns that show up everywhere

1. **Server component for the page, client component for the table/form.** Page does the auth check and the initial DB read (Server Component). Then mounts a `"use client"` component with `initialProducts={products}` (or similar) as a prop. The client component manages search/filter/pagination state, refetches via `fetch("/api/admin/...")` for mutations.

2. **Every admin API route starts with `await isAuthenticated()`.** Returns `401` if false. No middleware shortcut.

3. **Soft delete = `archived: true`.** Real `DELETE` is only for newsletter subscribers / sessions / page views. Campaigns, promoters, products etc all archive.

4. **Optimistic UI on toggles + status changes.** Update local state first, fire fetch, revert on failure.

5. **`revalidatePath("/")` after every product/blog/announcement mutation.** Plus `pingIndexNow([url])` to nudge Bing/Yandex.

6. **Mobile/desktop split: card view + table view.** Same data, two layouts: `block lg:hidden` for the mobile cards, `hidden lg:block` for the desktop table.

7. **Pagination is 10 or 15 per page, client-side**, for everything under ~500 rows. Newsletter subscribers and orders use server-side pagination once over 500.

8. **All forms use uncontrolled HTML `<form>` + a single `onSubmit` handler.** No react-hook-form, no zod, no formik. The state is a single `useState<Settings>` object. Validation is `if (!field) return` + toast.

9. **Toggles save instantly (no Save button).** Pattern: optimistic update → fetch PUT → revert on error → show error toast for 3 seconds.

10. **Every external link in admin opens in a new tab with `target="_blank" rel="noopener"`.**

11. **Loading states are always `Loader2 className="animate-spin"`** in a centered flex container, not skeleton screens. Keeps the surface area small.

---

## 7. Section-by-section feature map

### 7.1  `/admin` — Dashboard home

**Purpose:** At-a-glance health check for the operator.

**Layout:** Single column of:
1. **4-stat KPI row** (Revenue 7d, Orders 7d, Visitors 7d, Conversion %). Each card has a delta badge comparing to previous 7d.
2. **Recent Orders mini-table** (8 rows, expandable).
3. **Inventory snapshot card** with stacked progress bars (In stock / Sold out) plus total products / newsletter subs / blog posts counters.
4. **Recent Products grid** (responsive 1→4 cols), each card linking to its edit page.

**Data sources (all read directly from Prisma in the server component):**
- `prisma.checkoutOrder.findMany({ where: { createdAt: { gte: weekAgo } } })`
- `prisma.pageView.count({ where: { createdAt: { gte: weekAgo } } })`
- `prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 12 })`
- `prisma.newsletterSubscriber.count({ where: { active: true } })`
- `prisma.blogPost.count({ where: { published: true } })`

**Tricky bits:**
- Revenue calculation parses the multi-line price string `$600/HP\n$1100/P` — pick the first line's numeric and multiply by quantity per item.
- Conversion rate = `orders / pageViews * 100`, clamp to 2 decimals.
- Time-ago helper: `"3m ago" | "2h ago" | "5d ago" | "Jan 12"`.

---

### 7.2  `/admin/products` — Products

**Purpose:** Inventory management.

**Page structure:**
- Header: title + product count subtitle + "Add Product" link
- `<CategoryVisibilityToggle />` — compact chip row, click any of the 10 categories to instantly hide them site-wide (saves via `/api/admin/category-visibility`)
- `<FlowerDescriptionToggle />` — one-click batch operation that auto-writes "Sold Out in red" descriptions to all FLOWER products in the $250-399 range and "Minimum 2 Pounds in red" to those in $500-800
- `<ProductsTable initialProducts={products} />` — client component

**ProductsTable features:**
- Search bar (name / category / status, fuzzy match)
- Category filter dropdown
- 10-per-page pagination
- Mobile: card view with thumbnail + title + price + sold-out toggle. Desktop: full table.
- Inline sold-out toggle (PUT `/api/admin/products/{id}` with `{ isSoldOut: bool }`) — optimistic
- Delete via confirmation modal
- Cloudinary thumbnail optimization via `optimizeImage(imageUrl, "thumbnail")`

**Product form (new + edit, lives in `ProductForm.tsx`):**

| Section | Fields |
|---|---|
| Basic info | `title*`, `category*` (enum), `description`, `rating` (default `"10/10"`), `slug` (auto-from-title via `lib/slug.ts`) |
| Pricing | `priceLocal*` (textarea, multi-line `$600/HP\n$1100/P`), `priceShip` (auto-calc OR manual), `slashedPriceLocal`, `slashedPriceShip`. Auto-calc rule: FLOWER ship = local + $100; others ship = local × 1.10 (configured in `lib/slashedPrice.ts`) |
| Media | Main `imageUrl` (FileUpload), `videoUrl` (FileUpload type=video), `images[]` (array of FileUpload, max 5) |
| Status | `indoor` (FLOWER only checkbox), `isSoldOut` |
| SEO (collapsible) | `metaTitle` (60 char), `metaDescription` (160 char), `metaKeywords`, `ogImage` |

After save: `POST /api/admin/products` (create) or `PUT /api/admin/products/[id]` (update). Server runs:
1. Validate
2. Upsert in DB
3. `revalidatePath("/")`, `revalidatePath("/product/${slug}")`
4. `pingIndexNow([${siteUrl}/product/${slug}])`

---

### 7.3  `/admin/orders` — Orders

**Purpose:** Process orders, see where customers came from.

**Layout:**
1. **Status filter row** — 5 quick-filter pills: All / Pending / Confirmed / Shipped / Delivered. Each shows count. Selected pill has a ring.
2. **Source filter row** (NEW; this is the differentiator from generic admin templates) — 6 pills: All / Newsletter / Tracked / Social / Search / Direct. Click any to filter. Counts are live.
3. **Search bar** — searches name, email, order #, city, country.
4. **Refresh button** — manual re-fetch.
5. **Orders list** — each row collapsible. Row shows status dot + customer name + order # (`-XXXXXXXX` last 8 in monospace) + Fast-Order badge if telegram-source + location + total + status badge + payment method + time ago + chevron.

**Expanded row shows:**
- Full delivery address
- All line items with thumbnails, prices, quantities, deliveryType (`local | ship`)
- IP location (city/state/country/zip) vs declared address — flag mismatches
- Payment method, shipping carrier, delivery notes
- **Order source card** showing:
  - Channel badge (rose for Newsletter, emerald for Tracked, etc.)
  - Source string (e.g. `"Newsletter: Sour Slurpee Drop"`)
  - UTM params (source/medium/campaign)
  - Promoter name if linked
  - Entry page URL
  - Page-view count + time-on-site label
  - Long-form verdict paragraph explaining the attribution
- Inline status dropdown (5 options, PATCH `/api/admin/orders` with `{id, status}`)
- Inline delete button (with confirmation modal)

**API:**
- `GET /api/admin/orders` — pulls both `CheckoutOrder` and `Order` rows, merges them, dedupes (same sessionId within 5 minutes = same order logged twice — drop the `Order` row), then attaches an `attribution` object via `lib/orderAttribution.ts`
- `PATCH /api/admin/orders` body `{id, status}` — updates status
- `DELETE /api/admin/orders?id=...` — hard delete

**Source attribution logic (`lib/orderAttribution.ts`):**

For a given `sessionId`:
1. Look up `CampaignClick` rows. If any → channel = `email` (when utmMedium=email or utmSource=newsletter) or `tracked-link` otherwise, source = campaign name.
2. Else look up the first `PageView` for that session. Check the page URL for UTM params (`extractUtm()`):
   - If `utmSource` present → match against `Campaign` table to find name. If `utmMedium === "email"` or `utmSource === "newsletter"` → channel `email`. Else `tracked-link`.
3. Else categorize by `refererDomain`:
   - `realduckdistro.com` → `internal`
   - `google.*` / `bing.*` / `duckduckgo.*` → `search`
   - `instagram` / `t.me` / `facebook` / `tiktok` / `reddit` / etc → `social`
   - Empty → `direct`
   - Anything else → `unknown` with source `"Referral: <domain>"`
4. Return `{ channel, source, utmSource, utmMedium, utmCampaign, campaignName, promoterName, entryPage, refererDomain, pageViewCount, firstSeenAt, lastSeenAt, timeOnSiteSeconds, timeOnSiteLabel, verdict }`.

---

### 7.4  `/admin/blog` — Blog posts

**Purpose:** Long-form content publishing.

**Page structure:**
- Header: title + counts (`5 total · 3 published · 2 drafts`) + "New Post" button
- Desktop table: thumbnail / title+author / category / publish toggle / date / actions (edit, delete)
- Mobile cards: similar info stacked

**Toggle publish** without leaving the list: PUT `/api/admin/blog/[id]` with `{ published: bool }`. Optimistic.

**BlogForm (used by new + edit):**

| Section | Fields |
|---|---|
| Title block | `title*`, `subtitle` |
| Meta | `category*` (4-enum), `author` (default "Real Duck Distro") |
| Media | `imageUrl` (cover, FileUpload), `images[]` (up to 5 via FileUpload) |
| Content | `excerpt` (textarea — auto-generated from content if empty), `content*` (large textarea, markdown-supported on the render side) |
| Tags | text input + Add button, tags shown as removable pills |
| Status | `published`, `featured` checkboxes |
| SEO | `metaTitle`, `metaDescription`, `metaKeywords`, `ogImage` |

**On save:** revalidatePath blog routes + ping IndexNow.

---

### 7.5  `/admin/announcements` — Announcements

**Purpose:** Operator-pushed banners + push notifications.

**Page structure:**
- Header + "New" button
- List of announcement cards: bell icon (green published / gray draft), title, message (line-clamp-1), status badges (Published / Draft / Scheduled with date / Pushed-with-checkmark), action buttons (Send Push if published-and-not-pushed, Edit, Delete)

**Form fields:**
- `title*`, `message*` (short — shown in push), `content` (long), `imageUrl`, `link` (custom deep-link, defaults to `/announcements`), `published`, `scheduledAt` (datetime), `sendPush` (checkbox)

**Logic:**
- If `scheduledAt` is in the future and `sendPush` is unchecked → force `published: false` (so it doesn't go public early)
- "Send push" action triggers `fanOutPush(announcement)` — iterates all active `PushSubscription` rows, sends in parallel via `web-push`, marks `410 Gone` results as inactive, sets `pushed: true` + `pushSentAt: now`.

---

### 7.6  `/admin/newsletter` — Subscribers

**Purpose:** Email list management.

**Page structure:**
- Header: title + "Export CSV" button
- 3 stat cards: Total / Active / Inactive
- Filter row: search by email + status dropdown (All / Active / Inactive)
- Desktop table: Email / Status pill / Source / Location+Device / Joined-time-ago / Actions
- Mobile cards: same data stacked
- 15-per-page pagination

**Actions per row:**
- Toggle active (PATCH `/api/admin/newsletter/[id]` body `{ active: bool }`)
- Delete (DELETE `/api/admin/newsletter/[id]`)

**CSV export:** `GET /api/admin/newsletter?format=csv&...` returns text/csv attachment. Respects current search + status filter.

**Newsletter blasts (offline script):**
- `_send_newsletter_campaign.ts` — Resend-backed sender
- Loads SMTP not from settings (transactional path) but from `RESEND_API_KEY` env
- Sends from `<newsletter@your-verified-root-domain.com>`
- Headers include `List-Unsubscribe` + `List-Unsubscribe-Post: One-Click` for Gmail inbox placement
- Modes: `--preview` (write HTML to disk), `--test you@email.com`, `--send` (blast active list)
- Tracks each send with a tag `{ campaign, product }`

---

### 7.7  `/admin/links` — Promoter + campaign tracker

**Purpose:** UTM-tagged short-link issuer + attribution analytics.

**Page structure:**
- 4 KPI cards: total clicks / unique sessions / attributed orders / attributed revenue (team-wide)
- **Promoters section:** expandable rows. Each row = a promoter (with initials avatar, name, totals). Expanding reveals their campaigns.
- **Standalone campaigns section:** campaigns not assigned to any promoter
- Each campaign row: name, utm_source/utm_medium, click count, unique sessions, orders, revenue, copy-link button, archive button

**Click flow:** Each campaign has a short-link `/r/{slug}`. The `/r/[slug]/route.ts` redirect:
1. Look up `Campaign` by slug
2. Insert `CampaignClick` row with sessionId, IP geo, UA parsed
3. 302 redirect to `${destination}?utm_source=...&utm_medium=...&utm_campaign=...&utm_content=...`

This is what lets newsletter clicks AND social clicks both feed the same attribution table.

**APIs:** `GET/POST /api/admin/promoters`, `GET/POST /api/admin/campaigns`, `PUT/DELETE /api/admin/campaigns/[id]` (archive on DELETE), same for promoters.

---

### 7.8  `/admin/analytics` — Deep analytics

**Purpose:** Period-over-period traffic, conversion, geography.

**Tabs:** 24h / 7d / 30d / 90d.

**Cards & charts:**
- Animated number KPIs (Total visits, Orders, Conversion %, Revenue)
- Traffic trend chart (recharts area chart) of page views + product views over the period
- **Top products** ranked by view count, with thumbnail + price + sold-out status
- Device breakdown (mobile / desktop / tablet) pie
- Browser breakdown bar chart
- Top referrers table
- **Traffic channels breakdown** (5-way) with color pills + top sources per channel
- Geographic table (orders by country)
- Recent orders mini-table
- Inventory snapshot

**API:** `GET /api/admin/analytics?days=7` returns one fat object with all aggregations. The page is pure render.

---

### 7.9  `/admin/pwa` — PWA + Push subscriber analytics

**Purpose:** Track app installs and discount redemption.

**Sections:**
- Hero stat: `activeInstalls30d` with retention % and 7-day breakdown
- 6-stat grid: Installs / Subscribers Active / Inactive / Total Subs / Discounts Used / Discounts Available
- 4 breakdown cards: Active Installs by Country / Active Installs by Device / All-time Installs by Device / All-time Installs by Country
- Recent Installs scrollable list (newest first, with discount-used badge)
- Recent Subscribers scrollable list (device/OS/country)

**API:** `GET /api/admin/pwa` returns the aggregated `PwaData` object. Read-only.

---

### 7.10  `/admin/settings` — Site configuration

**Purpose:** Configure outbound channels, payment-rail messaging, and SMTP.

**Layout:** Sidebar (3 sections) + main panel with sticky save bar.

**Sections:**
1. **Social & contact links** — 7 url/tel inputs: telegramOrder, telegramChannel, snapchatLink, signalLink, tiktokLink, phoneNumber, potatoChat
2. **Telegram bot** — `telegramBotToken` (secret with eye toggle), `telegramChatId` (negative for groups)
3. **Email & SMTP** — `companyEmail`, `adminEmail`, `smtpHost`, `smtpPort`, `smtpUser`, `smtpPassword` (secret)

**Save:** `PUT /api/admin/settings` sends entire `Settings` object. Server upserts each key into `SiteSetting` table. Empty values delete the row (so it falls back to env defaults).

---

## 8. Database schema — every model

Below is the **Prisma schema** in its entirety, grouped by feature area. Drop into `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ────────────────────────────────
// Enums
// ────────────────────────────────

enum Category {
  FLOWER
  TOP_SHELF
  EDIBLES
  CONCENTRATES
  PREROLLS
  MUSHROOM
  DISPOSABLES
  PILLS
  COKE
  OTHERS
}

enum BlogCategory {
  EDUCATION
  HOW_TO
  IMPORTANCE
  HEALTH_MEDICINAL
}

// ────────────────────────────────
// Auth
// ────────────────────────────────

model AdminSession {
  id        String   @id @default(cuid())
  token     String   @unique
  username  String
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([token])
  @@index([expiresAt])
}

// ────────────────────────────────
// Catalog
// ────────────────────────────────

model Product {
  id                String     @id @default(cuid())
  slug              String?    @unique
  title             String
  description       String?
  category          Category
  indoor            Boolean    @default(true)
  rating            String     @default("10/10")
  priceLocal        String
  priceShip         String
  slashedPriceLocal String?
  slashedPriceShip  String?
  isSoldOut         Boolean    @default(false)
  imageUrl          String
  images            String[]   @default([])
  videoUrl          String?
  metaTitle         String?
  metaDescription   String?
  metaKeywords      String?
  ogImage           String?
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  views             ProductView[]

  @@index([slug])
  @@index([category])
  @@index([createdAt])
}

model ProductView {
  id            String   @id @default(cuid())
  productId     String
  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  userAgent     String?
  referer       String?
  refererDomain String?
  sessionId     String?
  device        String?
  browser       String?
  os            String?
  createdAt     DateTime @default(now())

  @@index([productId])
  @@index([createdAt])
  @@index([sessionId])
}

// ────────────────────────────────
// Orders
// ────────────────────────────────

model CheckoutOrder {
  id             String   @id @default(cuid())
  orderNumber    String   @unique
  sessionId      String?
  firstName      String
  lastName       String
  email          String
  phone          String
  address        String
  apartment      String?
  city           String
  state          String
  zipCode        String
  country        String   @default("United States")
  items          Json
  totalItems     Int
  paymentMethod  String
  shippingMethod String?
  pwaDiscount    Boolean  @default(false)
  deliveryNotes  String?
  ipCountry      String?
  ipState        String?
  ipCity         String?
  ipZip          String?
  ipAddress      String?
  orderSource    String   @default("email")
  status         String   @default("pending")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([email])
  @@index([orderNumber])
  @@index([createdAt])
  @@index([status])
}

model Order {
  id           String   @id @default(cuid())
  sessionId    String
  productId    String?
  productTitle String
  category     String
  price        String
  deliveryType String
  quantity     Int      @default(1)
  country      String?
  state        String?
  city         String?
  zip          String?
  ip           String?
  device       String?
  browser      String?
  os           String?
  createdAt    DateTime @default(now())

  @@index([sessionId])
  @@index([createdAt])
}

// ────────────────────────────────
// Content
// ────────────────────────────────

model BlogPost {
  id              String       @id @default(cuid())
  slug            String       @unique
  title           String
  subtitle        String?
  category        BlogCategory
  content         String
  excerpt         String?
  imageUrl        String
  images          String[]     @default([])
  author          String       @default("Real Duck Distro")
  published       Boolean      @default(false)
  featured        Boolean      @default(false)
  tags            String[]     @default([])
  metaTitle       String?
  metaDescription String?
  metaKeywords    String?
  ogImage         String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([category])
  @@index([published])
  @@index([createdAt])
  @@index([slug])
}

model Announcement {
  id          String    @id @default(cuid())
  title       String
  message     String
  content     String
  imageUrl    String?
  link        String?
  published   Boolean   @default(false)
  scheduledAt DateTime?
  pushed      Boolean   @default(false)
  pushSentAt  DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([published])
  @@index([scheduledAt])
}

// ────────────────────────────────
// Analytics + tracking
// ────────────────────────────────

model PageView {
  id            String   @id @default(cuid())
  page          String
  userAgent     String?
  referer       String?
  refererDomain String?
  sessionId     String?
  device        String?
  browser       String?
  os            String?
  country       String?
  city          String?
  createdAt     DateTime @default(now())

  @@index([page])
  @@index([createdAt])
  @@index([sessionId])
}

model Promoter {
  id        String     @id @default(cuid())
  slug      String     @unique
  name      String
  email     String?
  notes     String?
  archived  Boolean    @default(false)
  createdAt DateTime   @default(now())
  campaigns Campaign[]

  @@index([archived])
}

model Campaign {
  id          String          @id @default(cuid())
  slug        String          @unique
  name        String
  purpose     String?
  destination String
  utmSource   String
  utmMedium   String
  utmCampaign String?
  utmContent  String?
  utmTerm     String?
  archived    Boolean         @default(false)
  createdAt   DateTime        @default(now())
  promoterId  String?
  promoter    Promoter?       @relation(fields: [promoterId], references: [id], onDelete: SetNull)
  clicks      CampaignClick[]

  @@index([archived])
  @@index([createdAt])
  @@index([promoterId])
}

model CampaignClick {
  id         String   @id @default(cuid())
  campaignId String
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  sessionId  String?
  ip         String?
  country    String?
  city       String?
  device     String?
  browser    String?
  os         String?
  referer    String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([campaignId])
  @@index([sessionId])
}

// ────────────────────────────────
// Push / PWA
// ────────────────────────────────

model PushSubscription {
  id        String   @id @default(cuid())
  endpoint  String   @unique
  p256dh    String
  auth      String
  sessionId String?
  device    String?
  browser   String?
  os        String?
  country   String?
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([active])
}

model PwaInstall {
  id                      String    @id @default(cuid())
  sessionId               String    @unique
  fingerprint             String?
  device                  String?
  browser                 String?
  os                      String?
  country                 String?
  discountUsed            Boolean   @default(false)
  notificationsEnabled    Boolean   @default(false)
  notificationsAcceptedAt DateTime?
  lastOpenedAt            DateTime?
  createdAt               DateTime  @default(now())

  @@index([sessionId])
  @@index([notificationsEnabled])
}

// ────────────────────────────────
// Newsletter
// ────────────────────────────────

model NewsletterSubscriber {
  id             String    @id @default(cuid())
  email          String    @unique
  active         Boolean   @default(true)
  source         String?
  sessionId      String?
  ipAddress      String?
  country        String?
  device         String?
  browser        String?
  os             String?
  confirmedAt    DateTime?
  unsubscribedAt DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([active])
  @@index([createdAt])
}

// ────────────────────────────────
// Config
// ────────────────────────────────

model SiteSetting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}

model DeletedSlug {
  id        String   @id @default(cuid())
  slug      String   @unique
  kind      String
  title     String?
  deletedAt DateTime @default(now())

  @@index([slug])
  @@index([kind])
}
```

---

## 9. External services & integrations

| Service | Purpose | Files |
|---|---|---|
| **Cloudflare R2** | Image + video storage | `lib/r2.ts` (presigned URL builder), `app/api/admin/upload-url/route.ts`, `app/admin/components/FileUpload.tsx` |
| **IndexNow** | Bing/Yandex re-crawl ping | `lib/indexNow.ts`. Key file at `/public/<key>.txt`. Canonicalize host to `www.` |
| **web-push** | Browser push notifications | `lib/webpush.ts`. VAPID keys in env. `fanOutPush()` sends to all active subscribers, marks 410s inactive |
| **Resend** | Newsletter blasts | `_send_newsletter_campaign.ts`. From a verified root domain. DKIM + SPF + MX records required |
| **nodemailer** | Transactional email (order confirmations, welcome) | SMTP creds from SiteSetting (or env fallback) via `lib/adminConfig.ts` |
| **Telegram Bot API** | Order notifications to operator | `app/api/orders/telegram/route.ts` calls `sendMessage` directly. Bot token + chat ID in SiteSetting |
| **Cloudinary** | Thumbnail URL transforms | `lib/cloudinary.ts` `optimizeImage()` rewrites R2 URLs to Cloudinary fetch URLs |

---

## 10. The 15-step implementation guide

Each step is sized to fit one focused commit (1-4 hours of work). Do them in order.

### Step 1 — Project skeleton

```bash
npx create-next-app@14 my-admin --typescript --tailwind --app --no-src-dir --no-eslint
cd my-admin
npm install @prisma/client prisma lucide-react
npm install -D @types/node
npx prisma init
```

Configure `tsconfig.json` strict mode. Add `tailwind.config.ts` (default works). Add `@import "tailwindcss";` and `@import "tw-animate-css";` to `app/globals.css`. Add the `admin-*` classes from Section 5.

**Done when:** `npm run dev` renders the default Next.js page at `localhost:3000`.

### Step 2 — Database + Prisma schema

Provision Postgres (Neon free tier). Set `DATABASE_URL` in `.env`. Paste the **entire schema from Section 8** into `prisma/schema.prisma`. Run:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Create `lib/prisma.ts` with the singleton client (see Section 4 — paste the exact code).

**Done when:** `npx prisma studio` opens and shows all the empty tables.

### Step 3 — Auth helpers + login route + middleware

- Add `lib/auth.ts` (paste verbatim from Section 4)
- Add `lib/rateLimit.ts` (a 30-line in-memory map keyed by `${prefix}:${ip}` with sliding window)
- Add `app/api/admin/login/route.ts` and `app/api/admin/logout/route.ts`
- Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
- Skip middleware for now (we don't use it for auth)

**Done when:** POST `/api/admin/login` with correct creds returns `{success:true}` and sets the cookie.

### Step 4 — Admin layout shell

- Create `app/admin/layout.tsx` (paste from Section 4)
- Create `app/admin/context/SidebarContext.tsx` (paste from Section 4)
- Create `app/admin/components/AdminSidebar.tsx` with the `navGroups` array (paste from Section 4)
- Create `app/admin/login/page.tsx` — a client component with a simple form that POSTs to `/api/admin/login`, on success calls `router.push("/admin")` + `router.refresh()`

**Done when:** `/admin/login` shows a form; submitting valid creds redirects to a (currently empty) `/admin` with the sidebar visible.

### Step 5 — Dashboard home

Create `app/admin/page.tsx` as a server component. Run the 5 Prisma queries from Section 7.1. Build the 4 KPI cards + recent orders mini-table + inventory snapshot + recent products grid using the patterns in Section 5.

**Done when:** `/admin` shows KPIs (all zeros initially), an empty orders table, and an empty product grid.

### Step 6 — Products: list + form + API + R2 upload

This is the biggest step. Break it into substeps:

1. Create `lib/r2.ts` with `getPresignedUploadUrl({ filename, contentType, slug? })`. Uses `@aws-sdk/client-s3` configured for R2. Returns `{ uploadUrl, publicUrl }`.
2. Create `app/api/admin/upload-url/route.ts` — POST `{ filename, contentType, slug? }` → presigned URL.
3. Create `app/admin/components/FileUpload.tsx` (full code: a button that opens a hidden `<input type="file">`, on change fetches a presigned URL, then `XMLHttpRequest.send(file)` directly to R2 with progress tracking, then calls `onChange(publicUrl)`).
4. Create `app/api/admin/products/route.ts` (GET list, POST create) and `app/api/admin/products/[id]/route.ts` (GET/PUT/DELETE).
5. Create `app/admin/products/page.tsx` (server) + `app/admin/products/components/ProductsTable.tsx` (client) + `ProductForm.tsx`.
6. Add `lib/slug.ts` (kebab-case slugifier) and `lib/slashedPrice.ts` (auto-calc rules).
7. Wire `revalidatePath` + `pingIndexNow` to product mutations.

**Done when:** You can create, edit, delete a product, and the image upload to R2 works (file appears in your R2 bucket).

### Step 7 — Orders: list + status + attribution

1. Create `lib/orderAttribution.ts` (paste verbatim from Section 7.3 logic).
2. Create `app/api/admin/orders/route.ts` (GET merges CheckoutOrder + Order + attaches attribution; PATCH updates status; DELETE removes).
3. Create `app/admin/orders/components/OrdersTable.tsx` — search, status filter row, **source filter chips** (the differentiator), expandable rows, inline status dropdown.
4. Create `app/admin/orders/page.tsx` (server wrapper).
5. Add Order schema indexes if not already.

**Done when:** Orders list shows mock data with channel badges. Manually insert a fake `Campaign` + `CampaignClick` + `Order` and verify the source verdict renders correctly.

### Step 8 — Blog: list + form + markdown

1. `app/api/admin/blog/route.ts` (GET/POST) + `[id]/route.ts` (PUT/DELETE).
2. `app/admin/blog/page.tsx` — list with publish toggle.
3. `app/admin/blog/components/BlogForm.tsx` — same shape as ProductForm but with markdown content textarea + tags input + 4-enum category dropdown.
4. On publish/unpublish: ping IndexNow.

**Done when:** Create a blog post with cover image, mark it published, IndexNow gets pinged.

### Step 9 — Announcements + web push

1. `lib/webpush.ts` — initialize `web-push` with VAPID keys, expose `fanOutPush(announcement)` that:
   - Loads all `PushSubscription where active=true`
   - Builds notification payload `{ title, body, icon, url }`
   - Sends in parallel via `Promise.allSettled`
   - Marks 410 results as `active: false`
2. `app/api/admin/announcements/route.ts` + `[id]/route.ts`. The PUT route accepts `sendPush: true` to trigger fan-out.
3. `app/admin/announcements/page.tsx` (list with Send Push button).
4. `app/admin/announcements/new/page.tsx` and `[id]/edit/page.tsx`.

**Done when:** Subscribe to push on the public site, create an announcement with "send push", get the notification.

### Step 10 — Newsletter list + CSV export + Resend campaign

1. `app/api/admin/newsletter/route.ts` — GET (list with `?q=`, `?status=`, `?format=csv` for export).
2. `app/api/admin/newsletter/[id]/route.ts` — PATCH toggle active, DELETE remove.
3. `app/admin/newsletter/page.tsx` — stat cards + table + CSV export button.
4. Sign up for Resend; verify your domain (DKIM `resend._domainkey` + MX `send` + SPF `send` at root domain).
5. Add `RESEND_API_KEY` to `.env`. Install `resend` package.
6. Build a script `scripts/send_campaign.ts` modeled on `_send_newsletter_campaign.ts` — uses `from: "Brand <newsletter@yourroot.com>"`, deliverability headers (`List-Unsubscribe`, `List-Unsubscribe-Post`), and the same minimal-promotional HTML template that lands in Primary inbox.

**Done when:** You can blast a test email to your own address via Resend, and it lands in Primary (not Promotions).

### Step 11 — Promoter + Campaign link tracking

1. Add `lib/slug.ts` if not done.
2. `app/api/admin/promoters/route.ts` + `[id]/route.ts` (archive on DELETE).
3. `app/api/admin/campaigns/route.ts` + `[id]/route.ts`.
4. `app/r/[slug]/route.ts` — the public-facing redirect:
   - Look up `Campaign` by slug
   - Insert `CampaignClick` row
   - 302 redirect with UTM params appended
5. `app/admin/links/page.tsx` (server) + `LinksClient.tsx` (client with expandable promoter list, KPI strip, copy-to-clipboard).

**Done when:** Create a promoter "John" + campaign "ig-bio" → destination `/`. Visit `/r/ig-bio` → see UTMs in the URL. Refresh admin → click count is 1.

### Step 12 — Analytics dashboard

1. Add `recharts` package.
2. `app/api/admin/analytics/route.ts` — accepts `?days=N`, runs a wall of `groupBy` + `count` queries against `PageView`, `ProductView`, `CheckoutOrder`, `CampaignClick`. Returns the unified `AnalyticsData` object.
3. `app/admin/analytics/page.tsx` — client component that fetches on mount + tab change. Renders the KPI cards, traffic trend line chart, device/browser/referrer breakdowns, channels card, geographic table.
4. Animated counters: use a small `useAnimatedNumber(target, duration=800)` hook.

**Done when:** With some seed data, the page shows real charts.

### Step 13 — Settings + Category visibility + Flower descriptions

1. `lib/adminConfig.ts` — reads `SiteSetting` rows, falls back to env vars, returns typed object.
2. `lib/categoryVisibility.ts` — reads the `hiddenCategories` key from SiteSetting, 60-second in-memory cache, exposes `getHiddenCategories()` and `invalidateHiddenCategoriesCache()`.
3. `app/api/admin/settings/route.ts` (GET + PUT all settings keys).
4. `app/api/admin/category-visibility/route.ts` (dedicated GET + PUT for the toggle).
5. `app/api/admin/products/flower-descriptions/route.ts` — POST `action=apply|revert` batch-updates description fields.
6. `app/admin/settings/page.tsx` — 3-section form with sticky save bar (paste structure from Section 7.10).
7. `app/admin/products/components/CategoryVisibilityToggle.tsx` — compact chip row with auto-save on click.
8. `app/admin/products/components/FlowerDescriptionToggle.tsx`.

**Done when:** Toggling DISPOSABLES off in admin makes all disposable products disappear from `/` (homepage) and return 404 on direct URL.

### Step 14 — PWA & push subscriber dashboard

1. `app/api/admin/pwa/route.ts` — aggregates PwaInstall + PushSubscription + Gift (if you have a discount-code model).
2. `app/admin/pwa/page.tsx` — hero stat + 6-stat grid + 4 breakdown cards + recent lists. Read-only.

**Done when:** With some PWA installs, the page shows retention % + country/device breakdowns.

### Step 15 — Wiring, polish, deployment

1. **Middleware for deleted-slug 410 Gone:** `middleware.ts` checks if request path matches a `DeletedSlug.slug`. If yes, return 410.
2. **IndexNow key file:** `public/<your-key>.txt` with the key as content. Verify it serves at `https://www.yoursite.com/<key>.txt`.
3. **Sitemap + news.xml:** `app/sitemap.ts` reads products + blogs + announcements + filters hidden categories. `app/news.xml/route.ts` returns Google News-formatted sitemap for the last 48h of blogs.
4. **Robots.txt:** simple `/admin/`, `/api/` disallow + sitemap URL.
5. **Vercel deployment:**
   - Add all env vars
   - Set NODE_VERSION to 18+
   - Add Cron Job (if needed): `0 0 * * *` → `/api/cron/cleanup-sessions` to delete expired AdminSession rows
6. **DNS:**
   - Apex → www redirect (Vercel handles it automatically if you add both)
   - DKIM, SPF, MX for Resend
   - IndexNow key TXT verification (none needed — file-based)
7. **Final smoke tests:**
   - Log in, log out
   - Create a product → see it on homepage
   - Place a fake order via the public site → see it in /admin/orders with correct attribution
   - Send a push notification
   - Send a Resend test email
   - Filter orders by "Newsletter" channel

**Done when:** Production URL works, admin login works, all 10 admin sections render and persist data.

---

## 11. Final notes & gotchas

1. **Neon serverless DB has cold-start latency.** First request after idle can take 2–5 seconds. Either wrap your Prisma queries in a retry helper or accept the latency on cold load. Don't expose this to public-facing first-byte time — use Prisma Accelerate or another connection pool if you scale.

2. **Hostinger / cheap SMTP cannot deliver bulk mail to Gmail.** Their IP reputation is terrible. Use it for transactional only. For newsletters, **always use Resend** (or SendGrid, Mailgun, Postmark). Even with perfect SPF/DKIM/DMARC, Gmail silently drops bulk mail from shared-hosting IPs.

3. **The "newsletter from Primary inbox" copy strategy:**
   - Subject without emojis or "drop"/"deal"/"%off"
   - Plain-letter feel ("Hi,...— Real Duck Distro")
   - Max 2 images, no gradient banner
   - Headers: `List-Unsubscribe` + `List-Unsubscribe-Post: One-Click`
   - From a `newsletter@yourdomain.com` not a `noreply@`
   - Sender domain must have DKIM aligned with the `From` header
   - First send to any recipient may still hit Promotions — Gmail learns after 1-2 sends + interactions

4. **The `email` channel in `orderAttribution.ts`** is matched on BOTH `utmMedium === "email"` AND `utmSource === "newsletter"`. Either triggers. This is intentional so legacy campaigns tagged either way show up correctly.

5. **Disposables business rule lives in `lib/orderRules.ts`** as `DISPOSABLES_MIN_QUANTITY`. Both client (cart, product card, product detail) and server (checkout + telegram order routes) reference it. Change once, applies everywhere — but check the client constants aren't hard-coded duplicates.

6. **Category visibility check happens in:** homepage query, sitemap query, product detail page (404 if hidden). It does NOT filter related products inside another product's "you may also like" list because that list is same-category — so if category is hidden, the parent page 404'd already.

7. **Image optimization gotcha:** Cloudinary's fetch transformation goes through `cloudinary.com/your-cloud/image/fetch/...`. It pulls FROM your R2 URL, caches it, serves WebP. Don't accidentally double-optimize. The pattern is "R2 stores the original, Cloudinary serves the thumbnail."

8. **Always run typecheck before committing:** `npx tsc --noEmit`. The schema-derived types from Prisma will catch most data-shape mistakes for you.

9. **For the "differentiate clients by source" feature specifically:** The flow is `email click → utm params in URL → page view records URL → order placed → orderAttribution.ts reads page view's URL → returns channel "email" with verdict "This order came from your email newsletter"`. The admin orders table shows the rose badge + filter chip. That's the entire chain.

10. **`revalidatePath` is per-process** in Vercel. On a multi-instance deploy, content updates won't appear instantly on all servers — but the `revalidate = 60` directive on pages ensures all clients see the change within a minute. Don't fight this; it's acceptable for an e-commerce admin where freshness is measured in minutes.

---

## End of blueprint

Reading this top-to-bottom takes ~45 minutes. Implementing in order takes 5-10 days of focused work for an experienced Next.js dev. The result is a turnkey admin dashboard that handles every common e-commerce operator need without external dependencies beyond the listed third-party services.

**Hand this to the next Claude. It has everything.**
