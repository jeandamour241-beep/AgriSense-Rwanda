"use client";

import React, { useState, useEffect } from "react";
import {
  RWANDA_PROVINCES,
  DISTRICTS_BY_PROVINCE,
  STRATUM_OPTIONS,
  SOWING_PERIOD_OPTIONS,
  SEED_TYPE_OPTIONS,
  CROP_OPTIONS,
  IRRIGATION_SOIL_EROSION_OPTIONS,
  IRRIGATION_LAND_CONSOLIDATION_OPTIONS,
  SelectOption,
} from "@/lib/constants/irrigationConstants";
import { AGRICULTURE_SEASONS } from "@/lib/constants/rwandaAgriculture";
import { IrrigationRequest } from "@/types/irrigation";
import {
  getIrrigationRecommendation,
  IrrigationServiceError,
} from "@/lib/services/irrigationService";
import { useIrrigation } from "@/lib/context/IrrigationContext";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  DropletsIcon,
  SpinnerIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  InfoIcon,
} from "@/components/ui/Icons";

// ============================================================
// STYLES
// ============================================================
const inputBase =
  "w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white text-zinc-800 transition-all focus:outline-none focus:ring-2";
const inputNormal =
  "border-zinc-300 hover:border-zinc-400 focus:border-emerald-500 focus:ring-emerald-500/20";
const inputError = "border-red-400 focus:border-red-500 focus:ring-red-200";

type FieldErrors = Record<string, { en: string; rw: string }>;

// ============================================================
// SECTION HEADER
// ============================================================
function SectionHeader({
  titleEn,
  titleRw,
  icon,
}: {
  titleEn: string;
  titleRw: string;
  icon: React.ReactNode;
}) {
  const { language } = useLanguage();
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-sm sm:text-base font-bold text-zinc-900">
          {language === "rw" ? titleRw : titleEn}
        </h2>
      </div>
    </div>
  );
}

// ============================================================
// FIELD WRAPPER
// ============================================================
function Field({
  label,
  labelRw,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  labelRw: string;
  required?: boolean;
  hint?: string;
  error?: { en: string; rw: string };
  children: React.ReactNode;
}) {
  const { language } = useLanguage();
  return (
    <div className="space-y-1.5">
      <label className="block text-xs sm:text-sm font-semibold text-zinc-800">
        {language === "rw" ? labelRw : label}
        {required && <span className="text-emerald-600 ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600 font-medium">
          {language === "rw" ? error.rw : error.en}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-zinc-500 leading-tight">{hint}</p>
      ) : null}
    </div>
  );
}

function LocationIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CropIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 20h10" />
      <path d="M12 20v-8" />
      <path d="M12 12c0-4.4 3.6-8 8-8 0 4.4-3.6 8-8 8Z" />
      <path d="M12 15c0-3.3-2.7-6-6-6 0 3.3 2.7 6 6 6Z" />
    </svg>
  );
}

function PlotIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

