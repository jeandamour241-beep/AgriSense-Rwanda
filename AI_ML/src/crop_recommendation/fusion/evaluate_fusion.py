from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import GroupShuffleSplit



# CONFIG


RANDOM_STATE = 42
TEST_SIZE = 0.20

TOP_K = [1, 3, 5]

WEIGHT_CONFIGS = {
    "A_50_30_20": {
        "historical": 0.50,
        "exact_ml": 0.30,
        "category_ml": 0.20,
    },
    "B_40_40_20": {
        "historical": 0.40,
        "exact_ml": 0.40,
        "category_ml": 0.20,
    },
    "C_40_30_30": {
        "historical": 0.40,
        "exact_ml": 0.30,
        "category_ml": 0.30,
    },
    "D_60_25_15": {
        "historical": 0.60,
        "exact_ml": 0.25,
        "category_ml": 0.15,
    },
}



# PATHS


BASE_DIR = Path(__file__).resolve().parents[3]

DATA_PATH = (
    BASE_DIR
    / "data"
    / "agrisystem"
    / "agriculture_features_v2.csv"
)

MODEL_DIR = (
    BASE_DIR
    / "src"
    / "crop_recommendation"
    / "models"
)

OUTPUT_DIR = (
    BASE_DIR
    / "src"
    / "crop_recommendation"
    / "fusion"
)



# LOAD DATA


print("=" * 80)
print("RWANDA AGRISYSTEM - FUSION EVALUATION")
print("=" * 80)

print("\nLoading dataset...")

df = pd.read_csv(
    DATA_PATH,
    low_memory=False
)

print(
    f"Dataset shape: {df.shape}"
)



# LOAD MODELS


print("\nLoading models...")

exact_artifact = joblib.load(
    MODEL_DIR
    / "crop_recommendation_model.joblib"
)

category_artifact = joblib.load(
    MODEL_DIR
    / "crop_category_model.joblib"
)

exact_model = exact_artifact["model"]
exact_features = exact_artifact["features"]

category_model = category_artifact["model"]
category_features = category_artifact["features"]

print("Exact crop model loaded.")
print("Category model loaded.")



# VALIDATE REQUIRED COLUMNS


required_columns = set(
    exact_features
    + category_features
    + [
        "Segment_ID",
        "s2q4",
        "CropCategory",
        "s1q2",
        "season",
        "s4q13",
        "s4q1",
        "s4q6",
        "s2q2",
    ]
)

missing = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing:
    raise ValueError(
        f"Missing required columns: {missing}"
    )



# GROUP SPLIT


print("\n" + "=" * 80)
print("GROUP SPLIT")
print("=" * 80)

splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=TEST_SIZE,
    random_state=RANDOM_STATE
)

train_idx, test_idx = next(
    splitter.split(
        df,
        groups=df["Segment_ID"]
    )
)

train_df = df.iloc[train_idx].copy()
test_df = df.iloc[test_idx].copy()

train_groups = set(
    train_df["Segment_ID"]
)

test_groups = set(
    test_df["Segment_ID"]
)

overlap = train_groups.intersection(
    test_groups
)

print(
    f"Train rows: {len(train_df):,}"
)

print(
    f"Test rows:  {len(test_df):,}"
)

print(
    f"Train groups: {len(train_groups):,}"
)

print(
    f"Test groups:  {len(test_groups):,}"
)

print(
    f"Group overlap: {len(overlap)}"
)

if overlap:
    raise RuntimeError(
        "Group leakage detected!"
    )



# HISTORICAL STATISTICS
# IMPORTANT:
# ONLY TRAIN DATA IS USED


print("\nBuilding historical crop statistics from TRAIN data...")

historical_counts = (
    train_df
    .groupby(
        [
            "s1q2",
            "season",
            "s4q13",
            "s4q1",
            "s4q6",
            "s2q4",
            "CropCategory",
        ],
        dropna=True
    )
    .size()
    .reset_index(
        name="count"
    )
)



# HELPER: HISTORICAL SCORE


def get_historical_scores(row):

    district = row["s1q2"]
    season = row["season"]
    irrigation = row["s4q13"]
    erosion = row["s4q1"]
    consolidation = row["s4q6"]

    filtered = historical_counts.copy()

    
    # Same district + season
    

    filtered = filtered[
        (filtered["s1q2"].astype(str) == str(district))
        &
        (filtered["season"].astype(str) == str(season))
    ]

    if len(filtered) == 0:
        return {}

    
    # Try progressively relaxed conditions
    

    filter_levels = [
        ["s4q13", "s4q1", "s4q6"],
        ["s4q13", "s4q1"],
        ["s4q13"],
        [],
    ]

    selected = None

    values = {
        "s4q13": irrigation,
        "s4q1": erosion,
        "s4q6": consolidation,
    }

    for level in filter_levels:

        candidate = filtered.copy()

        for column in level:

            value = values[column]

            candidate = candidate[
                candidate[column].astype(str)
                == str(value)
            ]

        total_observations = candidate["count"].sum()

        if total_observations >= 20:

            selected = candidate
            break

    if selected is None:

        selected = filtered

    if len(selected) == 0:
        return {}

    
    # Calculate frequency
    

    total = selected["count"].sum()

    selected = selected.copy()

    selected["frequency"] = (
        selected["count"] / total
    )

    max_frequency = selected["frequency"].max()

    if max_frequency > 0:

        selected["historical_score"] = (
            selected["frequency"]
            / max_frequency
        )

    else:

        selected["historical_score"] = 0.0

    result = {}

    for _, item in selected.iterrows():

        crop = item["s2q4"]

        result[crop] = {
            "historical_score":
                float(item["historical_score"]),

            "historical_frequency":
                float(item["frequency"]),

            "historical_count":
                int(item["count"]),

            "category":
                item["CropCategory"],
        }

    return result



