"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";

interface SortSelectProps {
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSortByChange: (value: string) => void;
  onSortDirectionChange: () => void;
  productCount: number;
}

export default function SortSelect({
  sortBy,
  sortDirection,
  onSortByChange,
  onSortDirectionChange,
  productCount,
}: SortSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions = [
    { value: "default", label: "Default" },
    { value: "date-desc", label: "Newest First" },
    { value: "date-asc", label: "Oldest First" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
  ];

  const currentValue = sortBy === "default" ? "default" : `${sortBy}-${sortDirection}`;
  const currentLabel = sortOptions.find((o) => o.value === currentValue)?.label || "Sort";

  const handleSelect = (value: string) => {
    if (value === "default") {
      onSortByChange("default");
    } else {
      const [sort, dir] = value.split("-");
      onSortByChange(sort);
      if (dir !== sortDirection) {
        onSortDirectionChange();
      }
    }
    setIsOpen(false);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">
        {productCount} product{productCount !== 1 ? "s" : ""}
      </p>

      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 h-9 px-3.5 bg-white border rounded-lg text-sm cursor-pointer transition-all duration-200 ${
            isOpen
              ? "border-slate-900 shadow-sm"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-700 font-medium">{currentLabel}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors ${
                  currentValue === option.value
                    ? "bg-slate-50 text-slate-900 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {option.label}
                {currentValue === option.value && (
                  <Check className="w-3.5 h-3.5 text-slate-900" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
