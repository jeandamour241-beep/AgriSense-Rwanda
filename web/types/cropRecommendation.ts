/**
 * Type Definitions for Crop Recommendation System
 * Synchronized with the RwandaAgriSystem NestJS / Python AI service API.
 */

export interface CropRecommendationRequest {
  /** District / Akarere (e.g. "Huye") */
  s1q2: string;
  /** Season / Igihembwe cy'ubuhinzi (e.g. "Season A", "Season B", "Season C") */
  season: string;
  /** Plot Area / Ubuso bw'umurima in hectares (e.g. 0.8) */
  s2q2?: number;
  /** Irrigation / Kuhira umurima ("Yes" | "No") */
  s4q13?: "Yes" | "No" | string;
  /** Soil Erosion / Isuri y'ubutaka ("Low" | "Medium" | "High") */
  s4q1?: "Low" | "Medium" | "High" | string;
  /** Land Consolidation / Guhuza ubutaka bw'ubuhinzi ("Yes" | "No") */
  s4q6?: "Yes" | "No" | string;
}

export interface CropRecommendationItem {
  crop: string;
  category: string;
  fusion_score: number;
  historical_score: number;
  exact_ml_score: number;
  category_ml_score: number;
  historical_observations: number;
  historical_frequency: number;
  summary?: string;
  reasons?: string[];
  note?: string;
}

export interface CropRecommendationMetadata {
  method?: string;
  fusion_weights?: {
    historical: number;
    exact_crop_ml: number;
    category_ml: number;
  };
  score_type?: string;
  warning?: string;
}

export interface CropRecommendationResponse {
  success: boolean;
  input?: CropRecommendationRequest;
  recommendations: CropRecommendationItem[];
  metadata?: CropRecommendationMetadata;
  message?: string;
}
