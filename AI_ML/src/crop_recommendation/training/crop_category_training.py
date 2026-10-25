from pathlib import Path

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    f1_score,
    top_k_accuracy_score,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder



# PATHS


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
    / "crop_recommendation"
    / "models"
)

MODEL_PATH = MODEL_DIR / "crop_category_model.joblib"



# CONFIGURATION


FEATURES = [
    "s1q1",      # Province
    "s1q2",      # District
    "s1q3",      # Stratum
    "season",    # Season
    "s2q2",      # Plot area
    "s2q7",      # Sowing period
    "s4q1",      # Degree of erosion
    "s4q6",      # Land consolidation
    "s4q13",     # Irrigation
]

TARGET = "CropCategory"
GROUP_COLUMN = "Segment_ID"

CATEGORICAL_FEATURES = [
    "s1q1",
    "s1q2",
    "s1q3",
    "season",
    "s2q7",
    "s4q1",
    "s4q6",
    "s4q13",
]

NUMERIC_FEATURES = [
    "s2q2",
]

RANDOM_STATE = 42



# HEADER


print("=" * 80)
print("AGRISYSTEM - CROP CATEGORY RECOMMENDATION")
print("=" * 80)



# LOAD DATA


print("\nLoading dataset:")
print(DATA_PATH)

if not DATA_PATH.exists():
    raise FileNotFoundError(
        f"\nDataset not found:\n{DATA_PATH}"
    )

df = pd.read_csv(DATA_PATH)

print(
    f"\nDataset shape: "
    f"{df.shape[0]:,} rows × {df.shape[1]} columns"
)



# CHECK COLUMNS


required_columns = (
    FEATURES
    + [TARGET, GROUP_COLUMN]
)

missing_columns = [
    col for col in required_columns
    if col not in df.columns
]

if missing_columns:
    print("\nERROR: Missing columns:")
    for col in missing_columns:
        print(f"  - {col}")

    raise ValueError(
        "Required columns are missing from the dataset."
    )

print("\nAll required columns are available.")

print("\nFeatures:")
for feature in FEATURES:
    print(f"  - {feature}")

print(f"\nTarget: {TARGET}")
print(f"Group:  {GROUP_COLUMN}")



# CLEAN TARGET + GROUP & FIX CATEGORICAL TYPES


print("\nInitial rows:", f"{len(df):,}")

df = df.dropna(
    subset=[
        TARGET,
        GROUP_COLUMN,
    ]
).copy()

print(
    "Rows after target/group cleaning:",
    f"{len(df):,}"
)

# KOSORA ERROR: Hindura colone za categorical zose zibe string vyanze kuvangwa na numbers/NaN
for col in CATEGORICAL_FEATURES:
    df[col] = df[col].astype(str)



# CROP CATEGORY DISTRIBUTION


print("\n" + "=" * 80)
print("CROP CATEGORY DISTRIBUTION")
print("=" * 80)

category_counts = (
    df[TARGET]
    .value_counts()
    .sort_values(ascending=False)
)

print(
    f"\nNumber of crop categories: "
    f"{category_counts.shape[0]}"
)

print("\nCrop category counts:")

for category, count in category_counts.items():

    percentage = (
        count / len(df)
    ) * 100

    print(
        f"{str(category):35s}"
        f"{count:8,d}"
        f" ({percentage:6.2f}%)"
    )



# PREPARE X / y / GROUPS


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
    random_state=RANDOM_STATE,
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
    f"\nTrain rows: {len(X_train):,}"
)

print(
    f"Test rows:  {len(X_test):,}"
)

print(
    f"\nTrain groups: "
    f"{groups_train.nunique():,}"
)

print(
    f"Test groups:  "
    f"{groups_test.nunique():,}"
)



# GROUP OVERLAP CHECK


overlap = set(groups_train.unique()).intersection(
    set(groups_test.unique())
)

print(
    f"\nGroup overlap: {len(overlap)}"
)

if len(overlap) > 0:
    raise RuntimeError(
        "Group leakage detected!"
    )

print("Group split is clean.")



# PREPROCESSING


categorical_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(
                strategy="most_frequent"
            ),
        ),
        (
            "encoder",
            OneHotEncoder(
                handle_unknown="ignore"
            ),
        ),
    ]
)

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

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            categorical_pipeline,
            CATEGORICAL_FEATURES,
        ),
        (
            "numerical",
            numeric_pipeline,
            NUMERIC_FEATURES,
        ),
    ]
)



# MODEL


