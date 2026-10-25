/**
 * Rwanda Agriculture Constants
 * Standardized for RwandaAgriSystem frontend forms & services.
 */

export const RWANDA_DISTRICTS = [
  "Bugesera",
  "Burera",
  "Gakenke",
  "Gasabo",
  "Gatsibo",
  "Gicumbi",
  "Gisagara",
  "Huye",
  "Kamonyi",
  "Karongi",
  "Kayonza",
  "Kicukiro",
  "Kirehe",
  "Muhanga",
  "Musanze",
  "Ngoma",
  "Ngororero",
  "Nyabihu",
  "Nyagatare",
  "Nyamagabe",
  "Nyamasheke",
  "Nyanza",
  "Nyarugenge",
  "Nyaruguru",
  "Rubavu",
  "Ruhango",
  "Rulindo",
  "Rusizi",
  "Rutsiro",
  "Rwamagana",
] as const;

export type RwandaDistrict = (typeof RWANDA_DISTRICTS)[number];

export const AGRICULTURE_SEASONS = [
  { value: "Season A", labelEn: "Season A (Sept - Feb)", labelRw: "Igihembwe cya A (Nzeli - Gashyantare)" },
  { value: "Season B", labelEn: "Season B (March - June)", labelRw: "Igihembwe cya B (Werurwe - Kamena)" },
  { value: "Season C", labelEn: "Season C (Marshlands / July - Sept)", labelRw: "Igihembwe cya C (Imyobo / Nyakanga - Nzeli)" },
] as const;

export const IRRIGATION_OPTIONS = [
  { value: "No", labelEn: "No", labelRw: "Oya" },
  { value: "Yes", labelEn: "Yes", labelRw: "Yego" },
] as const;

export const SOIL_EROSION_OPTIONS = [
  { value: "Low", labelEn: "Low", labelRw: "Ntoya" },
  { value: "Medium", labelEn: "Medium", labelRw: "Hagati" },
  { value: "High", labelEn: "High", labelRw: "Nyinshi" },
] as const;

export const LAND_CONSOLIDATION_OPTIONS = [
  { value: "Yes", labelEn: "Yes", labelRw: "Yego" },
  { value: "No", labelEn: "No", labelRw: "Oya" },
] as const;
