/**
 * Index-status checker using Bing Webmaster Tools API.
 *
 * HTML scraping of Bing/Google search results is unreliable in 2026
 * (bot-detection strips results, DDG throttles, Google CAPTCHAs).
 * The only reliable path is the official BWT API, which returns exact
 * indexed-status per URL.
 *
 * SETUP (30 seconds, free):
 *   1. Go to https://www.bing.com/webmasters → Settings (gear icon)
 *   2. Click "API Access"
 *   3. Generate an API key
 *   4. Add to .env:  BING_WEBMASTER_API_KEY=<your-key>
 *   5. Run this script
 *
 * Usage:
 *   npx tsx ./_check_indexing.ts                  # check all 207 URLs
 *   npx tsx ./_check_indexing.ts --limit 20       # first 20
 *   npx tsx ./_check_indexing.ts --category blogs # blogs only
 *
 * Output files:
 *   _indexing_report.csv         — full report: url,is_indexed,checked_at
 *   _not_indexed_bing.txt        — URLs missing from Bing's index
 *
 * Quota: 1,000 calls/day on free tier. 207 URLs fits easily.
 * Runtime: ~3 min for 207 URLs (1s between calls).
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import { writeFile, appendFile } from "fs/promises";
import { prisma } from "./lib/prisma";

const SITE = "https://www.realduckdistro.com";
const SITE_HOST = "www.realduckdistro.com";
const API_KEY = process.env.BING_WEBMASTER_API_KEY;

const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX !== -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : Infinity;
const CAT_IDX = process.argv.indexOf("--category");
const CATEGORY = CAT_IDX !== -1 ? process.argv[CAT_IDX + 1] : "all";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface UrlInfoResponse {
  d?: {
    IsIndexed?: boolean;
    DocumentDownloaded?: boolean;
    HttpStatusCode?: number;
    CrawlErrorCode?: number;
    LastCrawledDate?: string;
  };
}

async function checkBingIndex(url: string): Promise<{ isIndexed: boolean | null; err?: string }> {
  if (!API_KEY) return { isIndexed: null, err: "no_api_key" };
  try {
    const endpoint = `https://ssl.bing.com/webmaster/api.svc/json/GetUrlInfo?apikey=${API_KEY}&siteUrl=${encodeURIComponent(SITE)}&url=${encodeURIComponent(url)}`;
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return { isIndexed: null, err: `http_${res.status}` };
    const data = (await res.json()) as UrlInfoResponse;
    if (data.d?.IsIndexed === true) return { isIndexed: true };
    if (data.d?.IsIndexed === false) return { isIndexed: false };
    return { isIndexed: null, err: "no_data" };
  } catch (e) {
    return { isIndexed: null, err: (e as Error).message };
  }
}

async function buildUrlList(): Promise<string[]> {
  const STATIC = [`${SITE}/`, `${SITE}/about`, `${SITE}/blog`, `${SITE}/announcements`];
  const products = await prisma.product.findMany({
    where: { slug: { not: null } },
    select: { slug: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const blogs = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  if (CATEGORY === "blogs") return blogs.map((b) => `${SITE}/blog/${b.slug}`).slice(0, LIMIT);
  if (CATEGORY === "products") return products.map((p) => `${SITE}/product/${p.slug}`).slice(0, LIMIT);
  if (CATEGORY === "static") return STATIC.slice(0, LIMIT);

  return [
    ...STATIC,
    ...blogs.map((b) => `${SITE}/blog/${b.slug}`),
    ...products.map((p) => `${SITE}/product/${p.slug}`),
  ].slice(0, LIMIT);
}

async function main() {
  if (!API_KEY) {
    console.log(`\n❌ Missing BING_WEBMASTER_API_KEY in .env\n`);
    console.log(`SETUP (30 seconds):`);
    console.log(`  1. Open https://www.bing.com/webmasters`);
    console.log(`  2. Settings (⚙) → API Access → Generate API key`);
    console.log(`  3. Add this line to /home/wice2/Desktop/projects/realduck/.env:`);
    console.log(`       BING_WEBMASTER_API_KEY=<paste-your-key-here>`);
    console.log(`  4. Re-run this script\n`);
    console.log(`Note: Bing Webmaster site must be verified for ${SITE_HOST} first.`);
    console.log(`If you see your site in https://www.bing.com/webmasters, you're verified.\n`);
    process.exit(1);
  }

  const urls = await buildUrlList();
  console.log(`\n🔎 Checking ${urls.length} URLs via Bing Webmaster API`);
  console.log(`   Quota: ~1,000/day on free tier  •  Estimated runtime: ${Math.ceil(urls.length * 1.2 / 60)} min\n`);

  const csvPath = "./_indexing_report.csv";
  await writeFile(csvPath, "url,is_indexed,checked_at,error\n");

  const notIndexed: string[] = [];
  let yesCount = 0, noCount = 0, errCount = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const { isIndexed, err } = await checkBingIndex(url);
    const checkedAt = new Date().toISOString();
    const status = isIndexed === true ? "yes" : isIndexed === false ? "no" : "?";
    await appendFile(csvPath, `${url},${status},${checkedAt},${err || ""}\n`);

    if (isIndexed === true) yesCount++;
    else if (isIndexed === false) { noCount++; notIndexed.push(url); }
    else errCount++;

    const flag = isIndexed === true ? "✅" : isIndexed === false ? "❌" : "❓";
    console.log(`  ${String(i + 1).padStart(3)}/${urls.length}  ${flag}  ${status.padEnd(3)}  ${err ? `(${err})  ` : ""}${url}`);

    await sleep(1000);
  }

  await writeFile("./_not_indexed_bing.txt", notIndexed.join("\n") + (notIndexed.length ? "\n" : ""));

  console.log(`\n📊 SUMMARY`);
  console.log(`   ✅ Indexed:        ${yesCount}`);
  console.log(`   ❌ Not indexed:    ${noCount}`);
  console.log(`   ❓ Unknown/error:  ${errCount}`);
  console.log(`\n📄 Files:`);
  console.log(`   ${csvPath}            — full report`);
  console.log(`   ./_not_indexed_bing.txt   — submit these to Bing (URL Submission)\n`);

  if (errCount > 0) {
    console.log(`⚠ ${errCount} URLs returned an error. Common causes:`);
    console.log(`   • Site not verified in Bing Webmaster Tools`);
    console.log(`   • API key invalid or expired`);
    console.log(`   • Rate limit hit (wait 24h)\n`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
