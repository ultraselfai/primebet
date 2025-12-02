"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Category {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="px-4 py-2">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                activeCategory === category.id
                  ? "bg-[#00faff] text-[#0a1628]"
                  : "bg-[#0d1f3c] text-gray-300 hover:bg-[#162a4a] border border-white/10"
              )}
            >
              {category.icon}
              {category.label}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
}
