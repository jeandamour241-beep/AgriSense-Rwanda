"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "");
const SEASONS = ["Season A", "Season B", "Season C"] as const;
type Module = "pest_disease" | "irrigation";
const PEST_COLORS = { missing: "#d7dee0", low: "#d7f0df", moderate: "#a6d9ad", elevated: "#55aa76", high: "#18704b" };
const IRRIGATION_COLORS = { missing: "#d7dee0", low: "#e0f2fe", moderate: "#93c5fd", elevated: "#3b82f6", high: "#1e3a8a" };
const PEST_LEVELS = [
  { label: "Low", range: "0–<5%", color: PEST_COLORS.low },
  { label: "Moderate", range: "5–<10%", color: PEST_COLORS.moderate },
  { label: "Elevated", range: "10–<20%", color: PEST_COLORS.elevated },
  { label: "High", range: "≥20%", color: PEST_COLORS.high },
];
const IRRIGATION_LEVELS = [
  { label: "Low", range: "0–<5%", color: IRRIGATION_COLORS.low },
  { label: "Moderate", range: "5–<10%", color: IRRIGATION_COLORS.moderate },
  { label: "Elevated", range: "10–<20%", color: IRRIGATION_COLORS.elevated },
  { label: "High", range: "≥20%", color: IRRIGATION_COLORS.high },
];
type Indicator = { module: Module; season: string; observedCount: number | null; reportedCases: number | null; reportedRatePct: number | null; dataStatus: string; indicatorType: string };
type Feature = { type: "Feature"; properties?: { district?: string; districtId?: string; shapeName?: string; riskIndicator?: Indicator }; geometry: { type: string; coordinates: unknown } };
type Collection = { type: "FeatureCollection"; module?: string; season?: string; features: Feature[] };

function normalize(value: unknown) { return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
function rateColor(indicator: Indicator | undefined, module: Module) {
  const colors = module === "irrigation" ? IRRIGATION_COLORS : PEST_COLORS;
  if (!indicator || indicator.dataStatus === "NO_DATA" || indicator.observedCount === 0 || indicator.reportedRatePct == null || !Number.isFinite(indicator.reportedRatePct) || indicator.dataStatus !== "SUFFICIENT_FOR_INITIAL_REVIEW") return colors.missing;
  if (indicator.reportedRatePct < 5) return colors.low;
  if (indicator.reportedRatePct < 10) return colors.moderate;
  if (indicator.reportedRatePct < 20) return colors.elevated;
  return colors.high;
}
function project(features: Feature[]) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let coordinateCount = 0;

  // Scan GeoJSON directly. Avoid building several ~150k-element intermediate
  // arrays or spreading one into Math.min/Math.max (which exceeds argument limits).
  const stack: unknown[] = features.map((feature) => feature.geometry?.coordinates);
  while (stack.length) {
    const node = stack.pop();
    if (!Array.isArray(node)) continue;
    if (node.length >= 2 && typeof node[0] === "number" && typeof node[1] === "number") {
      const [longitude, latitude] = node;
      if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
        const y = -latitude;
        minX = Math.min(minX, longitude);
        maxX = Math.max(maxX, longitude);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        coordinateCount += 1;
      }
      continue;
    }
    for (let index = node.length - 1; index >= 0; index -= 1) stack.push(node[index]);
  }

  if (coordinateCount === 0) return { paths: new Map<Feature, string>(), bounds: { minX: 0, minY: 0, width: 1, height: 1 } };

  const sourceWidth = maxX - minX || 1;
  const sourceHeight = maxY - minY || 1;
  // Use one scale for both axes so longitude/latitude proportions are retained.
  const scale = 1000 / Math.max(sourceWidth, sourceHeight);
  const offsetX = (1000 - sourceWidth * scale) / 2;
  const offsetY = (1000 - sourceHeight * scale) / 2;
  const projectCoordinate = (longitude: number, latitude: number) =>
    `${(longitude - minX) * scale + offsetX},${(-latitude - minY) * scale + offsetY}`;
  const paths = new Map<Feature, string>();
  for (const feature of features) {
    const items: string[] = [];
    const visit = (node: unknown) => {
      if (!Array.isArray(node)) return;
      if (node.length >= 2 && typeof node[0] === "number" && typeof node[1] === "number") return;
      if (node.length && Array.isArray(node[0]) && typeof node[0][0] === "number") {
        const ring = node.filter((point): point is number[] => Array.isArray(point) && typeof point[0] === "number" && typeof point[1] === "number" && Number.isFinite(point[0]) && Number.isFinite(point[1]));
        if (ring.length) items.push(`M${ring.map(([longitude, latitude]) => projectCoordinate(longitude, latitude)).join("L")}Z`);
        return;
      }
      node.forEach(visit);
    };
    visit(feature.geometry?.coordinates);
    paths.set(feature, items.join(""));
  }
  return { paths, bounds: { minX: -16, minY: -16, width: 1032, height: 1032 } };
}
function label(feature: Feature) { return feature.properties?.district || feature.properties?.shapeName || "Unnamed district"; }
function rateText(indicator?: Indicator) { return indicator?.dataStatus !== "NO_DATA" && indicator?.observedCount !== 0 && indicator?.reportedRatePct != null && Number.isFinite(indicator.reportedRatePct) ? `${indicator.reportedRatePct.toFixed(2)}%` : "No data"; }

