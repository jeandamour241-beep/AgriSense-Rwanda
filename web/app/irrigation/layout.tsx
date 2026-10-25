import React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { IrrigationProvider } from "@/lib/context/IrrigationContext";

export const metadata: Metadata = {
  title: "Irrigation Decision Assistant | AgriSense Rwanda",
  description:
    "Get irrigation guidance to help make better water management decisions for your crops.",
};

export default function IrrigationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <IrrigationProvider>{children}</IrrigationProvider>
    </AppShell>
  );
}
