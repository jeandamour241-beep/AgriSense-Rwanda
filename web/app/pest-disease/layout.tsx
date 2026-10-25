import React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Crop Pest/Disease Early Warning | AgriSense Rwanda",
  description:
    "Identify potential crop pest and disease risks early and take action before they become serious.",
};

export default function PestDiseaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
