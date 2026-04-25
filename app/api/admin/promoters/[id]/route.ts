import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    // Soft archive — preserves all historical click + revenue data.
    // Their links also get archived so /r/<slug> stops redirecting.
    await prisma.$transaction([
      prisma.promoter.update({ where: { id }, data: { archived: true } }),
      prisma.campaign.updateMany({ where: { promoterId: id }, data: { archived: true } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error archiving promoter:", error);
    return NextResponse.json({ error: "Failed to archive" }, { status: 500 });
  }
}
