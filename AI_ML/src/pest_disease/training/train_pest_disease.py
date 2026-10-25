from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    ExtraTreesClassifier,
    RandomForestClassifier,
)
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder



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
    / "pest_disease"
    / "models"
)

MODEL_PATH = (
    MODEL_DIR
    / "pest_disease_early_warning_model.joblib"
)



# CONFIGURATION


TARGET_SOURCE = "s2q42"
TARGET = "pest_disease_risk"

GROUP_COLUMN = "Segment_ID"

FEATURES = [
    # Location / context
    "s1q1",
    "s1q2",
    "s1q3",

    # Agricultural season
    "season",

    # Plot / crop information
    "s2q2",
    "s2q4",
    "s2q7",
    "s2q11",

    # Field conditions
    "s4q1",
    "s4q6",
]


# LOAD DATA

print("=" * 80)
print("IMPROVED CROP PEST / DISEASE EARLY WARNING TRAINING")
print("=" * 80)

print("\nLoading dataset...")

df = pd.read_csv(
    DATA_PATH,
    low_memory=False,
)

print(
    f"Dataset shape: {df.shape}"
)


# CHECK COLUMNS

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
    raise ValueError(
        f"Missing required columns: {missing_columns}"
    )


# CREATE TARGET

print("\nCreating pest/disease target...")

df[TARGET_SOURCE] = pd.to_numeric(
    df[TARGET_SOURCE],
    errors="coerce",
)


# Remove missing target values
df = df[
    df[TARGET_SOURCE].notna()
].copy()


# Pest damage > 0 = positive class
df[TARGET] = (
    df[TARGET_SOURCE] > 0
).astype(int)


# TARGET DISTRIBUTION

print("\nTarget distribution:")

target_counts = (
    df[TARGET]
    .value_counts()
    .sort_index()
)

for target_value, count in target_counts.items():

    percentage = (
        count / len(df) * 100
    )

    if target_value == 0:
        label = "NO PEST/DAMAGE"
    else:
        label = "PEST/DAMAGE RISK"

    print(
        f"{target_value} - {label}: "
        f"{count:,} "
        f"({percentage:.2f}%)"
    )


# FEATURES / TARGET / GROUPS

X = df[FEATURES].copy()

y = df[TARGET].copy()

groups = df[GROUP_COLUMN].copy()



# GROUP SPLIT


print("\n" + "=" * 80)
print("GROUP SPLIT")
print("=" * 80)

splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=0.20,
    random_state=42,
)

train_idx, test_idx = next(
    splitter.split(
        X,
        y,
        groups=groups,
    )
)


X_train = X.iloc[train_idx].copy()
X_test = X.iloc[test_idx].copy()

y_train = y.iloc[train_idx].copy()
y_test = y.iloc[test_idx].copy()

groups_train = groups.iloc[train_idx]
groups_test = groups.iloc[test_idx]


print(
    f"Train rows: {len(X_train):,}"
)

print(
    f"Test rows: {len(X_test):,}"
)

print(
    f"Train groups: "
    f"{groups_train.nunique():,}"
)

print(
    f"Test groups: "
    f"{groups_test.nunique():,}"
)


# GROUP LEAKAGE CHECK

overlap = (
    set(groups_train.unique())
    & set(groups_test.unique())
)

print(
    f"Group overlap: {len(overlap)}"
)

if overlap:
    raise RuntimeError(
        "GROUP LEAKAGE DETECTED!"
    )



# FEATURE TYPES


numeric_features = [
    "s2q2",
]

categorical_features = [
    feature
    for feature in FEATURES
    if feature not in numeric_features
]



# PREPROCESSING


numeric_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(
                strategy="median",
            ),
        ),
    ]
)


categorical_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(
                strategy="most_frequent",
            ),
        ),
        (
            "onehot",
            OneHotEncoder(
                handle_unknown="ignore",
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
    ]
)



# MODELS


