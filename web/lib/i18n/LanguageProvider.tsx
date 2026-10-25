"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { translateKnown, type Language } from "./translations";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (englishText: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "rwanda-agrisystem-language";

function readSavedLanguage(): Language | null {
  const cookieValue = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${STORAGE_KEY}=`))
    ?.slice(STORAGE_KEY.length + 1);
  if (cookieValue === "en" || cookieValue === "rw") return cookieValue;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "rw" ? stored : null;
  } catch {
    return null;
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // RW is the stable SSR/hydration default; restore the saved choice after mount.
  const [language, setCurrentLanguage] = useState<Language>("rw");

  useEffect(() => {
    try {
      const stored = readSavedLanguage();
      if (stored) {
        // This is the client-only persisted preference restore; keeping it after
        // mount avoids a server/client markup mismatch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentLanguage(stored);
      }
    } catch {
      // localStorage may be unavailable in restricted browsing contexts.
    }
    const syncAcrossTabs = (event: StorageEvent) => {
      if (
        event.key === STORAGE_KEY &&
        (event.newValue === "en" || event.newValue === "rw")
      ) {
        setCurrentLanguage(event.newValue);
      }
    };
    window.addEventListener("storage", syncAcrossTabs);
    return () => window.removeEventListener("storage", syncAcrossTabs);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const pageTitles: Record<string, string> = {
      "/": "Welcome to AgriSense Rwanda",
      "/home": "Home",
      "/crop-recommendation": "Crop Recommendation System",
      "/crop-recommendation/results": "Crop Recommendation Results",
      "/irrigation": "Irrigation Decision Assistant",
      "/pest-disease": "Crop Pest/Disease Early Warning",
      "/fertilizer": "Fertilizer Recommendation Assistant",
      "/data-explorer": "Rwanda Agriculture Data Explorer",
      "/risk-map": "Agriculture Risk Map",
    };
    const title = `${translateKnown(pageTitles[pathname] ?? "Home", language)} | AgriSense Rwanda`;
    const applyTitle = () => {
      if (document.title !== title) document.title = title;
    };
    applyTitle();
    // Next can update route metadata after client effects; keep the tab title in
    // sync with the selected language when those metadata nodes change.
    const observer = new MutationObserver(applyTitle);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [language, pathname]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch {
      // Continue with the cookie fallback if localStorage is unavailable.
    }
    document.cookie = `${STORAGE_KEY}=${nextLanguage}; path=/; max-age=31536000; samesite=lax`;
    setCurrentLanguage(nextLanguage);
  }, []);

  const t = useCallback(
    (englishText: string) => {
      const translated = translateKnown(englishText, language);
      if (
        process.env.NODE_ENV === "development" &&
        language === "rw" &&
        translated === englishText
      ) {
        console.warn(`[i18n] Missing Kinyarwanda translation: ${englishText}`);
      }
      return translated;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value)
    throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}
