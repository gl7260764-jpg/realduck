import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import OrderTracker from "./OrderTracker";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.realduckdistro.com";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Track the status of your Real Duck Distro order. Enter your order number and email to see real-time updates.",
  alternates: {
    canonical: `${SITE_URL}/orders`,
  },
};

export default function OrderTrackingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 sm:py-16">
        <OrderTracker />
      </main>
      <Footer />
    </div>
  );
}
