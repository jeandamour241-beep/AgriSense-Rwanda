from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder



# 1. PATHS


PROJECT_ROOT = Path(__file__).resolve().parents[3]

DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "all_data"
    / "all_seasons_cleaned_merged.csv"
)

MODEL_DIR = (
    PROJECT_ROOT
    / "src"
    / "fertilizer"
    / "models"
)

MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODEL_DIR / "fertilizer_strategy_model.joblib"

RESULTS_PATH = MODEL_DIR / "fertilizer_strategy_results.csv"



# 2. CONFIGURATION


TARGET = "fertilizer_strategy"
GROUP_COLUMN = "Segment_ID"

FEATURES = [
    "s1q1",      # Province
    "s1q2",      # District
    "s1q3",      # Stratum
    "season",    # Season
    "s2q2",      # Plot area
    "s2q4",      # Crop
    "s2q7",      # Sowing period
    "s2q11",     # Seed type
    "s4q1",      # Erosion
    "s4q6",      # Consolidated site
]

RANDOM_STATE = 42
TEST_SIZE = 0.20



# 3. LOAD DATA


print("=" * 80)
print("FERTILIZER STRATEGY RECOMMENDATION - TRAINING")
print("=" * 80)

print("\nLoading dataset...")

df = pd.read_csv(
    DATA_PATH,
    low_memory=False,
)

print(f"Dataset shape: {df.shape}")



# 4. CHECK REQUIRED COLUMNS


required_columns = (
    FEATURES
    + [
        "s3q1",
        "s3q3",
        "s3q7",
        "s3q9",
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



# 5. NORMALIZE YES / NO VALUES


def normalize_yes_no(value):
    """
    Convert questionnaire Yes/No values to:
        Yes -> 1
        No  -> 0
        Missing/unknown -> NaN
    """

    if pd.isna(value):
        return np.nan

    value_str = str(value).strip().lower()

    if value_str in {"yes", "1", "1.0"}:
        return 1

    if value_str in {"no", "2", "2.0"}:
        return 0

    return np.nan



# 6. CREATE PLOT-LEVEL ORGANIC USAGE


print("\nCreating organic fertilizer usage...")

organic_plot = df["s3q3"].apply(normalize_yes_no)

# Questionnaire skip logic:
#
# s3q1 = No
#     -> s3q3 may be skipped
#     -> therefore we know organic = 0
#
organic_parent_no = (
    df["s3q1"]
    .apply(normalize_yes_no)
    .eq(0)
)

organic_plot.loc[
    organic_plot.isna() & organic_parent_no
] = 0



# 7. CREATE PLOT-LEVEL INORGANIC USAGE


print("Creating inorganic fertilizer usage...")

inorganic_plot = df["s3q9"].apply(normalize_yes_no)

# Questionnaire skip logic:
#
# s3q7 = No
#     -> s3q9 may be skipped
#     -> therefore we know inorganic = 0
#
inorganic_parent_no = (
    df["s3q7"]
    .apply(normalize_yes_no)
    .eq(0)
)

inorganic_plot.loc[
    inorganic_plot.isna() & inorganic_parent_no
] = 0



# 8. CREATE FERTILIZER STRATEGY TARGET


def create_strategy(organic, inorganic):
    if pd.isna(organic) or pd.isna(inorganic):
        return np.nan

    organic = int(organic)
    inorganic = int(inorganic)

    if organic == 0 and inorganic == 0:
        return "NONE"

    if organic == 1 and inorganic == 0:
        return "ORGANIC_ONLY"

    if organic == 0 and inorganic == 1:
        return "INORGANIC_ONLY"

    if organic == 1 and inorganic == 1:
        return "BOTH"

    return np.nan


df[TARGET] = [
    create_strategy(
        organic,
        inorganic,
    )
    for organic, inorganic
    in zip(
        organic_plot,
        inorganic_plot,
    )
]



# 9. TARGET DISTRIBUTION


print("\n" + "=" * 80)
print("TARGET DISTRIBUTION")
print("=" * 80)

target_counts = (
    df[TARGET]
    .value_counts(dropna=False)
)

print(target_counts)

print("\nTarget percentages:")

target_percentages = (
    df[TARGET]
    .value_counts(normalize=True, dropna=False)
    * 100
)

print(target_percentages.round(2))



# 10. REMOVE UNKNOWN TARGET ROWS


df_model = df.dropna(
    subset=[
        TARGET,
        GROUP_COLUMN,
    ]
).copy()

print(
    f"\nRows used for training: {len(df_model):,}"
)



# 11. PREPARE X AND y


X = df_model[FEATURES].copy()

y = df_model[TARGET].copy()

groups = df_model[GROUP_COLUMN].copy()



# 12. DETERMINE FEATURE TYPES


categorical_features = []

numeric_features = []

for feature in FEATURES:

    if pd.api.types.is_numeric_dtype(
        X[feature]
    ):
        numeric_features.append(feature)

    else:
        categorical_features.append(feature)


print("\n" + "=" * 80)
print("FEATURE TYPES")
print("=" * 80)

print("\nCategorical features:")
for feature in categorical_features:
    print(f"  - {feature}")

print("\nNumeric features:")
for feature in numeric_features:
    print(f"  - {feature}")



# 13. PREPROCESSING


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
    ]
)



