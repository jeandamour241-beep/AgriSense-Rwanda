"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  CropRecommendationRequest,
  CropRecommendationResponse,
} from "@/types/cropRecommendation";

interface CropRecommendationContextType {
  result: CropRecommendationResponse | null;
  lastInput: CropRecommendationRequest | null;
  setRecommendationData: (
    data: CropRecommendationResponse,
    input: CropRecommendationRequest
  ) => void;
  clearRecommendation: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const STORAGE_KEY_RESULT = "agrisense_crop_rec_result";
const STORAGE_KEY_INPUT = "agrisense_crop_rec_input";

const CropRecommendationContext = createContext<
  CropRecommendationContextType | undefined
>(undefined);

export function CropRecommendationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [result, setResult] = useState<CropRecommendationResponse | null>(null);
  const [lastInput, setLastInput] = useState<CropRecommendationRequest | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Rehydrate from sessionStorage on mount (prevents state loss on refresh)
  useEffect(() => {
    try {
      const storedResult = sessionStorage.getItem(STORAGE_KEY_RESULT);
      const storedInput = sessionStorage.getItem(STORAGE_KEY_INPUT);

      if (storedResult) {
        // Rehydrate React state from the browser's session cache on mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setResult(JSON.parse(storedResult));
      }
      if (storedInput) {
        setLastInput(JSON.parse(storedInput));
      }
    } catch {
      // sessionStorage might fail in restricted iframe / SSR
    }
  }, []);

  const setRecommendationData = (
    data: CropRecommendationResponse,
    input: CropRecommendationRequest
  ) => {
    setResult(data);
    setLastInput(input);

    try {
      sessionStorage.setItem(STORAGE_KEY_RESULT, JSON.stringify(data));
      sessionStorage.setItem(STORAGE_KEY_INPUT, JSON.stringify(input));
    } catch {
      // Ignore storage errors
    }
  };

  const clearRecommendation = () => {
    setResult(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY_RESULT);
    } catch {
      // Ignore
    }
  };

  return (
    <CropRecommendationContext.Provider
      value={{
        result,
        lastInput,
        setRecommendationData,
        clearRecommendation,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </CropRecommendationContext.Provider>
  );
}

export function useCropRecommendation() {
  const context = useContext(CropRecommendationContext);
  if (!context) {
    throw new Error(
      "useCropRecommendation must be used within a CropRecommendationProvider"
    );
  }
  return context;
}
