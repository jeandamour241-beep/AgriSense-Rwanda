import React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Agriculture Risk Map | AgriSense Rwanda",
  description:
    "Explore agricultural risks across Rwanda and understand where risks may affect farming activities.",
};

export default function RiskMapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
