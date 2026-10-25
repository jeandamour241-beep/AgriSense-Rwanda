import { AlertTriangleIcon } from "@/components/ui/Icons";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-zinc-200 bg-white text-zinc-700">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-amber-950 sm:p-5">
          <div className="grid gap-6 sm:grid-cols-[minmax(12rem,0.8fr)_minmax(0,2fr)] sm:gap-10">
            <section aria-labelledby="footer-project-title">
              <h2
                id="footer-project-title"
                className="text-sm font-bold text-amber-950"
              >
                AgriSense Rwanda
              </h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-amber-950/80">
                Agricultural data insights and decision support for Rwanda.
              </p>
            </section>

            <section aria-labelledby="footer-data-title">
              <h2
                id="footer-data-title"
                className="flex items-center gap-2 text-sm font-bold text-amber-950"
              >
                <AlertTriangleIcon size={17} className="shrink-0 text-amber-700" />
                <span>Data Source and Limitations</span>
              </h2>
              <div className="mt-2 space-y-2.5 text-[13px] leading-5 text-amber-950/85">
                <p>
                  AgriSense Rwanda uses agricultural survey data from the National
                  Institute of Statistics of Rwanda (NISR), based on the 2025
                  dataset available to this project. The observations represent
                  historical survey information and should not be interpreted as
                  real-time agricultural conditions.
                </p>
                <p>
                  Machine-learning predictions and recommendations are estimates
                  generated from available data and model outputs. They may not
                  reflect current field conditions and should be verified against
                  local observations and advice from qualified agricultural
                  officers before making important farming decisions.
                </p>
                <p>
                  Data availability, sample size, and model performance may vary
                  by district, season, and agricultural indicator. Results should
                  be interpreted with these limitations in mind.
                </p>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-5 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
          © {currentYear} Rwanda AgriSystem
        </div>
      </div>
    </footer>
  );
}
