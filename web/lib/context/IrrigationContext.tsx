"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { IrrigationRequest, IrrigationResponseData } from "@/types/irrigation";

interface IrrigationContextType {
  result: IrrigationResponseData | null;
  lastInput: IrrigationRequest | null;
  setIrrigationData: (
    data: IrrigationResponseData,
    input: IrrigationRequest
  ) => void;
  clearIrrigation: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const STORAGE_KEY_RESULT = "agrisense_irrigation_result";
const STORAGE_KEY_INPUT = "agrisense_irrigation_input";

const IrrigationContext = createContext<IrrigationContextType | undefined>(
  undefined
);

export function IrrigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [result, setResult] = useState<IrrigationResponseData | null>(null);
  const [lastInput, setLastInput] = useState<IrrigationRequest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Rehydrate state on mount
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
      // sessionStorage might not be available
    }
  }, []);

  const setIrrigationData = (
    data: IrrigationResponseData,
    input: IrrigationRequest
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

  const clearIrrigation = () => {
    setResult(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY_RESULT);
    } catch {
      // Ignore
    }
  };

  return (
    <IrrigationContext.Provider
      value={{
        result,
        lastInput,
        setIrrigationData,
        clearIrrigation,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </IrrigationContext.Provider>
  );
}

export function useIrrigation() {
  const context = useContext(IrrigationContext);
  if (!context) {
    throw new Error("useIrrigation must be used within an IrrigationProvider");
  }
  return context;
}
