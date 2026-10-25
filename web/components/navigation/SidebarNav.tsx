"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SIDEBAR_NAV_ITEMS, SidebarNavItem } from "@/config/modules";
import {
  HomeIcon,
  SproutIcon,
  DropletsIcon,
  BugAlertIcon,
  FertilizerIcon,
  DataExplorerIcon,
  BotSparklesIcon,
  RiskMapIcon,
} from "@/components/ui/Icons";

export interface SidebarNavProps {
  onItemClick?: () => void;
}

export function SidebarNav({ onItemClick }: SidebarNavProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const renderNavIcon = (iconName: string, isActive: boolean) => {
    const iconClass = isActive
      ? "text-white"
      : "text-zinc-500 group-hover:text-emerald-800 transition-colors";

    switch (iconName) {
      case "home":
        return <HomeIcon size={19} className={iconClass} />;
      case "sprout":
        return <SproutIcon size={19} className={iconClass} />;
      case "droplets":
        return <DropletsIcon size={19} className={iconClass} />;
      case "bug":
        return <BugAlertIcon size={19} className={iconClass} />;
      case "fertilizer":
        return <FertilizerIcon size={19} className={iconClass} />;
      case "data-explorer":
        return <DataExplorerIcon size={19} className={iconClass} />;
      case "bot":
        return <BotSparklesIcon size={19} className={iconClass} />;
      case "risk-map":
        return <RiskMapIcon size={19} className={iconClass} />;
      default:
        return <HomeIcon size={19} className={iconClass} />;
    }
  };

  const isItemActive = (item: SidebarNavItem) => {
    if (item.route === "/home") {
      return pathname === "/home" || pathname === "/home/";
    }
    return pathname === item.route || pathname.startsWith(item.route + "/");
  };

  return (
    <nav
      className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
      aria-label={t("Services")}
    >
      <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
        {t("Services")}
      </div>

      {SIDEBAR_NAV_ITEMS.map((item) => {
        const active = isItemActive(item);

        return (
          <Link
            key={item.id}
            href={item.route}
            onClick={onItemClick}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              active
                ? "bg-emerald-800 text-white shadow-xs font-semibold"
                : "text-zinc-700 hover:bg-emerald-50/80 hover:text-emerald-950"
            }`}
          >
            <span className="flex-shrink-0">
              {renderNavIcon(item.iconName, active)}
            </span>
            <span className="truncate leading-tight">{t(item.title)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
