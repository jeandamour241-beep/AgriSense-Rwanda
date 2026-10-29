"use client";

import React, { useRef, useEffect } from "react";
import { useIrrigation } from "@/lib/context/IrrigationContext";
import { IrrigationForm } from "@/components/irrigation/IrrigationForm";
import { IrrigationResultView } from "@/components/irrigation/IrrigationResultView";

/**
 * Existing Irrigation Decision Assistant page — /irrigation
 *
 * This is the ONLY irrigation page and route in the application.
 * No second page or route was created.
 **/
export default function IrrigationPage() {
  const { result, clearIrrigation } = useIrrigation();
  const resultRef = useRef<HTMLDivElement>(null);

  // Smoothly scroll down to the result when it arrives
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const handleReset = () => {
    clearIrrigation();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScrollToForm = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-10 pb-12">
      {/* 1. Irrigation Form */}
      <IrrigationForm />

      {/* 2. Recommendation results (rendered below form upon success) */}
      {result && (
        <div
          ref={resultRef}
          id="irrigation-result"
          className="pt-6 border-t border-zinc-200/80"
        >
          <IrrigationResultView
            onReset={handleReset}
            onScrollToForm={handleScrollToForm}
          />
        </div>
      )}
    </div>
  );
}
