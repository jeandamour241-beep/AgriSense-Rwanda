"use client";

import React from "react";
import { AGRICULTURE_MODULES, AgricultureModule } from "@/config/modules";
import { ModuleCard } from "./ModuleCard";

export interface ModuleGridProps {
  modules?: AgricultureModule[];
  className?: string;
}

export function ModuleGrid({
  modules = AGRICULTURE_MODULES,
  className = "",
}: ModuleGridProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 ${className}`}
    >
      {modules.map((module, index) => {
        // Center an odd final card on desktop when the grid has three columns.
        // while preserving identical dimensions and layout.
        const isSeventhCard = index === 6;
        const positionClass = isSeventhCard ? "lg:col-start-2" : "";

        return (
          <div key={module.id} className={`h-full ${positionClass}`}>
            <ModuleCard module={module} />
          </div>
        );
      })}
    </div>
  );
}
