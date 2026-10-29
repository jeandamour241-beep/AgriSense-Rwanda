"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CROP_OPTIONS,
  DISTRICTS_BY_PROVINCE,
  IRRIGATION_LAND_CONSOLIDATION_OPTIONS,
  RWANDA_PROVINCES,
  SOWING_PERIOD_OPTIONS,
} from "@/lib/constants/irrigationConstants";
import { AGRICULTURE_SEASONS } from "@/lib/constants/rwandaAgriculture";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  InfoIcon,
  SpinnerIcon,
} from "@/components/ui/Icons";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type ModuleKind = "pest-disease" | "fertilizer";
type Option = { value: string; label: string };
type Field = {
  key: string;
  label: string;
  hint?: string;
  options?: Option[];
  type?: "number";
};
type ApiResponse = Record<string, unknown>;

const yesNo: Option[] = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const sharedFields: Field[] = [
  {
    key: "s1q1",
    label: "Province",
    options: RWANDA_PROVINCES.map(({ value, labelEn }) => ({
      value,
      label: labelEn,
    })),
  },
  {
    key: "s1q2",
    label: "District",
    hint: "Choose the district where this plot is located.",
  },
  {
    key: "s1q3",
    label: "Agricultural land stratum",
    hint: "Choose the survey land category that best describes this area.",
    options: [
      { value: "10", label: "Agricultural land on hillside" },
      { value: "20", label: "Agricultural land in marshland" },
      { value: "30", label: "Rangeland" },
      { value: "40", label: "Mixed" },
      { value: "90", label: "Large Scale Farmer" },
    ],
  },
  {
    key: "season",
    label: "Agricultural season",
    options: AGRICULTURE_SEASONS.map(({ value, labelEn }) => ({
      value,
      label: labelEn,
    })),
  },
  {
    key: "s2q2",
    label: "Plot area (ha)",
    type: "number",
    hint: "Enter the area of this plot in square metres.",
  },
  {
    key: "s2q4",
    label: "Crop grown on this plot",
    options: CROP_OPTIONS.map(({ value, labelEn }) => ({
      value,
      label: labelEn,
    })),
  },
  {
    key: "s2q7",
    label: "Sowing period",
    hint: "Select the survey period when this plot was sown.",
    options: SOWING_PERIOD_OPTIONS.map(({ value, labelEn }) => ({
      value,
      label: labelEn,
    })),
  },
  {
    key: "s2q11",
    label: "Type of seeds sown",
    options: [
      { value: "1", label: "Traditional seeds" },
      { value: "2", label: "Improved seeds" },
      { value: "3", label: "Traditional and improved seeds" },
    ],
  },
];

const pestFields: Field[] = [
  ...sharedFields,
  {
    key: "s3q1",
    label: "Organic fertilizer used on any plot this season?",
    options: yesNo,
  },
  {
    key: "s3q7",
    label: "Inorganic fertilizer used on any plot this season?",
    options: yesNo,
  },
  {
    key: "s3q8",
    label: "Main source of fertilizer",
    options: [
      { value: "1", label: "Government (MINAGRI/RAB/NAEB)" },
      { value: "2", label: "Agro-dealers" },
      { value: "3", label: "NGOs" },
      { value: "4", label: "Market" },
      { value: "5", label: "Other" },
    ],
  },
  {
    key: "s3q9",
    label: "Inorganic fertilizer used on this plot this season?",
    options: yesNo,
  },
  {
    key: "s4q1",
    label: "Degree of soil erosion on this plot",
    hint: "Select the observed erosion level.",
    options: [
      { value: "1", label: "Severe erosion" },
      { value: "2", label: "Moderate erosion" },
      { value: "3", label: "Low erosion" },
      { value: "4", label: "Very low erosion" },
    ],
  },
  { key: "s4q2", label: "Anti-erosion activity on any plot?", options: yesNo },
  { key: "s4q3", label: "Anti-erosion activity on this plot?", options: yesNo },
  {
    key: "s4q4",
    label: "Were anti-erosion activities done this season?",
    options: yesNo,
  },
  {
    key: "s4q6",
    label: "Is this plot in a consolidated site this season?",
    options: IRRIGATION_LAND_CONSOLIDATION_OPTIONS.map(
      ({ value, labelEn }) => ({ value, label: labelEn }),
    ),
  },
  {
    key: "s4q8",
    label: "Mechanical equipment used on any plot this season?",
    options: yesNo,
  },
  {
    key: "s4q13",
    label: "Irrigation practiced on any plot this season?",
    options: yesNo,
  },
];

