/**
 * Centralized Module Configuration for RwandaAgriSystem
 *
 * PRODUCT MODULES:
 * 1. Crop Recommendation System
 * 2. Irrigation Decision Assistant
 * 3. Crop Pest/Disease Early Warning
 * 4. Fertilizer Recommendation Assistant
 * 5. Rwanda Agriculture Data Explorer
 * 6. Agriculture Risk Map
 *
 * This configuration is the single source of truth for:
 * - Home dashboard cards
 * - Sidebar navigation
 * - Route paths & metadata
 */

export type ModuleId =
  | "crop-recommendation"
  | "irrigation"
  | "pest-disease"
  | "fertilizer"
  | "data-explorer"
  | "risk-map";

export interface ModuleAccent {
  key: string;
  name: string;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  tagBg: string;
  tagText: string;
  tagBorder: string;
  cardBorderHover: string;
  glowHover: string;
  dotColor: string;
}

export interface AgricultureModule {
  id: ModuleId;
  order: number;
  title: string;
  shortDescription: string;
  route: string;
  iconName:
    | "sprout"
    | "droplets"
    | "bug"
    | "fertilizer"
    | "data-explorer"
    | "risk-map";
  iconConcept: string;
  accent: ModuleAccent;
  ctaText: string;
  statusText: string;
}

export const AGRICULTURE_MODULES: AgricultureModule[] = [
  {
    id: "crop-recommendation",
    order: 1,
    title: "Crop Recommendation System",
    shortDescription:
      "Get crop recommendations based on agricultural conditions and available farm information.",
    route: "/crop-recommendation",
    iconName: "sprout",
    iconConcept: "Plant / Sprout",
    accent: {
      key: "green",
      name: "Green",
      iconBg: "bg-emerald-50",
      iconBorder: "border-emerald-200/80",
      iconColor: "text-emerald-700",
      tagBg: "bg-emerald-50/70",
      tagText: "text-emerald-800",
      tagBorder: "border-emerald-200/60",
      cardBorderHover: "hover:border-emerald-400/80 hover:shadow-emerald-950/5",
      glowHover: "group-hover:from-emerald-50/40",
      dotColor: "bg-emerald-600",
    },
    ctaText: "See details",
    statusText: "Biteganyijwe",
  },
  {
    id: "irrigation",
    order: 2,
    title: "Irrigation Decision Assistant",
    shortDescription:
      "Get irrigation guidance to help make better water management decisions for your crops.",
    route: "/irrigation",
    iconName: "droplets",
    iconConcept: "Water drop / Droplets",
    accent: {
      key: "blue",
      name: "Blue",
      iconBg: "bg-sky-50",
      iconBorder: "border-sky-200/80",
      iconColor: "text-sky-700",
      tagBg: "bg-sky-50/70",
      tagText: "text-sky-800",
      tagBorder: "border-sky-200/60",
      cardBorderHover: "hover:border-sky-400/80 hover:shadow-sky-950/5",
      glowHover: "group-hover:from-sky-50/40",
      dotColor: "bg-sky-600",
    },
    ctaText: "See details",
    statusText: "Biteganyijwe",
  },
  {
    id: "pest-disease",
    order: 3,
    title: "Crop Pest/Disease Early Warning",
    shortDescription:
      "Identify potential crop pest and disease risks early and take action before they become serious.",
    route: "/pest-disease",
    iconName: "bug",
    iconConcept: "Bug / Shield / Alert",
    accent: {
      key: "orange",
      name: "Orange",
      iconBg: "bg-amber-50",
      iconBorder: "border-amber-200/80",
      iconColor: "text-amber-700",
      tagBg: "bg-amber-50/70",
      tagText: "text-amber-800",
      tagBorder: "border-amber-200/60",
      cardBorderHover: "hover:border-amber-400/80 hover:shadow-amber-950/5",
      glowHover: "group-hover:from-amber-50/40",
      dotColor: "bg-amber-600",
    },
    ctaText: "See details",
    statusText: "Biteganyijwe",
  },
  {
    id: "fertilizer",
    order: 4,
    title: "Fertilizer Recommendation Assistant",
    shortDescription:
      "Get fertilizer recommendations based on crop and agricultural conditions.",
    route: "/fertilizer",
    iconName: "fertilizer",
    iconConcept: "Leaf / Fertilizer / Sprout",
    accent: {
      key: "green",
      name: "Green",
      iconBg: "bg-green-50",
      iconBorder: "border-green-200/80",
      iconColor: "text-green-700",
      tagBg: "bg-green-50/70",
      tagText: "text-green-800",
      tagBorder: "border-green-200/60",
      cardBorderHover: "hover:border-green-400/80 hover:shadow-green-950/5",
      glowHover: "group-hover:from-green-50/40",
      dotColor: "bg-green-600",
    },
    ctaText: "See details",
    statusText: "Biteganyijwe",
  },
  {
    id: "data-explorer",
    order: 5,
    title: "Rwanda Agriculture Data Explorer",
    shortDescription:
      "Explore Rwanda agriculture data, statistics, trends, and useful agricultural insights.",
    route: "/data-explorer",
    iconName: "data-explorer",
    iconConcept: "Chart / Database / Analytics",
    accent: {
      key: "teal",
      name: "Teal",
      iconBg: "bg-teal-50",
      iconBorder: "border-teal-200/80",
      iconColor: "text-teal-700",
      tagBg: "bg-teal-50/70",
      tagText: "text-teal-800",
      tagBorder: "border-teal-200/60",
      cardBorderHover: "hover:border-teal-400/80 hover:shadow-teal-950/5",
      glowHover: "group-hover:from-teal-50/40",
      dotColor: "bg-teal-600",
    },
    ctaText: "See details",
    statusText: "Biteganyijwe",
  },
  {
    id: "risk-map",
    order: 7,
    title: "Agriculture Risk Map",
    shortDescription:
      "Explore agricultural risks across Rwanda and understand where risks may affect farming activities.",
    route: "/risk-map",
    iconName: "risk-map",
    iconConcept: "Map / Location / Warning",
    accent: {
      key: "orange-red",
      name: "Orange/Red",
      iconBg: "bg-rose-50",
      iconBorder: "border-rose-200/80",
      iconColor: "text-rose-700",
      tagBg: "bg-rose-50/70",
      tagText: "text-rose-800",
      tagBorder: "border-rose-200/60",
      cardBorderHover: "hover:border-rose-400/80 hover:shadow-rose-950/5",
      glowHover: "group-hover:from-rose-50/40",
      dotColor: "bg-rose-600",
    },
    ctaText: "See details",
    statusText: "Biteganyijwe",
  },
];

/**
 * Sidebar Navigation Items Configuration
 * 1. Ahabanza (/home)
 * Followed directly by the 7 centralized product modules
 */
export interface SidebarNavItem {
  id: string;
  title: string;
  route: string;
  iconName: string;
  isHome?: boolean;
}

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  {
    id: "home",
    title: "Ahabanza",
    route: "/home",
    iconName: "home",
    isHome: true,
  },
  ...AGRICULTURE_MODULES.map((module) => ({
    id: module.id,
    title: module.title,
    route: module.route,
    iconName: module.iconName,
    isHome: false,
  })),
];

/**
 * Helper to lookup module by route
 */
export function getModuleByRoute(route: string): AgricultureModule | undefined {
  return AGRICULTURE_MODULES.find((m) => m.route === route);
}

/**
 * Helper to lookup module by ID
 */
export function getModuleById(id: string): AgricultureModule | undefined {
  return AGRICULTURE_MODULES.find((m) => m.id === id);
}
