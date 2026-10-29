import { IrrigationRequest, IrrigationResponseData } from "@/types/irrigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class IrrigationServiceError extends Error {
  constructor(
    public messageEn: string,
    public messageRw: string,
    public status?: number
  ) {
    super(`${messageEn} / ${messageRw}`);
    this.name = "IrrigationServiceError";
  }
}

/**
 * Irrigation Service
 * Communicates ONLY with NestJS Backend (POST /irrigation).
 * The NestJS backend handles calling the Python AI service internally.
 */
export async function getIrrigationRecommendation(
  payload: IrrigationRequest
): Promise<IrrigationResponseData> {
  const url = `${API_BASE_URL}/irrigation`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorMessageEn =
        "There was a problem getting the model assessment. Please try again.";
      const errorMessageRw =
        "Habaye ikibazo mu kubona igisubizo cya modeli. Ongera ugerageze.";

      try {
        const errorJson = await res.json();
        if (errorJson?.message) {
          const detail = Array.isArray(errorJson.message)
            ? errorJson.message.join(", ")
            : errorJson.message;
          errorMessageEn = `Problem getting assessment: ${detail}`;
        }
      } catch {
        // Use default error text
      }

      throw new IrrigationServiceError(
        errorMessageEn,
        errorMessageRw,
        res.status
      );
    }

    const json = await res.json();

    if (json && json.success === false) {
      throw new IrrigationServiceError(
        json.error || "There was a problem getting the model assessment. Please try again.",
        "Habaye ikibazo mu kubona igisubizo cya modeli. Ongera ugerageze."
      );
    }

    // NestJS returns { success: true, data: { ... } } or raw data
    const data: IrrigationResponseData = json?.data ? json.data : json;

    if (!data || typeof data.irrigation_needed !== "boolean") {
      throw new IrrigationServiceError(
        "Invalid response received from irrigation service.",
        "Habaye ikibazo mu kubona igisubizo cya modeli. Ongera ugerageze."
      );
    }

    return data;
  } catch (err: unknown) {
    if (err instanceof IrrigationServiceError) {
      throw err;
    }

    throw new IrrigationServiceError(
      "There was a problem getting the model assessment. Please try again.",
      "Habaye ikibazo mu kubona igisubizo cya modeli. Ongera ugerageze."
    );
  }
}
