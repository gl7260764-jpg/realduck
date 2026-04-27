import { Metadata } from "next";
import prisma from "@/lib/prisma";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AnnouncementsClient from "./AnnouncementsClient";

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";

export const metadata: Metadata = {
  title: "Announcements | Real Duck Distro",
  description: "Stay updated with the latest news, exclusive drops, offers, and announcements from Real Duck Distro — the world's leading premium cannabis lifestyle brand.",
  alternates: {
    canonical: `${SITE_URL}/announcements`,
  },
  openGraph: {
    title: "Announcements | Real Duck Distro",
    description: "Stay updated with the latest news, exclusive drops, offers, and announcements from Real Duck Distro.",
    url: `${SITE_URL}/announcements`,
    siteName: "Real Duck Distro",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/images/hero.webp`,
        width: 1200,
        height: 630,
        alt: "Real Duck Distro Announcements",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Announcements | Real Duck Distro",
    description: "Stay updated with the latest news, exclusive drops, offers, and announcements from Real Duck Distro.",
    images: [`${SITE_URL}/images/hero.webp`],
  },
};

async function processScheduled() {
  try {
    const now = new Date();
    await prisma.announcement.updateMany({
      where: { scheduledAt: { lte: now }, published: false },
      data: { published: true },
    });
  } catch {}
}

async function getAnnouncements() {
  try {
    await processScheduled();
    return await prisma.announcement.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  } catch { return []; }
}

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();

  return (
    <>
      <Navbar />
      <AnnouncementsClient
        announcements={announcements.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
          pushSentAt: a.pushSentAt?.toISOString() || null,
        }))}
      />
      <Footer />
    </>
  );
}
