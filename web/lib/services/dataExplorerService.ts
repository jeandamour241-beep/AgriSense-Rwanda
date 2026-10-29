const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

export type ExplorerFilters = {
  province?: string;
  district?: string;
  crop?: string;
  season?: string;
};
export type FilterOptions = {
  provinces: string[];
  districts: string[];
  crops: string[];
  seasons: string[];
};
export type Overview = {
  observations: number;
  districts: number;
  crops: number;
  seasons: number;
  harvested_area_ha: number | null;
  mean_yield: number | null;
  median_yield: number | null;
  yield_observations: number;
  source?: string;
};
export type CropStat = {
  crop: string;
  observations: number;
  crop_area_ha: number | null;
  harvested_area_ha: number | null;
  mean_yield: number | null;
  median_yield: number | null;
};
export type DistrictStat = {
  district: string;
  observations: number;
  crops: number;
  crop_area_ha: number | null;
  harvested_area_ha: number | null;
  mean_yield: number | null;
  median_yield: number | null;
};
export type SeasonStat = {
  season: string;
  observations: number;
  crops: number;
  crop_area_ha: number | null;
  harvested_area_ha: number | null;
  mean_yield: number | null;
  median_yield: number | null;
};
export type TableRow = {
  province: string | null;
  district: string | null;
  season: string | null;
  crop: string | null;
  crop_area_ha: number | null;
  harvested_area_ha: number | null;
  yield: number | null;
};
export type TableResult = {
  total: number;
  page: number;
  page_size: number;
  items: TableRow[];
};

type Envelope<T> = {
  success?: boolean;
  data?: T;
  message?: string | string[];
  error?: string;
};

function buildUrl(
  path: string,
  params: Record<string, string | number | undefined> = {},
) {
  const url = new URL(`${API_BASE_URL}/data-explorer/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "")
      url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function get<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
    cache: "no-store",
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error(
      `The data service returned an unreadable response (HTTP ${response.status}).`,
    );
  }
  if (!response.ok) {
    const envelope = body as Envelope<unknown>;
    const message = Array.isArray(envelope?.message)
      ? envelope.message.join("; ")
      : (envelope?.message ?? envelope?.error);
    throw new Error(
      typeof message === "string" && message
        ? message
        : `Request failed (HTTP ${response.status}).`,
    );
  }
  if (!body || typeof body !== "object")
    throw new Error("The data service returned an unexpected response.");
  const envelope = body as Envelope<T>;
  if (envelope.success === false)
    throw new Error(
      envelope.error ||
        (typeof envelope.message === "string"
          ? envelope.message
          : "The data service could not complete this request."),
    );
  if (!("data" in envelope))
    throw new Error("The data service response is missing its data field.");
  return envelope.data as T;
}

export const dataExplorerService = {
  filters: (signal?: AbortSignal) =>
    get<FilterOptions>("filters", undefined, signal),
  overview: (filters: ExplorerFilters, signal?: AbortSignal) =>
    get<Overview>("overview", filters, signal),
  crops: (
    filters: Pick<ExplorerFilters, "province" | "district" | "season">,
    signal?: AbortSignal,
  ) => get<CropStat[]>("crops", { ...filters, limit: 12 }, signal),
  districts: (
    filters: Pick<ExplorerFilters, "province" | "crop" | "season">,
    signal?: AbortSignal,
  ) => get<DistrictStat[]>("districts", { ...filters, limit: 12 }, signal),
  seasons: (
    filters: Pick<ExplorerFilters, "province" | "district" | "crop">,
    signal?: AbortSignal,
  ) => get<SeasonStat[]>("seasons", filters, signal),
  table: (filters: ExplorerFilters, page: number, signal?: AbortSignal) =>
    get<TableResult>("table", { ...filters, page, page_size: 10 }, signal),
};
