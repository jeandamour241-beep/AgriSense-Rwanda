from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent

DATA_PATH = (
    BASE_DIR
    / "data"
    / "all_data"
    / "all_seasons_cleaned_merged.csv"
)


def main():
    df = pd.read_csv(DATA_PATH, low_memory=False)

    # Normalize the known spelling variation.
    df["district_clean"] = (
        df["s1q2"]
        .astype("string")
        .str.strip()
        .replace({
            "Nyarugenege": "Nyarugenge",
        })
    )

    print("\nOBSERVATIONS PER DISTRICT")
    print(
        df.groupby("district_clean", dropna=False)
        .size()
        .sort_values(ascending=False)
        .to_string()
    )

    for target in ["s4q14", "s2q42", "s3q3", "s3q9"]:
        if target not in df.columns:
            continue

        print(f"\n{'=' * 60}")
        print(f"TARGET: {target}")
        print(f"{'=' * 60}")

        summary = (
            df.groupby(
                ["district_clean", "season"],
                dropna=False,
            )[target]
            .agg(
                total_rows="size",
                observed="count",
                missing=lambda x: x.isna().sum(),
            )
            .reset_index()
        )

        summary["observed_pct"] = (
            summary["observed"] / summary["total_rows"] * 100
        ).round(1)

        print(summary.to_string(index=False))


if __name__ == "__main__":
    main()
