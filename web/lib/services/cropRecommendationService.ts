import {
  CropRecommendationRequest,
  CropRecommendationResponse,
} from "@/types/cropRecommendation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export class CropRecommendationServiceError extends Error {
  constructor(
    public messageEn: string,
    public messageRw: string,
    public status?: number
  ) {
    super(`${messageEn} / ${messageRw}`);
    this.name = "CropRecommendationServiceError";
  }
}

/**
 * Reusable service for Crop Recommendation System
 * Communicates ONLY with the NestJS API (POST /crop-recommendation).
 */
export async function getCropRecommendations(
  payload: CropRecommendationRequest
): Promise<CropRecommendationResponse> {
  const url = `${API_BASE_URL}/crop-recommendation`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const serverMessage =
        (typeof errorData?.message === "string" && errorData.message) ||
        (typeof errorData?.detail === "string" && errorData.detail);
      throw new CropRecommendationServiceError(
        serverMessage || `Crop recommendation failed (HTTP ${res.status}). Please try again.`,
        serverMessage || `Inama ku bihingwa yanze (HTTP ${res.status}). Ongera ugerageze.`,
        res.status
      );
    }

    const data: CropRecommendationResponse = await res.json();

    if (!data || data.success === false) {
      throw new CropRecommendationServiceError(
        data?.message || "Agriculture service returned an unsuccessful response. Please try again.",
        "Serivisi y'ubuhinzi ntiyatanze igisubizo cyifuzwa. Ongera ugerageze."
      );
    }

    return data;
  } catch (err: unknown) {
    if (err instanceof CropRecommendationServiceError) {
      throw err;
    }

    throw new CropRecommendationServiceError(
      "We could not connect to the agriculture service. Please try again.",
      "Ntabwo twabashije guhuza na serivisi y'ubuhinzi. Ongera ugerageze."
    );
  }
}
