
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = (
    BASE_DIR
    / "data"
    / "all_data"
    / "all_seasons_cleaned_merged.csv"
)

MIN_OBSERVATIONS = 30


def main():
    df = pd.read_csv(DATA_PATH, low_memory=False)

    df["district_clean"] = (
        df["s1q2"]
        .astype("string")
        .str.strip()
        .replace({"Nyarugenege": "Nyarugenge"})
    )

    # Keep only rows where the target was actually observed.
    df["pest_target"] = pd.to_numeric(
        df["s2q42"], errors="coerce"
    )

    observed = df.dropna(
        subset=["district_clean", "season", "pest_target"]
    ).copy()

    # Existing model definition: positive value = reported case.
    observed["reported_case"] = (
        observed["pest_target"] > 0
    ).astype(int)

    summary = (
        observed.groupby(["district_clean", "season"])
        .agg(
            total_observed=("reported_case", "size"),
            reported_cases=("reported_case", "sum"),
            reported_rate=("reported_case", "mean"),
        )
        .reset_index()
    )

    summary["reported_rate_pct"] = (
        summary["reported_rate"] * 100
    ).round(2)

    summary["data_status"] = summary["total_observed"].apply(
        lambda n: (
            "SUFFICIENT_FOR_INITIAL_REVIEW"
            if n >= MIN_OBSERVATIONS
            else "INSUFFICIENT_DATA"
        )
    )

    summary = summary.sort_values(
        ["season", "reported_rate_pct"],
        ascending=[True, False],
    )

    print("\nPEST / DISEASE REPORTED OCCURRENCE")
    print(summary.to_string(index=False))

    output_path = (
        BASE_DIR
        / "data"
        / "agrisystem"
        / "pest_district_season_summary.csv"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    summary.to_csv(output_path, index=False)

    print(f"\nSaved summary to: {output_path}")


if __name__ == "__main__":
    main()
