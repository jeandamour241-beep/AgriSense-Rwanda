"use client";

import React from "react";
import { CropRecommendationMetadata } from "@/types/cropRecommendation";
import { InfoIcon } from "@/components/ui/Icons";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export interface MethodInfoCardProps {
  metadata?: CropRecommendationMetadata;
}

export function MethodInfoCard({ metadata }: MethodInfoCardProps) {
  const { language } = useLanguage();
  const weights = metadata?.fusion_weights;

  // Format percentages dynamically from backend weights
  const historicalPct =
    weights?.historical !== undefined
      ? Math.round(weights.historical * 100)
      : 40;
  const exactMlPct =
    weights?.exact_crop_ml !== undefined
      ? Math.round(weights.exact_crop_ml * 100)
      : 30;
  const categoryMlPct =
    weights?.category_ml !== undefined
      ? Math.round(weights.category_ml * 100)
      : 30;

  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <InfoIcon size={18} />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-900">
            {language === "rw" ? "Uko iyi nama yakozwe" : "How this recommendation was produced"}
          </h3>
          <p className="text-xs text-zinc-500">
          </p>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
        {language === "rw" ? "Sisitemu ya RwandaAgriSystem ihuza amakuru y’ubushakashatsi bw’ubuhinzi bwo mu Rwanda n’imodeli za machine learning zatojwe ku makuru y’ikirere n’ubuhinzi:" : "RwandaAgriSystem combines historical agricultural survey evidence with machine learning models trained on agro-climatic data:"}
      </p>

      {/* 3 Weight Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/60 text-center">
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700">
            {historicalPct}%
          </div>
          <p className="text-xs font-semibold text-zinc-800 mt-0.5">
            {language === "rw" ? "Amakuru y’ubuhinzi yo mu mateka" : "Historical agriculture data"}
          </p>
          <p className="text-[11px] text-zinc-500">
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/60 text-center">
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700">
            {exactMlPct}%
          </div>
          <p className="text-xs font-semibold text-zinc-800 mt-0.5">
            {language === "rw" ? "Modeli ya ML y’igihingwa nyirizina" : "Exact crop ML model"}
          </p>
          <p className="text-[11px] text-zinc-500">
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/60 text-center">
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700">
            {categoryMlPct}%
          </div>
          <p className="text-xs font-semibold text-zinc-800 mt-0.5">
            {language === "rw" ? "Modeli ya ML y’icyiciro cy’igihingwa" : "Crop category ML model"}
          </p>
          <p className="text-[11px] text-zinc-500">
          </p>
        </div>
      </div>

      <div className="text-xs text-zinc-500 bg-zinc-50/60 p-3 rounded-xl border border-zinc-200/50">
        <p>
          <span className="font-semibold text-zinc-700">{language === "rw" ? "Uburyo bwakoreshejwe:" : "Methodology:"}</span>{" "}
          {metadata?.method || "historical + exact-crop ML + category ML"}
        </p>
      </div>
    </div>
  );
}
