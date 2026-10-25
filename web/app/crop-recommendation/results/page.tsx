import React from "react";
import type { Metadata } from "next";
import { RecommendationResultsView } from "@/components/crop-recommendation/RecommendationResultsView";

export const metadata: Metadata = {
  title: "Crop Recommendation Results | AgriSense Rwanda",
  description:
    "Crop recommendation results based on Rwanda agriculture data.",
};

export default function CropRecommendationResultsPage() {
  return (
    <div className="py-4">
      <RecommendationResultsView />
    </div>
  );
}
