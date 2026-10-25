import React from "react";
import type { Metadata } from "next";
import { CropRecommendationForm } from "@/components/crop-recommendation/CropRecommendationForm";

export const metadata: Metadata = {
  title: "Crop Recommendation System | AgriSense Rwanda",
  description:
    "Get crop recommendations based on historical Rwanda agriculture data and farm conditions.",
};

export default function CropRecommendationPage() {
  return (
    <div className="py-4">
      <CropRecommendationForm />
    </div>
  );
}
