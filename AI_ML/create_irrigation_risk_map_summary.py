
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parent

SOURCE_PATH = (
    ROOT / "data" / "all_data" / "all_seasons_cleaned_merged.csv"
)

OUTPUT_PATH = (
    ROOT / "data" / "agrisystem" /
    "irrigation_district_season_summary.csv"
)

MIN_OBSERVATIONS = 30

VALID_SEASONS = ["Season A", "Season B", "Season C"]


def clean_district(value):
    """Normalize district names for matching with the existing map."""
    if pd.isna(value):
        return None

    name = " ".join(str(value).strip().split()).title()

    aliases = {
        "Nyarugenege": "Nyarugenge",
    }

    return aliases.get(name, name)


def main():
    print("=" * 70)
    print("RWANDA AGRISYSTEM - IRRIGATION RISK MAP SUMMARY")
    print("=" * 70)

    if not SOURCE_PATH.exists():
        raise FileNotFoundError(
            f"Source dataset not found: {SOURCE_PATH}"
        )

    df = pd.read_csv(SOURCE_PATH, low_memory=False)

    required_columns = [
        "s1q2",
        "season",
        "s4q13",
        "s4q14",
    ]

    missing = [
        col for col in required_columns
        if col not in df.columns
    ]

    if missing:
        raise ValueError(
            f"Missing required columns: {missing}"
        )

    print(f"Source shape: {df.shape}")

    # Normalize the fields used by this indicator.
    df["district_clean"] = df["s1q2"].apply(clean_district)
    df["season"] = df["season"].astype("string").str.strip()
    df["s4q13"] = df["s4q13"].astype("string").str.strip()
    df["s4q14"] = df["s4q14"].astype("string").str.strip()

    # Only use known seasons and valid district names.
    df = df[
        df["district_clean"].notna()
        & df["season"].isin(VALID_SEASONS)
    ].copy()

    print(f"Rows with valid district and season: {len(df)}")

    # Questionnaire logic:
    # s4q13 = Yes means the respondent reported irrigation
    # on at least one of their plots.
    # s4q14 is a plot-level answer and is evaluated only
    # for these eligible records.
    eligible = df[df["s4q13"] == "Yes"].copy()

    # Missing or unexpected answers are not counted as No.
    eligible = eligible[
        eligible["s4q14"].isin(["Yes", "No"])
    ].copy()

    print(f"Eligible records with valid s4q14: {len(eligible)}")
    print(
        "Records with s4q14 = Yes (irrigated plots):",
        int((eligible["s4q14"] == "Yes").sum()),
    )
    print(
        "Records with s4q14 = No (not irrigated plots):",
        int((eligible["s4q14"] == "No").sum()),
    )

    # Build the district-season summary.
    summary = (
        eligible.groupby(
            ["district_clean", "season"],
            as_index=False,
        )
        .agg(
            total_observed=("s4q14", "size"),
            reported_cases=("s4q14", lambda x: (x == "Yes").sum()),
        )
    )

    # Keep a complete district x season grid.
    districts = sorted(df["district_clean"].dropna().unique())

    full_index = pd.MultiIndex.from_product(
        [districts, VALID_SEASONS],
        names=["district_clean", "season"],
    )

    summary = (
        summary.set_index(["district_clean", "season"])
        .reindex(full_index)
        .reset_index()
    )

    summary["total_observed"] = (
        summary["total_observed"].fillna(0).astype(int)
    )

    summary["reported_cases"] = (
        summary["reported_cases"].fillna(0).astype(int)
    )

    summary["reported_rate"] = (
        summary["reported_cases"]
        .div(summary["total_observed"].where(
            summary["total_observed"] > 0
        ))
    )

    summary["reported_rate_pct"] = (
        summary["reported_rate"] * 100
    ).round(2)

    def classify_status(row):
        if row["total_observed"] == 0:
            return "NO_DATA"

        if row["total_observed"] < MIN_OBSERVATIONS:
            return "INSUFFICIENT_OBSERVATIONS"

        return "SUFFICIENT_FOR_INITIAL_REVIEW"

    summary["data_status"] = summary.apply(
        classify_status,
        axis=1,
    )

    # Keep the schema compatible with the existing Pest summary.
    summary = summary[
        [
            "district_clean",
            "season",
            "total_observed",
            "reported_cases",
            "reported_rate",
            "reported_rate_pct",
            "data_status",
        ]
    ].sort_values(
        ["season", "reported_rate_pct"],
        ascending=[True, False],
        na_position="last",
    )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    summary.to_csv(OUTPUT_PATH, index=False)

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)

    print("Output shape:", summary.shape)
    print("\nRows per season:")
    print(summary.groupby("season").size().to_string())

    print("\nData status counts:")
    print(summary["data_status"].value_counts().to_string())

    print("\nHighest observed irrigation rates per season:")
    for season in VALID_SEASONS:
        season_data = summary[
            (summary["season"] == season)
            & (summary["total_observed"] >= MIN_OBSERVATIONS)
        ].sort_values("reported_rate_pct", ascending=False)

        print(f"\n{season}:")
        if season_data.empty:
            print("No district meets the minimum observation threshold.")
        else:
            print(
                season_data[
                    [
                        "district_clean",
                        "total_observed",
                        "reported_cases",
                        "reported_rate_pct",
                    ]
                ].head(5).to_string(index=False)
            )

    print("\nSaved to:")
    print(OUTPUT_PATH)
    print("\nNote: This is a historical survey indicator, not a prediction.")


if __name__ == "__main__":
    main()
