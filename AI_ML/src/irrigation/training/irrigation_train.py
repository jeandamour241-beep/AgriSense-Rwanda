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
    / "irrigation"
    / "models"
)

MODEL_PATH = MODEL_DIR / "irrigation_decision_model.joblib"



# CONFIGURATION


TARGET = "s4q14"
GROUP_COLUMN = "Segment_ID"

# s4q13 is used ONLY for filtering.
# It should NOT be a normal model feature because
# s4q13 asks whether irrigation was practiced in any plots,
# while s4q14 is the plot-level irrigation decision.

FEATURES = [
    "s1q1",      # Province
    "s1q2",      # District
    "s1q3",      # Stratum / land context
    "season",    # Season
    "s2q2",      # Plot area
    "s2q4",      # Crop
    "s2q7",      # Sowing period
    "s2q11",     # Seed type
    "s4q1",      # Soil erosion
    "s4q6",      # Land consolidation
]



# LOAD DATA


def load_data():

    print("=" * 80)
    print("RWANDA AGRISYSTEM - IRRIGATION DECISION MODEL")
    print("=" * 80)

    print("\nLoading:")
    print(DATA_PATH)

    df = pd.read_csv(DATA_PATH, low_memory=False)

    print(f"\nOriginal dataset shape: {df.shape}")

    required_columns = (
        FEATURES
        + [
            TARGET,
            GROUP_COLUMN,
            "s4q13",
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

    return df



# PREPARE DATA


def prepare_data(df):

    print("\n" + "=" * 80)
    print("DATA PREPARATION")
    print("=" * 80)

    
    # Keep only records where Q4.13 = Yes
    

    before = len(df)

    df = df[
        df["s4q13"]
        .astype(str)
        .str.strip()
        .str.lower()
        .isin(["yes", "1"])
    ].copy()

    print(
        f"\nRows after s4q13 == Yes: "
        f"{len(df):,} / {before:,}"
    )

    
    # Keep only required columns
    

    columns = FEATURES + [TARGET, GROUP_COLUMN]

    df = df[columns].copy()

    
    # Remove missing target
    

    before_target = len(df)

    df[TARGET] = (
        df[TARGET]
        .astype(str)
        .str.strip()
    )

    invalid_target = df[TARGET].isin(
        ["", "nan", "NaN", "None", "null"]
    )

    df = df[~invalid_target].copy()

    print(
        f"Rows after removing missing target: "
        f"{len(df):,} / {before_target:,}"
    )

    
    # Remove missing group
    

    before_group = len(df)

    df = df.dropna(
        subset=[GROUP_COLUMN]
    ).copy()

    print(
        f"Rows after removing missing Segment_ID: "
        f"{len(df):,} / {before_group:,}"
    )

    return df



# DATA AUDIT


def audit_data(df):

    print("\n" + "=" * 80)
    print("IRRIGATION TARGET AUDIT")
    print("=" * 80)

    print("\nTarget:")
    print(TARGET)

    print("\nTarget distribution:")

    counts = df[TARGET].value_counts()

    percentages = (
        df[TARGET]
        .value_counts(normalize=True)
        * 100
    )

    for value in counts.index:
        print(
            f"  {value}: "
            f"{counts[value]:,} "
            f"({percentages[value]:.2f}%)"
        )

    print("\nNumber of classes:")
    print(df[TARGET].nunique())

    print("\nFeature missing values:")

    missing = df[FEATURES].isna().sum()

    for column, count in missing.items():

        percentage = (
            count / len(df) * 100
        )

        print(
            f"  {column}: "
            f"{count:,} "
            f"({percentage:.2f}%)"
        )

    print("\nNumber of Segment_ID groups:")
    print(
        df[GROUP_COLUMN].nunique()
    )



# BUILD PREPROCESSOR


def build_pipeline(X):

    numeric_features = [
        column
        for column in FEATURES
        if pd.api.types.is_numeric_dtype(
            X[column]
        )
    ]

    categorical_features = [
        column
        for column in FEATURES
        if column not in numeric_features
    ]

    print("\n" + "=" * 80)
    print("FEATURE TYPES")
    print("=" * 80)

    print("\nNumeric features:")
    print(numeric_features)

    print("\nCategorical features:")
    print(categorical_features)

    numeric_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(
                    strategy="median"
                ),
            )
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
                    handle_unknown="ignore"
                ),
            ),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "num",
                numeric_pipeline,
                numeric_features,
            ),
            (
                "cat",
                categorical_pipeline,
                categorical_features,
            ),
        ]
    )

    model = RandomForestClassifier(
        n_estimators=400,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight="balanced_subsample",
        random_state=42,
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

    return pipeline



# TRAIN


def train():

    df = load_data()

    df = prepare_data(df)

    audit_data(df)

    X = df[FEATURES].copy()

    y = df[TARGET].copy()

    groups = df[GROUP_COLUMN].copy()

    
    # GROUP SPLIT
    

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

    X_train = X.iloc[train_idx]
    X_test = X.iloc[test_idx]

    y_train = y.iloc[train_idx]
    y_test = y.iloc[test_idx]

    train_groups = groups.iloc[train_idx]
    test_groups = groups.iloc[test_idx]

    print("\n" + "=" * 80)
    print("GROUP SPLIT")
    print("=" * 80)

    print(
        f"\nTrain rows: {len(X_train):,}"
    )

    print(
        f"Test rows: {len(X_test):,}"
    )

    print(
        f"Train groups: "
        f"{train_groups.nunique():,}"
    )

    print(
        f"Test groups: "
        f"{test_groups.nunique():,}"
    )

    overlap = (
        set(train_groups)
        & set(test_groups)
    )

    print(
        f"Group overlap: {len(overlap)}"
    )

    if overlap:
        raise RuntimeError(
            "Group leakage detected!"
        )

    
    # BUILD MODEL
    

    pipeline = build_pipeline(
        X_train
    )

    print("\n" + "=" * 80)
    print("TRAINING RANDOM FOREST")
    print("=" * 80)

    pipeline.fit(
        X_train,
        y_train,
    )

    print("\nTraining completed.")

    
    # PREDICTION
    

    y_pred = pipeline.predict(
        X_test
    )

    
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

    
    # CLASSIFICATION REPORT
    

    print("\nClassification Report:")

    print(
        classification_report(
            y_test,
            y_pred,
            zero_division=0,
        )
    )

    
    # CONFUSION MATRIX
    

    print("\nConfusion Matrix:")

    labels = sorted(
        y_test.unique()
    )

    matrix = confusion_matrix(
        y_test,
        y_pred,
        labels=labels,
    )

    print(
        pd.DataFrame(
            matrix,
            index=[
                f"Actual_{x}"
                for x in labels
            ],
            columns=[
                f"Pred_{x}"
                for x in labels
            ],
        )
    )

    
    # SAVE MODEL
    

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    artifact = {
        "pipeline": pipeline,
        "features": FEATURES,
        "target": TARGET,
        "group_column": GROUP_COLUMN,
        "filter": {
            "column": "s4q13",
            "value": "Yes",
        },
        "metrics": {
            "accuracy": accuracy,
            "balanced_accuracy": balanced_accuracy,
            "macro_f1": macro_f1,
            "weighted_f1": weighted_f1,
        },
    }

    joblib.dump(
        artifact,
        MODEL_PATH,
    )

    print("\n" + "=" * 80)
    print("MODEL SAVED")
    print("=" * 80)

    print(
        f"\n{MODEL_PATH}"
    )

    return pipeline



# MAIN


if __name__ == "__main__":
    train()