"use client";

import PasswordGate from "./PasswordGate";
import AgeGate from "./AgeGate";
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
        <AgeGate>
          <PasswordGate>{children}</PasswordGate>
        </AgeGate>
        <CartDrawer />
        <PwaManager />
        <NewsletterPopup />
      </CartProvider>
    </SettingsProvider>
  );
}
