"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SidebarFilters from "./SidebarFilters";
import ProductGrid from "./ProductGrid";

interface Product {
  id: string;
  slug?: string | null;
  title: string;
  category: string;
  indoor: boolean;
  rating: string;
  priceLocal: string;
  priceShip: string;
  isSoldOut: boolean;
  imageUrl: string;
  videoUrl?: string | null;
  createdAt: Date | string;
}

interface CatalogClientProps {
  initialProducts: Product[];
}

export default function CatalogClient({ initialProducts }: CatalogClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  // Single compound sort value: "default" | "date-desc" | "date-asc" | "price-asc" | "price-desc"
  const [sortValue, setSortValue] = useState("default");

  // Derive sortBy and sortDirection from the compound value
  const sortBy = sortValue === "default" ? "default" : sortValue.split("-")[0];
  const sortDirection = sortValue === "default" ? "desc" : (sortValue.split("-")[1] as "asc" | "desc");

  // Sync category filter with URL for SEO crawlability
  useEffect(() => {
    const urlCategory = searchParams.get("category") || "";
    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [searchParams]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams(window.location.search);
    if (category && category !== "all") {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    const newUrl = params.toString() ? `/?${params.toString()}` : "/";
    router.push(newUrl, { scroll: false });
  };

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = new Set(initialProducts.map((p) => p.category));
    return Array.from(cats).sort();
  }, [initialProducts]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Price range filter
    if (selectedPriceRange && selectedPriceRange !== "all") {
      result = result.filter((p) => {
        const priceMatch = p.priceLocal.match(/\$(\d+)/);
        if (!priceMatch) return true;
        const price = parseInt(priceMatch[1], 10);

        switch (selectedPriceRange) {
          case "0-500":
            return price < 500;
          case "500-750":
            return price >= 500 && price < 750;
          case "750-1000":
            return price >= 750 && price < 1000;
          case "1000+":
            return price >= 1000;
          default:
            return true;
        }
      });
    }

    // Sorting
    if (sortBy !== "default") {
      result.sort((a, b) => {
        if (sortBy === "date") {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortDirection === "desc" ? dateB - dateA : dateA - dateB;
        }

        if (sortBy === "price") {
          const priceA = parseInt(a.priceLocal.match(/\$(\d+)/)?.[1] || "0", 10);
          const priceB = parseInt(b.priceLocal.match(/\$(\d+)/)?.[1] || "0", 10);
          return sortDirection === "asc" ? priceA - priceB : priceB - priceA;
        }

        return 0;
      });
    }

    return result;
  }, [initialProducts, searchQuery, selectedCategory, selectedPriceRange, sortBy, sortDirection]);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Unified Filter Bar */}
      <SidebarFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        selectedPriceRange={selectedPriceRange}
        onPriceRangeChange={setSelectedPriceRange}
        categories={categories}
        sortValue={sortValue}
        onSortChange={setSortValue}
      />

      {/* Product Grid */}
      <div className="mt-5 sm:mt-6">
        <ProductGrid products={filteredProducts} />
      </div>
    </div>
  );
}
