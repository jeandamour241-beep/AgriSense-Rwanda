"use client";

import React from "react";
import Link from "next/link";
import { AgricultureModule } from "@/config/modules";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  SproutIcon,
  DropletsIcon,
  BugAlertIcon,
  FertilizerIcon,
  DataExplorerIcon,
  BotSparklesIcon,
  RiskMapIcon,
  ArrowRightIcon,
} from "@/components/ui/Icons";

export interface ModuleCardProps {
  module: AgricultureModule;
  className?: string;
}

export function renderModuleIcon(iconName: string, size = 22, className = "") {
  switch (iconName) {
    case "sprout":
      return <SproutIcon size={size} className={className} />;
    case "droplets":
      return <DropletsIcon size={size} className={className} />;
    case "bug":
      return <BugAlertIcon size={size} className={className} />;
    case "fertilizer":
      return <FertilizerIcon size={size} className={className} />;
    case "data-explorer":
      return <DataExplorerIcon size={size} className={className} />;
    case "bot":
      return <BotSparklesIcon size={size} className={className} />;
    case "risk-map":
      return <RiskMapIcon size={size} className={className} />;
    default:
      return <SproutIcon size={size} className={className} />;
  }
}

export function ModuleCard({ module, className = "" }: ModuleCardProps) {
  const { title, shortDescription, route, iconName, accent, ctaText } = module;
  const { t } = useLanguage();

  return (
    <Link
      href={route}
      aria-label={`${t(title)} - ${t(ctaText)}`}
      className={`group relative flex flex-col justify-between h-full p-6 sm:p-7 bg-white rounded-2xl border border-zinc-200/80 shadow-xs hover:shadow-lg transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 hover:-translate-y-1 ${accent.cardBorderHover} ${className}`}
    >
      {/* Top row: Icon container + Subtle module indicator */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-200 group-hover:scale-105 ${accent.iconBg} ${accent.iconBorder} ${accent.iconColor}`}
          >
            {renderModuleIcon(iconName, 24, "transition-transform group-hover:rotate-3")}
          </div>

          {/* Module number & subtle status badge */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-zinc-400">
              0{module.order}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${accent.dotColor} opacity-75`}
            />
          </div>
        </div>

        {/* Module Title */}
        <h3 className="text-lg font-bold text-zinc-900 tracking-tight group-hover:text-emerald-800 transition-colors mb-2 leading-snug">
          {t(title)}
        </h3>

        {/* Short Description */}
        <p className="text-sm text-zinc-600 leading-relaxed">
          {t(shortDescription)}
        </p>
      </div>

      {/* Card Footer / Reba byinshi CTA */}
      <div className="pt-6 mt-6 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
        <span className="tracking-wide">{t(ctaText)}</span>
        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
          <ArrowRightIcon
            size={16}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </div>
      </div>
    </Link>
  );
}
