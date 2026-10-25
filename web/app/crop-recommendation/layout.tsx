import React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";

import { CropRecommendationProvider } from "@/lib/context/CropRecommendationContext";

export const metadata: Metadata = {
  title: "Crop Recommendation System | AgriSense Rwanda",
  description:
    "Get crop recommendations based on agricultural conditions and available farm information.",
};

export default function CropRecommendationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <CropRecommendationProvider>{children}</CropRecommendationProvider>
    </AppShell>
  );
}