export default function RiskMapPage() {
  const { t } = useLanguage();
  const [season, setSeason] = useState<(typeof SEASONS)[number]>("Season A");
  const [module, setModule] = useState<Module>("pest_disease");
  const [data, setData] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [retry, setRetry] = useState(0);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/agriculture-risk-map/indicators?module=${module}&season=${encodeURIComponent(season)}`, { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) { setErrorStatus(response.status); throw new Error("Risk map service returned HTTP {status}."); }
        const body: unknown = await response.json();
        if (!body || typeof body !== "object" || !Array.isArray((body as Collection).features)) throw new Error("The risk map service returned an invalid district collection.");
        const collection = body as Collection;
        if (collection.module && collection.module !== module) throw new Error("The risk map service returned data for a different indicator.");
        if (collection.season && collection.season !== season) throw new Error("The risk map service returned data for a different season.");
        return collection;
      })
      .then((result) => { if (result.features.some((f) => !f.geometry || !Array.isArray(f.geometry.coordinates))) throw new Error("Some district boundary geometry is missing or invalid."); setData(result); })
      .catch((cause: unknown) => { if (!controller.signal.aborted) { setData(null); setError(cause instanceof Error && ["Risk map service returned HTTP {status}.", "The risk map service returned an invalid district collection.", "The risk map service returned data for a different indicator.", "The risk map service returned data for a different season.", "Some district boundary geometry is missing or invalid."].includes(cause.message) ? cause.message : "Unable to load risk map data."); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [module, season, retry]);

  const features = useMemo(() => data?.features ?? [], [data]);
  const { paths, bounds } = useMemo(() => project(features), [features]);
  const { matching, duplicates } = useMemo(() => {
    const map = new Map<string, Feature>();
    const duplicateNames = new Set<string>();
    for (const feature of features) { const key = normalize(label(feature)); if (key && map.has(key)) duplicateNames.add(label(feature)); else if (key) map.set(key, feature); }
    return { matching: map, duplicates: [...duplicateNames] };
  }, [features]);
  const unmatched = useMemo(() => features.filter((f) => !normalize(label(f)) || !matching.has(normalize(label(f)))), [features, matching]);
  const selectedFeature = selected ? matching.get(selected) : undefined;
  const usable = features.filter((f) => { const indicator = f.properties?.riskIndicator; return indicator?.dataStatus === "SUFFICIENT_FOR_INITIAL_REVIEW" && indicator.observedCount !== 0 && typeof indicator.reportedRatePct === "number" && Number.isFinite(indicator.reportedRatePct); });
  const available = usable.length;
  const missing = Math.max(0, features.length - available);
  const highest = usable.reduce<Feature | null>((best, current) => !best || current.properties!.riskIndicator!.reportedRatePct! > best.properties!.riskIndicator!.reportedRatePct! ? current : best, null);
  const highestRate = highest?.properties?.riskIndicator?.reportedRatePct;
  const levels = module === "irrigation" ? IRRIGATION_LEVELS : PEST_LEVELS;
  const rateLabel = module === "irrigation" ? "Historical reported irrigation rate (%)" : "Historical reported occurrence rate";
  const moduleLabel = module === "irrigation" ? "Irrigation" : "Pest/Disease";

  const changeZoom = useCallback((delta: number) => setZoom((current) => Math.min(2.6, Math.max(1, current + delta))), []);
  const detail = selectedFeature?.properties?.riskIndicator;
  const districtText = (feature: Feature) => feature.properties?.district || feature.properties?.shapeName || t("Unnamed district");
  const displayRate = (indicator?: Indicator) => {
    const value = rateText(indicator);
    return value === "No data" ? t("No data") : value;
  };

  return <main className="mx-auto max-w-[1440px] space-y-6 pb-10">
    <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-600"/>{t("RWANDA · FIELD SURVEY DATA")}</div><h1 className="text-3xl font-bold tracking-tight text-zinc-900">{t("Agriculture Risk Map")}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{t(module === "irrigation" ? "Explore historical reported irrigation rates across Rwanda’s districts." : "Explore historical reported pest and disease occurrence across Rwanda’s districts.")}</p></div>
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm"><span className="block text-xs font-medium uppercase tracking-wide text-zinc-500">{t("Indicator")}</span><span className="mt-1 block font-semibold text-zinc-900">{t(moduleLabel)} · {t(season)}</span></div>
    </header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("Season summary")}>
      <Metric label={t("Districts with usable data")} value={loading ? "—" : `${available} / ${features.length}`} note={t("Meets the backend review threshold")} />
      <Metric label={t("Missing or insufficient")} value={loading ? "—" : String(missing)} note={t("Not shown as zero occurrence")} />
      <Metric label={t("Highest reported district")} value={loading ? "—" : highest ? districtText(highest) : t("No data")} note={t("Among districts with sufficient observations")} />
      <Metric label={t("Highest reported rate")} value={loading ? "—" : highestRate != null ? `${highestRate.toFixed(2)}%` : t("No data")} note={t("Historical reported occurrence")} />
    </section>

    <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div><h2 className="font-semibold text-zinc-900">{t("District occurrence")}</h2><p className="mt-1 text-xs text-zinc-500">{t("Select a district to inspect its survey summary.")}</p></div>
          <div className="flex flex-wrap items-center gap-2"><label htmlFor="module" className="text-xs font-medium text-zinc-600">{t("Module")}</label><select id="module" value={module} onChange={(e) => { setModule(e.target.value as Module); setLoading(true); setError(""); setSelected(null); }} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"><option value="pest_disease">{t("Pest/Disease")}</option><option value="irrigation">{t("Irrigation")}</option></select><label htmlFor="season" className="text-xs font-medium text-zinc-600">{t("Season")}</label><select id="season" value={season} onChange={(e) => { setSeason(e.target.value as (typeof SEASONS)[number]); setLoading(true); setError(""); setSelected(null); }} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">{SEASONS.map((item) => <option key={item} value={item}>{t(item)}</option>)}</select></div>
        </div>
        <div className="relative bg-[#f5f8f6]">
          {loading && <div className="absolute inset-0 z-10 grid place-items-center bg-white/75 text-sm font-medium text-zinc-600"><span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent"/>{t("Loading district indicators…")}</div>}
          {error ? <div role="alert" className="grid min-h-[420px] place-items-center p-8 text-center"><div><p className="font-semibold text-red-800">{t("Could not load the risk map")}</p><p className="mt-2 max-w-md text-sm text-zinc-600">{t(error).replace("{status}", String(errorStatus ?? ""))}</p><button onClick={() => { setLoading(true); setError(""); setRetry((current) => current + 1); }} className="mt-4 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">{t("Retry")}</button></div></div>
            : !loading && features.length === 0 ? <div className="grid min-h-[420px] place-items-center text-sm text-zinc-500">{t("No district data is available for {season}.").replace("{season}", t(season))}</div>
            : <div className="relative h-[420px] min-h-[360px] w-full touch-none sm:h-[560px]" onWheel={(e) => { e.preventDefault(); changeZoom(e.deltaY < 0 ? 0.1 : -0.1); }}>
              <svg viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`} role="img" aria-label={t("Rwanda district map showing {indicator} for {season}").replace("{indicator}", t(moduleLabel)).replace("{season}", t(season))} className="h-full w-full cursor-grab p-5 active:cursor-grabbing sm:p-8" preserveAspectRatio="xMidYMid meet"
                onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, moved: false }; e.currentTarget.setPointerCapture(e.pointerId); }}
                onPointerMove={(e) => { if (!drag.current) return; const rect = e.currentTarget.getBoundingClientRect(); const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y; if (Math.abs(dx) + Math.abs(dy) > 2) drag.current.moved = true; drag.current.x = e.clientX; drag.current.y = e.clientY; setPan((p) => ({ x: p.x + dx * bounds.width / rect.width, y: p.y + dy * bounds.height / rect.height })); }}
                onPointerUp={() => { if (drag.current?.moved) window.setTimeout(() => { drag.current = null; }, 0); else drag.current = null; }}>
                <g transform={`translate(${500 * (1 - zoom) + pan.x} ${500 * (1 - zoom) + pan.y}) scale(${zoom})`}>
                  {features.map((feature, index) => { const key = normalize(label(feature)); const indicator = feature.properties?.riskIndicator; const isSelected = selected === key; return <path key={`${key}-${index}`} d={paths.get(feature) || ""} fill={rateColor(indicator, module)} stroke={isSelected ? "#064e3b" : "#fff"} strokeWidth={isSelected ? 3.8 : 2.1} vectorEffect="non-scaling-stroke" tabIndex={0} role="button" aria-label={`${districtText(feature)}, ${displayRate(indicator)}`} onClick={() => { if (drag.current?.moved) { drag.current = null; return; } setSelected(isSelected ? null : key); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(isSelected ? null : key); } }} onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(.92)"; }} onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }} className="cursor-pointer outline-none transition-[filter] focus:stroke-emerald-900">
                    <title>{`${districtText(feature)} · ${displayRate(indicator)}${indicator ? ` · ${indicator.observedCount ?? "—"} ${t("observations")}` : ""}`}</title></path>; })}
                </g>
              </svg>
              <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"><button aria-label={t("Zoom in")} onClick={() => changeZoom(.2)} className="px-3 py-1.5 text-lg text-zinc-700 hover:bg-zinc-50">+</button><button aria-label={t("Zoom out")} onClick={() => changeZoom(-.2)} className="border-t border-zinc-200 px-3 py-1.5 text-lg text-zinc-700 hover:bg-zinc-50">−</button><button aria-label={t("Reset map view")} onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="border-t border-zinc-200 px-2 py-1 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-50">{t("RESET")}</button></div>
              <div className="absolute bottom-3 left-3 rounded-lg border border-white/80 bg-white/90 px-3 py-2 text-[11px] text-zinc-500 shadow-sm">{t("Rwanda district boundaries · hover or focus to see values")}</div>
            </div>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-100 px-4 py-3 sm:px-5"><span className="text-xs font-semibold text-zinc-700">{t(rateLabel)}</span>{levels.map((level) => <div key={level.label} className="flex items-center gap-1.5 text-xs text-zinc-600"><span className="h-3 w-3 rounded-sm border border-black/5" style={{ backgroundColor: level.color }}/>{t(level.label)} <span className="text-zinc-400">{level.range}</span></div>)}<div className="flex items-center gap-1.5 text-xs text-zinc-600"><span className="h-3 w-3 rounded-sm border border-black/5" style={{ backgroundColor: module === "irrigation" ? IRRIGATION_COLORS.missing : PEST_COLORS.missing }}/>{t("No data / insufficient")}</div></div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("District details")}</p><h2 className="mt-2 text-xl font-bold text-zinc-900">{selectedFeature ? districtText(selectedFeature) : t("Select a district")}</h2></div>{selectedFeature && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{t(season)}</span>}</div>
          {!selectedFeature ? <p className="mt-4 text-sm leading-6 text-zinc-500">{t("Choose a district on the map to view its reported cases, observation count, and data status.")}</p> : <>
            <div className="mt-5 rounded-xl bg-zinc-50 p-4"><div className="text-xs font-medium text-zinc-500">{module === "irrigation" ? t("Historical reported irrigation rate") : t("Historical reported occurrence rate")}</div><div className="mt-1 text-3xl font-bold text-zinc-900">{displayRate(detail)}</div></div>
            <div className="mt-4 grid grid-cols-2 gap-3"><Stat label={module === "irrigation" ? t("Reported irrigated observations") : t("Reported cases")} value={detail?.reportedCases == null ? t("No data") : detail.reportedCases.toLocaleString()} /><Stat label={module === "irrigation" ? t("Eligible observations") : t("Observations")} value={detail?.observedCount == null ? t("No data") : detail.observedCount.toLocaleString()} /></div>
            <div className="mt-4"><p className="text-xs font-medium text-zinc-500">{t("Data quality")}</p><p className={`mt-1 text-sm font-semibold ${detail?.dataStatus === "SUFFICIENT_FOR_INITIAL_REVIEW" ? "text-emerald-800" : "text-amber-800"}`}>{t(detail?.dataStatus?.replaceAll("_", " ") ?? "NO DATA")}</p></div>
            {detail && detail.dataStatus !== "SUFFICIENT_FOR_INITIAL_REVIEW" && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">{t("Small or insufficient sample. Treat any reported values cautiously; this district is excluded from the rate color scale and summary comparisons.")}</p>}
            <p className="mt-4 border-t border-zinc-100 pt-4 text-sm leading-6 text-zinc-600">{!detail || detail.dataStatus === "NO_DATA" ? t("No survey indicator is available for this district and season.") : detail.dataStatus !== "SUFFICIENT_FOR_INITIAL_REVIEW" ? t("The available observations do not meet the backend review threshold, so this rate should not be compared with other districts.") : t("This is a summary of historical survey reports. It does not estimate future outbreak likelihood.")}</p>
          </>}
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5"><h3 className="text-sm font-bold text-emerald-950">{t("How to read this map")}</h3><p className="mt-2 text-sm leading-6 text-emerald-900/80">{module === "irrigation" ? t("Colors show the historical share of eligible survey records reporting that a plot was irrigated. This is not a measure of irrigation need, drought risk, or an AI prediction. Interpret small samples cautiously.") : t("Colors represent historical reported pest or disease occurrence in survey data. They do not predict future outbreaks. Interpret comparisons cautiously, especially where sample sizes are small.")}</p><p className="mt-3 text-xs leading-5 text-emerald-900/70">{t("Color categories are provisional display thresholds, not scientifically validated risk levels.")}</p></div>
        {!loading && unmatched.length > 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{t("{count} boundary record(s) could not be matched by district name.").replace("{count}", String(unmatched.length))}</p>}
        {!loading && duplicates.length > 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{t("Duplicate normalized boundary names detected: {names}.").replace("{names}", duplicates.join(", "))}</p>}
      </aside>
    </section>
  </main>;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p><p className="mt-2 truncate text-2xl font-bold text-zinc-900" title={value}>{value}</p><p className="mt-1 text-xs text-zinc-500">{note}</p></article>; }
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-zinc-100 p-3"><p className="text-[11px] font-medium text-zinc-500">{label}</p><p className="mt-1 break-words text-sm font-bold text-zinc-900">{value}</p></div>; }
