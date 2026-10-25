from pathlib import Path
from typing import Optional

import pandas as pd



# PATHS


BASE_DIR = Path(__file__).resolve().parents[3]

DATA_PATH = (
    BASE_DIR
    / "data"
    / "agrisystem"
    / "agriculture_features_v2.csv"
)



# CONFIGURATION


CROP_COLUMN = "s2q4"
CATEGORY_COLUMN = "CropCategory"

DISTRICT_COLUMN = "s1q2"
SEASON_COLUMN = "season"

IRRIGATION_COLUMN = "s4q13"
EROSION_COLUMN = "s4q1"
LAND_CONSOLIDATION_COLUMN = "s4q6"

PLOT_AREA_COLUMN = "s2q2"



# DATA LOADING


def load_data() -> pd.DataFrame:
    """
    Load the agriculture feature dataset.

    The dataset is read-only.
    This function does not modify or overwrite the CSV.
    """

    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found:\n{DATA_PATH}"
        )

    df = pd.read_csv(
        DATA_PATH,
        low_memory=False
    )

    required_columns = [
        CROP_COLUMN,
        CATEGORY_COLUMN,
        DISTRICT_COLUMN,
        SEASON_COLUMN,
        IRRIGATION_COLUMN,
        EROSION_COLUMN,
        LAND_CONSOLIDATION_COLUMN,
        PLOT_AREA_COLUMN,
    ]

    missing = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            "Missing required columns:\n"
            + "\n".join(f"- {column}" for column in missing)
        )

    return df



# VALUE NORMALIZATION


def normalize_value(value) -> str:
    """
    Convert values to a comparable string representation.
    """

    if pd.isna(value):
        return ""

    return str(value).strip().lower()



# FILTER HELPERS


def apply_exact_filter(
    df: pd.DataFrame,
    column: str,
    value
) -> pd.DataFrame:
    """
    Apply an exact case-insensitive filter.
    """

    if value is None:
        return df

    target = normalize_value(value)

    if target == "":
        return df

    mask = (
        df[column]
        .fillna("")
        .astype(str)
        .str.strip()
        .str.lower()
        == target
    )

    return df[mask]


def filter_by_context(
    df: pd.DataFrame,
    district: Optional[str] = None,
    season: Optional[str] = None,
    irrigation: Optional[str] = None,
    erosion: Optional[str] = None,
    land_consolidation: Optional[str] = None,
) -> pd.DataFrame:

    result = df.copy()

    # 
    # Required context
    # 

    if district is not None:
        result = apply_exact_filter(
            result,
            DISTRICT_COLUMN,
            district
        )

    if season is not None:
        result = apply_exact_filter(
            result,
            SEASON_COLUMN,
            season
        )

    # 
    # Optional context
    # 

    if irrigation is not None:
        result = apply_exact_filter(
            result,
            IRRIGATION_COLUMN,
            irrigation
        )

    if erosion is not None:
        result = apply_exact_filter(
            result,
            EROSION_COLUMN,
            erosion
        )

    if land_consolidation is not None:
        result = apply_exact_filter(
            result,
            LAND_CONSOLIDATION_COLUMN,
            land_consolidation
        )

    return result



# PLOT AREA MATCHING


def calculate_area_similarity(
    df: pd.DataFrame,
    target_area: Optional[float]
) -> pd.Series:

    if target_area is None:
        return pd.Series(
            1.0,
            index=df.index
        )

    areas = pd.to_numeric(
        df[PLOT_AREA_COLUMN],
        errors="coerce"
    )

    # Avoid division by zero.
    denominator = max(abs(float(target_area)), 0.01)

    difference = abs(areas - float(target_area))

    similarity = 1 - (
        difference / denominator
    )

    return similarity.clip(
        lower=0.0,
        upper=1.0
    ).fillna(0.0)



# CROP RANKING