const fertilizerFields: Field[] = [
  ...sharedFields,
  pestFields.find(({ key }) => key === "s4q1")!,
  pestFields.find(({ key }) => key === "s4q6")!,
];

const configs: Record<
  ModuleKind,
  {
    title: string;
    description: string;
    button: string;
    endpoint: string;
    groups: { title: string; keys: string[] }[];
  }
> = {
  "pest-disease": {
    title: "Crop Pest/Disease Early Warning",
    description:
      "Estimate potential crop pest and disease risk from farm location, crop, and management information.",
    button: "Assess crop risk",
    endpoint: "/pest-disease",
    groups: [
      { title: "Farm location", keys: ["s1q1", "s1q2", "s1q3", "season"] },
      { title: "Crop information", keys: ["s2q2", "s2q4", "s2q7", "s2q11"] },
      {
        title: "Crop management",
        keys: pestFields.slice(8).map(({ key }) => key),
      },
    ],
  },
  fertilizer: {
    title: "Fertilizer Recommendation Assistant",
    description:
      "Review fertilizer strategy estimates and historical usage patterns based on plot and crop information.",
    button: "Get fertilizer insights",
    endpoint: "/fertilizer",
    groups: [
      { title: "Farm location", keys: ["s1q1", "s1q2", "s1q3", "season"] },
      {
        title: "Crop and plot information",
        keys: fertilizerFields.slice(4).map(({ key }) => key),
      },
    ],
  },
};

const pestKeys = [
  "s1q1",
  "s1q2",
  "s1q3",
  "season",
  "s2q2",
  "s2q4",
  "s2q7",
  "s2q11",
  "s3q1",
  "s3q7",
  "s3q8",
  "s3q9",
  "s4q1",
  "s4q2",
  "s4q3",
  "s4q4",
  "s4q6",
  "s4q8",
  "s4q13",
] as const;
const fertilizerKeys = [
  "s1q1",
  "s1q2",
  "s1q3",
  "season",
  "s2q2",
  "s2q4",
  "s2q7",
  "s2q11",
  "s4q1",
  "s4q6",
] as const;

