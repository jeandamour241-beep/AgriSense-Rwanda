from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder



# PROJECT PATHS


PROJECT_ROOT = Path(__file__).resolve().parents[3]

DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "agrisystem"
    / "agriculture_features_v2.csv"
)

MODEL_DIR = (
    PROJECT_ROOT
    / "src"
    / "pest_disease"
    / "models"
)

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True,
)



# CONFIGURATION


TARGET_SOURCE = "s2q42"
TARGET_COLUMN = "pest_disease_risk"

GROUP_COLUMN = "Segment_ID"

RANDOM_STATE = 42



# V3 FEATURES

#
# These are contextual / potentially available predictors.
#
# IMPORTANT:
# We intentionally DO NOT use:
#
# s2q41 - s2q50
# s2q24_d
# s2q24_disease
# s3q18
# s3q19
# Yield
# Harvested_Crop_Area_ha
# s4q14
#
# because they can represent damage, losses, treatment,
# production outcome, or historical management outcomes.


FEATURES = [

    
    # LOCATION
    

    "s1q1",       # Province
    "s1q2",       # District
    "s1q3",       # Stratum / land type


    
    # SEASON
    

    "season",


    
    # CROP / PLANTING INFORMATION
    

    "s2q2",       # Plot area
    "s2q4",       # Crop
    "s2q7",       # Sowing period
    "s2q11",      # Seed type


    
    # FERTILIZER CONTEXT
    

    "s3q1",
    "s3q7",
    "s3q8",
    "s3q9",


    
    # FIELD / LAND CONDITIONS
    

    "s4q1",
    "s4q2",
    "s4q3",
    "s4q4",
    "s4q6",
    "s4q8",


    
    # IRRIGATION CONTEXT
    

    "s4q13",
]



# LOAD DATA


print("=" * 80)
print("PEST / DISEASE EARLY WARNING - V3")
print("=" * 80)

print("\nLoading dataset...")

df = pd.read_csv(
    DATA_PATH,
    low_memory=False,
)

print(f"Dataset shape: {df.shape}")



# CHECK REQUIRED COLUMNS


required_columns = (
    FEATURES
    + [
        TARGET_SOURCE,
        GROUP_COLUMN,
    ]
)

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:

    print("\nERROR: Missing columns:")

    for column in missing_columns:
        print(f"  - {column}")

    raise ValueError(
        "Some required columns are missing from the dataset."
    )



# CREATE TARGET


print("\nCreating pest/disease target...")

# Remove rows where target is missing
df = df[
    df[TARGET_SOURCE].notna()
].copy()

# Convert target source safely to numeric
target_numeric = pd.to_numeric(
    df[TARGET_SOURCE],
    errors="coerce",
)

# Remove rows that could not be converted
valid_target = target_numeric.notna()

df = df.loc[
    valid_target
].copy()

target_numeric = target_numeric.loc[
    valid_target
]

# Binary target:
# 0 = no insect/pest damage
# 1 = insect/pest damage
df[TARGET_COLUMN] = (
    target_numeric > 0
).astype(int)



# TARGET DISTRIBUTION


print("\nTarget distribution:")

target_counts = (
    df[TARGET_COLUMN]
    .value_counts()
    .sort_index()
)

for label, count in target_counts.items():

    percentage = (
        count / len(df)
    ) * 100

    print(
        f"{label} - "
        f"{count:,} "
        f"({percentage:.2f}%)"
    )


positive_rate = df[
    TARGET_COLUMN
].mean()

print(
    f"\nPositive rate: "
    f"{positive_rate:.4%}"
)



# PREPARE X / y / GROUPS


X = df[
    FEATURES
].copy()

y = df[
    TARGET_COLUMN
].copy()

groups = df[
    GROUP_COLUMN
].copy()



# SHOW RAW FEATURE TYPES


print("\n" + "=" * 80)
print("RAW FEATURE TYPES")
print("=" * 80)

for feature in FEATURES:

    dtype = X[feature].dtype

    print(
        f"{feature:<20} "
        f"dtype={str(dtype):<15} "
        f"unique={X[feature].nunique(dropna=True):>6}"
    )



# GROUP SPLIT


print("\n" + "=" * 80)
print("GROUP SPLIT")
print("=" * 80)

splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=0.20,
    random_state=RANDOM_STATE,
)

train_idx, test_idx = next(
    splitter.split(
        X,
        y,
        groups=groups,
    )
)


X_train = X.iloc[
    train_idx
].copy()

X_test = X.iloc[
    test_idx
].copy()

y_train = y.iloc[
    train_idx
].copy()

y_test = y.iloc[
    test_idx
].copy()

groups_train = groups.iloc[
    train_idx
]

groups_test = groups.iloc[
    test_idx
]


print(
    f"Train rows: {len(X_train):,}"
)

print(
    f"Test rows:  {len(X_test):,}"
)

print(
    f"Train groups: "
    f"{groups_train.nunique():,}"
)

