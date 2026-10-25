"use client";

import React from "react";
import { CropRecommendationRequest } from "@/types/cropRecommendation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export interface FarmSummaryCardProps {
  input?: CropRecommendationRequest;
}

export function FarmSummaryCard({ input }: FarmSummaryCardProps) {
  const { language } = useLanguage();
  if (!input) return null;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-500">
          {language === "rw" ? "Amakuru y’umurima watanze" : "Submitted farm information"}
        </h3>
        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
          {language === "rw" ? "Byemejwe" : "Verified input"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 text-xs">
        <div className="p-3 rounded-xl bg-zinc-50/80 border border-zinc-200/60">
          <p className="text-zinc-500 font-medium">{language === "rw" ? "Akarere" : "District"}</p>
          <p className="text-sm font-bold text-zinc-900 mt-0.5 truncate">
            {input.s1q2 || "—"}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50/80 border border-zinc-200/60">
          <p className="text-zinc-500 font-medium">{language === "rw" ? "Igihembwe" : "Season"}</p>
          <p className="text-sm font-bold text-zinc-900 mt-0.5 truncate">
            {input.season || "—"}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50/80 border border-zinc-200/60">
          <p className="text-zinc-500 font-medium">{language === "rw" ? "Ubuso" : "Plot area"}</p>
          <p className="text-sm font-bold text-zinc-900 mt-0.5 truncate">
            {input.s2q2 !== undefined ? `${input.s2q2} ha` : "—"}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50/80 border border-zinc-200/60">
          <p className="text-zinc-500 font-medium">{language === "rw" ? "Kuhira" : "Irrigation"}</p>
          <p className="text-sm font-bold text-zinc-900 mt-0.5 truncate">
            {language === "rw" ? (input.s4q13 === "Yes" ? "Yego" : "Oya") : input.s4q13}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50/80 border border-zinc-200/60">
          <p className="text-zinc-500 font-medium">{language === "rw" ? "Isuri" : "Soil erosion"}</p>
          <p className="text-sm font-bold text-zinc-900 mt-0.5 truncate">
            {input.s4q1 || "—"}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50/80 border border-zinc-200/60">
          <p className="text-zinc-500 font-medium">{language === "rw" ? "Guhuza ubutaka" : "Land consolidation"}</p>
          <p className="text-sm font-bold text-zinc-900 mt-0.5 truncate">
            {language === "rw" ? (input.s4q6 === "Yes" ? "Yego" : "Oya") : input.s4q6}
          </p>
        </div>
      </div>
    </div>
  );
}
