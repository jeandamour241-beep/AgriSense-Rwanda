import React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Fertilizer Recommendation Assistant | AgriSense Rwanda",
  description:
    "Get fertilizer recommendations based on crop and agricultural conditions.",
};

export default function FertilizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
