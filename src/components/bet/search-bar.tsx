"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function SearchBar({ 
  placeholder = "Search", 
  value = "", 
  onChange 
}: SearchBarProps) {
  return (
    <div className="relative px-4 py-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full h-11 pl-10 pr-4 bg-[#0d1f3c] border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#00faff]/50 focus:ring-[#00faff]/20"
        />
      </div>
    </div>
  );
}