models = {

    # MODEL 1

    "random_forest": RandomForestClassifier(
        n_estimators=400,

        min_samples_split=4,

        min_samples_leaf=1,

        max_features="sqrt",

        class_weight="balanced",

        random_state=42,

        n_jobs=-1,
    ),

    # MODEL 2
    

    "extra_trees": ExtraTreesClassifier(
        n_estimators=400,

        min_samples_split=4,

        min_samples_leaf=1,

        max_features="sqrt",

        class_weight="balanced",

        random_state=42,

        n_jobs=-1,
    ),
}



# TRAIN + EVALUATE


results = []

trained_models = {}


for model_name, classifier in models.items():

    print("\n" + "=" * 80)
    print(
        f"TRAINING MODEL: {model_name.upper()}"
    )
    print("=" * 80)

    pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                preprocessor,
            ),
            (
                "classifier",
                classifier,
            ),
        ]
    )

    print("\nTraining...")

    pipeline.fit(
        X_train,
        y_train,
    )

    print("Training completed.")

    
    # PREDICTION
    

    y_probability = (
        pipeline
        .predict_proba(X_test)[:, 1]
    )

    # Default threshold
    y_pred = (
        y_probability >= 0.50
    ).astype(int)

    
    # METRICS
    

    accuracy = accuracy_score(
        y_test,
        y_pred,
    )

    balanced_accuracy = (
        balanced_accuracy_score(
            y_test,
            y_pred,
        )
    )

    precision = precision_score(
        y_test,
        y_pred,
        zero_division=0,
    )

    recall = recall_score(
        y_test,
        y_pred,
        zero_division=0,
    )

    f1 = f1_score(
        y_test,
        y_pred,
        zero_division=0,
    )

    roc_auc = roc_auc_score(
        y_test,
        y_probability,
    )

    print("\nPerformance:")

    print(
        f"Accuracy:           {accuracy:.4f}"
    )

    print(
        f"Balanced Accuracy:  "
        f"{balanced_accuracy:.4f}"
    )

    print(
        f"Precision:          {precision:.4f}"
    )

    print(
        f"Recall:             {recall:.4f}"
    )

    print(
        f"F1 Score:           {f1:.4f}"
    )

    print(
        f"ROC-AUC:            {roc_auc:.4f}"
    )

    print("\nConfusion Matrix:")

    cm = confusion_matrix(
        y_test,
        y_pred,
    )

    print(cm)

    print("\nClassification Report:")

    print(
        classification_report(
            y_test,
            y_pred,
            target_names=[
                "No Pest/Disease Damage",
                "Pest/Disease Risk",
            ],
            zero_division=0,
        )
    )

    results.append(
        {
            "model": model_name,
            "accuracy": accuracy,
            "balanced_accuracy": balanced_accuracy,
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "roc_auc": roc_auc,
        }
    )

    trained_models[
        model_name
    ] = pipeline



# COMPARE MODELS


results_df = pd.DataFrame(
    results
)

print("\n" + "=" * 80)
print("MODEL COMPARISON")
print("=" * 80)

print(
    results_df
    .sort_values(
        "f1",
        ascending=False,
    )
    .to_string(index=False)
)



# SELECT BEST MODEL

#
# We select using F1 of the positive class,
# not Accuracy.
#
# Reason:
#
# Pest/Disease Risk is the important class
# for an Early Warning system.


best_row = (
    results_df
    .sort_values(
        [
            "f1",
            "recall",
            "roc_auc",
        ],
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
    ]
)


print("\n" + "=" * 80)
print("BEST MODEL")
print("=" * 80)

print(
    f"Selected model: "
    f"{best_model_name}"
)

print(
    f"F1: "
    f"{best_row['f1']:.4f}"
)

print(
    f"Recall: "
    f"{best_row['recall']:.4f}"
)

print(
    f"ROC-AUC: "
    f"{best_row['roc_auc']:.4f}"
)



