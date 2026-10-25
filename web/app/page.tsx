"use client";

import React from "react";
import Image from "next/image";
import { APP_CONFIG, ASSETS } from "@/lib/constants";
import { Logo } from "@/components/branding/Logo";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { LanguageSelector } from "@/components/navigation/LanguageSelector";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function WelcomePage() {
  const { language, t } = useLanguage();
  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-between overflow-hidden bg-emerald-950 text-white select-none">
      {/* 1. Hero Background Image with Cover Behavior & Centralized Asset */}
      <div className="absolute inset-0 z-0">
        <Image
          src={ASSETS.hero.rwandaAgriculture}
          alt="Rwanda agricultural terraced hills and tea landscape"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-center scale-[1.02] transform transition-transform duration-1000 ease-out"
        />
        {/* Dark Emerald / Forest Gradient Overlay for Contrast & Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-emerald-950/80 to-black/95 backdrop-brightness-[0.85]" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/40 to-black/80" />
      </div>

      {/* 2. Top Header / Brand Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-6 sm:pt-8 flex items-center justify-between">
        <Logo variant="hero" size="md" />

        {/* Rwanda Tag Badge */}
        <div className="flex items-center gap-3">
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{t("Rwanda")}</span>
        </div>
        <LanguageSelector />
        </div>
      </header>

      {/* 3. Main Welcome / Hero Content */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-6 py-10 sm:py-16 flex flex-col items-center text-center my-auto">
        {/* Slogan Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs sm:text-sm font-semibold mb-6 shadow-lg shadow-emerald-950/30">
          <span className="text-emerald-300">🌱</span>
          <span>{t(APP_CONFIG.slogan)}</span>
        </div>

        {/* {/* Main Title */}
        {/* <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-4 drop-shadow-md">
          {APP_CONFIG.name}
        </h1> */}

        {/* Subtitle in Kinyarwanda */}
        {/* <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-emerald-300 mb-6 drop-shadow-xs max-w-2xl">
          &ldquo;{t(APP_CONFIG.slogan)}&rdquo;
        </p> */}

        {/* Supporting Explanation */}
        <p className="text-sm sm:text-base md:text-lg text-emerald-100/90 font-normal leading-relaxed max-w-2xl mb-10 text-pretty">
          {language === "rw" ? APP_CONFIG.description : "Digital agriculture tools help farmers make better decisions, improve productivity, and respond to climate change."}
        </p>

        {/* 4. Prominent "Komeza" Continue Button */}
        <div className="w-full sm:w-auto flex flex-col items-center gap-3">
          <Button
            href="/home"
            variant="primary"
            size="xl"
            className="group w-full sm:w-80 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-400/40 ring-2 ring-emerald-400/40 transition-all duration-300"
          >
            <span className="font-bold text-lg sm:text-xl tracking-wide">
              {language === "rw" ? "Komeza" : "Continue"}
            </span>
            <span className="text-emerald-100/80 text-xs sm:text-sm font-medium">
            </span>
            <ArrowRightIcon
              size={22}
              className="ml-1 transition-transform duration-200 group-hover:translate-x-1.5"
            />
          </Button>

          <p className="text-xs text-emerald-200/60 font-medium">
            {language === "rw" ? "Kanda hano kugira ngo winjire ku rubuga" : "Click here to enter the platform"}
          </p>
        </div>
      </main>

    </div>
  );
}