// ============================================================
// MAIN FORM COMPONENT
// ============================================================
export function IrrigationForm() {
  const { language } = useLanguage();
  const { setIrrigationData, lastInput, isLoading, setIsLoading } =
    useIrrigation();

  // Exactly 10 model fields
  const [province, setProvince] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [stratum, setStratum] = useState<string>("");
  const [season, setSeason] = useState<string>("");
  const [plotArea, setPlotArea] = useState<string>("");
  const [crop, setCrop] = useState<string>("");
  const [sowingPeriod, setSowingPeriod] = useState<string>("");
  const [seedType, setSeedType] = useState<string>("");
  const [soilErosion, setSoilErosion] = useState<string>("");
  const [landConsolidation, setLandConsolidation] = useState<string>("");

  // Derived: districts for selected province
  const availableDistricts = province
    ? (DISTRICTS_BY_PROVINCE[province] ?? [])
    : [];

  // UI state
  const [errorMessage, setErrorMessage] = useState<{
    en: string;
    rw: string;
  } | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Prefill from last input on mount
  useEffect(() => {
    if (lastInput) {
      // Rehydrate editable fields from the route-level context after it reads
      // the previous assessment from session storage.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (lastInput.s1q1) setProvince(lastInput.s1q1);
      if (lastInput.s1q2) setDistrict(lastInput.s1q2);
      if (lastInput.s1q3) setStratum(lastInput.s1q3);
      if (lastInput.season) setSeason(lastInput.season);
      if (lastInput.s2q2 !== undefined) setPlotArea(String(lastInput.s2q2));
      if (lastInput.s2q4) setCrop(lastInput.s2q4);
      if (lastInput.s2q7) setSowingPeriod(lastInput.s2q7);
      if (lastInput.s2q11) setSeedType(lastInput.s2q11);
      if (lastInput.s4q1) setSoilErosion(lastInput.s4q1);
      if (lastInput.s4q6) setLandConsolidation(lastInput.s4q6);
    }
  }, [lastInput]);

  // Reset district if province changes
  useEffect(() => {
    if (
      province &&
      district &&
      !DISTRICTS_BY_PROVINCE[province]?.includes(district)
    ) {
      // Keep the dependent district selection valid when a restored province changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDistrict("");
    }
  }, [province, district]);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: FieldErrors = {};
    if (!province.trim())
      newErrors.province = {
        en: "Please select a province.",
        rw: "Hitamo intara.",
      };
    if (!district.trim())
      newErrors.district = {
        en: "Please select a district.",
        rw: "Hitamo akarere.",
      };
    if (!stratum.trim())
      newErrors.stratum = {
        en: "Please select the land context.",
        rw: "Hitamo icyiciro cy'ubutaka.",
      };
    if (!season.trim())
      newErrors.season = {
        en: "Please select an agricultural season.",
        rw: "Hitamo igihembwe cy'ubuhinzi.",
      };
    if (!plotArea.trim()) {
      newErrors.plotArea = {
        en: "Please enter the plot area.",
        rw: "Nyamuneka andika ubuso bw'umurima.",
      };
    } else {
      const num = parseFloat(plotArea);
      if (isNaN(num) || num <= 0)
        newErrors.plotArea = {
          en: "Plot area must be greater than 0.",
          rw: "Ubuso bw'umurima bugomba kurenza 0.",
        };
    }
    if (!crop.trim())
      newErrors.crop = { en: "Please select a crop.", rw: "Hitamo igihingwa." };
    if (!sowingPeriod.trim())
      newErrors.sowingPeriod = {
        en: "Please select a sowing period.",
        rw: "Hitamo igihe cyo gutera.",
      };
    if (!seedType.trim())
      newErrors.seedType = {
        en: "Please select a seed type.",
        rw: "Hitamo ubwoko bw'imbuto.",
      };
    if (!soilErosion.trim())
      newErrors.soilErosion = {
        en: "Please select soil erosion level.",
        rw: "Hitamo urugero rw'isuri.",
      };
    if (!landConsolidation.trim())
      newErrors.landConsolidation = {
        en: "Please select land consolidation.",
        rw: "Hitamo niba umurima uhuje ubutaka.",
      };

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!validate()) return;

    setIsLoading(true);

    // Exact 10 model fields submitted
    const payload: IrrigationRequest = {
      s1q1: province,
      s1q2: district,
      s1q3: stratum,
      season: season,
      s2q2: parseFloat(plotArea),
      s2q4: crop,
      s2q7: sowingPeriod,
      s2q11: seedType,
      s4q1: soilErosion,
      s4q6: landConsolidation,
    };

    try {
      const response = await getIrrigationRecommendation(payload);
      setIrrigationData(response, payload);
    } catch (err: unknown) {
      if (err instanceof IrrigationServiceError) {
        setErrorMessage({ en: err.messageEn, rw: err.messageRw });
      } else {
        setErrorMessage({
          en: "There was a problem getting the model assessment. Please try again.",
          rw: "Habaye ikibazo mu kubona igisubizo cya modeli. Ongera ugerageze.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Header Banner ──────────────────────── */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-xs">
            <DropletsIcon size={24} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>
                {language === "rw"
                  ? "Isuzuma ryo kuhira • Rwanda"
                  : "Irrigation Assessment • Rwanda"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Irrigation Decision Assistant
            </h1>
            <p className="text-sm font-semibold text-emerald-800 mt-0.5">
              Umufasha mu Gufata Icyemezo ku Kuhira
            </p>
            <div className="mt-4 pt-3 border-t border-zinc-100 text-sm text-zinc-600 space-y-1.5 leading-relaxed">
              <p>
                {language === "rw"
                  ? "Tanga amakuru y’umurima wawe kugira ngo isuzuma rifashe kumenya niba kuhira bishobora gukenerwa."
                  : "Enter your plot information to assess whether irrigation may be needed."}
              </p>
              <p className="text-zinc-500 italic text-xs sm:text-sm">
                Shyiramo amakuru y&apos;umurima kugira ngo isuzume niba kuhira
                bishobora gukenerwa.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error Banner ───────────────────────── */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 sm:p-5 rounded-2xl bg-red-50 border border-red-200/90 text-red-900 flex items-start gap-3 shadow-xs"
        >
          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangleIcon size={18} />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-red-950">{errorMessage.en}</p>
            <p className="text-red-700 text-xs mt-0.5">{errorMessage.rw}</p>
          </div>
        </div>
      )}

      {/* ── Main Form ──────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white border border-zinc-200/80 shadow-xs overflow-hidden"
        noValidate
      >
        {/* ── Section A: Location ─────────────── */}
        <div className="p-6 sm:p-8 space-y-5">
          <SectionHeader
            titleEn="A. Location Information"
            titleRw="Ahantu umurima uherereye"
            icon={<LocationIcon />}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* s1q1 — Province */}
            <Field
              label="Province"
              labelRw="Intara"
              required
              error={errors.province}
            >
              <select
                id="irr-province-select"
                name="s1q1"
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  clearError("province");
                }}
                disabled={isLoading}
                className={`${inputBase} ${errors.province ? inputError : inputNormal}`}
              >
                <option value="">
                  {language === "rw" ? "Hitamo intara" : "Select province"}
                </option>
                {RWANDA_PROVINCES.map((p: SelectOption) => (
                  <option key={p.value} value={p.value}>
                    {language === "rw" ? p.labelRw : p.labelEn}
                  </option>
                ))}
              </select>
            </Field>

            {/* s1q2 — District (cascading) */}
            <Field
              label="District"
              labelRw="Akarere"
              required
              hint={
                !province
                  ? language === "rw"
                    ? "Banza uhitemo intara."
                    : "Select a province first."
                  : undefined
              }
              error={errors.district}
            >
              <select
                id="irr-district-select"
                name="s1q2"
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  clearError("district");
                }}
                disabled={isLoading || !province}
                className={`${inputBase} ${errors.district ? inputError : inputNormal} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="">
                  {province
                    ? language === "rw"
                      ? "Hitamo akarere"
                      : "Select district"
                    : language === "rw"
                      ? "Banza uhitemo intara"
                      : "Select province first"}
                </option>
                {availableDistricts.map((d: string) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>

            {/* s1q3 — Stratum / Land context */}
            <div className="md:col-span-2">
              <Field
                label="Stratum / Land Context"
                labelRw="Icyiciro cy'ubutaka / aho umurima uherereye"
                required
                error={errors.stratum}
              >
                <select
                  id="irr-stratum-select"
                  name="s1q3"
                  value={stratum}
                  onChange={(e) => {
                    setStratum(e.target.value);
                    clearError("stratum");
                  }}
                  disabled={isLoading}
                  className={`${inputBase} ${errors.stratum ? inputError : inputNormal}`}
                >
                  <option value="">
                    {language === "rw"
                      ? "Hitamo icyiciro cy’ubutaka"
                      : "Select land context"}
                  </option>
                  {STRATUM_OPTIONS.map((s: SelectOption) => (
                    <option key={s.value} value={s.value}>
                      {language === "rw" ? s.labelRw : s.labelEn}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100" />

        {/* ── Section B: Crop Information ──────── */}
        <div className="p-6 sm:p-8 space-y-5">
          <SectionHeader
            titleEn="B. Crop Information"
            titleRw="Amakuru y'igihingwa"
            icon={<CropIcon />}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* season — Agricultural Season */}
            <Field
              label="Agricultural Season"
              labelRw="Igihembwe cy'ubuhinzi"
              required
              error={errors.season}
            >
              <select
                id="irr-season-select"
                name="season"
                value={season}
                onChange={(e) => {
                  setSeason(e.target.value);
                  clearError("season");
                }}
                disabled={isLoading}
                className={`${inputBase} ${errors.season ? inputError : inputNormal}`}
              >
                <option value="">
                  {language === "rw" ? "Hitamo igihembwe" : "Select season"}
                </option>
                {AGRICULTURE_SEASONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.labelEn} — {s.labelRw}
                  </option>
                ))}
              </select>
            </Field>

            {/* s2q4 — Crop */}
            <Field
              label="Crop"
              labelRw="Igihingwa"
              required
              error={errors.crop}
            >
              <select
                id="irr-crop-select"
                name="s2q4"
                value={crop}
                onChange={(e) => {
                  setCrop(e.target.value);
                  clearError("crop");
                }}
                disabled={isLoading}
                className={`${inputBase} ${errors.crop ? inputError : inputNormal}`}
              >
                <option value="">
                  {language === "rw" ? "Hitamo igihingwa" : "Select crop"}
                </option>
                {CROP_OPTIONS.map((c: SelectOption) => (
                  <option key={c.value} value={c.value}>
                    {language === "rw" ? c.labelRw : c.labelEn}
                  </option>
                ))}
              </select>
            </Field>

            {/* s2q7 — Sowing Period */}
            <Field
              label="Sowing Period"
              labelRw="Igihe cyo gutera"
              required
              error={errors.sowingPeriod}
            >
              <select
                id="irr-sowing-select"
                name="s2q7"
                value={sowingPeriod}
                onChange={(e) => {
                  setSowingPeriod(e.target.value);
                  clearError("sowingPeriod");
                }}
                disabled={isLoading}
                className={`${inputBase} ${errors.sowingPeriod ? inputError : inputNormal}`}
              >
                <option value="">
                  {language === "rw"
                    ? "Hitamo igihe cyo gutera"
                    : "Select sowing period"}
                </option>
                {SOWING_PERIOD_OPTIONS.map((s: SelectOption) => (
                  <option key={s.value} value={s.value}>
                    {language === "rw" ? s.labelRw : s.labelEn}
                  </option>
                ))}
              </select>
            </Field>

            {/* s2q11 — Seed Type */}
            <Field
              label="Seed Type"
              labelRw="Ubwoko bw'imbuto"
              required
              error={errors.seedType}
            >
              <select
                id="irr-seed-select"
                name="s2q11"
                value={seedType}
                onChange={(e) => {
                  setSeedType(e.target.value);
                  clearError("seedType");
                }}
                disabled={isLoading}
                className={`${inputBase} ${errors.seedType ? inputError : inputNormal}`}
              >
                <option value="">
                  {language === "rw"
                    ? "Hitamo ubwoko bw’imbuto"
                    : "Select seed type"}
                </option>
                {SEED_TYPE_OPTIONS.map((s: SelectOption) => (
                  <option key={s.value} value={s.value}>
                    {language === "rw" ? s.labelRw : s.labelEn}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="border-t border-zinc-100" />

        {/* ── Section C: Plot Information ──────── */}
        <div className="p-6 sm:p-8 space-y-5">
          <SectionHeader
            titleEn="C. Plot Information"
            titleRw="Amakuru y'umurima"
            icon={<PlotIcon />}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* s2q2 — Plot Area (ha) */}
            <div className="md:col-span-2">
              <Field
                label="Plot Area (ha)"
                labelRw="Ubuso bw'umurima (ha)"
                required
                hint={
                  language === "rw"
                    ? "Andika ubuso bw’umurima burenze 0 muri hegitari."
                    : "Enter plot size in hectares (> 0)."
                }
                error={errors.plotArea}
              >
                <input
                  id="irr-plot-area-input"
                  type="number"
                  name="s2q2"
                  step="0.01"
                  min="0.01"
                  value={plotArea}
                  onChange={(e) => {
                    setPlotArea(e.target.value);
                    clearError("plotArea");
                  }}
                  disabled={isLoading}
                  placeholder={language === "rw" ? "Urugero: 0.8" : "e.g. 0.8"}
                  className={`${inputBase} placeholder-zinc-400 ${errors.plotArea ? inputError : inputNormal}`}
                />
              </Field>
            </div>

            {/* s4q1 — Soil Erosion */}
            <Field
              label="Soil Erosion"
              labelRw="Isuri y'ubutaka"
              required
              hint={
                language === "rw"
                  ? "Urugero rw’isuri rushobora kwibasira uyu murima."
                  : "Erosion vulnerability of the plot."
              }
              error={errors.soilErosion}
            >
              <select
                id="irr-erosion-select"
                name="s4q1"
                value={soilErosion}
                onChange={(e) => {
                  setSoilErosion(e.target.value);
                  clearError("soilErosion");
                }}
                disabled={isLoading}
                className={`${inputBase} ${errors.soilErosion ? inputError : inputNormal}`}
              >
                <option value="">
                  {language === "rw"
                    ? "Hitamo urugero rw’isuri"
                    : "Select soil erosion"}
                </option>
                {IRRIGATION_SOIL_EROSION_OPTIONS.map((opt: SelectOption) => (
                  <option key={opt.value} value={opt.value}>
                    {language === "rw" ? opt.labelRw : opt.labelEn}
                  </option>
                ))}
              </select>
            </Field>

            {/* s4q6 — Land Consolidation */}
            <Field
              label="Land Consolidation"
              labelRw="Guhuriza hamwe ubutaka"
              required
              hint={
                language === "rw"
                  ? "Uyu murima uri muri gahunda yo guhuza ubutaka?"
                  : "Is this plot part of land consolidation?"
              }
              error={errors.landConsolidation}
            >
              <select
                id="irr-consolidation-select"
                name="s4q6"
                value={landConsolidation}
                onChange={(e) => {
                  setLandConsolidation(e.target.value);
                  clearError("landConsolidation");
                }}
                disabled={isLoading}
                className={`${inputBase} ${errors.landConsolidation ? inputError : inputNormal}`}
              >
                <option value="">
                  {language === "rw"
                    ? "Hitamo uko ubutaka buhujwe"
                    : "Select consolidation"}
                </option>
                {IRRIGATION_LAND_CONSOLIDATION_OPTIONS.map(
                  (opt: SelectOption) => (
                    <option key={opt.value} value={opt.value}>
                      {language === "rw" ? opt.labelRw : opt.labelEn}
                    </option>
                  ),
                )}
              </select>
            </Field>
          </div>
        </div>

        {/* ── Info hint ──────────────────────────── */}
        <div className="mx-6 sm:mx-8 mb-6">
          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 flex items-center gap-2.5 text-xs text-emerald-900">
            <InfoIcon size={15} className="text-emerald-700 flex-shrink-0" />
            <span>
              {language === "rw"
                ? "Isuzuma rikoresha amakuru y’ubushakashatsi bw’ubuhinzi mu Rwanda n’imodeli yatojwe kugira ngo risuzume niba kuhira bikenewe. Iyi modeli yatojwe ku nyandiko zagaragaje ko kuhira byakozwe."
                : "This assessment uses historical national agricultural survey data and a trained machine learning model to assess irrigation needs. The model was trained on records where irrigation was reported as practiced."}
            </span>
          </div>
        </div>

        {/* ── Submit Button ─────────────────────────────── */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-100">
          <div className="text-xs text-zinc-500 text-center sm:text-left">
            <span className="text-emerald-600 font-semibold">*</span>{" "}
            {language === "rw" ? "Ibice bisabwa" : "Required fields"}
          </div>
          <button
            id="irr-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 shadow-md shadow-emerald-950/15 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer select-none"
          >
            {isLoading ? (
              <>
                <SpinnerIcon size={20} className="text-white" />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold leading-tight">
                    {language === "rw"
                      ? "Modeli irimo gusesengura amakuru y’umurima wawe..."
                      : "The model is analyzing your plot information..."}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col text-left">
                  <span className="text-sm sm:text-base font-bold leading-tight">
                    {language === "rw"
                      ? "Saba isuzuma ryo kuhira"
                      : "Get Irrigation Assessment"}
                  </span>
                </div>
                <ArrowRightIcon size={18} className="text-white ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
