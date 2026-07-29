import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order from Real Duck Distro. Enter your delivery details and choose your payment method. Discreet shipping across the USA; priority delivery to Kentucky, Michigan, Florida and Mississippi.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
