from pathlib import Path
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

ORIGINAL_FILE = (
    PROJECT_ROOT
    / "data"
    / "all_data"
    / "all_seasons_cleaned_merged.csv"
)

FEATURE_FILE = (
    PROJECT_ROOT
    / "data"
    / "agrisystem"
    / "agriculture_features_v2.csv"
)


def main():

    print("=" * 80)
    print("AGRISYSTEM - ADD SEGMENT_ID")
    print("=" * 80)

    print("\nLoading original dataset...")
    original = pd.read_csv(
        ORIGINAL_FILE,
        low_memory=False
    )

    print(
        f"Original: "
        f"{original.shape[0]:,} rows × "
        f"{original.shape[1]:,} columns"
    )

    if "Segment_ID" not in original.columns:
        raise ValueError(
            "Segment_ID was not found in the original dataset."
        )

    print("\nLoading agriculture_features_v2...")
    features = pd.read_csv(
        FEATURE_FILE,
        low_memory=False
    )

    print(
        f"V2 before: "
        f"{features.shape[0]:,} rows × "
        f"{features.shape[1]:,} columns"
    )

    if len(original) != len(features):
        raise ValueError(
            "Row counts do not match between original dataset and V2."
        )

    if "Segment_ID" in features.columns:
        print("\nSegment_ID already exists. Nothing to change.")
        return

    # Preserve the exact original row order.
    features.insert(
        0,
        "Segment_ID",
        original["Segment_ID"].values
    )

    features.to_csv(
        FEATURE_FILE,
        index=False
    )

    print("\nSegment_ID added successfully.")

    print(
        f"V2 after: "
        f"{features.shape[0]:,} rows × "
        f"{features.shape[1]:,} columns"
    )

    print("\nSegment_ID unique values:")
    print(features["Segment_ID"].nunique())

    print("\nMissing Segment_ID:")
    print(features["Segment_ID"].isna().sum())

    print("\n" + "=" * 80)
    print("DONE")
    print("=" * 80)


if __name__ == "__main__":
    main()