print(
    f"Test groups:  "
    f"{groups_test.nunique():,}"
)


group_overlap = (
    set(groups_train)
    .intersection(
        set(groups_test)
    )
)

print(
    f"Group overlap: "
    f"{len(group_overlap)}"
)


if len(group_overlap) > 0:

    raise ValueError(
        "Group leakage detected!"
    )



# CORRECT FEATURE TYPE DETECTION

#
# IMPORTANT:
# Do NOT use:
#
#     X[column].dtype == "object"
#
# because pandas may use StringDtype / other extension
# dtypes for string columns.
#
# Instead use sklearn-compatible dtype detection.


numeric_features = [
    feature
    for feature in FEATURES
    if pd.api.types.is_numeric_dtype(
        X[feature]
    )
]

categorical_features = [
    feature
    for feature in FEATURES
    if not pd.api.types.is_numeric_dtype(
        X[feature]
    )
]


print("\n" + "=" * 80)
print("FEATURE TYPES")
print("=" * 80)

print("\nCategorical features:")

for feature in categorical_features:

    print(
        f"  - {feature}"
    )


print("\nNumeric features:")

for feature in numeric_features:

    print(
        f"  - {feature}"
    )


print(
    f"\nTotal categorical: "
    f"{len(categorical_features)}"
)

print(
    f"Total numeric: "
    f"{len(numeric_features)}"
)



# PREPROCESSING


# Numeric:
# missing values -> median

numeric_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(
                strategy="median"
            ),
        ),
    ]
)


# Categorical:
# missing values -> most frequent
# strings -> one-hot encoded

categorical_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(
                strategy="most_frequent"
            ),
        ),
        (
            "onehot",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=True,
            ),
        ),
    ]
)


preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            numeric_pipeline,
            numeric_features,
        ),
        (
            "categorical",
            categorical_pipeline,
            categorical_features,
        ),
    ],
    remainder="drop",
)



# MODELS


models = {

    
    # LOGISTIC REGRESSION
    

    "LOGISTIC_REGRESSION": LogisticRegression(
        max_iter=2000,
        class_weight="balanced",
        C=0.5,
        solver="liblinear",
        random_state=RANDOM_STATE,
    ),


    
    # RANDOM FOREST
    

    "RANDOM_FOREST": RandomForestClassifier(
        n_estimators=600,
        min_samples_split=4,
        min_samples_leaf=2,
        max_features="sqrt",
        class_weight="balanced",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    ),
}



# TRAINING


results = []

trained_models = {}


for model_name, model in models.items():

    print("\n" + "=" * 80)
    print(model_name)
    print("=" * 80)

    pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                preprocessor,
            ),
            (
                "model",
                model,
            ),
        ]
    )

    print("\nTraining...")

    pipeline.fit(
        X_train,
        y_train,
    )

    print("Training complete.")


    
    # PROBABILITIES
    

    probabilities = (
        pipeline
        .predict_proba(X_test)
        [:, 1]
    )


    
    # DEFAULT THRESHOLD
    

    predictions = (
        probabilities >= 0.50
    ).astype(int)


    
    # METRICS
    

    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    balanced_accuracy = (
        balanced_accuracy_score(
            y_test,
            predictions,
        )
    )

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0,
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0,
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0,
    )

    roc_auc = roc_auc_score(
        y_test,
        probabilities,
    )

    pr_auc = average_precision_score(
        y_test,
        probabilities,
    )

    matrix = confusion_matrix(
        y_test,
        predictions,
    )


    
    # PRINT METRICS
    

    print("\nMetrics:")

    print(
        f"Accuracy:           "
        f"{accuracy:.4f}"
    )

    print(
        f"Balanced Accuracy: "
        f"{balanced_accuracy:.4f}"
    )

    print(
        f"Precision:          "
        f"{precision:.4f}"
    )

    print(
        f"Recall:             "
        f"{recall:.4f}"
    )

    print(
        f"F1:                 "
        f"{f1:.4f}"
    )

    print(
        f"ROC-AUC:            "
        f"{roc_auc:.4f}"
    )

    print(
        f"PR-AUC:             "
        f"{pr_auc:.4f}"
    )


    print("\nConfusion Matrix:")

    print(matrix)


    
    # SAVE RESULT
    

    results.append(
        {
            "model": model_name,
            "accuracy": accuracy,
            "balanced_accuracy": balanced_accuracy,
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "roc_auc": roc_auc,
            "pr_auc": pr_auc,
        }
    )


    trained_models[
        model_name
    ] = {
        "pipeline": pipeline,
        "probabilities": probabilities,
    }



# MODEL COMPARISON


print("\n" + "=" * 80)
print("MODEL COMPARISON")
print("=" * 80)

results_df = pd.DataFrame(
    results
)

print(
    results_df.to_string(
        index=False
    )
)



# SELECT BEST MODEL

#
# Because the positive class is only 8.16%, PR-AUC is a
# particularly useful metric for model selection.


