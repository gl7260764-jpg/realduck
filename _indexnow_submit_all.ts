/**
 * One-shot batch submission of every public URL on the site to IndexNow.
 *
 * IndexNow notifies Bing, Yandex, Naver, Seznam, and Yep in real time.
 * (Google does not consume IndexNow but tolerates it — no penalty.)
 *
 * Run when:
 *   • You suspect Bing/Yandex have stopped crawling
 *   • After a large content drop (e.g. the 5 PAA blogs)
 *   • Periodically (monthly is reasonable) to refresh discovery
 *
 *   npx tsx ./_indexnow_submit_all.ts          # preview URL count + targets
 *   npx tsx ./_indexnow_submit_all.ts --apply  # actually submit
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import { prisma } from "./lib/prisma";
import { pingIndexNow } from "./lib/indexNow";

const APPLY = process.argv.includes("--apply");
// Force www. The key file only returns HTTP 200 at www; the apex domain 307s,
// which silently fails IndexNow's key-verification step.
const SITE = "https://www.realduckdistro.com";

async function main() {
  // Static pages (same set the sitemap uses)
  const STATIC = [
    `${SITE}/`,
    `${SITE}/about`,
    `${SITE}/blog`,
    `${SITE}/announcements`,
  ];

  const products = await prisma.product.findMany({
    where: { slug: { not: null } },
    select: { slug: true },
  });
  const blogs = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true },
  });

  const productUrls = products.map((p) => `${SITE}/product/${p.slug}`);
  const blogUrls = blogs.map((b) => `${SITE}/blog/${b.slug}`);
  const all = [...STATIC, ...blogUrls, ...productUrls];

  console.log(`\n${APPLY ? "🚀 SUBMITTING" : "🔍 PREVIEW"} — ${all.length} URLs to IndexNow`);
  console.log(`   ${STATIC.length} static  •  ${blogUrls.length} blogs  •  ${productUrls.length} products\n`);
  console.log(`   Endpoint: https://api.indexnow.org/indexnow`);
  console.log(`   Key file: ${SITE}/0a83dcea9b8e48ce895b77e3a75f2f0f.txt`);
  console.log(`   Targets:  Bing, Yandex, Naver, Seznam, Yep\n`);

  if (!APPLY) {
    console.log("First 5:");
    all.slice(0, 5).forEach((u) => console.log(`  ${u}`));
    console.log(`...`);
    console.log("Last 5:");
    all.slice(-5).forEach((u) => console.log(`  ${u}`));
    console.log(`\n[dry run] Re-run with --apply to submit.\n`);
    await prisma.$disconnect();
    return;
  }

  const ok = await pingIndexNow(all);

  if (ok) {
    console.log(`✅ Submitted ${all.length} URLs to IndexNow successfully.`);
    console.log(`\nNext step: confirm receipt in Bing Webmaster Tools → URL Submission → IndexNow History.`);
  } else {
    console.log(`⚠ IndexNow returned a non-OK status. Check logs above. Common causes:`);
    console.log(`   • Key file not reachable (verify ${SITE}/0a83dcea9b8e48ce895b77e3a75f2f0f.txt returns plain text)`);
    console.log(`   • Rate limited (wait 24h and retry)`);
    console.log(`   • Quota exceeded for the day`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
