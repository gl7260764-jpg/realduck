"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { formatPrice } from "@/lib/formatPrice";

export interface CartItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  priceLocal: string;
  priceShip: string;
  quantity: number;
  priceType: "local" | "ship";
}

function extractNumericPrice(priceStr: string): number {
  const match = priceStr.match(/\$?([\d,]+(?:\.\d+)?)/);
  if (!match) return 0;
  return parseFloat(match[1].replace(",", ""));
}

const LOW_PRICE_THRESHOLD = 30;
const LOW_PRICE_MIN_QTY = 5;
const CART_TOTAL_BYPASS = 300;
// Disposables business rule: minimum 50 units, never bypassed.
const DISPOSABLES_MIN_QTY = 50;
const isDisposableItem = (cat: string) => cat === "DISPOSABLES";

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity">) => boolean;
  isInCart: (id: string) => boolean;
  removeItem: (id: string, priceType: "local" | "ship") => void;
  updateQuantity: (id: string, priceType: "local" | "ship", quantity: number) => void;
  updateDeliveryType: (id: string, oldPriceType: "local" | "ship", newPriceType: "local" | "ship") => void;
  clearCart: () => void;
  totalItems: number;
  getItemPrice: (item: CartItem) => string;
  isLowPriceItem: (item: CartItem) => boolean;
  getMinQty: (item: CartItem) => number;
  cartTotal: number;
  cartMeetsMinimum: boolean;
  pwaDiscount: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pwaDiscount, setPwaDiscount] = useState(false);

  // Check PWA discount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPwaDiscount(localStorage.getItem("nobu_pwa_discount") === "1");
    }
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("realduckdistro-cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart:", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage when items change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("realduckdistro-cart", JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const isInCart = (id: string): boolean => {
    return items.some((item) => item.id === id);
  };

  const addItem = (newItem: Omit<CartItem, "quantity">): boolean => {
    if (items.some((item) => item.id === newItem.id)) {
      return false; // Already in cart
    }
    // Disposables ALWAYS start at 50 — business rule, no bypass.
    if (isDisposableItem(newItem.category)) {
      setItems((prev) => [...prev, { ...newItem, quantity: DISPOSABLES_MIN_QTY }]);
      return true;
    }
    // Otherwise: low-price items start at 5 (unless cart total already bypasses), else 1.
    const priceString = newItem.priceType === "local" ? newItem.priceLocal : newItem.priceShip;
    const priceFormatted = formatPrice(priceString).split("\n")[0] || priceString;
    const numericPrice = extractNumericPrice(priceFormatted);
    const isLow = numericPrice > 0 && numericPrice < LOW_PRICE_THRESHOLD;
    const currentTotal = items.reduce((sum, i) => {
      const p = extractNumericPrice(formatPrice(i.priceType === "local" ? i.priceLocal : i.priceShip).split("\n")[0] || "");
      return sum + p * i.quantity;
    }, 0);
    const startQty = (isLow && currentTotal < CART_TOTAL_BYPASS) ? LOW_PRICE_MIN_QTY : 1;
    setItems((prev) => [...prev, { ...newItem, quantity: startQty }]);
    return true;
  };

  const removeItem = (id: string, priceType: "local" | "ship") => {
    setItems((prev) => prev.filter((item) => !(item.id === id && item.priceType === priceType)));
  };

  const updateQuantity = (id: string, priceType: "local" | "ship", quantity: number) => {
    if (quantity <= 0) {
      removeItem(id, priceType);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id && item.priceType === priceType) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const updateDeliveryType = (id: string, oldPriceType: "local" | "ship", newPriceType: "local" | "ship") => {
    if (oldPriceType === newPriceType) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.priceType === oldPriceType
          ? { ...item, priceType: newPriceType }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const getItemPrice = (item: CartItem): string => {
    const priceString = item.priceType === "local" ? item.priceLocal : item.priceShip;
    return formatPrice(priceString).split("\n")[0] || priceString;
  };

  const isLowPriceItem = (item: CartItem): boolean => {
    const price = extractNumericPrice(getItemPrice(item));
    return price > 0 && price < LOW_PRICE_THRESHOLD;
  };

  // Calculate cart total
  const cartTotal = items.reduce((sum, item) => {
    const price = extractNumericPrice(getItemPrice(item));
    return sum + price * item.quantity;
  }, 0);

  // Get minimum quantity for an item.
  // Disposables: always 50 (no bypass).
  // Low-price items (<$30): 5 unless cart already over $300 bypass.
  // Everything else: 1.
  const getMinQty = (item: CartItem): number => {
    if (isDisposableItem(item.category)) return DISPOSABLES_MIN_QTY;
    if (!isLowPriceItem(item)) return 1;
    // If cart total (excluding this item) already >= $300, allow qty 1
    const otherTotal = items.reduce((sum, i) => {
      if (i.id === item.id) return sum;
      const p = extractNumericPrice(getItemPrice(i));
      return sum + p * i.quantity;
    }, 0);
    if (otherTotal >= CART_TOTAL_BYPASS) return 1;
    return LOW_PRICE_MIN_QTY;
  };

  // Check if all low-price items meet their minimum quantity
  const cartMeetsMinimum = items.every((item) => {
    const minQty = getMinQty(item);
    return item.quantity >= minQty;
  });

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        setIsOpen,
        addItem,
        isInCart,
        removeItem,
        updateQuantity,
        updateDeliveryType,
        clearCart,
        totalItems,
        getItemPrice,
        isLowPriceItem,
        getMinQty,
        cartTotal,
        cartMeetsMinimum,
        pwaDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
