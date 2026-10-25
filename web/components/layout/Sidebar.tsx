"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/branding/Logo";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import { CloseIcon, LeafIcon } from "@/components/ui/Icons";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { t } = useLanguage();
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        aria-label={t("AgriSense Navigation")}
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-white border-r border-zinc-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-zinc-100 flex items-center justify-between">
          <Link
            href="/home"
            className="outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1"
          >
            <Logo size="md" />
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close menu")}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 lg:hidden outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav onItemClick={onClose} />
        </div>

        {/* Sidebar Footer / Brand Assurance */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100/80">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <LeafIcon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-emerald-950 truncate">
                AgriSense Rwanda
              </p>
              <p className="text-[11px] text-emerald-700 truncate">
                {t("Smart Agriculture")}
              </p>
            </div>
            <div
              className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"
              title={t("System Online")}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
