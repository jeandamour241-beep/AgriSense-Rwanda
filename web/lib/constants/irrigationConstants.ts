/**
 * Constants for Irrigation Decision Assistant
 * Based on historical Rwanda Agricultural Survey (NISR) features.
 */

export interface SelectOption {
  value: string;
  labelEn: string;
  labelRw: string;
}

/**
 * s1q1: Provinces as modeled in the training dataset
 */
export const RWANDA_PROVINCES: SelectOption[] = [
  { value: "Kigali", labelEn: "Kigali City", labelRw: "Umujyi wa Kigali" },
  { value: "North", labelEn: "Northern Province", labelRw: "Intara y'Amajyaruguru" },
  { value: "South", labelEn: "Southern Province", labelRw: "Intara y'Amajyepfo" },
  { value: "East", labelEn: "Eastern Province", labelRw: "Intara y'Iburasirazuba" },
  { value: "West", labelEn: "Western Province", labelRw: "Intara y'Iburengerazuba" },
];

/**
 * s1q2: Districts grouped by province
 */
export const DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  Kigali: ["Gasabo", "Kicukiro", "Nyarugenge"],
  North: ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"],
  South: [
    "Gisagara",
    "Huye",
    "Kamonyi",
    "Muhanga",
    "Nyamagabe",
    "Nyanza",
    "Nyaruguru",
    "Ruhango",
  ],
  East: [
    "Bugesera",
    "Gatsibo",
    "Kayonza",
    "Kirehe",
    "Ngoma",
    "Nyagatare",
    "Rwamagana",
  ],
  West: [
    "Karongi",
    "Ngororero",
    "Nyabihu",
    "Nyamasheke",
    "Rubavu",
    "Rusizi",
    "Rutsiro",
  ],
};

/**
 * s1q3: Stratum / Land context values matching the ML dataset
 */
export const STRATUM_OPTIONS: SelectOption[] = [
  {
    value: "Agricultural land on hillside",
    labelEn: "Agricultural land on hillside",
    labelRw: "Ubutaka bw'ubuhinzi ku misozi",
  },
  {
    value: "Agricultural land in marshland",
    labelEn: "Agricultural land in marshland",
    labelRw: "Ubutaka bw'ubuhinzi mu bishanga",
  },
  {
    value: "10 Intensive cropland on hillsides",
    labelEn: "Intensive cropland on hillsides",
    labelRw: "Ubuhinzi buhoraho ku misozi",
  },
  {
    value: "20 Intensive cropland in marshlands",
    labelEn: "Intensive cropland in marshlands",
    labelRw: "Ubuhinzi buhoraho mu bishanga",
  },
  {
    value: "30 Rangelands",
    labelEn: "Rangelands / Pastureland",
    labelRw: "Ubutaka bw'inzuri n'ubwuri",
  },
  {
    value: "40 Mixed",
    labelEn: "Mixed agricultural land",
    labelRw: "Ubutaka buvanze bw'ubuhinzi",
  },
  {
    value: "LSF",
    labelEn: "Large Scale Farming (LSF)",
    labelRw: "Imirima migari y'ubuhinzi (LSF)",
  },
];

/**
 * s2q7: Sowing Period options from the ML dataset
 */
export const SOWING_PERIOD_OPTIONS: SelectOption[] = [
  {
    value: "Between 01-15 /09",
    labelEn: "01 - 15 September (Season A)",
    labelRw: "01 - 15 Nzeli (Igihembwe cya A)",
  },
  {
    value: "Between 16- 30/09",
    labelEn: "16 - 30 September (Season A)",
    labelRw: "16 - 30 Nzeli (Igihembwe cya A)",
  },
  {
    value: "Between 01-15/10",
    labelEn: "01 - 15 October (Season A)",
    labelRw: "01 - 15 Ukwakira (Igihembwe cya A)",
  },
  {
    value: "Between16- 31/10",
    labelEn: "16 - 31 October (Season A)",
    labelRw: "16 - 31 Ukwakira (Igihembwe cya A)",
  },
  {
    value: "After 31/10",
    labelEn: "After 31 October",
    labelRw: "Nyuma ya 31 Ukwakira",
  },
  {
    value: "Between 01-15/01",
    labelEn: "01 - 15 January",
    labelRw: "01 - 15 Mutarama",
  },
  {
    value: "Between 16-31/01",
    labelEn: "16 - 31 January",
    labelRw: "16 - 31 Mutarama",
  },
  {
    value: "Between 01-15/02",
    labelEn: "01 - 15 February (Season B)",
    labelRw: "01 - 15 Gashyantare (Igihembwe cya B)",
  },
  {
    value: "Between 16-28/02",
    labelEn: "16 - 28 February (Season B)",
    labelRw: "16 - 28 Gashyantare (Igihembwe cya B)",
  },
  {
    value: "Between 01- 15/03",
    labelEn: "01 - 15 March (Season B)",
    labelRw: "01 - 15 Werurwe (Igihembwe cya B)",
  },
  {
    value: "Between16 –31/03",
    labelEn: "16 - 31 March (Season B)",
    labelRw: "16 - 31 Werurwe (Igihembwe cya B)",
  },
  {
    value: "Between 01- 31/05",
    labelEn: "May (Season B)",
    labelRw: "Gicurasi (Igihembwe cya B)",
  },
  {
    value: "Between 01- 30/06",
    labelEn: "June (Season C)",
    labelRw: "Kamena (Igihembwe cya C)",
  },
  {
    value: "Between 01-15/07",
    labelEn: "01 - 15 July (Season C)",
    labelRw: "01 - 15 Nyakanga (Igihembwe cya C)",
  },
  {
    value: "Between 16-31/07",
    labelEn: "16 - 31 July (Season C)",
    labelRw: "16 - 31 Nyakanga (Igihembwe cya C)",
  },
  {
    value: "Between 01-15/08",
    labelEn: "01 - 15 August",
    labelRw: "01 - 15 Kanama",
  },
  {
    value: "Between 16-31/08",
    labelEn: "16 - 31 August",
    labelRw: "16 - 31 Kanama",
  },
  {
    value: "Other season (applicable for all crops)",
    labelEn: "Other sowing period",
    labelRw: "Ikindi gihe cyo gutera",
  },
];

