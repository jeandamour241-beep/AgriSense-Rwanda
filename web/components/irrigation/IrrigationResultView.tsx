"use client";

import React from "react";
import { useIrrigation } from "@/lib/context/IrrigationContext";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  IrrigationResponseData,
  IrrigationRequest,
  HistoricalCategoryAdvice,
  HistoricalCostAdvice,
} from "@/types/irrigation";
import {
  DropletsIcon,
  CheckCircle2Icon,
  InfoIcon,
  RotateCcwIcon,
} from "@/components/ui/Icons";

// ============================================================
// HELPERS
// ============================================================

function fmtPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/A";
  return `${Number(value).toFixed(2)}%`;
}

function fmtRWF(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/A";
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(value);
}

const PROVINCE_LABELS: Record<string, string> = {
  Kigali: "Kigali City / Umujyi wa Kigali",
  North: "Northern Province / Amajyaruguru",
  South: "Southern Province / Amajyepfo",
  East: "Eastern Province / Iburasirazuba",
  West: "Western Province / Iburengerazuba",
};

function humanLabel(value: string | undefined, map?: Record<string, string>): string {
  if (!value) return "—";
  if (map && map[value]) return map[value];
  return value;
}

// ============================================================
// CONFIDENCE PROGRESS BAR
// ============================================================

