"use client";

import React from "react";
import { CropRecommendationItem } from "@/types/cropRecommendation";
import {
  AwardIcon,
  CheckCircle2Icon,
  SproutIcon,
} from "@/components/ui/Icons";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export interface CropCardProps {
  recommendation: CropRecommendationItem;
  rank: number; // 1, 2, 3
}

export function getCropVisual(cropName: string) {
  const lower = cropName.toLowerCase();
  if (lower.includes("maize") || lower.includes("corn")) {
    return { emoji: "🌽", rwName: "Ibigori" };
  }
  if (lower.includes("bean")) {
    return { emoji: "🫘", rwName: "Ibishyimbo" };
  }
  if (lower.includes("cassava")) {
    return { emoji: "🌿", rwName: "Imyumbati" };
  }
  if (lower.includes("sweet potato")) {
    return { emoji: "🍠", rwName: "Ibijumba" };
  }
  if (lower.includes("potato") || lower.includes("irish")) {
    return { emoji: "🥔", rwName: "Ibirayi" };
  }
  if (lower.includes("rice")) {
    return { emoji: "🌾", rwName: "Umuceri" };
  }
  if (lower.includes("sorghum")) {
    return { emoji: "🌾", rwName: "Amasaka" };
  }
  if (lower.includes("soya") || lower.includes("soybean")) {
    return { emoji: "🌱", rwName: "Soya" };
  }
  if (lower.includes("banana")) {
    return { emoji: "🍌", rwName: "Ibitoki" };
  }
  if (lower.includes("coffee")) {
    return { emoji: "☕", rwName: "Ikawa" };
  }
  if (lower.includes("tea")) {
    return { emoji: "🍵", rwName: "Icyayi" };
  }
  return { emoji: "🌱", rwName: cropName };
}

export function CropCard({ recommendation, rank }: CropCardProps) {
  const { language } = useLanguage();
  const isTopRank = rank === 1;
  const visual = getCropVisual(recommendation.crop);

  // Format scores safely
  const scorePercent =
    recommendation.fusion_score !== undefined
      ? (recommendation.fusion_score * 100).toFixed(1)
      : "0.0";

  const frequencyPercent =
    recommendation.historical_frequency !== undefined
      ? (recommendation.historical_frequency * 100).toFixed(1)
      : null;

  return (
    <div
      className={`relative flex flex-col justify-between h-full rounded-2xl bg-white border transition-all duration-200 shadow-xs hover:shadow-lg ${
        isTopRank
          ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-950/5"
          : "border-zinc-200/90 hover:border-zinc-300"
      }`}
    >
      {/* Top Banner Accent for Rank #1 */}
      {isTopRank && (
        <div className="absolute -top-3.5 left-6 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-700 text-white shadow-sm ring-2 ring-white">
          <AwardIcon size={14} />
          <span>{language === "rw" ? "Inama ya mbere ku gihingwa" : "Top recommendation"}</span>
        </div>
      )}

      <div className="p-6 sm:p-7 space-y-6">
        {/* Header: Rank Badge & Crop Name */}
        <div className="flex items-start justify-between gap-4 pt-1">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-xs ${
                isTopRank
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-zinc-100 border border-zinc-200 text-zinc-700"
              }`}
            >
              <span>{visual.emoji}</span>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight">
                  {recommendation.crop}
                </h3>
              </div>
              <p className="text-xs font-semibold text-emerald-700">
                {language === "rw" ? visual.rwName : ""}
                {recommendation.category &&
                  recommendation.category !== recommendation.crop && (
                    <span className="text-zinc-400 font-normal">
                      {" "}
                      • {recommendation.category}
                    </span>
                  )}
              </p>
            </div>
          </div>

          {/* Rank indicator */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm ${
              isTopRank
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 border border-zinc-200"
            }`}
          >
            #{rank}
          </div>
        </div>

        {/* 1. Recommendation Score Box */}
        <div
          className={`p-4 rounded-xl border ${
            isTopRank
              ? "bg-emerald-50/70 border-emerald-200/80"
              : "bg-zinc-50 border-zinc-200/70"
          }`}
        >
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              {language === "rw" ? "Amanota y’inama / urutonde rwa modeli" : "Recommendation score / model ranking"}
            </span>
            <span
              className={`text-2xl font-extrabold tracking-tight ${
                isTopRank ? "text-emerald-800" : "text-zinc-900"
              }`}
            >
              {scorePercent}%
            </span>
          </div>

          {/* Score progress track */}
          <div className="w-full bg-zinc-200/70 h-2 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isTopRank ? "bg-emerald-600" : "bg-zinc-700"
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, Number(scorePercent)))}%`,
              }}
            />
          </div>
        </div>

        {/* 2. Deterministic Summary */}
        {recommendation.summary && (
          <div className="p-3.5 rounded-xl bg-zinc-50/80 border border-zinc-200/60 text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium">
            <p className="text-zinc-800">{recommendation.summary}</p>
          </div>
        )}

        {/* 3. Why this crop? (Reasons Section) */}
        {recommendation.reasons && recommendation.reasons.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <SproutIcon size={14} className="text-emerald-700" />
              <span>{language === "rw" ? "Kuki iki gihingwa?" : "Why this crop?"}</span>
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-600">
              {recommendation.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-snug">
                  <CheckCircle2Icon
                    size={15}
                    className="text-emerald-600 flex-shrink-0 mt-0.5"
                  />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 4. Historical Evidence Section */}
        <div className="pt-4 border-t border-zinc-100 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            {language === "rw" ? "Ibimenyetso by’amateka" : "Historical evidence"}
          </h4>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/60">
              <p className="text-base sm:text-lg font-bold text-zinc-900">
                {recommendation.historical_observations ?? "—"}
              </p>
              <p className="text-[11px] text-zinc-500">{language === "rw" ? "Inyandiko z’amateka" : "Historical observations"}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/60">
              <p className="text-base sm:text-lg font-bold text-zinc-900">
                {frequencyPercent ? `${frequencyPercent}%` : "—"}
              </p>
              <p className="text-[11px] text-zinc-500">{language === "rw" ? "Inshuro cyagaragaye mu mateka" : "Historical frequency"}</p>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 italic leading-tight">
            {language === "rw" ? "Iyi nama ishingiye ku nyandiko z’ubuhinzi zo mu bihe byashize." : "This recommendation is supported by historical agriculture observations."}
          </p>
        </div>
      </div>
    </div>
  );
}