function displayName(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function messageFromBody(body: unknown, status: number) {
  if (body && typeof body === "object") {
    const data = body as Record<string, unknown>;
    const message = data.message ?? data.error;
    if (Array.isArray(message)) return message.map(String).join("; ");
    if (typeof message === "string" && message.trim()) return message;
  }
  return `The request failed (HTTP ${status}). Please try again.`;
}

export function AssistantForm({ module }: { module: ModuleKind }) {
  const { t } = useLanguage();
  const config = configs[module];
  const fields = module === "pest-disease" ? pestFields : fertilizerFields;
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const districts = values.s1q1
    ? (DISTRICTS_BY_PROVINCE[values.s1q1] ?? [])
    : [];
  const fieldByKey = useMemo(
    () => new Map(fields.map((field) => [field.key, field])),
    [fields],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setResult(null);
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      const value = values[field.key]?.trim() ?? "";
      if (!value) nextErrors[field.key] = t("Please complete this field.");
      else if (
        field.type === "number" &&
        (!Number.isFinite(Number(value)) || Number(value) <= 0)
      ) {
        nextErrors[field.key] = t("Enter an area greater than 0 m².");
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setMessage(
        t("Review the highlighted fields and correct them before submitting."),
      );
      return;
    }

    const keys = module === "pest-disease" ? pestKeys : fertilizerKeys;
    const payload = Object.fromEntries(
      keys.map((key) => [
        key,
        key === "s2q2" ? Number(values[key]) : values[key],
      ]),
    );
    if (process.env.NODE_ENV === "development")
      console.debug(`[${module}] submitting DTO fields`, keys);
    setLoading(true);
    try {
      const baseUrl = (
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      ).replace(/\/$/, "");
      const response = await fetch(`${baseUrl}${config.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const raw = await response.text();
      let body: unknown = null;
      if (raw.trim()) {
        try {
          body = JSON.parse(raw);
        } catch {
          throw new Error(
            "The agriculture service returned an unreadable response. Please try again.",
          );
        }
      }
      if (process.env.NODE_ENV === "development")
        console.debug(`[${module}] response`, {
          status: response.status,
          body,
        });
      if (!response.ok) throw new Error(messageFromBody(body, response.status));
      if (!body || typeof body !== "object")
        throw new Error(
          "The agriculture service returned an empty response. Please try again later.",
        );
      const envelope = body as ApiResponse;
      if (envelope.success === false)
        throw new Error(messageFromBody(envelope, response.status));
      const data = envelope.data;
      const resultData =
        data && typeof data === "object" ? (data as ApiResponse) : envelope;
      if (!Object.keys(resultData).length)
        throw new Error(
          "The agriculture service returned no result. Please try again later.",
        );
      setResult(resultData);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not reach the agriculture service. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-xl text-emerald-700"
          >
            {module === "pest-disease" ? "⌕" : "✳"}
          </div>
          <div>
            <span className="mb-2 inline-flex rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {t("RwandaAgriSystem • Historical data")}
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
              {t(config.title)}
            </h1>
            <p className="mt-3 border-t border-zinc-100 pt-3 text-sm leading-relaxed text-zinc-600">
              {t(config.description)}
            </p>
          </div>
        </div>
      </section>

      {message && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          <AlertTriangleIcon size={18} />
          <span>{t(message)}</span>
        </div>
      )}

      <form
        onSubmit={submit}
        noValidate
        aria-busy={loading}
        className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs"
      >
        {config.groups.map((group, index) => (
          <section
            key={group.title}
            className={`space-y-5 p-6 sm:p-8 ${index ? "border-t border-zinc-100" : ""}`}
          >
            <header className="border-b border-zinc-100 pb-3">
              <h2 className="text-base font-bold capitalize text-zinc-900">
                {t(group.title)}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {t("Use the details recorded for the selected plot.")}
              </p>
            </header>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {group.keys.map((key) => {
                const field = fieldByKey.get(key)!;
                const id = `${module}-${field.key}`;
                const invalid = Boolean(errors[field.key]);
                const controlClass = `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-zinc-800 outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${invalid ? "border-red-400 focus:ring-red-200" : "border-zinc-300 hover:border-zinc-400 focus:border-emerald-500 focus:ring-emerald-500/20"}`;
                return (
                  <div key={field.key} className="space-y-1.5">
                    <label
                      htmlFor={id}
                      className="block text-xs font-semibold text-zinc-800 sm:text-sm"
                    >
                      {t(field.label)}{" "}
                      <span className="text-emerald-700">*</span>
                    </label>
                    {field.key === "s1q2" || field.options ? (
                      <select
                        id={id}
                        value={values[field.key] ?? ""}
                        disabled={
                          loading || (field.key === "s1q2" && !values.s1q1)
                        }
                        aria-invalid={invalid}
                        aria-describedby={
                          invalid
                            ? `${id}-error`
                            : field.hint
                              ? `${id}-hint`
                              : undefined
                        }
                        onChange={(event) => {
                          const value = event.target.value;
                          setValues((old) => ({
                            ...old,
                            [field.key]: value,
                            ...(field.key === "s1q1" ? { s1q2: "" } : {}),
                          }));
                          setErrors((old) => ({ ...old, [field.key]: "" }));
                        }}
                        className={controlClass}
                      >
                        <option value="">
                          {t("Select")} {t(field.label).toLowerCase()}
                        </option>
                        {(field.key === "s1q2"
                          ? districts.map((value) => ({ value, label: value }))
                          : (field.options ?? [])
                        ).map((option) => (
                          <option key={option.value} value={option.value}>
                            {t(option.label)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={id}
                        type="number"
                        step="any"
                        min="0"
                        value={values[field.key] ?? ""}
                        aria-invalid={invalid}
                        aria-describedby={
                          invalid
                            ? `${id}-error`
                            : field.hint
                              ? `${id}-hint`
                              : undefined
                        }
                        onChange={(event) => {
                          setValues((old) => ({
                            ...old,
                            [field.key]: event.target.value,
                          }));
                          setErrors((old) => ({ ...old, [field.key]: "" }));
                        }}
                        disabled={loading}
                        className={controlClass}
                      />
                    )}
                    {invalid ? (
                      <p
                        id={`${id}-error`}
                        className="text-xs font-medium text-red-600"
                      >
                        {errors[field.key]}
                      </p>
                    ) : (
                      field.hint && (
                        <p
                          id={`${id}-hint`}
                          className="text-[11px] leading-tight text-zinc-500"
                        >
                          {t(field.hint)}
                        </p>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        <div className="mx-6 mb-6 flex items-start gap-2.5 rounded-xl border border-zinc-200/70 bg-zinc-50 p-3.5 text-xs text-zinc-600 sm:mx-8">
          <InfoIcon size={16} className="shrink-0 text-emerald-700" />
          <span>
            {t(
              module === "pest-disease"
                ? "This is a model-based risk estimate using historical survey patterns, not a confirmed pest or disease diagnosis."
                : "Recommendations summarize model estimates and historical fertilizer use. They are not soil-tested prescriptions.",
            )}
          </span>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-zinc-100 px-6 pb-6 pt-4 sm:mx-2 sm:flex-row sm:px-6 sm:pb-8">
          <p className="text-xs text-zinc-500">
            {t("Fields marked")}{" "}
            <span className="font-semibold text-emerald-700">*</span>{" "}
            {t("are required.")}
          </p>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 px-8 py-3.5 font-bold text-white shadow-md shadow-emerald-950/15 transition-all hover:from-emerald-500 hover:to-green-600 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
          >
            {loading ? (
              <>
                <SpinnerIcon size={20} />
                <span>{t("Processing your information…")}</span>
              </>
            ) : (
              <>
                <span>{t(config.button)}</span>
                <ArrowRightIcon size={18} />
              </>
            )}
          </button>
        </div>
      </form>

      {result && (
        <section
          aria-live="polite"
          className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs sm:p-8"
        >
          <header className="border-b border-zinc-100 pb-3">
            <h2 className="text-lg font-bold text-zinc-900">
              {t(
                module === "pest-disease"
                  ? "Risk assessment"
                  : "Fertilizer insights",
              )}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {t("Returned by the agriculture service")}
            </p>
          </header>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {t(
              "Model-generated explanations are shown in the language returned by the service.",
            )}
          </p>
          <ResultView data={result} module={module} />
          <button
            type="button"
            onClick={() => {
              setResult(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            {t("Revise inputs")}
          </button>
        </section>
      )}
    </div>
  );
}

function ResultView({
  data,
  module,
}: {
  data: ApiResponse;
  module: ModuleKind;
}) {
  const { t } = useLanguage();
  if (module === "pest-disease") {
    const probability =
      typeof data.risk_percentage === "number"
        ? `${data.risk_percentage}%`
        : typeof data.risk_probability === "number"
          ? `${(data.risk_probability * 100).toFixed(1)}%`
          : null;
    const entries = [
      [
        "Risk level",
        typeof data.risk_level === "string"
          ? t(displayName(data.risk_level))
          : null,
      ],
      ["Risk probability", probability],
      // ["Model", typeof data.model === "string" ? data.model : null],
    ] as const;
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {entries
          .filter(([, value]) => value !== null)
          .map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
            >
              <p className="text-xs text-zinc-500">{t(label)}</p>
              <p className="mt-1 text-base font-bold text-zinc-900">{value}</p>
            </div>
          ))}
      </div>
    );
  }
  const strategy =
    typeof data.strategy === "string" ? displayName(data.strategy) : null;
  const probabilities =
    data.strategy_probabilities &&
    typeof data.strategy_probabilities === "object"
      ? (data.strategy_probabilities as Record<string, unknown>)
      : null;
  const sections = [
    ["Organic", data.organic],
    ["Inorganic", data.inorganic],
  ] as const;
  return (
    <div className="space-y-4">
      {strategy && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs text-emerald-800">
            {t("Historical fertilizer strategy class")}
          </p>
          <p className="mt-1 text-lg font-bold text-emerald-950">
            {t(strategy)}
          </p>
          {typeof data.strategy_probability === "number" && (
            <p className="mt-1 text-sm text-emerald-800">
              {t("Model probability:")}{" "}
              {(data.strategy_probability * 100).toFixed(1)}%
            </p>
          )}
          {probabilities && (
            <ul className="mt-3 grid gap-1 border-t border-emerald-200 pt-3 text-sm text-emerald-900 sm:grid-cols-2">
              {Object.entries(probabilities).map(([name, value]) => (
                <li key={name} className="flex justify-between gap-3">
                  <span>{t(displayName(name))}</span>
                  <span className="font-semibold">
                    {typeof value === "number"
                      ? `${(value * 100).toFixed(1)}%`
                      : String(value)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {sections.map(([label, value]) => {
        if (!value || typeof value !== "object") return null;
        const section = value as Record<string, unknown>;
        return (
          <div key={label} className="rounded-xl border border-zinc-200 p-4">
            <h3 className="font-bold text-zinc-900">
              {t(`${label} fertilizer patterns`)}
            </h3>
            {Array.isArray(section.recommendations) &&
            section.recommendations.length ? (
              <ul className="mt-2 space-y-2">
                {section.recommendations.map((item, index) => {
                  const row =
                    item && typeof item === "object"
                      ? (item as Record<string, unknown>)
                      : {};
                  return (
                    <li
                      key={index}
                      className="flex flex-wrap justify-between gap-2 border-t border-zinc-100 pt-2 text-sm"
                    >
                      <span className="font-medium text-zinc-800">
                        {t(String(row.type ?? ""))}
                      </span>
                      <span className="text-zinc-500">
                        {typeof row.historical_percentage === "number"
                          ? `${row.historical_percentage}% ${t("of recorded examples")}`
                          : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-600">
                {t(
                  String(
                    section.message ?? "No supporting pattern data returned.",
                  ),
                )}
              </p>
            )}
            {typeof section.records_used === "number" && (
              <p className="mt-3 text-xs text-zinc-500">
                {t("Historical records used:")} {section.records_used}
              </p>
            )}
          </div>
        );
      })}
      {typeof data.basis === "string" && (
        <p className="text-sm text-zinc-600">
          {t("Basis:")} {t(data.basis)}
        </p>
      )}
      {typeof data.note === "string" && (
        <p className="rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-600">
          {t(data.note)}
        </p>
      )}
      {!strategy &&
        !sections.some(([, value]) => value && typeof value === "object") && (
          <pre className="overflow-auto rounded-xl bg-zinc-50 p-4 text-xs text-zinc-700">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
    </div>
  );
}
