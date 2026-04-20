"use client";

import PasswordGate from "./PasswordGate";
import PageTracker from "./PageTracker";
import { CartProvider } from "../context/CartContext";
import { SettingsProvider } from "../context/SettingsContext";
import CartDrawer from "./CartDrawer";
import PwaManager from "./PwaManager";
import NewsletterPopup from "./NewsletterPopup";

interface ClientProviderProps {
  children: React.ReactNode;
}

export default function ClientProvider({ children }: ClientProviderProps) {
  return (
    <SettingsProvider>
      <CartProvider>
        <PageTracker />
        <PasswordGate>{children}</PasswordGate>
        <CartDrawer />
        <PwaManager />
        <NewsletterPopup />
      </CartProvider>
    </SettingsProvider>
  );
}