model = RandomForestClassifier(
    n_estimators=400,
    max_depth=None,
    min_samples_split=5,
    min_samples_leaf=2,
    class_weight="balanced_subsample",
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



# TRAIN


print("\n" + "=" * 80)
print("TRAINING")
print("=" * 80)

print("\nTraining Random Forest...")

pipeline.fit(
    X_train,
    y_train,
)

print("Training completed.")



# PREDICTION


y_pred = pipeline.predict(X_test)

y_proba = pipeline.predict_proba(X_test)

model_classes = pipeline.named_steps[
    "model"
].classes_



# EVALUATION


print("\n" + "=" * 80)
print("EVALUATION")
print("=" * 80)


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
    zero_division=0,
)

weighted_f1 = f1_score(
    y_test,
    y_pred,
    average="weighted",
    zero_division=0,
)


print(
    f"\nAccuracy:           {accuracy:.4f}"
)

print(
    f"Balanced Accuracy:  {balanced_accuracy:.4f}"
)

print(
    f"Macro F1:           {macro_f1:.4f}"
)

print(
    f"Weighted F1:        {weighted_f1:.4f}"
)



# TOP-K


# Top-K metrics are only valid when enough classes are present
# in the test set.

test_classes = set(y_test.unique())

valid_class_mask = [
    cls in test_classes
    for cls in model_classes
]

if sum(valid_class_mask) >= 5:

    # Align probability columns to classes present in test set
    valid_proba = y_proba[:, valid_class_mask]

    valid_classes = model_classes[
        valid_class_mask
    ]

    try:

        top3 = top_k_accuracy_score(
            y_test,
            valid_proba,
            k=3,
            labels=valid_classes,
        )

        top5 = top_k_accuracy_score(
            y_test,
            valid_proba,
            k=5,
            labels=valid_classes,
        )

        print(
            f"Top-3 Accuracy:     {top3:.4f}"
        )

        print(
            f"Top-5 Accuracy:     {top5:.4f}"
        )

    except ValueError as e:

        print(
            "\nTop-K calculation skipped:"
        )

        print(e)

else:

    print(
        "\nTop-K metrics skipped because "
        "the test set contains too few classes."
    )



# CLASSIFICATION REPORT


print("\nClassification Report:")

print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0,
    )
)



# FEATURE IMPORTANCE


print("\n" + "=" * 80)
print("FEATURE IMPORTANCE")
print("=" * 80)

preprocessor_fitted = (
    pipeline.named_steps[
        "preprocessor"
    ]
)

rf_model = (
    pipeline.named_steps[
        "model"
    ]
)

feature_names = (
    preprocessor_fitted
    .get_feature_names_out()
)

importances = (
    rf_model
    .feature_importances_
)

importance_df = pd.DataFrame(
    {
        "feature": feature_names,
        "importance": importances,
    }
)

importance_df = (
    importance_df
    .sort_values(
        "importance",
        ascending=False,
    )
)

print(
    "\nTop 20 transformed features:"
)

for _, row in importance_df.head(20).iterrows():

    print(
        f"{row['feature']:<55}"
        f"{row['importance']:.6f}"
    )



# SAVE MODEL


print("\n" + "=" * 80)
print("MODEL SAVING")
print("=" * 80)

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

model_package = {
    "model": pipeline,

    "features": FEATURES,

    "categorical_features": CATEGORICAL_FEATURES,

    "numeric_features": NUMERIC_FEATURES,

    "target": TARGET,

    "group_column": GROUP_COLUMN,

    "model_type": "RandomForestClassifier",

    "random_state": RANDOM_STATE,

    "classes": list(model_classes),

    "metrics": {
        "accuracy": float(accuracy),
        "balanced_accuracy": float(
            balanced_accuracy
        ),
        "macro_f1": float(macro_f1),
        "weighted_f1": float(weighted_f1),
    },
}


joblib.dump(
    model_package,
    MODEL_PATH,
)

print(
    "\nModel saved:"
)

print(MODEL_PATH)



# FINAL SUMMARY


print("\n" + "=" * 80)
print("CROP CATEGORY MODEL COMPLETE")
print("=" * 80)

print(
    f"\nFinal Accuracy: "
    f"{accuracy:.4f}"
)

print(
    f"Final Macro F1: "
    f"{macro_f1:.4f}"
)

print(
    f"\nCategories learned: "
    f"{len(model_classes)}"
)

print(
    f"Model file:\n"
    f"{MODEL_PATH}"
)

print("\nDone.")