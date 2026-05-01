import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const SOLD_OUT_MIN = 300;
const SOLD_OUT_MAX = 499;
const MIN_ORDER_MIN = 500;
const MIN_ORDER_MAX = 800;

const SOLD_OUT_HTML = '<span style="color:red;font-weight:bold;">Sold Out</span>';
const MIN_ORDER_HTML = '<span style="color:red;font-weight:bold;">Minimum order is 2 Pounds</span>';

function firstPriceLine(price: string | null | undefined): number | null {
  if (!price) return null;
  const m = price.split("\n")[0].match(/(\d[\d,]*(?:\.\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function withMarker(existing: string | null | undefined, marker: string): string {
  const cur = (existing ?? "").trim();
  if (cur.includes(marker)) return cur;
  return cur.length === 0 ? marker : `${marker}\n\n${cur}`;
}

function withoutMarker(existing: string | null | undefined, marker: string): string {
  if (!existing) return "";
  return existing
    .replace(marker + "\n\n", "")
    .replace("\n\n" + marker, "")
    .replace(marker, "")
    .trim();
}

async function getMatched() {
  const flowers = await prisma.product.findMany({
    where: { category: "FLOWER" },
    select: {
      id: true,
      priceShip: true,
      description: true,
      isSoldOut: true,
    },
  });
  const soldOut: typeof flowers = [];
  const minOrder: typeof flowers = [];
  for (const p of flowers) {
    const ship = firstPriceLine(p.priceShip);
    if (ship === null) continue;
    if (ship >= SOLD_OUT_MIN && ship <= SOLD_OUT_MAX) soldOut.push(p);
    else if (ship >= MIN_ORDER_MIN && ship <= MIN_ORDER_MAX) minOrder.push(p);
  }
  return { soldOut, minOrder };
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { soldOut, minOrder } = await getMatched();
    const anyMarked =
      soldOut.some((p) => (p.description ?? "").includes(SOLD_OUT_HTML)) ||
      minOrder.some((p) => (p.description ?? "").includes(MIN_ORDER_HTML));
    return NextResponse.json({
      enabled: anyMarked,
      soldOutCount: soldOut.length,
      minOrderCount: minOrder.length,
    });
  } catch (error) {
    console.error("flower-descriptions GET:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const action: "apply" | "revert" = body.action;
    if (action !== "apply" && action !== "revert") {
      return NextResponse.json({ error: "action must be 'apply' or 'revert'" }, { status: 400 });
    }

    const { soldOut, minOrder } = await getMatched();
    const ops: Promise<unknown>[] = [];

    for (const p of soldOut) {
      const cur = p.description ?? "";
      if (action === "apply") {
        const next = withMarker(cur, SOLD_OUT_HTML);
        const needsBadgeClear = p.isSoldOut === true;
        if (next !== cur || needsBadgeClear) {
          ops.push(
            prisma.product.update({
              where: { id: p.id },
              data: { description: next, ...(needsBadgeClear ? { isSoldOut: false } : {}) },
            }),
          );
        }
      } else {
        const next = withoutMarker(cur, SOLD_OUT_HTML);
        if (next !== cur) {
          ops.push(prisma.product.update({ where: { id: p.id }, data: { description: next } }));
        }
      }
    }

    for (const p of minOrder) {
      const cur = p.description ?? "";
      if (action === "apply") {
        const next = withMarker(cur, MIN_ORDER_HTML);
        if (next !== cur) {
          ops.push(prisma.product.update({ where: { id: p.id }, data: { description: next } }));
        }
      } else {
        const next = withoutMarker(cur, MIN_ORDER_HTML);
        if (next !== cur) {
          ops.push(prisma.product.update({ where: { id: p.id }, data: { description: next } }));
        }
      }
    }

    await Promise.all(ops);

    // Best-effort ISR refresh — product detail pages cache for 60s.
    try {
      revalidatePath("/");
      revalidatePath("/product/[id]", "page");
    } catch {}

    return NextResponse.json({
      success: true,
      action,
      affected: ops.length,
      soldOutCount: soldOut.length,
      minOrderCount: minOrder.length,
    });
  } catch (error) {
    console.error("flower-descriptions POST:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
