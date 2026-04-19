import { PrismaClient, Category, BlogCategory } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function parsePgArray(input: unknown): string[] {
  if (Array.isArray(input)) return input as string[];
  if (typeof input !== "string") return [];
  const s = input.trim();
  if (!s || s === "{}" || s === "NULL") return [];
  if (!(s.startsWith("{") && s.endsWith("}"))) return [];
  const body = s.slice(1, -1);

  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inQuotes) {
      if (ch === "\\" && i + 1 < body.length) {
        cur += body[++i];
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim()).filter((v) => v.length > 0);
}

function parseDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  const d = new Date(String(v).replace(" ", "T") + (String(v).includes("T") ? "" : "Z"));
  return isNaN(d.getTime()) ? undefined : d;
}

async function seedProducts() {
  const file = path.join(process.cwd(), "products.json");
  const raw = JSON.parse(fs.readFileSync(file, "utf-8")) as any[];
  console.log(`Seeding ${raw.length} products...`);

  let ok = 0;
  for (const p of raw) {
    const data = {
      title: String(p.title ?? "").trim(),
      description: p.description ?? null,
      category: p.category as Category,
      indoor: Boolean(p.indoor),
      rating: p.rating ?? "10/10",
      priceLocal: String(p.priceLocal ?? ""),
      priceShip: String(p.priceShip ?? ""),
      isSoldOut: Boolean(p.isSoldOut),
      imageUrl: String(p.imageUrl ?? ""),
      images: parsePgArray(p.images),
      videoUrl: p.videoUrl ?? null,
      slug: p.slug ?? null,
      createdAt: parseDate(p.createdAt),
      updatedAt: parseDate(p.updatedAt),
    };

    await prisma.product.upsert({
      where: { id: p.id },
      update: data,
      create: { id: p.id, ...data },
    });
    ok++;
  }
  console.log(`✔ Products upserted: ${ok}/${raw.length}`);
}

async function seedBlogPosts() {
  const file = path.join(process.cwd(), "blogpost.json");
  const raw = JSON.parse(fs.readFileSync(file, "utf-8")) as any[];
  console.log(`Seeding ${raw.length} blog posts...`);

  let ok = 0;
  for (const b of raw) {
    const data = {
      slug: String(b.slug),
      title: String(b.title ?? ""),
      subtitle: b.subtitle ?? null,
      category: b.category as BlogCategory,
      content: String(b.content ?? ""),
      excerpt: b.excerpt ?? null,
      imageUrl: String(b.imageUrl ?? ""),
      images: parsePgArray(b.images),
      author: b.author ?? "Real Duck Distro",
      published: Boolean(b.published),
      featured: Boolean(b.featured),
      tags: parsePgArray(b.tags),
      createdAt: parseDate(b.createdAt),
      updatedAt: parseDate(b.updatedAt),
    };

    await prisma.blogPost.upsert({
      where: { id: b.id },
      update: data,
      create: { id: b.id, ...data },
    });
    ok++;
  }
  console.log(`✔ Blog posts upserted: ${ok}/${raw.length}`);
}

async function main() {
  await seedProducts();
  await seedBlogPosts();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
