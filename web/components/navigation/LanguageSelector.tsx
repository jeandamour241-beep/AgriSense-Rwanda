"use client";

import React from "react";
import { GlobeIcon } from "@/components/ui/Icons";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export interface LanguageSelectorProps {
  className?: string;
}

/**
 * Global language selector. The short labels remain recognizable in both languages.
 */
export function LanguageSelector({ className = "" }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("Language selector")}
      className={`inline-flex items-center gap-0.5 rounded-xl border border-zinc-200 bg-white/90 p-1 text-xs font-semibold shadow-xs select-none ${className}`}
    >
      <div className="flex items-center pl-1.5 pr-1 text-emerald-700 pointer-events-none">
        <GlobeIcon size={14} />
      </div>

      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-label="English"
        aria-pressed={language === "en"}
        className={`rounded-lg px-2.5 py-1.5 transition-colors ${
          language === "en"
            ? "bg-emerald-700 font-bold text-white"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        }`}
      >
        ENG
      </button>

      <span className="text-zinc-300 font-light px-0.5">/</span>

      <button
        type="button"
        onClick={() => setLanguage("rw")}
        aria-label="Kinyarwanda"
        aria-pressed={language === "rw"}
        className={`rounded-lg px-2.5 py-1.5 transition-colors ${
          language === "rw"
            ? "bg-emerald-700 font-bold text-white"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        }`}
      >
        KIN/RW
      </button>
    </div>
  );
}
