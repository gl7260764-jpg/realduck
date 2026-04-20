"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";

interface SidebarFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedPriceRange: string;
  onPriceRangeChange: (range: string) => void;
  categories: string[];
  sortValue: string;
  onSortChange: (value: string) => void;
}

function FilterDropdown({
  value,
  options,
  onChange,
  placeholder,
  label,
  align = "left",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = value && value !== "all" && value !== "default";
  const current = options.find((o) => o.value === value);
  const displayLabel = current && isActive ? current.label : placeholder;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        type="button"
        className={`flex items-center justify-between w-full h-11 px-4 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
          open
            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
            : isActive
              ? "bg-slate-900 text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
        }`}
        aria-label={label}
      >
        <span className={isActive ? "text-white" : "text-gray-500"}>
          {displayLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${
            isActive ? "text-white/60" : "text-gray-400"
          }`}
        />
      </button>

      {open && (
        <div className={`absolute ${align === "right" ? "right-0 lg:right-auto lg:left-0" : "left-0"} top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl shadow-black/8 overflow-hidden z-50 min-w-[190px]`}>
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-150 ${
                  value === option.value
                    ? "bg-slate-50 text-slate-900 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <Check className="w-3.5 h-3.5 text-slate-900 ml-3" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SidebarFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedPriceRange,
  onPriceRangeChange,
  categories,
  sortValue,
  onSortChange,
}: SidebarFiltersProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  const priceOptions = [
    { value: "all", label: "All Prices" },
    { value: "0-500", label: "Under $500" },
    { value: "500-750", label: "$500 – $750" },
    { value: "750-1000", label: "$750 – $1,000" },
    { value: "1000+", label: "$1,000+" },
  ];

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...categories.map((c) => ({ value: c, label: c })),
  ];

  const sortOptions = [
    { value: "default", label: "Featured" },
    { value: "date-desc", label: "Newest First" },
    { value: "date-asc", label: "Oldest First" },
    { value: "price-asc", label: "Price: Low → High" },
    { value: "price-desc", label: "Price: High → Low" },
  ];

  const hasActiveFilters =
    (selectedCategory && selectedCategory !== "all") ||
    (selectedPriceRange && selectedPriceRange !== "all") ||
    sortValue !== "default";

  const activeCount =
    (selectedCategory && selectedCategory !== "all" ? 1 : 0) +
    (selectedPriceRange && selectedPriceRange !== "all" ? 1 : 0) +
    (sortValue !== "default" ? 1 : 0);

  const clearAll = () => {
    onSearchChange("");
    onCategoryChange("all");
    onPriceRangeChange("all");
    onSortChange("default");
  };

  return (
    <div className="w-full space-y-3">
      {/* ── Desktop: single row  |  Mobile: search on top, filters below ── */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2">
        {/* Search */}
        <div className={`flex-1 min-w-0 transition-all duration-200 ${searchFocused ? "lg:flex-[2]" : ""}`}>
          <div
            className={`flex items-center h-11 rounded-xl border transition-all duration-200 overflow-hidden ${
              searchFocused
                ? "border-slate-900 shadow-md shadow-slate-900/10 bg-white"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <Search
              className={`w-4 h-4 ml-3.5 flex-shrink-0 transition-colors duration-200 ${
                searchFocused ? "text-slate-900" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="flex-1 h-full px-3 text-sm bg-transparent outline-none placeholder:text-gray-400 text-gray-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="flex items-center justify-center w-9 h-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters row — wrap on mobile so dropdowns aren't clipped, inline on desktop */}
        <div className="grid grid-cols-3 gap-2 lg:flex lg:items-center lg:flex-shrink-0">
          <FilterDropdown
            value={selectedCategory || "all"}
            options={categoryOptions}
            onChange={onCategoryChange}
            placeholder="Category"
            label="Select category"
          />

          <FilterDropdown
            value={selectedPriceRange || "all"}
            options={priceOptions}
            onChange={onPriceRangeChange}
            placeholder="Price"
            label="Select price range"
          />

          <FilterDropdown
            value={sortValue}
            options={sortOptions}
            onChange={onSortChange}
            placeholder="Sort by"
            label="Sort products"
            align="right"
          />

          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="col-span-3 lg:col-auto lg:flex-shrink-0 flex items-center justify-center gap-1.5 h-11 px-3.5 rounded-xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors duration-200"
            >
              <X className="w-3.5 h-3.5" />
              Clear
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {activeCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {(searchQuery || hasActiveFilters) && (
        <div className="flex items-center gap-2 flex-wrap">
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
              &ldquo;{searchQuery}&rdquo;
              <button type="button" onClick={() => onSearchChange("")} className="hover:text-slate-900 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedCategory && selectedCategory !== "all" && (
            <span className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full bg-slate-900 text-white text-xs font-medium">
              {selectedCategory}
              <button type="button" onClick={() => onCategoryChange("all")} className="hover:text-white/60 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedPriceRange && selectedPriceRange !== "all" && (
            <span className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full bg-slate-900 text-white text-xs font-medium">
              {priceOptions.find((p) => p.value === selectedPriceRange)?.label}
              <button type="button" onClick={() => onPriceRangeChange("all")} className="hover:text-white/60 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
