"use client";

import React from "react";
import { MenuIcon } from "@/components/ui/Icons";
import { LanguageSelector } from "@/components/navigation/LanguageSelector";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export interface HeaderProps {
  onMenuToggle?: () => void;
}

/**
 * Minimal topbar: mobile navigation control at left and global language toggle at right.
 */
export function Header({ onMenuToggle }: HeaderProps) {
  const { t } = useLanguage();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-6">
      <div className="flex items-center">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label={t("Open navigation")}
          className="p-2 -ml-1 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 lg:hidden outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <MenuIcon size={22} />
        </button>
      </div>
      <div className="ml-auto flex items-center">
        <LanguageSelector />
      </div>
    </header>
  );
}
