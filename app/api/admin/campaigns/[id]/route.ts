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
    // Soft archive — keeps historical click + revenue data intact
    await prisma.campaign.update({
      where: { id },
      data: { archived: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error archiving campaign:", error);
    return NextResponse.json({ error: "Failed to archive" }, { status: 500 });
  }
}