def rank_crops(
    df: pd.DataFrame,
    target_area: Optional[float] = None,
) -> pd.DataFrame:

    if df.empty:
        return pd.DataFrame()

    working = df.copy()

    
    # Area similarity
    

    working["_area_similarity"] = calculate_area_similarity(
        working,
        target_area
    )

    
    # Crop statistics
    

    grouped = (
        working
        .groupby(
            [CROP_COLUMN, CATEGORY_COLUMN],
            dropna=False
        )
        .agg(
            historical_count=(CROP_COLUMN, "size"),
            area_similarity=(
                "_area_similarity",
                "mean"
            )
        )
        .reset_index()
    )

    
    # Historical frequency
    

    total = grouped["historical_count"].sum()

    if total == 0:
        return pd.DataFrame()

    grouped["historical_frequency"] = (
        grouped["historical_count"] / total
    )

    
    # Normalize frequency to 0-1
    

    max_frequency = grouped[
        "historical_frequency"
    ].max()

    if max_frequency > 0:
        grouped["frequency_score"] = (
            grouped["historical_frequency"]
            / max_frequency
        )
    else:
        grouped["frequency_score"] = 0.0

    
    # Final score
    #
    # 80% historical frequency
    # 20% plot-area similarity
    

    grouped["recommendation_score"] = (
        0.80 * grouped["frequency_score"]
        + 0.20 * grouped["area_similarity"]
    )

    
    # Sort
    

    grouped = grouped.sort_values(
        by=[
            "recommendation_score",
            "historical_count",
        ],
        ascending=False
    )

    grouped = grouped.reset_index(drop=True)

    return grouped



# MAIN RECOMMENDER


def recommend_crops(
    district: str,
    season: str,
    irrigation: Optional[str] = None,
    erosion: Optional[str] = None,
    land_consolidation: Optional[str] = None,
    plot_area: Optional[float] = None,
    top_n: int = 5,
) -> pd.DataFrame:

    df = load_data()

    
    # STEP 1: District + Season
    

    base_context = filter_by_context(
        df=df,
        district=district,
        season=season,
    )

    if base_context.empty:
        return pd.DataFrame()

    
    # STEP 2: Add optional agricultural conditions
    

    contextual = filter_by_context(
        df=base_context,
        irrigation=irrigation,
        erosion=erosion,
        land_consolidation=land_consolidation,
    )

    
    # STEP 3: If the exact context is too small,
    # gradually relax optional conditions.
    

    if len(contextual) < 20:

        contextual = filter_by_context(
            df=base_context,
            irrigation=irrigation,
            erosion=erosion,
        )

    if len(contextual) < 20:

        contextual = filter_by_context(
            df=base_context,
            irrigation=irrigation,
        )

    if len(contextual) < 20:

        contextual = base_context

    
    # STEP 4: Rank crops
    

    ranked = rank_crops(
        contextual,
        target_area=plot_area
    )

    if ranked.empty:
        return ranked

    
    # STEP 5: Keep Top N
    

    return ranked.head(top_n)



# PRINT RECOMMENDATIONS


def print_recommendations(
    results: pd.DataFrame,
    district: str,
    season: str,
):

    print("\n")
    print("=" * 70)
    print("RWANDA AGRISYSTEM - HISTORICAL CROP RECOMMENDATION")
    print("=" * 70)

    print(f"District : {district}")
    print(f"Season   : {season}")

    if results.empty:
        print("\nNo historical observations matched the given context.")
        return

    print(
        f"\nHistorical observations used: "
        f"{results['historical_count'].sum():,}"
    )

    print("\nTOP RECOMMENDATIONS")
    print("-" * 70)

    for index, row in results.iterrows():

        rank = index + 1

        crop = row[CROP_COLUMN]
        category = row[CATEGORY_COLUMN]

        count = int(
            row["historical_count"]
        )

        frequency = (
            row["historical_frequency"] * 100
        )

        score = (
            row["recommendation_score"] * 100
        )

        print(
            f"{rank}. {crop}"
        )

        print(
            f"   Category              : {category}"
        )

        print(
            f"   Historical observations: {count:,}"
        )

        print(
            f"   Historical frequency   : "
            f"{frequency:.2f}%"
        )

        print(
            f"   Recommendation score   : "
            f"{score:.2f}"
        )

        print()



# TEST


if __name__ == "__main__":

    
    # Example farmer input
    

    district = "Nyagatare"
    season = "Season C"

    irrigation = "Yes"
    erosion = "High"
    land_consolidation = "Yes"

    plot_area = 0.8

    
    # Generate recommendations
    

    results = recommend_crops(
        district=district,
        season=season,
        irrigation=irrigation,
        erosion=erosion,
        land_consolidation=land_consolidation,
        plot_area=plot_area,
        top_n=5,
    )

    
    # Display
    

    print_recommendations(
        results,
        district=district,
        season=season,
    )