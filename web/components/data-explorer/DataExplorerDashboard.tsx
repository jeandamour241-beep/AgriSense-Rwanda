"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  dataExplorerService,
  type CropStat,
  type DistrictStat,
  type ExplorerFilters,
  type FilterOptions,
  type Overview,
  type SeasonStat,
  type TableResult,
  type TableRow,
} from "@/lib/services/dataExplorerService";
import {
  AlertTriangleIcon,
  InfoIcon,
  SpinnerIcon,
} from "@/components/ui/Icons";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Resource<T> = { value: T | null; loading: boolean; error: string | null };
type ResourceSetter<T> = (
  value: Resource<T> | ((current: Resource<T>) => Resource<T>),
) => void;
const blank = <T,>(): Resource<T> => ({
  value: null,
  loading: false,
  error: null,
});
const emptyFilters: ExplorerFilters = {};
const numberFormat = new Intl.NumberFormat("en-RW", {
  maximumFractionDigits: 0,
});
const decimalFormat = new Intl.NumberFormat("en-RW", {
  maximumFractionDigits: 2,
});

function formatNumber(value: number | null | undefined, decimals = false) {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "—";
  return (decimals ? decimalFormat : numberFormat).format(value);
}

function useResource<T>(initial: T | null = null) {
  return useState<Resource<T>>({ value: initial, loading: false, error: null });
}

