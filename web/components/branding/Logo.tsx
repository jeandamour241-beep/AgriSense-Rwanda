import React from "react";
import { LeafIcon } from "@/components/ui/Icons";

export interface LogoProps {
  variant?: "light" | "dark" | "hero";
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  className?: string;
}

export function Logo({
  variant = "light",
  size = "md",
  showTagline = false,
  className = "",
}: LogoProps) {
  const isDarkBg = variant === "hero" || variant === "dark";

  // Size variations
  const sizeMap = {
    sm: {
      iconBox: "w-8 h-8 rounded-lg",
      iconSize: 18,
      brandText: "text-lg",
      countryText: "text-xs",
      taglineText: "text-[10px]",
    },
    md: {
      iconBox: "w-10 h-10 rounded-xl",
      iconSize: 22,
      brandText: "text-xl",
      countryText: "text-sm",
      taglineText: "text-xs",
    },
    lg: {
      iconBox: "w-12 h-12 rounded-2xl",
      iconSize: 26,
      brandText: "text-2xl",
      countryText: "text-base",
      taglineText: "text-sm",
    },
    xl: {
      iconBox: "w-16 h-16 rounded-2xl",
      iconSize: 36,
      brandText: "text-3xl sm:text-4xl",
      countryText: "text-lg sm:text-xl",
      taglineText: "text-sm sm:text-base",
    },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Icon Badge */}
      <div
        className={`${currentSize.iconBox} flex items-center justify-center transition-transform hover:scale-105 ${
          isDarkBg
            ? "bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-300/30"
            : "bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-md shadow-emerald-900/10"
        }`}
      >
        <LeafIcon size={currentSize.iconSize} className="stroke-[2.2]" />
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-bold tracking-tight ${currentSize.brandText} ${
              isDarkBg ? "text-white" : "text-zinc-900"
            }`}
          >
            AgriSense
          </span>
          <span
            className={`font-semibold tracking-normal ${currentSize.countryText} ${
              isDarkBg ? "text-emerald-300" : "text-emerald-700"
            }`}
          >
            Rwanda
          </span>
        </div>

        {showTagline && (
          <span
            className={`font-medium tracking-wide ${currentSize.taglineText} ${
              isDarkBg ? "text-emerald-100/80" : "text-zinc-500"
            }`}
          >
            Smart Agriculture. Better Tomorrow!
          </span>
        )}
      </div>
    </div>
  );
}