# THRESHOLD ANALYSIS

#
# IMPORTANT:
#
# We don't immediately change the model.
#
# We test different thresholds to understand
# the trade-off between:
#
# Precision <-> Recall
#
# This is especially important for Early Warning.


print("\n" + "=" * 80)
print("THRESHOLD ANALYSIS")
print("=" * 80)


best_probabilities = (
    best_pipeline
    .predict_proba(X_test)[:, 1]
)


threshold_results = []


thresholds = np.arange(
    0.10,
    0.71,
    0.05,
)


for threshold in thresholds:

    threshold_pred = (
        best_probabilities
        >= threshold
    ).astype(int)

    threshold_precision = (
        precision_score(
            y_test,
            threshold_pred,
            zero_division=0,
        )
    )

    threshold_recall = (
        recall_score(
            y_test,
            threshold_pred,
            zero_division=0,
        )
    )

    threshold_f1 = (
        f1_score(
            y_test,
            threshold_pred,
            zero_division=0,
        )
    )

    threshold_results.append(
        {
            "threshold": threshold,
            "precision": threshold_precision,
            "recall": threshold_recall,
            "f1": threshold_f1,
        }
    )


threshold_df = pd.DataFrame(
    threshold_results
)


print(
    threshold_df.to_string(
        index=False
    )
)



# SELECT OPERATIONAL THRESHOLD

#
# For Early Warning, recall is important.
#
# But we don't want an extremely low threshold
# that creates too many false alarms.
#
# Therefore:
#
# 1. Prefer F1
# 2. If several thresholds are close,
#    prefer higher recall.


best_threshold_row = (
    threshold_df
    .sort_values(
        [
            "f1",
            "recall",
        ],
        ascending=False,
    )
    .iloc[0]
)


BEST_THRESHOLD = float(
    best_threshold_row[
        "threshold"
    ]
)


print("\nSelected threshold:")

print(
    f"{BEST_THRESHOLD:.2f}"
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



# FINAL MODEL ARTIFACT


MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


artifact = {

    "pipeline": best_pipeline,

    "features": FEATURES,

    "target": TARGET,

    "target_source": TARGET_SOURCE,

    "group_column": GROUP_COLUMN,

    "decision_threshold": BEST_THRESHOLD,

    "metrics": {
        "accuracy": float(
            best_row["accuracy"]
        ),

        "balanced_accuracy": float(
            best_row[
                "balanced_accuracy"
            ]
        ),

        "precision": float(
            best_row["precision"]
        ),

        "recall": float(
            best_row["recall"]
        ),

        "f1": float(
            best_row["f1"]
        ),

        "roc_auc": float(
            best_row["roc_auc"]
        ),
    },

    "threshold_metrics": {
        "precision": float(
            best_threshold_row[
                "precision"
            ]
        ),

        "recall": float(
            best_threshold_row[
                "recall"
            ]
        ),

        "f1": float(
            best_threshold_row[
                "f1"
            ]
        ),
    },

    "training_config": {

        "models_tested": [
            "RandomForestClassifier",
            "ExtraTreesClassifier",
        ],

        "n_estimators": 400,

        "class_weight": "balanced",

        "test_size": 0.20,

        "split_method": (
            "GroupShuffleSplit"
        ),

        "random_state": 42,
    },

    "target_definition": {

        "description": (
            "Pest/disease risk based on "
            "recorded crop damage by "
            "insects or pests."
        ),

        "positive_condition": (
            "s2q42 > 0"
        ),

        "negative_condition": (
            "s2q42 == 0"
        ),
    },
}



# SAVE


joblib.dump(
    artifact,
    MODEL_PATH,
)


print("\n" + "=" * 80)
print("MODEL SAVED")
print("=" * 80)

print(
    f"Path: {MODEL_PATH}"
)

print(
    f"Decision threshold: "
    f"{BEST_THRESHOLD:.2f}"
)

print("\nTraining completed successfully.")
