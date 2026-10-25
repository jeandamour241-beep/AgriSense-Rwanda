/**
 * Type Definitions for Irrigation Decision Assistant
 * Synchronized with RwandaAgriSystem NestJS / Python AI service API.
 */

export interface IrrigationRequest {
  /** s1q1: Province / Intara (e.g. "South", "North", "East", "West", "Kigali") */
  s1q1: string;
  /** s1q2: District / Akarere (e.g. "Huye") */
  s1q2: string;
  /** s1q3: Stratum / Land Context (e.g. "Agricultural land on hillside", "Agricultural land in marshland") */
  s1q3: string;
  /** season: Agricultural Season / Igihembwe (e.g. "Season A", "Season B", "Season C") */
  season: string;
  /** s2q2: Plot Area in hectares / Ubuso bw'umurima (e.g. 0.8, must be > 0) */
  s2q2: number;
  /** s2q4: Crop / Igihingwa (e.g. "Maize", "Bush bean") */
  s2q4: string;
  /** s2q7: Sowing Period / Igihe cyo gutera */
  s2q7: string;
  /** s2q11: Seed Type / Ubwoko bw'imbuto (e.g. "Improved seeds", "Traditional seeds", "1&2") */
  s2q11: string;
  /** s4q1: Soil Erosion / Isuri y'ubutaka */
  s4q1: string;
  /** s4q6: Land Consolidation / Guhuriza hamwe ubutaka ("Yes" | "No") */
  s4q6: string;
}

export interface HistoricalCategoryAdvice {
  code?: string;
  label?: string;
  top_value?: string;
  count?: number;
  observations?: number;
  percentage?: number;
}

export interface HistoricalCostAdvice {
  observations?: number;
  min?: number;
  q25?: number;
  median?: number;
  q75?: number;
  max?: number;
}

export interface HistoricalIrrigationAdviceData {
  historical_observations?: number;
  observations?: number;
  technique?: HistoricalCategoryAdvice | null;
  water_source?: HistoricalCategoryAdvice | null;
  tool?: HistoricalCategoryAdvice | null;
  irrigation_tool?: HistoricalCategoryAdvice | null;
  cost?: HistoricalCostAdvice | null;
  historical_cost?: HistoricalCostAdvice | null;
  note?: string;
}

export interface IrrigationResponseData {
  decision: string;
  irrigation_needed: boolean;
  prediction: string | number;
  confidence: number | null;
  probability_irrigation: number | null;
  historical_advice?: HistoricalIrrigationAdviceData | null;
  model?: {
    target?: string;
    features?: string[];
    metrics?: Record<string, unknown>;
  };
  note?: string;
}

export interface IrrigationResponse {
  success: boolean;
  data: IrrigationResponseData;
  error?: string;
  message?: string;
}
