/**
 * Centralized Application Constants & Asset References
 * AgriSense Rwanda - "Smart Agriculture. Better Tomorrow!"
 */

export const APP_CONFIG = {
  name: "AgriSense Rwanda",
  shortName: "AgriSense",
  country: "Rwanda",
  slogan: "Smart Agriculture. Better Tomorrow!",
  taglineKinyarwanda: "Ubuhinzi bwubaka ejo hazaza",
  description:
    "Urubuga rw’ubuhinzi rukoresha ikoranabuhanga mu gufasha abahinzi gufata ibyemezo byiza, kugenzura umusaruro, no guhangana n'imihindagurikire y'ikirere.",
  version: "1.0.0",
} as const;

/**
 * Dedicated Asset Locations
 * Centralized to allow easy image asset replacement without touching UI components.
 */
export const ASSETS = {
  hero: {
    rwandaAgriculture: "/images/hero/rwanda-agriculture.jpg",
  },
  branding: {
    leafLogo: "/images/logo/leaf.svg",
  },
} as const;

export {
  AGRICULTURE_MODULES,
  SIDEBAR_NAV_ITEMS,
  getModuleByRoute,
  getModuleById,
  type AgricultureModule,
  type SidebarNavItem,
  type ModuleId,
} from "@/config/modules";

