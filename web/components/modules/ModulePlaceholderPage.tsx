"use client";

import React from "react";
import Link from "next/link";
import { getModuleById, ModuleId } from "@/config/modules";
import { renderModuleIcon } from "@/components/dashboard/ModuleCard";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export interface ModulePlaceholderPageProps {
  moduleId: ModuleId;
}

/**
 * Reusable clean placeholder shell for RwandaAgriSystem modules.
 * Strictly adheres to rule: NO fake results, NO fake AI predictions, NO fake data.
 */
export function ModulePlaceholderPage({ moduleId }: ModulePlaceholderPageProps) {
  const moduleData = getModuleById(moduleId);
  const { t } = useLanguage();

  if (!moduleData) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-600">{t("Module not found.")}</p>
        <Link
          href="/home"
          className="mt-4 inline-block text-emerald-700 underline font-medium"
        >
          {t("Back to home")}
        </Link>
      </div>
    );
  }

  const { title, shortDescription, iconName, accent, statusText } = moduleData;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* 1. Breadcrumbs */}
      <nav aria-label={t("Breadcrumb")} className="flex items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/home"
          className="hover:text-emerald-700 transition-colors font-medium"
        >
          {t("Home")}
        </Link>
        <span>/</span>
        <span className="text-zinc-800 font-semibold truncate">{title}</span>
      </nav>

      {/* 2. Module Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xs flex-shrink-0 ${accent.iconBg} ${accent.iconBorder} ${accent.iconColor}`}
            >
              {renderModuleIcon(iconName, 28)}
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>RwandaAgriSystem • {t(statusText)}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                {t(title)}
              </h1>
              <p className="text-sm sm:text-base text-zinc-600 mt-2 max-w-2xl leading-relaxed">
                {t(shortDescription)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Clean Placeholder Shell (No fake results / No fake ML) */}
      <div className="p-8 sm:p-12 rounded-2xl bg-white border border-dashed border-zinc-300 text-center flex flex-col items-center">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${accent.iconBg} ${accent.iconColor}`}
        >
          {renderModuleIcon(iconName, 32)}
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
          {t("This module is being prepared")}
        </h2>
        <p className="text-xs uppercase tracking-wider font-semibold text-emerald-700 mt-1">
          {t("Module under development")}
        </p>

        <p className="text-sm text-zinc-600 max-w-lg mt-3 leading-relaxed">
          {t("This module is being prepared with care. Its agriculture services and real data will appear here in a future release.")}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-xs transition-colors"
          >
            <span>{t("Back to home")}</span>
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
