"use client";

import React from "react";
import Link from "next/link";
import { useCropRecommendation } from "@/lib/context/CropRecommendationContext";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { FarmSummaryCard } from "./FarmSummaryCard";
import { CropCard } from "./CropCard";
import { MethodInfoCard } from "./MethodInfoCard";
import {
  SproutIcon,
  RotateCcwIcon,
  InfoIcon,
} from "@/components/ui/Icons";

export function RecommendationResultsView() {
  const { result, lastInput } = useCropRecommendation();
  const { language } = useLanguage();

  // If no result exists yet (e.g. visited URL directly without submission)
  if (!result || !result.recommendations || result.recommendations.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
          <SproutIcon size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900">
            {language === "rw" ? "Nta nama zabonetse" : "No recommendations found"}
          </h1>
          <p className="text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
            {language === "rw" ? "Banza utange amakuru y’umurima wawe kugira ngo ubone inama zikwiye ku bihingwa." : "Please fill in your farm information first to generate crop recommendations."}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/crop-recommendation"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-xs transition-colors"
          >
            <SproutIcon size={18} />
            <span>{language === "rw" ? "Uzuza amakuru y’umurima" : "Fill farm form"}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Get Top 3 recommendations
  const topRecommendations = result.recommendations.slice(0, 3);
  const inputData = result.input || lastInput || undefined;

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* 1. Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Breadcrumb / Back button */}
        <Link
          href="/crop-recommendation"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors group"
        >
          <span className="text-emerald-700 group-hover:-translate-x-0.5 transition-transform">
            ←
          </span>
          <span>{language === "rw" ? "Subira ku nama z’ibihingwa" : "Back to crop recommendation"}</span>
        </Link>

        {/* Try Again CTA */}
        <Link
          href="/crop-recommendation"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/90 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-900 shadow-xs transition-all self-start sm:self-auto"
        >
          <RotateCcwIcon size={15} className="text-emerald-700" />
          <span>{language === "rw" ? "Ongera ugerageze" : "Try again"}</span>
        </Link>
      </div>

      {/* 2. Page Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>{language === "rw" ? "RwandaAgriSystem • Sisitemu itanga inama ku bihingwa" : "RwandaAgriSystem • Crop Recommendation Engine"}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-900 tracking-tight">
          {language === "rw" ? "Inama ku bihingwa" : "Crop recommendations"}
        </h1>
        <p className="text-base sm:text-lg font-semibold text-emerald-800">
        </p>

        <p className="text-sm text-zinc-600 max-w-3xl leading-relaxed pt-1">
          {language === "rw" ? "Bishingiye ku makuru y’umurima wawe n’amakuru y’ubuhinzi bwo mu Rwanda." : "Based on your farm information and Rwanda agriculture data."}
        </p>
        {language === "rw" && <p className="text-xs text-amber-800">Ibisobanuro by’imodeli bigaragazwa mu rurimi byagaruyemo na serivisi.</p>}
      </div>

      {/* 3. Submitted Farm Summary Card */}
      <FarmSummaryCard input={inputData} />

      {/* 4. Important Score Explanation Notice (Requirement 11) */}
      <div
        role="note"
        className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3.5 text-xs sm:text-sm text-emerald-950 shadow-xs"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-100/90 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
          <InfoIcon size={18} />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-emerald-950">
            {language === "rw" ? "Icyitonderwa ku manota y’inama" : "Important note on recommendation score"}
          </p>
          <p className="text-emerald-900 leading-relaxed">
            {language === "rw" ? "Aya manota akoreshwa mu kugereranya inama. Ntabwo ari amahirwe y’ijana cyangwa isezerano." : "This score ranks recommendations for comparison. It is not a probability or guarantee."}
          </p>
        </div>
      </div>

      {/* 5. Top 3 Recommendation Cards (Desktop: 3 cols, Mobile: 1 col) */}
      <section aria-labelledby="top-recommendations-title" className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
          <div>
            <h2
              id="top-recommendations-title"
              className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight"
            >
              {language === "rw" ? "Ibihingwa 3 by’ingenzi bisabwe" : "Top 3 recommended crops"}
            </h2>
            <p className="text-xs text-zinc-500">
              {language === "rw" ? "Byashyizwe ku rutonde hakurikijwe akarere, igihembwe n’imiterere y’umurima wawe" : "Ranked by suitability to your district, season, and farm condition"}
            </p>
          </div>

          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/70">
            {language === "rw" ? "Ibisubizo 3 bya mbere" : "Top 3 results"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {topRecommendations.map((rec, index) => (
            <CropCard
              key={`${rec.crop}-${index}`}
              recommendation={rec}
              rank={index + 1}
            />
          ))}
        </div>
      </section>

      {/* 6. Method Information Card */}
      <MethodInfoCard metadata={result.metadata} />

      {/* 7. Bottom Navigation CTA */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200/70">
        <Link
          href="/crop-recommendation"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <span>← {language === "rw" ? "Subira ku nama z’ibihingwa" : "Back to crop recommendation"}</span>
        </Link>

        <Link
          href="/crop-recommendation"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-xs transition-colors"
        >
          <RotateCcwIcon size={16} />
          <span>{language === "rw" ? "Gerageza undi murima" : "Try another farm"}</span>
        </Link>
      </div>
    </div>
  );
}