# MODEL PROBABILITIES


print("\nGenerating ML predictions for test set...")

X_exact = test_df[
    exact_features
]

X_category = test_df[
    category_features
]

exact_probabilities = (
    exact_model
    .predict_proba(X_exact)
)

category_probabilities = (
    category_model
    .predict_proba(X_category)
)

exact_classes = (
    exact_model
    .named_steps["classifier"]
    .classes_
)

category_classes = (
    category_model
    .named_steps["model"]
    .classes_
)

print(
    f"Exact crop classes: {len(exact_classes)}"
)

print(
    f"Category classes: {len(category_classes)}"
)



# CATEGORY LOOKUP


crop_to_category = (
    df[
        ["s2q4", "CropCategory"]
    ]
    .dropna()
    .drop_duplicates(
        subset=["s2q4"]
    )
    .set_index("s2q4")[
        "CropCategory"
    ]
    .to_dict()
)



# EVALUATION


print("\n" + "=" * 80)
print("EVALUATING FUSION CONFIGURATIONS")
print("=" * 80)


results = []

num_test_rows = len(test_df)


for config_name, weights in WEIGHT_CONFIGS.items():

    print(
        f"\nEvaluating {config_name}..."
    )

    hits = {
        1: 0,
        3: 0,
        5: 0,
    }

    evaluated_rows = 0

    for i in range(num_test_rows):

        row = test_df.iloc[i]

        actual_crop = row["s2q4"]

        if pd.isna(actual_crop):
            continue

        # ----------------------------------------------------
        # Exact ML probabilities
        # ----------------------------------------------------

        exact_map = {
            crop: float(prob)
            for crop, prob
            in zip(
                exact_classes,
                exact_probabilities[i]
            )
        }

        # ----------------------------------------------------
        # Category ML probabilities
        # ----------------------------------------------------

        category_map = {
            category: float(prob)
            for category, prob
            in zip(
                category_classes,
                category_probabilities[i]
            )
        }

        # ----------------------------------------------------
        # Historical scores
        # ----------------------------------------------------

        historical_map = (
            get_historical_scores(row)
        )

        # ----------------------------------------------------
        # Candidate crops
        # ----------------------------------------------------

        candidates = set(
            exact_classes
        )

        candidates.update(
            historical_map.keys()
        )

        # ----------------------------------------------------
        # Calculate fusion score
        # ----------------------------------------------------

        scored = []

        for crop in candidates:

            exact_score = exact_map.get(
                crop,
                0.0
            )

            category = crop_to_category.get(
                crop
            )

            category_score = (
                category_map.get(
                    category,
                    0.0
                )
            )

            historical_info = (
                historical_map.get(
                    crop
                )
            )

            if historical_info:

                historical_score = (
                    historical_info[
                        "historical_score"
                    ]
                )

            else:

                historical_score = 0.0

            fusion_score = (

                weights["historical"]
                * historical_score

                +

                weights["exact_ml"]
                * exact_score

                +

                weights["category_ml"]
                * category_score
            )

            scored.append(
                (
                    crop,
                    fusion_score
                )
            )

        # ----------------------------------------------------
        # Sort
        # ----------------------------------------------------

        scored.sort(
            key=lambda x: x[1],
            reverse=True
        )

        ranked_crops = [
            crop
            for crop, score
            in scored
        ]

        evaluated_rows += 1

        # ----------------------------------------------------
        # Top-K accuracy
        # ----------------------------------------------------

        for k in TOP_K:

            top_k = ranked_crops[:k]

            if actual_crop in top_k:

                hits[k] += 1

    # ========================================================
    # METRICS
    # ========================================================

    metrics = {

        "configuration":
            config_name,

        "historical_weight":
            weights["historical"],

        "exact_ml_weight":
            weights["exact_ml"],

        "category_ml_weight":
            weights["category_ml"],

        "evaluated_rows":
            evaluated_rows,

        "top_1_accuracy":
            hits[1] / evaluated_rows
            if evaluated_rows
            else 0.0,

        "top_3_accuracy":
            hits[3] / evaluated_rows
            if evaluated_rows
            else 0.0,

        "top_5_accuracy":
            hits[5] / evaluated_rows
            if evaluated_rows
            else 0.0,
    }

    results.append(metrics)

    print(
        f"  Top-1: "
        f"{metrics['top_1_accuracy']:.4f}"
    )

    print(
        f"  Top-3: "
        f"{metrics['top_3_accuracy']:.4f}"
    )

    print(
        f"  Top-5: "
        f"{metrics['top_5_accuracy']:.4f}"
    )



# RESULTS TABLE


results_df = pd.DataFrame(
    results
)

results_df = results_df.sort_values(
    "top_3_accuracy",
    ascending=False
)

print("\n" + "=" * 80)
print("FINAL FUSION EVALUATION")
print("=" * 80)

print(
    results_df[
        [
            "configuration",
            "historical_weight",
            "exact_ml_weight",
            "category_ml_weight",
            "top_1_accuracy",
            "top_3_accuracy",
            "top_5_accuracy",
        ]
    ].to_string(
        index=False
    )
)



# SAVE RESULTS


output_path = (
    OUTPUT_DIR
    / "fusion_evaluation_results.csv"
)

results_df.to_csv(
    output_path,
    index=False
)

print("\nResults saved to:")
print(output_path)

print("\nEvaluation complete.")