function ProgressBar({ value, colorClass }: { value: number | null; colorClass: string }) {
  const pct = value ?? 0;
  return (
    <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

// ============================================================
// ADVICE CARD SHELL
// ============================================================

function AdviceCard({
  titleEn,
  titleRw,
  icon,
  children,
}: {
  titleEn: string;
  titleRw: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const { language } = useLanguage();
  return (
    <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200/80 text-sky-700 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-900">{language === "rw" ? titleRw : titleEn}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ============================================================
// SUBMITTED INFO ROW
// ============================================================

function InfoRow({ labelEn, labelRw, value }: { labelEn: string; labelRw: string; value: string }) {
  const { language } = useLanguage();
  return (
    <div className="py-2.5 grid grid-cols-2 gap-2 border-b border-zinc-100 last:border-0">
      <div>
        <p className="text-xs font-semibold text-zinc-700">{language === "rw" ? labelRw : labelEn}</p>
      </div>
      <p className="text-sm font-medium text-zinc-900 text-right self-center break-words">{value || "—"}</p>
    </div>
  );
}

// ============================================================
// MAIN DECISION CARD
// ============================================================

function MainDecisionCard({ data }: { data: IrrigationResponseData }) {
  const { language } = useLanguage();
  const recommended = data.irrigation_needed;
  return (
    <div
      className={`p-6 sm:p-8 rounded-2xl border shadow-xs transition-all ${
        recommended
          ? "bg-sky-50/80 border-sky-200/80"
          : "bg-emerald-50/60 border-emerald-200/70"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-xs ${
            recommended
              ? "bg-sky-100/90 border-sky-200 text-sky-700"
              : "bg-emerald-100/90 border-emerald-200 text-emerald-700"
          }`}
        >
          {recommended ? <DropletsIcon size={34} /> : <CheckCircle2Icon size={34} />}
        </div>

        {/* Decision text */}
        <div className="flex-1">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 ${
              recommended
                ? "bg-sky-100 text-sky-800 border border-sky-200/70"
                : "bg-emerald-100 text-emerald-800 border border-emerald-200/70"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                recommended ? "bg-sky-600" : "bg-emerald-600"
              } animate-pulse`}
            />
            <span>{language === "rw" ? "RwandaAgriSystem • Isuzuma ryo kuhira" : "RwandaAgriSystem • Irrigation Assessment"}</span>
          </div>
          <h2
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              recommended ? "text-sky-950" : "text-emerald-950"
            }`}
          >
            {language === "rw" ? (recommended ? "Birakwiye kuhira" : "Ntabwo bikwiye kuhira") : (recommended ? "Irrigation is recommended" : "Irrigation is not recommended")}
          </h2>
          <p
            className={`text-base font-semibold mt-1 ${
              recommended ? "text-sky-700" : "text-emerald-700"
            }`}
          >
          </p>
        </div>
      </div>

      {/* Confidence + Probability row */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Model confidence */}
        <div className="p-4 bg-white/90 rounded-xl border border-white/70 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-zinc-800">{language === "rw" ? "Urwego rw’icyizere cya modeli" : "Model confidence"}</p>
            </div>
            <span className={`text-lg font-extrabold ${recommended ? "text-sky-700" : "text-emerald-700"}`}>
              {fmtPct(data.confidence)}
            </span>
          </div>
          <ProgressBar value={data.confidence} colorClass={recommended ? "bg-sky-500" : "bg-emerald-500"} />
        </div>

        {/* Probability of Irrigation */}
        <div className="p-4 bg-white/90 rounded-xl border border-white/70 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-zinc-800">{language === "rw" ? "Amahirwe yo gukenera kuhira" : "Probability of irrigation"}</p>
            </div>
            <span className={`text-lg font-extrabold ${recommended ? "text-sky-700" : "text-zinc-600"}`}>
              {fmtPct(data.probability_irrigation)}
            </span>
          </div>
          <ProgressBar
            value={data.probability_irrigation}
            colorClass={(data.probability_irrigation ?? 0) >= 50 ? "bg-sky-500" : "bg-zinc-400"}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HISTORICAL ADVICE SECTION
// ============================================================

function HistoricalAdviceSection({ advice }: { advice: IrrigationResponseData["historical_advice"] }) {
  if (!advice) return null;

  const technique: HistoricalCategoryAdvice | null | undefined = advice.technique;
  const waterSource: HistoricalCategoryAdvice | null | undefined = advice.water_source;
  const tool: HistoricalCategoryAdvice | null | undefined = advice.irrigation_tool || advice.tool;
  const cost: HistoricalCostAdvice | null | undefined = advice.historical_cost || advice.cost;

  const hasAny = Boolean(technique || waterSource || tool || cost);
  if (!hasAny) return null;

  return (
    <section aria-labelledby="irr-hist-title" className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
        <div>
          <h3 id="irr-hist-title" className="text-base sm:text-lg font-bold text-zinc-900">
            Historical Irrigation Advice
          </h3>
          <p className="text-xs text-zinc-500 font-medium">Inama y&apos;ubuhinzi bw&apos;amateka</p>
        </div>
        <span className="text-xs font-semibold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-200/70 hidden sm:block">
          Based on similar historical plots
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Technique */}
        {technique && (
          <AdviceCard
            titleEn="Irrigation Technique"
            titleRw="Uburyo bwo kuhira"
            icon={
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            }
          >
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-zinc-900">
                {technique.label ?? technique.top_value ?? "—"}
              </p>
              {technique.percentage !== undefined && (
                <>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${Math.min(100, technique.percentage)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Historical usage: <span className="font-semibold text-sky-700">{technique.percentage.toFixed(1)}%</span>
                  </p>
                </>
              )}
              {(technique.count !== undefined || technique.observations !== undefined) && (
                <p className="text-[11px] text-zinc-400">
                  {(technique.count ?? technique.observations)?.toLocaleString()} observations
                </p>
              )}
            </div>
          </AdviceCard>
        )}

        {/* Water Source */}
        {waterSource && (
          <AdviceCard
            titleEn="Water Source"
            titleRw="Aho amazi ava"
            icon={
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
              </svg>
            }
          >
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-zinc-900">
                {waterSource.label ?? waterSource.top_value ?? "—"}
              </p>
              {waterSource.percentage !== undefined && (
                <>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, waterSource.percentage)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Historical usage: <span className="font-semibold text-blue-700">{waterSource.percentage.toFixed(1)}%</span>
                  </p>
                </>
              )}
              {(waterSource.count !== undefined || waterSource.observations !== undefined) && (
                <p className="text-[11px] text-zinc-400">
                  {(waterSource.count ?? waterSource.observations)?.toLocaleString()} observations
                </p>
              )}
            </div>
          </AdviceCard>
        )}

        {/* Irrigation Tool */}
        {tool && (
          <AdviceCard
            titleEn="Irrigation Tool"
            titleRw="Igikoresho cyo kuhira"
            icon={
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            }
          >
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-zinc-900">
                {tool.label ?? tool.top_value ?? "—"}
              </p>
              {tool.percentage !== undefined && (
                <>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, tool.percentage)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Historical usage: <span className="font-semibold text-indigo-700">{tool.percentage.toFixed(1)}%</span>
                  </p>
                </>
              )}
              {(tool.count !== undefined || tool.observations !== undefined) && (
                <p className="text-[11px] text-zinc-400">
                  {(tool.count ?? tool.observations)?.toLocaleString()} observations
                </p>
              )}
            </div>
          </AdviceCard>
        )}
      </div>
    </section>
  );
}

// ============================================================
// SUBMITTED INFO CARD
// ============================================================

function SubmittedInfoCard({ input }: { input: IrrigationRequest }) {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
      <div className="border-b border-zinc-100 pb-3 mb-1">
        <h3 className="text-sm font-bold text-zinc-900">Your Submitted Information</h3>
        <p className="text-[11px] text-zinc-500 font-medium">Amakuru watanze</p>
      </div>
      <InfoRow labelEn="Province" labelRw="Intara" value={humanLabel(input.s1q1, PROVINCE_LABELS)} />
      <InfoRow labelEn="District" labelRw="Akarere" value={input.s1q2} />
      <InfoRow labelEn="Stratum / Land Context" labelRw="Icyiciro cy'ubutaka" value={input.s1q3} />
      <InfoRow labelEn="Agricultural Season" labelRw="Igihembwe cy'ubuhinzi" value={input.season} />
      <InfoRow labelEn="Crop" labelRw="Igihingwa" value={input.s2q4} />
      <InfoRow labelEn="Plot Area" labelRw="Ubuso bw'umurima" value={`${input.s2q2} ha`} />
      <InfoRow labelEn="Sowing Period" labelRw="Igihe cyo gutera" value={input.s2q7} />
      <InfoRow labelEn="Seed Type" labelRw="Ubwoko bw'imbuto" value={input.s2q11} />
      <InfoRow labelEn="Soil Erosion" labelRw="Isuri y'ubutaka" value={input.s4q1} />
      <InfoRow labelEn="Land Consolidation" labelRw="Guhuriza hamwe ubutaka" value={input.s4q6} />
    </div>
  );
}

// ============================================================
// MAIN RESULT VIEW
// ============================================================

export function IrrigationResultView({
  onReset,
  onScrollToForm,
}: {
  onReset: () => void;
  onScrollToForm?: () => void;
}) {
  const { result, lastInput } = useIrrigation();

  const handleBackToForm = () => {
    if (onScrollToForm) {
      onScrollToForm();
    } else {
      onReset();
    }
  };

  // Empty state fallback
  if (!result) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mx-auto border border-sky-200">
          <DropletsIcon size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900">
            Nta makuru y&apos;isuzuma yabonetse / No Assessment Found
          </h1>
          <p className="text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
            Ntabwo uratanga amakuru y&apos;umurima wawe. Banza wuzuze ibisabwa kugira ngo ubone isuzuma.
          </p>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-semibold text-sm shadow-xs transition-colors"
        >
          <DropletsIcon size={18} />
          <span>Uzuza Amakuru y&apos;Umurima / Fill Plot Form</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={handleBackToForm}
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-950 transition-colors group cursor-pointer"
        >
          <span className="text-sky-700 group-hover:-translate-x-0.5 transition-transform">←</span>
          <span>Back to Form / Subira ku Ifishi</span>
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/90 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-900 shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <RotateCcwIcon size={15} className="text-sky-700" />
          <span>New Assessment / Tangira Isuzuma Rishya</span>
        </button>
      </div>

      {/* Page header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200/70">
          <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
          <span>RwandaAgriSystem • Irrigation Assessment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
          Irrigation Assessment Result
        </h1>
        <p className="text-sm sm:text-base font-semibold text-sky-800">
          Igisubizo cy&apos;Isuzuma ry&apos;Kuhira
        </p>
        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed pt-1">
          Based on your plot information and Rwanda agriculture data. • Hashingiwe ku makuru watanze ndetse n&apos;amakuru y&apos;ubuhinzi bwo mu Rwanda.
        </p>
      </div>

      {/* 10. Main Decision Card */}
      <MainDecisionCard data={result} />

      {/* 12. Historical Advice Section (displayed when available) */}
      {result.historical_advice && (
        <HistoricalAdviceSection advice={result.historical_advice} />
      )}

      {/* 13. User Input Summary */}
      {lastInput && <SubmittedInfoCard input={lastInput} />}

      {/* 14. Important Disclaimer */}
      <div
        role="note"
        className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3.5 text-xs sm:text-sm text-amber-950 shadow-xs"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-100/90 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <InfoIcon size={18} />
        </div>
        <div className="space-y-1.5">
          <p className="font-bold text-amber-950">Important Disclaimer / Icyitonderwa</p>
          <p className="text-amber-950 leading-relaxed">
            <span className="font-semibold">Note:</span> This recommendation is based on available agricultural data and model analysis. It is not a real-time measurement of soil moisture or current weather conditions.
          </p>
          <p className="text-amber-900 text-xs italic leading-relaxed pt-1 border-t border-amber-200/60">
            <span className="font-semibold">Icyitonderwa:</span> Iyi nama ishingiye ku makuru y&apos;ubuhinzi yabitswe n&apos;isesengura rya modeli. Ntabwo ari igipimo nyacyo cy&apos;ubushuhe bw&apos;ubutaka cyangwa iteganyagihe ririho ako kanya.
          </p>
        </div>
      </div>

      {/* 16. New Assessment Bottom Bar */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200/70">
        <button
          onClick={handleBackToForm}
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-950 transition-colors cursor-pointer"
        >
          <span>← Subira ku Ifishi / Back to Form</span>
        </button>
        <button
          id="irr-new-assessment-btn"
          onClick={onReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
        >
          <RotateCcwIcon size={16} />
          <span>Tangira Isuzuma Rishya • New Assessment</span>
        </button>
      </div>
    </div>
  );
}
