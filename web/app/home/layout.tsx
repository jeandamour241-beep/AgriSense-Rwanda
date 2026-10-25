import React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Ahabanza | AgriSense Rwanda",
  description: "Urubuga rw'ibanze rwa AgriSense Rwanda - Ubuhinzi bwubaka ejo hazaza",
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
