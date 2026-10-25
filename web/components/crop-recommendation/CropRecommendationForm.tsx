"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RWANDA_DISTRICTS,
  AGRICULTURE_SEASONS,
  IRRIGATION_OPTIONS,
  SOIL_EROSION_OPTIONS,
  LAND_CONSOLIDATION_OPTIONS,
} from "@/lib/constants/rwandaAgriculture";
import { CropRecommendationRequest } from "@/types/cropRecommendation";
import {
  getCropRecommendations,
  CropRecommendationServiceError,
} from "@/lib/services/cropRecommendationService";
import { useCropRecommendation } from "@/lib/context/CropRecommendationContext";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  SproutIcon,
  SpinnerIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  InfoIcon,
} from "@/components/ui/Icons";

export function CropRecommendationForm() {
  const router = useRouter();
  const { language } = useLanguage();
  const { setRecommendationData, lastInput } = useCropRecommendation();

  // Form State
  const [district, setDistrict] = useState<string>("");
  const [season, setSeason] = useState<string>("");
  const [plotArea, setPlotArea] = useState<string>("");
  const [irrigation, setIrrigation] = useState<string>("No");
  const [soilErosion, setSoilErosion] = useState<string>("Low");
  const [landConsolidation, setLandConsolidation] = useState<string>("Yes");

  // UI State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<{
    en: string;
    rw: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, { en: string; rw: string }>>({});

  // Prefill from lastInput if available
  useEffect(() => {
    if (lastInput) {
      // The context restores this input from session storage after mount; copy
      // that external snapshot into the editable form state once it arrives.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (lastInput.s1q2) setDistrict(lastInput.s1q2);
      if (lastInput.season) setSeason(lastInput.season);
      if (lastInput.s2q2 !== undefined) setPlotArea(String(lastInput.s2q2));
      if (lastInput.s4q13) setIrrigation(lastInput.s4q13);
      if (lastInput.s4q1) setSoilErosion(lastInput.s4q1);
      if (lastInput.s4q6) setLandConsolidation(lastInput.s4q6);
    }
  }, [lastInput]);

  const validate = (): boolean => {
    const newErrors: Record<string, { en: string; rw: string }> = {};

    if (!district.trim()) {
      newErrors.district = {
        en: "Please select a district.",
        rw: "Hitamo akarere.",
      };
    }

    if (!season.trim()) {
      newErrors.season = {
        en: "Please select a season.",
        rw: "Hitamo igihembwe cy'ubuhinzi.",
      };
    }

    if (plotArea !== "") {
      const numArea = parseFloat(plotArea);
      if (isNaN(numArea) || numArea < 0) {
        newErrors.plotArea = {
          en: "Plot area must be greater than or equal to 0.",
          rw: "Ubuso bw'umurima bugomba kuba 0 cyangwa burenze.",
        };
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const payload: CropRecommendationRequest = {
      s1q2: district,
      season: season,
      s2q2: plotArea !== "" ? parseFloat(plotArea) : 0.8,
      s4q13: irrigation || "No",
      s4q1: soilErosion || "Low",
      s4q6: landConsolidation || "Yes",
    };

    try {
      const response = await getCropRecommendations(payload);

      // Store in context & session
      setRecommendationData(response, payload);

      // Navigate to results page
      router.push("/crop-recommendation/results");
    } catch (err: unknown) {
      if (err instanceof CropRecommendationServiceError) {
        setErrorMessage({
          en: err.messageEn,
          rw: err.messageRw,
        });
      } else {
        setErrorMessage({
          en: "We could not connect to the agriculture service. Please try again.",
          rw: "Ntabwo twabashije guhuza na serivisi y'ubuhinzi. Ongera ugerageze.",
        });
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Bilingual Introductory Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-xs">
            <SproutIcon size={24} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>{language === "rw" ? "Inama ku bihingwa • Rwanda" : "Crop Recommendations • Rwanda"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              {language === "rw" ? "Sisitemu itanga inama ku bihingwa" : "Crop Recommendation System"}
            </h1>
            <p className="text-sm font-semibold text-emerald-800 mt-0.5">
              {language === "rw" ? "Inama ku bihingwa" : "Crop guidance"}
            </p>

            <div className="mt-4 pt-3 border-t border-zinc-100 text-sm text-zinc-600 space-y-1.5 leading-relaxed">
              <p>
                {language === "rw" ? "Tanga amakuru y’umurima wawe kugira ngo tugusabire ibihingwa bikwiye dushingiye ku makuru y’ubuhinzi bwo mu Rwanda n’isesengura rya modeli." : "Tell us about your farm and we will recommend suitable crops based on historical Rwanda agriculture data and model analysis."}
              </p>
              <p className="text-zinc-500 italic text-xs sm:text-sm">
                {language === "rw" ? "Ibi byifuzo bishingiye ku makuru y’ubuhinzi bwo mu Rwanda n’isesengura rya modeli." : "Recommendations are based on Rwanda agriculture data and model analysis."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 sm:p-5 rounded-2xl bg-red-50 border border-red-200/90 text-red-900 flex items-start gap-3 shadow-xs animate-in fade-in duration-200"
        >
          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangleIcon size={18} />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-red-950">{language === "rw" ? errorMessage.rw : errorMessage.en}</p>
          </div>
        </div>
      )}

      {/* 3. Main Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-6"
      >
        <div className="border-b border-zinc-100 pb-3">
          <h2 className="text-base font-bold text-zinc-900">
            {language === "rw" ? "Amakuru y’umurima" : "Farm Information"}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {language === "rw" ? "Uzuza amakuru akurikira kugira ngo ubone inama ku bihingwa." : "Fill in the details below to receive crop recommendations."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Field 1: District (s1q2) */}
          <div className="space-y-1.5">
            <label
              htmlFor="district-select"
              className="block text-xs sm:text-sm font-semibold text-zinc-800"
            >
              {language === "rw" ? "Akarere" : "District"} <span className="text-emerald-700">*</span>
            </label>
            <select
              id="district-select"
              name="s1q2"
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                if (errors.district) {
                  setErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.district;
                    return copy;
                  });
                }
              }}
              disabled={isSubmitting}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white text-zinc-800 transition-all focus:outline-none focus:ring-2 ${
                errors.district
                  ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                  : "border-zinc-300 hover:border-zinc-400 focus:border-emerald-500 focus:ring-emerald-500/20"
              }`}
            >
              <option value="">{language === "rw" ? "Hitamo akarere" : "Select your district"}</option>
              {RWANDA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.district && (
              <p className="text-xs text-red-600 font-medium">
                {language === "rw" ? errors.district.rw : errors.district.en}
              </p>
            )}
          </div>

          {/* Field 2: Season (season) */}
          <div className="space-y-1.5">
            <label
              htmlFor="season-select"
              className="block text-xs sm:text-sm font-semibold text-zinc-800"
            >
              {language === "rw" ? "Igihembwe cy’ubuhinzi" : "Season"}{" "}
              <span className="text-emerald-700">*</span>
            </label>
            <select
              id="season-select"
              name="season"
              value={season}
              onChange={(e) => {
                setSeason(e.target.value);
                if (errors.season) {
                  setErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.season;
                    return copy;
                  });
                }
              }}
              disabled={isSubmitting}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white text-zinc-800 transition-all focus:outline-none focus:ring-2 ${
                errors.season
                  ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                  : "border-zinc-300 hover:border-zinc-400 focus:border-emerald-500 focus:ring-emerald-500/20"
              }`}
            >
              <option value="">{language === "rw" ? "Hitamo igihembwe" : "Select season"}</option>
              {AGRICULTURE_SEASONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {language === "rw" ? s.labelRw : s.labelEn}
                </option>
              ))}
            </select>
            {errors.season && (
              <p className="text-xs text-red-600 font-medium">
                {language === "rw" ? errors.season.rw : errors.season.en}
              </p>
            )}
          </div>

          {/* Field 3: Plot Area (s2q2) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="plot-area-input"
                className="block text-xs sm:text-sm font-semibold text-zinc-800"
              >
                {language === "rw" ? "Ubuso bw’umurima" : "Plot area"}
              </label>
              <span className="text-[11px] text-zinc-400 font-medium">
                {language === "rw" ? "Hegitari (ha)" : "Hectares (ha)"}
              </span>
            </div>
            <input
              id="plot-area-input"
              type="number"
              name="s2q2"
              step="0.01"
              min="0"
              value={plotArea}
              onChange={(e) => {
                setPlotArea(e.target.value);
                if (errors.plotArea) {
                  setErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.plotArea;
                    return copy;
                  });
                }
              }}
              disabled={isSubmitting}
              placeholder={language === "rw" ? "Urugero: 0.8" : "e.g. 0.8"}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white text-zinc-800 placeholder-zinc-400 transition-all focus:outline-none focus:ring-2 ${
                errors.plotArea
                  ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                  : "border-zinc-300 hover:border-zinc-400 focus:border-emerald-500 focus:ring-emerald-500/20"
              }`}
            />
            {errors.plotArea ? (
              <p className="text-xs text-red-600 font-medium">
                {language === "rw" ? errors.plotArea.rw : errors.plotArea.en}
              </p>
            ) : (
              <p className="text-[11px] text-zinc-500 leading-tight">
                {language === "rw" ? "Andika ubuso bugereranyije bw’umurima muri hegitari." : "Enter the approximate plot size in hectares."}
              </p>
            )}
          </div>

          {/* Field 4: Irrigation (s4q13) */}
          <div className="space-y-1.5">
            <label
              htmlFor="irrigation-select"
              className="block text-xs sm:text-sm font-semibold text-zinc-800"
            >
              {language === "rw" ? "Kuhira umurima" : "Irrigation"}
            </label>
            <select
              id="irrigation-select"
              name="s4q13"
              value={irrigation}
              onChange={(e) => setIrrigation(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 hover:border-zinc-400 text-sm bg-white text-zinc-800 transition-all focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20"
            >
              {IRRIGATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {language === "rw" ? opt.labelRw : opt.labelEn}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500 leading-tight">
              {language === "rw" ? "Hitamo niba umurima ukoreshwa mu kuhira." : "Does this farm use irrigation?"}
            </p>
          </div>

          {/* Field 5: Soil Erosion (s4q1) */}
          <div className="space-y-1.5">
            <label
              htmlFor="erosion-select"
              className="block text-xs sm:text-sm font-semibold text-zinc-800"
            >
              {language === "rw" ? "Isuri y’ubutaka" : "Soil erosion"}
            </label>
            <select
              id="erosion-select"
              name="s4q1"
              value={soilErosion}
              onChange={(e) => setSoilErosion(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 hover:border-zinc-400 text-sm bg-white text-zinc-800 transition-all focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20"
            >
              {SOIL_EROSION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {language === "rw" ? opt.labelRw : opt.labelEn}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500 leading-tight">
              {language === "rw" ? "Urugero rw’isuri ku murima." : "Erosion vulnerability level."}
            </p>
          </div>

          {/* Field 6: Land Consolidation (s4q6) */}
          <div className="space-y-1.5">
            <label
              htmlFor="consolidation-select"
              className="block text-xs sm:text-sm font-semibold text-zinc-800"
            >
              {language === "rw" ? "Guhuza ubutaka bw’ubuhinzi" : "Land consolidation"}
            </label>
            <select
              id="consolidation-select"
              name="s4q6"
              value={landConsolidation}
              onChange={(e) => setLandConsolidation(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 hover:border-zinc-400 text-sm bg-white text-zinc-800 transition-all focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20"
            >
              {LAND_CONSOLIDATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {language === "rw" ? opt.labelRw : opt.labelEn}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500 leading-tight">
              {language === "rw" ? "Uyu murima uri muri gahunda yo guhuza ubutaka?" : "Part of a land consolidation program?"}
            </p>
          </div>
        </div>

        {/* Informative Hint */}
        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center gap-2.5 text-xs text-zinc-600">
          <InfoIcon size={16} className="text-emerald-700 flex-shrink-0" />
          <span>
            {language === "rw" ? "RwandaAgriSystem ikoresha ubushakashatsi bw’ubuhinzi bwabanje na machine learning kugira ngo itange urutonde rukurikije akarere k’imihingire." : "RwandaAgriSystem uses historical national surveys and machine learning models to rank crops for your agro-ecological zone."}
          </span>
        </div>

        {/* Submit Action Area */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-100">
          <div className="text-xs text-zinc-500 text-center sm:text-left">
            <span className="text-emerald-700 font-semibold">*</span> {language === "rw" ? "Ibice bisabwa" : "Required fields"}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 shadow-md shadow-emerald-950/15 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer select-none"
          >
            {isSubmitting ? (
              <>
                <SpinnerIcon size={20} className="text-white" />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold leading-tight">
                    {language === "rw" ? "Turimo gusesengura umurima wawe..." : "Analyzing your farm..."}
                  </span>
                  <span className="text-[11px] text-emerald-100 font-medium leading-tight">
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col text-left">
                  <span className="text-sm sm:text-base font-bold leading-tight">
                    {language === "rw" ? "Bona inama ku bihingwa" : "Get Crop Recommendations"}
                  </span>
                  <span className="text-[11px] text-emerald-100 font-normal leading-tight">
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