/**
 * s2q11: Seed Type options from the ML dataset
 */
export const SEED_TYPE_OPTIONS: SelectOption[] = [
  {
    value: "Improved seeds",
    labelEn: "Improved seeds",
    labelRw: "Imbuto zatoranyijwe / zigezweho",
  },
  {
    value: "Traditional seeds",
    labelEn: "Traditional seeds",
    labelRw: "Imbuto gakondo",
  },
  {
    value: "1&2",
    labelEn: "Both Improved & Traditional (1 & 2)",
    labelRw: "Byombi (Imbuto zatoranyijwe na gakondo)",
  },
];

/**
 * s2q4: Common crop options supported by the Rwanda agriculture dataset
 */
export const CROP_OPTIONS: SelectOption[] = [
  { value: "Maize", labelEn: "Maize", labelRw: "Ikigori" },
  { value: "Bush bean", labelEn: "Bush bean", labelRw: "Ibishyimbo bigufi" },
  { value: "Climbing bean", labelEn: "Climbing bean", labelRw: "Ibishyimbo birandaranda" },
  { value: "Irish potato", labelEn: "Irish potato", labelRw: "Ibirayi" },
  { value: "Sweet potato", labelEn: "Sweet potato", labelRw: "Ibijumba" },
  { value: "Cassava", labelEn: "Cassava", labelRw: "Imyumbati" },
  { value: "Soybean", labelEn: "Soybean", labelRw: "Soya" },
  { value: "Rice", labelEn: "Rice", labelRw: "Umuceri" },
  { value: "Cooking banana", labelEn: "Cooking banana", labelRw: "Ibitoki byo guteka" },
  { value: "Dessert banana", labelEn: "Dessert banana", labelRw: "Imineke" },
  { value: "Banana for beer", labelEn: "Banana for beer", labelRw: "Ibitoki by'inzoga" },
  { value: "Coffee", labelEn: "Coffee", labelRw: "Ikawa" },
  { value: "Tomato", labelEn: "Tomato", labelRw: "Inyanya" },
  { value: "Cabbage", labelEn: "Cabbage", labelRw: "Ishu" },
  { value: "Eggplant", labelEn: "Eggplant", labelRw: "Intoryi" },
  { value: "Carrot", labelEn: "Carrot", labelRw: "Karoti" },
  { value: "Onion", labelEn: "Onion", labelRw: "Igitunguru" },
  { value: "Pepper", labelEn: "Pepper", labelRw: "Urusenda" },
  { value: "Groundnut", labelEn: "Groundnut", labelRw: "Ubunyobwa" },
  { value: "Wheat", labelEn: "Wheat", labelRw: "Ingano" },
  { value: "Sorghum", labelEn: "Sorghum", labelRw: "Amasaka" },
  { value: "Other seasonal vegetables(specify)", labelEn: "Seasonal vegetables", labelRw: "Imboga z'igihembwe" },
];

/**
 * s4q1: Soil Erosion options from the ML dataset
 */
export const IRRIGATION_SOIL_EROSION_OPTIONS: SelectOption[] = [
  {
    value: "Very Low (Splash erosion)",
    labelEn: "Very Low (Splash erosion)",
    labelRw: "Isuri ntoya cyane (Isuri y'ibitonyanga)",
  },
  {
    value: "Low (Wind erosion)",
    labelEn: "Low (Wind erosion)",
    labelRw: "Isuri ntoya (Isuri y'umuyaga)",
  },
  {
    value: "Moderate (Diffuse overland flow Erosion, Overland flow erosion,erosion by Infiltration)",
    labelEn: "Moderate (Overland flow / Infiltration)",
    labelRw: "Isuri yo hagati (Amazi atemba hejuru)",
  },
  {
    value: "Severe (Rill erosion, Gully erosion, Mass movement/landslides)",
    labelEn: "Severe (Rills, gullies, landslides)",
    labelRw: "Isuri ikabije (Imikoki, inkangu)",
  },
];

/**
 * s4q6: Land Consolidation options from the ML dataset
 */
export const IRRIGATION_LAND_CONSOLIDATION_OPTIONS: SelectOption[] = [
  {
    value: "Yes",
    labelEn: "Yes (Consolidated plot)",
    labelRw: "Yego (Umurima uhurije hamwe)",
  },
  {
    value: "No",
    labelEn: "No (Not consolidated)",
    labelRw: "Oya (Umurima udahurije hamwe)",
  },
];
