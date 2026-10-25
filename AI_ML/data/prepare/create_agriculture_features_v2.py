from pathlib import Path
import pandas as pd



# PATHS


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "all_data"
    / "all_seasons_cleaned_merged.csv"
)

OUTPUT_DIR = PROJECT_ROOT / "data" / "agrisystem"

OUTPUT_FILE = OUTPUT_DIR / "agriculture_features_v2.csv"
REGISTRY_FILE = "./src/config/feature_registry.csv"



# IMPORTANT FEATURES


BASE_FEATURES = [
    # Location
    "s1q1",
    "s1q2",
    "s1q3",

    # Season
    "season",

    # Crop / plot
    "s2q2",
    "s2q7",
    "s2q11",

    # Fertilizer
    "s3q1",
    "s3q2a_1",
    "s3q2a_2",
    "s3q2a_3",
    "s3q2a_4",
    "s3q2a_Other1",
    "s3q7",
    "s3q8",
    "s3q9",

    # Pesticides
    "s3q18",
    "s3q19",

    # Erosion
    "s4q1",
    "s4q2",
    "s4q3",
    "s4q4",
    "s4q5_a",
    "s4q5_b",

    # Land consolidation
    "s4q6",
    "s4q7",

    # Mechanization
    "s4q8",
    "s4q9",
    "s4q10_1",
    "s4q10_2",
    "s4q10_2_1",
    "s4q10_2_2",
    "s4q10_3",
    "s4q10_Other1",

    "s4q11_1",
    "s4q11_2",
    "s4q11_2_1",
    "s4q11_2_2",
    "s4q11_2_3",
    "s4q11_2_4",
    "s4q11_Other1",
    "s4q11_3",

    "s4q12_1",
    "s4q12_2",
    "s4q12_2_1",
    "s4q12_2_2",
    "s4q12_2_3",
    "s4q12_Other1",
    "s4q12_3",
    "s4q12_4",

    # Irrigation
    "s4q13",
    "s4q14",
    "s4q15",
    "s4q16",
    "s4q16_1",
    "s4q16_2",
    "s4q16_3",
    "s4q17",
    "s4q17_1",
    "s4q17_2",
    "s4q17_3",
    "s4q17_4",
    "s4q17_5",
    "s4q18",

    # Crop target
    "s2q4",
    "CropCategory",

    # Risk / loss indicators
    "s2q24_d",
    "s2q24_disease",
    "s2q41",
    "s2q42",
    "s2q43",
    "s2q44",
    "s2q45",
    "s2q46",
    "s2q47",
    "s2q48",
    "s2q49",
    "s2q50",

    # Outcome fields kept for other modules,
    # but NOT used for crop recommendation input
    "Yield",
    "Harvested_Crop_Area_ha",
]



# READ DATA


def main():

    print("=" * 80)
    print("AGRISENSE - CREATE AGRICULTURE FEATURES V2")
    print("=" * 80)

    print(f"\nInput file:")
    print(INPUT_FILE)

    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"\nDataset not found:\n{INPUT_FILE}\n\n"
            "Check that your original merged CSV is inside:\n"
            f"{PROJECT_ROOT / 'data' / 'NISR'}"
        )

    print("\nLoading dataset...")

    df = pd.read_csv(
        INPUT_FILE,
        low_memory=False
    )

    print(f"Original shape: {df.shape[0]:,} rows × {df.shape[1]:,} columns")


    # ========================================================
    # CHECK REQUIRED COLUMNS
    # ========================================================

    print("\nChecking requested features...")

    existing_features = [
        col for col in BASE_FEATURES
        if col in df.columns
    ]

    missing_features = [
        col for col in BASE_FEATURES
        if col not in df.columns
    ]

    print(f"Found: {len(existing_features)}")

    if missing_features:
        print("\nWARNING - These columns were NOT found:")
        for col in missing_features:
            print(f"  - {col}")

    else:
        print("All requested features found.")


    # ========================================================
    # CREATE DATASET
    # ========================================================

    result = df[existing_features].copy()


    # ========================================================
    # REMOVE COMPLETELY EMPTY COLUMNS
    # ========================================================

    completely_empty = [
        col
        for col in result.columns
        if result[col].isna().all()
    ]

    if completely_empty:

        print("\nRemoving completely empty columns:")

        for col in completely_empty:
            print(f"  - {col}")

        result = result.drop(columns=completely_empty)


    # ========================================================
    # OUTPUT DIRECTORY
    # ========================================================

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )


    # ========================================================
    # SAVE
    # ========================================================

    result.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\n" + "=" * 80)
    print("FEATURE DATASET CREATED")
    print("=" * 80)

    print(f"\nOutput:")
    print(OUTPUT_FILE)

    print(
        f"\nShape: "
        f"{result.shape[0]:,} rows × "
        f"{result.shape[1]:,} columns"
    )


    # ========================================================
    # FEATURE REGISTRY
    # ========================================================

    registry = []

    for column in result.columns:

        if column in ["s1q1", "s1q2", "s1q3"]:
            group = "location"

        elif column in ["season"]:
            group = "season"

        elif column in [
            "s2q2",
            "s2q4",
            "s2q7",
            "s2q11",
            "CropCategory",
        ]:
            group = "crop"

        elif column.startswith("s3q"):
            group = "fertilizer_pesticide"

        elif column.startswith("s4q8") or \
             column.startswith("s4q9") or \
             column.startswith("s4q10") or \
             column.startswith("s4q11") or \
             column.startswith("s4q12"):
            group = "mechanization"

        elif column.startswith("s4q13") or \
             column.startswith("s4q14") or \
             column.startswith("s4q15") or \
             column.startswith("s4q16") or \
             column.startswith("s4q17") or \
             column.startswith("s4q18"):
            group = "irrigation"

        elif column.startswith("s4q"):
            group = "soil_erosion_land"

        elif column.startswith("s2q24") or \
             column.startswith("s2q4") or \
             column.startswith("s2q41") or \
             column.startswith("s2q42") or \
             column.startswith("s2q43") or \
             column.startswith("s2q44") or \
             column.startswith("s2q45") or \
             column.startswith("s2q46") or \
             column.startswith("s2q47") or \
             column.startswith("s2q48") or \
             column.startswith("s2q49") or \
             column.startswith("s2q50"):
            group = "risk_loss"

        elif column in [
            "Yield",
            "Harvested_Crop_Area_ha",
        ]:
            group = "outcome"

        else:
            group = "other"

        registry.append({
            "feature": column,
            "group": group,
            "dtype": str(result[column].dtype),
            "missing_count": int(result[column].isna().sum()),
            "missing_percent": round(
                result[column].isna().mean() * 100,
                2
            ),
            "unique_values": int(
                result[column].nunique(dropna=True)
            ),
        })

    registry_df = pd.DataFrame(registry)

    registry_df.to_csv(
        REGISTRY_FILE,
        index=False
    )


    # ========================================================
    # FINAL VALIDATION
    # ========================================================

    print("\nFeature registry:")
    print(REGISTRY_FILE)

    print(
        f"\nRegistry rows: "
        f"{len(registry_df):,}"
    )

    print("\nFinal columns:")

    for i, column in enumerate(result.columns, start=1):
        print(f"{i:3}. {column}")

    print("\n" + "=" * 80)
    print("DONE")
    print("=" * 80)


if __name__ == "__main__":
    main()