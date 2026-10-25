import React from "react";
import type { Metadata } from "next";
import { DataExplorerDashboard } from "@/components/data-explorer/DataExplorerDashboard";

export const metadata: Metadata = {
  title: "Rwanda Agriculture Data Explorer | AgriSense Rwanda",
  description: "Explore agricultural survey statistics across Rwanda by province, district, crop, and season.",
};

export default function DataExplorerPage() {
  return <div className="py-4"><DataExplorerDashboard /></div>;
}