best_row = (
    results_df
    .sort_values(
        by="pr_auc",
        ascending=False,
    )
    .iloc[0]
)

best_model_name = (
    best_row["model"]
)

best_pipeline = (
    trained_models[
        best_model_name
    ]["pipeline"]
)

best_probabilities = (
    trained_models[
        best_model_name
    ]["probabilities"]
)


print(
    f"\nBest model by PR-AUC: "
    f"{best_model_name}"
)

print(
    f"Best ROC-AUC: "
    f"{best_row['roc_auc']:.4f}"
)

print(
    f"Best PR-AUC: "
    f"{best_row['pr_auc']:.4f}"
)



# THRESHOLD ANALYSIS


print("\n" + "=" * 80)
print("THRESHOLD ANALYSIS")
print("=" * 80)


threshold_results = []


thresholds = np.arange(
    0.10,
    0.71,
    0.05,
)


for threshold in thresholds:

    threshold = round(
        float(threshold),
        2,
    )

    predictions = (
        best_probabilities
        >= threshold
    ).astype(int)


    precision = precision_score(
        y_test,
        predictions,
        zero_division=0,
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0,
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0,
    )


    threshold_results.append(
        {
            "threshold": threshold,
            "precision": precision,
            "recall": recall,
            "f1": f1,
        }
    )


    print(
        f"Threshold {threshold:.2f} | "
        f"Precision={precision:.4f} | "
        f"Recall={recall:.4f} | "
        f"F1={f1:.4f}"
    )


threshold_df = pd.DataFrame(
    threshold_results
)



# SELECT BEST THRESHOLD


best_threshold_row = (
    threshold_df
    .sort_values(
        by="f1",
        ascending=False,
    )
    .iloc[0]
)


best_threshold = float(
    best_threshold_row[
        "threshold"
    ]
)


print("\n" + "=" * 80)
print("SELECTED THRESHOLD")
print("=" * 80)

print(
    f"Threshold: "
    f"{best_threshold:.2f}"
)

print(
    f"Precision: "
    f"{best_threshold_row['precision']:.4f}"
)

print(
    f"Recall: "
    f"{best_threshold_row['recall']:.4f}"
)

print(
    f"F1: "
    f"{best_threshold_row['f1']:.4f}"
)



# SAVE MODEL ARTIFACT


artifact = {

    "model": best_pipeline,

    "features": FEATURES,

    "numeric_features": numeric_features,

    "categorical_features": categorical_features,

    "target_source": TARGET_SOURCE,

    "target_column": TARGET_COLUMN,

    "target_definition": (
        "1 if s2q42 > 0, otherwise 0"
    ),

    "group_column": GROUP_COLUMN,

    "decision_threshold": best_threshold,

    "model_name": best_model_name,

    "metrics": results_df.to_dict(
        orient="records"
    ),

    "threshold_results": (
        threshold_df.to_dict(
            orient="records"
        )
    ),

    "train_rows": len(X_train),

    "test_rows": len(X_test),

    "train_groups": (
        groups_train.nunique()
    ),

    "test_groups": (
        groups_test.nunique()
    ),

    "group_overlap": len(
        group_overlap
    ),

    "excluded_features": [

        # Direct target
        "s2q42",

        # Production-loss variables
        "s2q41",
        "s2q43",
        "s2q44",
        "s2q45",
        "s2q46",
        "s2q47",
        "s2q48",
        "s2q49",
        "s2q50",

        # Other outcome variables
        "Yield",
        "Harvested_Crop_Area_ha",

        # Disease/pest outcome descriptions
        "s2q24_d",
        "s2q24_disease",

        # Pesticide / treatment response
        "s3q18",
        "s3q19",

        # Historical irrigation outcome
        "s4q14",
    ],
}


MODEL_PATH = (
    MODEL_DIR
    / "pest_disease_early_warning_v3.joblib"
)


joblib.dump(
    artifact,
    MODEL_PATH,
)



# SAVE EVALUATION RESULTS


RESULTS_PATH = (
    MODEL_DIR
    / "pest_disease_v3_results.csv"
)

results_df.to_csv(
    RESULTS_PATH,
    index=False,
)


THRESHOLD_PATH = (
    MODEL_DIR
    / "pest_disease_v3_thresholds.csv"
)

threshold_df.to_csv(
    THRESHOLD_PATH,
    index=False,
)



# FINAL OUTPUT


print("\n" + "=" * 80)
print("V3 TRAINING COMPLETE")
print("=" * 80)

print(
    f"\nModel:"
)

print(
    MODEL_PATH
)

print(
    f"\nResults:"
)

print(
    RESULTS_PATH
)

print(
    f"\nThreshold results:"
)

print(
    THRESHOLD_PATH
)

print(
    "\nFinal model:"
)

print(
    best_model_name
)

print(
    f"Decision threshold: "
    f"{best_threshold:.2f}"
)

print("\nDone.")
