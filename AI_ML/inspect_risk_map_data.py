from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent

DATA_PATH = (
    BASE_DIR
    / "data"
    / "all_data"
    / "all_seasons_cleaned_merged.csv"
)

TARGETS = [
    "s4q14",  # Irrigation
    "s2q42",  # Pest/disease observations
    "s3q3",   # Organic fertilizer
    "s3q9",   # Inorganic fertilizer
]


def main():
    if not DATA_PATH.exists():
        print(f"Dataset not found: {DATA_PATH}")
        return

    df = pd.read_csv(DATA_PATH, low_memory=False)

    print("\nDATASET SHAPE")
    print(df.shape)

    required = [
        "s1q1",
        "s1q2",
        "s1q3",
        "season",
        *TARGETS,
    ]

    print("\nCOLUMN CHECK")
    for column in required:
        print(f"{column}: {column in df.columns}")

    for column in ["s1q1", "s1q2", "season"]:
        if column not in df.columns:
            continue

        print(f"\nVALUES IN {column}")
        print(df[column].value_counts(dropna=False).head(50))

    for column in TARGETS:
        if column not in df.columns:
            continue

        print(f"\nTARGET DISTRIBUTION: {column}")
        print(df[column].value_counts(dropna=False).head(30))

        print(f"\nTARGET BY SEASON: {column}")
        if "season" in df.columns:
            print(
                pd.crosstab(
                    df["season"],
                    df[column],
                    dropna=False,
                )
            )


if __name__ == "__main__":
    main()