export function DataExplorerDashboard() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<Resource<FilterOptions>>(blank());
  const [overview, setOverview] = useResource<Overview>();
  const [crops, setCrops] = useResource<CropStat[]>();
  const [districts, setDistricts] = useResource<DistrictStat[]>();
  const [seasons, setSeasons] = useResource<SeasonStat[]>();
  const [table, setTable] = useResource<TableResult>({
    total: 0,
    page: 1,
    page_size: 10,
    items: [],
  });
  const [selected, setSelected] = useState<ExplorerFilters>(emptyFilters);
  const [applied, setApplied] = useState<ExplorerFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const controllers = useRef<Record<string, AbortController>>({});

  const run = useCallback(
    async <T,>(
      key: string,
      setter: ResourceSetter<T>,
      request: (signal: AbortSignal) => Promise<T>,
    ) => {
      controllers.current[key]?.abort();
      const controller = new AbortController();
      controllers.current[key] = controller;
      setter((current) => ({ ...current, loading: true, error: null }));
      try {
        const value = await request(controller.signal);
        if (!controller.signal.aborted)
          setter({ value, loading: false, error: null });
      } catch (error) {
        if (!controller.signal.aborted)
          setter((current) => ({
            ...current,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load this section.",
          }));
      }
    },
    [],
  );

  const loadDashboard = useCallback(
    (currentFilters: ExplorerFilters, currentPage = 1) => {
      void run("overview", setOverview, (signal) =>
        dataExplorerService.overview(currentFilters, signal),
      );
      void run("crops", setCrops, (signal) =>
        dataExplorerService
          .crops(
            {
              province: currentFilters.province,
              district: currentFilters.district,
              season: currentFilters.season,
            },
            signal,
          )
          .then((value) => {
            if (!Array.isArray(value))
              throw new Error(
                "The crop endpoint returned an unexpected format.",
              );
            return value;
          }),
      );
      void run("districts", setDistricts, (signal) =>
        dataExplorerService
          .districts(
            {
              province: currentFilters.province,
              crop: currentFilters.crop,
              season: currentFilters.season,
            },
            signal,
          )
          .then((value) => {
            if (!Array.isArray(value))
              throw new Error(
                "The district endpoint returned an unexpected format.",
              );
            return value;
          }),
      );
      void run("seasons", setSeasons, (signal) =>
        dataExplorerService
          .seasons(
            {
              province: currentFilters.province,
              district: currentFilters.district,
              crop: currentFilters.crop,
            },
            signal,
          )
          .then((value) => {
            if (!Array.isArray(value))
              throw new Error(
                "The seasons endpoint returned an unexpected format.",
              );
            return value;
          }),
      );
      void run("table", setTable, (signal) =>
        dataExplorerService
          .table(currentFilters, currentPage, signal)
          .then((value) => {
            if (
              !value ||
              !Array.isArray(value.items) ||
              !Number.isFinite(value.total) ||
              !Number.isFinite(value.page) ||
              !Number.isFinite(value.page_size)
            )
              throw new Error(
                "The table endpoint returned an unexpected format.",
              );
            return value;
          }),
      );
    },
    [run, setOverview, setCrops, setDistricts, setSeasons, setTable],
  );

  useEffect(() => {
    const activeControllers = controllers.current;
    void run("filters", setFilters, (signal) =>
      dataExplorerService.filters(signal).then((value) => {
        if (
          !value ||
          !Array.isArray(value.provinces) ||
          !Array.isArray(value.districts) ||
          !Array.isArray(value.crops) ||
          !Array.isArray(value.seasons)
        )
          throw new Error("The filter endpoint returned an unexpected format.");
        return value;
      }),
    );
    loadDashboard(emptyFilters, 1);
    return () =>
      Object.values(activeControllers).forEach((controller) =>
        controller.abort(),
      );
  }, [run, loadDashboard]);

  const options = filters.value;
  const applyFilters = () => {
    const next = Object.fromEntries(
      Object.entries(selected).filter(([, value]) => Boolean(value)),
    ) as ExplorerFilters;
    setApplied(next);
    setPage(1);
    loadDashboard(next, 1);
  };
  const resetFilters = () => {
    setSelected(emptyFilters);
    setApplied(emptyFilters);
    setPage(1);
    loadDashboard(emptyFilters, 1);
  };
  const changePage = (nextPage: number) => {
    if (
      nextPage < 1 ||
      (table.value &&
        nextPage > Math.ceil(table.value.total / table.value.page_size))
    )
      return;
    setPage(nextPage);
    void run("table", setTable, (signal) =>
      dataExplorerService.table(applied, nextPage, signal).then((value) => {
        if (
          !value ||
          !Array.isArray(value.items) ||
          !Number.isFinite(value.total) ||
          !Number.isFinite(value.page) ||
          !Number.isFinite(value.page_size)
        )
          throw new Error("The table endpoint returned an unexpected format.");
        return value;
      }),
    );
  };

  const activeFilters = useMemo(
    () => Object.values(applied).filter(Boolean).length,
    [applied],
  );
  const kpis = overview.value
    ? [
        {
          label: t("Survey observations"),
          value: formatNumber(overview.value.observations),
          note: t("Records matching filters"),
        },
        // {
        //   label: t("Districts represented"),
        //   value: formatNumber(overview.value.districts),
        //   note: t("Distinct districts"),
        // },
        {
          label: t("Crops represented"),
          value: formatNumber(overview.value.crops),
          note: t("Distinct crops"),
        },
        {
          label: t("Agricultural seasons"),
          value: formatNumber(overview.value.seasons),
          note: t("Distinct seasons"),
        },
        {
          label: t("Harvested area"),
          value:
            overview.value.harvested_area_ha === null
              ? "—"
              : `${formatNumber(overview.value.harvested_area_ha, true)} ha`,
          note: t("Sum of recorded harvested area"),
        },
        {
          label: t("Mean yield"),
          value: formatNumber(overview.value.mean_yield, true),
          note: `${formatNumber(overview.value.yield_observations)} ${t("observations")} · ${t("recorded value")}`,
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
          {t("RwandaAgriSystem · Survey data")}
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
          {t("Rwanda Agriculture Data Explorer")}
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-zinc-600">
          {t(
            "Explore agricultural survey statistics across Rwanda by province, district, crop, and season.",
          )}
        </p>
      </header>

      <section
        className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs sm:p-6"
        aria-labelledby="filter-title"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <h2 id="filter-title" className="text-base font-bold text-zinc-900">
              {t("Filter survey data")}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {t(
                "Selections apply across the dashboard after you press Apply filters.",
              )}
            </p>
          </div>
          {filters.loading && (
            <span className="inline-flex items-center gap-2 text-xs text-zinc-500">
              <SpinnerIcon size={15} />
              {t("Loading filter options")}
            </span>
          )}
        </div>
        {filters.error && (
          <ErrorNotice
            message={filters.error}
            onRetry={() =>
              void run("filters", setFilters, (signal) =>
                dataExplorerService.filters(signal),
              )
            }
          />
        )}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect
            label="Province"
            value={selected.province ?? ""}
            options={options?.provinces ?? []}
            disabled={!options || filters.loading}
            onChange={(value) =>
              setSelected((current) => ({
                ...current,
                province: value || undefined,
                district: undefined,
              }))
            }
          />
          <FilterSelect
            label="District"
            value={selected.district ?? ""}
            options={options?.districts ?? []}
            disabled={!options || filters.loading}
            onChange={(value) =>
              setSelected((current) => ({
                ...current,
                district: value || undefined,
              }))
            }
          />
          <FilterSelect
            label="Crop"
            value={selected.crop ?? ""}
            options={options?.crops ?? []}
            disabled={!options || filters.loading}
            onChange={(value) =>
              setSelected((current) => ({
                ...current,
                crop: value || undefined,
              }))
            }
          />
          <FilterSelect
            label="Agricultural season"
            value={selected.season ?? ""}
            options={options?.seasons ?? []}
            disabled={!options || filters.loading}
            onChange={(value) =>
              setSelected((current) => ({
                ...current,
                season: value || undefined,
              }))
            }
          />
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            {activeFilters
              ? `${activeFilters} ${t(activeFilters === 1 ? "filter applied" : "filters applied")}`
              : t("Showing all available survey data")}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={resetFilters}
              disabled={!options}
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              {t("Reset filters")}
            </button>
            <button
              type="button"
              onClick={applyFilters}
              disabled={!options}
              className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
            >
              {t("Apply filters")}
            </button>
          </div>
        </div>
      </section>

      <section aria-labelledby="overview-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2
              id="overview-title"
              className="text-base font-bold text-zinc-900"
            >
              {t("Agricultural overview")}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {t("Summary for the current selection")}
            </p>
          </div>
          {overview.loading && (
            <SpinnerIcon size={18} className="text-emerald-700" />
          )}
        </div>
        {overview.error ? (
          <ErrorNotice
            message={overview.error}
            onRetry={() =>
              void run("overview", setOverview, (signal) =>
                dataExplorerService.overview(applied, signal),
              )
            }
          />
        ) : kpis.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {kpis.map((kpi) => (
              <article
                key={kpi.label}
                className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs"
              >
                <p className="text-xs font-semibold text-zinc-500">
                  {kpi.label}
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                  {kpi.value}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{kpi.note}</p>
              </article>
            ))}
          </div>
        ) : (
          <LoadingPanel label="Loading summary statistics" />
        )}
        {overview.value?.source && (
          <p className="mt-3 text-[11px] text-zinc-500">
            {t("Source:")} {overview.value.source}
          </p>
        )}
      </section>

      <section aria-labelledby="charts-title">
        <div className="mb-3">
          <h2 id="charts-title" className="text-base font-bold text-zinc-900">
            {t("Explore the data")}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {t(
              "Record counts show the number of survey observations returned for each category.",
            )}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title={t("Crop comparison")}
            subtitle={t("Survey observations by crop")}
            resource={crops}
            onRetry={() =>
              void run("crops", setCrops, (signal) =>
                dataExplorerService.crops(
                  {
                    province: applied.province,
                    district: applied.district,
                    season: applied.season,
                  },
                  signal,
                ),
              )
            }
          >
            {crops.value && (
              <Bars
                rows={crops.value.map((row) => ({
                  label: row.crop,
                  value: row.observations,
                }))}
              />
            )}
          </ChartCard>
          <ChartCard
            title={t("District comparison")}
            subtitle={t("Survey observations by district")}
            resource={districts}
            onRetry={() =>
              void run("districts", setDistricts, (signal) =>
                dataExplorerService.districts(
                  {
                    province: applied.province,
                    crop: applied.crop,
                    season: applied.season,
                  },
                  signal,
                ),
              )
            }
          >
            {districts.value && (
              <Bars
                rows={districts.value.map((row) => ({
                  label: row.district,
                  value: row.observations,
                }))}
              />
            )}
          </ChartCard>
          <ChartCard
            title={t("Agricultural seasons")}
            subtitle={t("Survey observations by season")}
            resource={seasons}
            onRetry={() =>
              void run("seasons", setSeasons, (signal) =>
                dataExplorerService.seasons(
                  {
                    province: applied.province,
                    district: applied.district,
                    crop: applied.crop,
                  },
                  signal,
                ),
              )
            }
          >
            {seasons.value && (
              <Bars
                rows={seasons.value.map((row) => ({
                  label: t(row.season),
                  value: row.observations,
                }))}
              />
            )}
          </ChartCard>
          <aside className="flex min-h-56 flex-col justify-between rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-emerald-700">
                <InfoIcon size={18} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  {t("Reading these statistics")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {t(
                    "Charts compare record counts from the filtered survey. They do not represent production volume or yield. Area metrics are reported in hectares; yield is shown as the recorded value because a unit is not established in the data service.",
                  )}
                </p>
              </div>
            </div>
            <p className="mt-5 border-t border-emerald-100 pt-3 text-xs text-zinc-500">
              {overview.value?.source
                ? `${t("Dataset:")} ${overview.value.source}`
                : t("Agricultural survey records")}
            </p>
          </aside>
        </div>
      </section>

      <section
        className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs"
        aria-labelledby="table-title"
      >
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <h2 id="table-title" className="text-base font-bold text-zinc-900">
              {t("Survey records")}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {table.value
                ? `${numberFormat.format(table.value.total)} ${t("matching records")}`
                : t("Filtered agricultural observations")}
            </p>
          </div>
          {table.loading && (
            <span className="inline-flex items-center gap-2 text-xs text-zinc-500">
              <SpinnerIcon size={15} />
              {t("Loading records")}
            </span>
          )}
        </div>
        {table.error ? (
          <div className="p-5 sm:p-6">
            <ErrorNotice
              message={table.error}
              onRetry={() =>
                void run("table", setTable, (signal) =>
                  dataExplorerService.table(applied, page, signal),
                )
              }
            />
          </div>
        ) : table.value?.items.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-5 py-3">{t("Province")}</th>
                    <th className="px-5 py-3">{t("District")}</th>
                    <th className="px-5 py-3">{t("Season")}</th>
                    <th className="px-5 py-3">{t("Crop")}</th>
                    <th className="px-5 py-3 text-right">
                      {t("Crop area (ha)")}
                    </th>
                    <th className="px-5 py-3 text-right">
                      {t("Harvested area (ha)")}
                    </th>
                    <th className="px-5 py-3 text-right">
                      {t("Yield (recorded value)")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {table.value.items.map((row, index) => (
                    <TableRecord
                      key={`${row.province}-${row.district}-${row.crop}-${index}`}
                      row={row}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500">
                {t("Page")} {table.value.page} {t("of")}{" "}
                {Math.max(
                  1,
                  Math.ceil(table.value.total / table.value.page_size),
                )}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => changePage(page - 1)}
                  disabled={page <= 1 || table.loading}
                  className="rounded-lg border border-zinc-300 px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("Previous")}
                </button>
                <button
                  type="button"
                  onClick={() => changePage(page + 1)}
                  disabled={
                    page >=
                      Math.ceil(table.value.total / table.value.page_size) ||
                    table.loading
                  }
                  className="rounded-lg border border-zinc-300 px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("Next")}
                </button>
              </div>
            </div>
          </>
        ) : table.loading ? (
          <LoadingPanel label="Loading survey records" />
        ) : (
          <EmptyPanel label="No survey records match these filters." />
        )}
      </section>
      <p className="px-1 text-[11px] leading-relaxed text-zinc-500">
        {t(
          "Statistics are descriptive summaries of survey data. A missing value means the service did not return a recorded statistic.",
        )}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const { t } = useLanguage();
  const allLabel =
    label === "Agricultural season"
      ? "All agricultural seasons"
      : `All ${label.toLowerCase()}s`;
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-semibold text-zinc-800">
        {t(label)}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
      >
        <option value="">{t(allLabel)}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {t(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
    >
      <span className="flex items-start gap-2">
        <AlertTriangleIcon size={17} />
        <span>{t(message)}</span>
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
        >
          {t("Retry")}
        </button>
      )}
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-36 items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-200 bg-white text-sm text-zinc-500">
      <SpinnerIcon size={18} className="text-emerald-700" />
      {t(label)}
    </div>
  );
}

function EmptyPanel({ label }: { label: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 text-center text-sm text-zinc-500">
      {t(label)}
    </div>
  );
}

function ChartCard<T>({
  title,
  subtitle,
  resource,
  onRetry,
  children,
}: {
  title: string;
  subtitle: string;
  resource: Resource<T>;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs sm:p-6">
      <header className="mb-4 flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
          <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
        </div>
        {resource.loading && (
          <SpinnerIcon size={16} className="shrink-0 text-emerald-700" />
        )}
      </header>
      {resource.error ? (
        <ErrorNotice message={resource.error} onRetry={onRetry} />
      ) : resource.loading && !resource.value ? (
        <LoadingPanel label="Loading chart data" />
      ) : resource.value && React.Children.count(children) ? (
        children
      ) : (
        <EmptyPanel label="No records match these filters." />
      )}
    </article>
  );
}

function Bars({ rows }: { rows: { label: string; value: number | null }[] }) {
  const { t } = useLanguage();
  if (!rows.length)
    return <EmptyPanel label="No records match these filters." />;
  const maximum = Math.max(0, ...rows.map((row) => row.value ?? 0));
  return (
    <div
      className="space-y-4"
      role="img"
      aria-label={t("Horizontal bar chart comparing survey observation counts")}
    >
      {rows.map((row) => {
        const value = row.value;
        const width =
          value !== null && maximum > 0
            ? Math.max(2, (value / maximum) * 100)
            : 0;
        return (
          <div
            key={row.label}
            className="grid grid-cols-[minmax(90px,1fr)_2fr_auto] items-center gap-3"
          >
            <span
              className="truncate text-xs font-medium text-zinc-700"
              title={row.label}
            >
              {row.label}
            </span>
            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="min-w-10 text-right text-xs tabular-nums text-zinc-500">
              {formatNumber(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TableRecord({ row }: { row: TableRow }) {
  const { t } = useLanguage();
  return (
    <tr className="transition hover:bg-zinc-50/70">
      <td className="whitespace-nowrap px-5 py-3 text-zinc-700">
        {t(row.province ?? "—")}
      </td>
      <td className="whitespace-nowrap px-5 py-3 font-medium text-zinc-900">
        {row.district ?? "—"}
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-zinc-700">
        {t(row.season ?? "—")}
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-zinc-700">
        {t(row.crop ?? "—")}
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-zinc-700">
        {formatNumber(row.crop_area_ha, true)}
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-zinc-700">
        {formatNumber(row.harvested_area_ha, true)}
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-zinc-700">
        {formatNumber(row.yield, true)}
      </td>
    </tr>
  );
}
