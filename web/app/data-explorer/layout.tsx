import React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Rwanda Agriculture Data Explorer | AgriSense Rwanda",
  description:
    "Explore Rwanda agriculture data, statistics, trends, and useful agricultural insights.",
};

export default function DataExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
