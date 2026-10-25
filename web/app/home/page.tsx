"use client";

import React from "react";
import { APP_CONFIG } from "@/lib/constants";
import { LeafIcon } from "@/components/ui/Icons";
import { ModuleGrid } from "@/components/dashboard/ModuleGrid";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function HomePage() {
  const { language, t } = useLanguage();
  return (
    <div className="space-y-8 pb-10">
      {/* 1. Welcome Greeting Banner */}
      <section
        aria-label={t("Welcome to AgriSense Rwanda.")}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-green-950 p-6 sm:p-8 text-white shadow-lg shadow-emerald-950/10"
      >
        {/* Subtle decorative leaf background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <LeafIcon size={160} />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-3">
            <span>🌱</span>
            <span>{t(APP_CONFIG.slogan)}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2">
            {t("Welcome")} 👋
          </h1>

          <p className="text-lg sm:text-xl font-semibold text-emerald-100 mb-2">
            {t("Welcome to AgriSense Rwanda.")}
          </p>

          <p className="text-sm sm:text-base text-emerald-200/90 leading-relaxed max-w-2xl text-pretty">
            {language === "rw" ? "Urubuga rwa digitale rufasha abahinzi, inzobere, n'abafatanyabikorwa mu buhinzi gufata ibyemezo byiza bishingiye ku makuru yizewe n'ikoranabuhanga rigezweho." : "A digital agriculture platform that helps farmers, specialists, and partners make informed decisions using reliable data and modern technology."}
          </p>
        </div>
      </section>

      {/* 2. RwandaAgriSystem Services Section (Main Dashboard Focus) */}
      <section aria-labelledby="services-section-title" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-zinc-200/80 pb-3">
          <div>
            <h2
              id="services-section-title"
              className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900"
            >
              {t("RwandaAgriSystem Services")}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              {t("Choose the digital agriculture service you want to use")}
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>{t("6 essential services")}</span>
          </div>
        </div>

        {/* Agriculture service cards */}
        <ModuleGrid />
      </section>
    </div>
  );
}
