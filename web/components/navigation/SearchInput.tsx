"use client";

import React, { useState } from "react";
import { SearchIcon } from "@/components/ui/Icons";

export interface SearchInputProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

/**
 * Reusable visual search bar component for AgriSense Rwanda.
 * Designed to later connect to real search APIs.
 */
export function SearchInput({
  placeholder = "Shakisha...",
  className = "",
  onSearch,
}: SearchInputProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={`relative w-full max-w-xs sm:max-w-sm ${className}`}
    >
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
        <SearchIcon size={17} />
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Shakisha muri AgriSense"
        className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-100/90 hover:bg-zinc-100 focus:bg-white text-zinc-800 placeholder-zinc-400 rounded-xl border border-zinc-200/50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
      />
    </form>
  );
}