# 14. RANDOM FOREST MODEL


model = RandomForestClassifier(
    n_estimators=500,
    min_samples_split=5,
    min_samples_leaf=2,
    max_features="sqrt",
    class_weight="balanced",
    random_state=RANDOM_STATE,
    n_jobs=-1,
)


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



# 15. GROUP TRAIN / TEST SPLIT


print("\n" + "=" * 80)
print("GROUP SPLIT")
print("=" * 80)

splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=TEST_SIZE,
    random_state=RANDOM_STATE,
)

train_indices, test_indices = next(
    splitter.split(
        X,
        y,
        groups=groups,
    )
)

X_train = X.iloc[train_indices]
X_test = X.iloc[test_indices]

y_train = y.iloc[train_indices]
y_test = y.iloc[test_indices]

groups_train = groups.iloc[train_indices]
groups_test = groups.iloc[test_indices]


print(
    f"Train rows: {len(X_train):,}"
)

print(
    f"Test rows: {len(X_test):,}"
)

print(
    f"Train groups: {groups_train.nunique():,}"
)

print(
    f"Test groups: {groups_test.nunique():,}"
)


group_overlap = set(
    groups_train.unique()
).intersection(
    set(groups_test.unique())
)

print(
    f"Group overlap: {len(group_overlap)}"
)


if len(group_overlap) > 0:
    raise RuntimeError(
        "Group leakage detected!"
    )



# 16. TRAIN MODEL


print("\n" + "=" * 80)
print("TRAINING RANDOM FOREST")
print("=" * 80)

pipeline.fit(
    X_train,
    y_train,
)

print("\nTraining completed.")



# 17. PREDICTION


y_pred = pipeline.predict(
    X_test
)



# 18. EVALUATION


accuracy = accuracy_score(
    y_test,
    y_pred,
)

balanced_accuracy = balanced_accuracy_score(
    y_test,
    y_pred,
)

macro_f1 = f1_score(
    y_test,
    y_pred,
    average="macro",
)

weighted_f1 = f1_score(
    y_test,
    y_pred,
    average="weighted",
)


print("\n" + "=" * 80)
print("MODEL RESULTS")
print("=" * 80)

print(
    f"\nAccuracy:          {accuracy:.4f}"
)

print(
    f"Balanced Accuracy: {balanced_accuracy:.4f}"
)

print(
    f"Macro F1:          {macro_f1:.4f}"
)

print(
    f"Weighted F1:       {weighted_f1:.4f}"
)



# 19. CLASSIFICATION REPORT


print("\n" + "=" * 80)
print("CLASSIFICATION REPORT")
print("=" * 80)

print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0,
    )
)



# 20. CONFUSION MATRIX


labels = [
    "NONE",
    "ORGANIC_ONLY",
    "INORGANIC_ONLY",
    "BOTH",
]

cm = confusion_matrix(
    y_test,
    y_pred,
    labels=labels,
)

print("\n" + "=" * 80)
print("CONFUSION MATRIX")
print("=" * 80)

cm_df = pd.DataFrame(
    cm,
    index=[
        f"Actual_{label}"
        for label in labels
    ],
    columns=[
        f"Predicted_{label}"
        for label in labels
    ],
)

print(cm_df)



# 21. SAVE RESULTS


results = pd.DataFrame(
    {
        "metric": [
            "accuracy",
            "balanced_accuracy",
            "macro_f1",
            "weighted_f1",
        ],
        "value": [
            accuracy,
            balanced_accuracy,
            macro_f1,
            weighted_f1,
        ],
    }
)

results.to_csv(
    RESULTS_PATH,
    index=False,
)



# 22. SAVE MODEL ARTIFACT


artifact = {
    "model": pipeline,

    "features": FEATURES,

    "categorical_features": (
        categorical_features
    ),

    "numeric_features": (
        numeric_features
    ),

    "target": TARGET,

    "target_definition": {
        "NONE": (
            "organic fertilizer not used "
            "and inorganic fertilizer not used"
        ),

        "ORGANIC_ONLY": (
            "organic fertilizer used "
            "and inorganic fertilizer not used"
        ),

        "INORGANIC_ONLY": (
            "organic fertilizer not used "
            "and inorganic fertilizer used"
        ),

        "BOTH": (
            "both organic and inorganic "
            "fertilizer used"
        ),
    },

    "group_column": GROUP_COLUMN,

    "group_split": {
        "test_size": TEST_SIZE,
        "random_state": RANDOM_STATE,
        "group_overlap": len(group_overlap),
    },

    "metrics": {
        "accuracy": accuracy,
        "balanced_accuracy": balanced_accuracy,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1,
    },

    "model_name": "Random Forest Fertilizer Strategy V1",

    "random_state": RANDOM_STATE,
}


joblib.dump(
    artifact,
    MODEL_PATH,
)



# 23. FINAL OUTPUT


print("\n" + "=" * 80)
print("MODEL SAVED")
print("=" * 80)

print(
    f"\nModel:"
    f"\n{MODEL_PATH}"
)

print(
    f"\nResults:"
    f"\n{RESULTS_PATH}"
)

print("\nTraining finished successfully.")