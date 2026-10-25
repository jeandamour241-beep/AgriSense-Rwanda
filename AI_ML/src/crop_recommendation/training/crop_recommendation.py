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
    top_k_accuracy_score,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder



# PATHS


PROJECT_ROOT = Path(__file__).resolve().parents[3]

DATA_FILE = (
    PROJECT_ROOT
    / "data"
    / "agrisystem"
    / "agriculture_features_v2.csv"
)

MODEL_DIR = PROJECT_ROOT / "src" / "crop_recommendation" / "models"

MODEL_FILE = MODEL_DIR / "crop_recommendation_model.joblib"



# CROP RECOMMENDATION FEATURES


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

TARGET = "s2q4"

GROUP_COLUMN = "Segment_ID"



# LOAD DATA


def load_data():

    print("=" * 80)
    print("AGRISYSTEM - CROP RECOMMENDATION")
    print("=" * 80)

    print("\nLoading dataset:")
    print(DATA_FILE)

    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"\nDataset not found:\n{DATA_FILE}"
        )

    df = pd.read_csv(
        DATA_FILE,
        low_memory=False
    )

    print(
        f"\nDataset shape: "
        f"{df.shape[0]:,} rows × "
        f"{df.shape[1]:,} columns"
    )

    return df



# VALIDATE FEATURES


def validate_columns(df):

    required = FEATURES + [TARGET, GROUP_COLUMN]

    missing = [
        column
        for column in required
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            "\nMissing required columns:\n"
            + "\n".join(f"  - {x}" for x in missing)
        )

    print("\nAll required columns are available.")

    print("\nFeatures:")
    for feature in FEATURES:
        print(f"  - {feature}")

    print(f"\nTarget: {TARGET}")
    print(f"Group:  {GROUP_COLUMN}")



# CLEAN TARGET


def prepare_data(df):

    data = df[
        FEATURES
        + [TARGET]
        + [GROUP_COLUMN]
    ].copy()

    print("\nInitial rows:", len(data))

    # Target cannot be missing
    data = data.dropna(
        subset=[TARGET]
    )

    # Remove empty target values
    data[TARGET] = (
        data[TARGET]
        .astype(str)
        .str.strip()
    )

    data = data[
        (data[TARGET] != "")
        & (data[TARGET].str.lower() != "nan")
    ]

    # Group cannot be missing
    data = data.dropna(
        subset=[GROUP_COLUMN]
    )

    print(
        "Rows after target/group cleaning:",
        f"{len(data):,}"
    )

    return data



# TARGET DISTRIBUTION


def show_target_distribution(data):

    print("\n" + "=" * 80)
    print("CROP DISTRIBUTION")
    print("=" * 80)

    distribution = (
        data[TARGET]
        .value_counts()
        .sort_values(ascending=False)
    )

    print(
        f"\nNumber of crop classes: "
        f"{len(distribution)}"
    )

    print("\nCrop counts:")

    for crop, count in distribution.items():
        percentage = count / len(data) * 100

        print(
            f"{str(crop):30s}"
            f"{count:7,d}"
            f"  ({percentage:6.2f}%)"
        )

    return distribution



# FEATURE TYPES


def get_feature_types():

    categorical_features = [
        "s1q1",
        "s1q2",
        "s1q3",
        "season",
        "s2q7",
        "s4q1",
        "s4q6",
        "s4q13",
    ]

    numerical_features = [
        "s2q2",
    ]

    return categorical_features, numerical_features



# PREPROCESSING


def build_preprocessor():

    categorical_features, numerical_features = (
        get_feature_types()
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

    numerical_pipeline = Pipeline(
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
                categorical_features,
            ),
            (
                "numerical",
                numerical_pipeline,
                numerical_features,
            ),
        ]
    )

    return preprocessor



# MODEL


def build_model():

    preprocessor = build_preprocessor()

    classifier = RandomForestClassifier(
        n_estimators=400,
        max_depth=None,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight="balanced_subsample",
        random_state=42,
        n_jobs=-1,
    )

    model = Pipeline(
        steps=[
            (
                "preprocessor",
                preprocessor
            ),
            (
                "classifier",
                classifier
            ),
        ]
    )

    return model



# GROUP SPLIT


def split_data(data):

    X = data[FEATURES]
    y = data[TARGET]
    groups = data[GROUP_COLUMN]

    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=0.20,
        random_state=42,
    )

    train_indices, test_indices = next(
        splitter.split(
            X,
            y,
            groups=groups
        )
    )

    X_train = X.iloc[train_indices].copy()
    X_test = X.iloc[test_indices].copy()

    y_train = y.iloc[train_indices].copy()
    y_test = y.iloc[test_indices].copy()

    groups_train = groups.iloc[train_indices]
    groups_test = groups.iloc[test_indices]

    print("\n" + "=" * 80)
    print("GROUP SPLIT")
    print("=" * 80)

    print(f"\nTrain rows: {len(X_train):,}")
    print(f"Test rows:  {len(X_test):,}")

    print(
        f"\nTrain groups: "
        f"{groups_train.nunique():,}"
    )

    print(
        f"Test groups:  "
        f"{groups_test.nunique():,}"
    )

    # Critical validation
    overlap = set(groups_train) & set(groups_test)

    print(
        f"\nGroup overlap: {len(overlap)}"
    )

    if len(overlap) != 0:
        raise RuntimeError(
            "Group leakage detected!"
        )

    return X_train, X_test, y_train, y_test



# TRAIN


def train_model(model, X_train, y_train):

    print("\n" + "=" * 80)
    print("TRAINING")
    print("=" * 80)

    print("\nTraining Random Forest...")

    model.fit(
        X_train,
        y_train
    )

    print("Training completed.")

    return model



# EVALUATION


def evaluate_model(
    model,
    X_test,
    y_test
):

    print("\n" + "=" * 80)
    print("EVALUATION")
    print("=" * 80)

    predictions = model.predict(
        X_test
    )

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    balanced_accuracy = balanced_accuracy_score(
        y_test,
        predictions
    )

    macro_f1 = f1_score(
        y_test,
        predictions,
        average="macro",
        zero_division=0,
    )

    weighted_f1 = f1_score(
        y_test,
        predictions,
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
    

    if hasattr(model, "predict_proba"):

        probabilities = model.predict_proba(
            X_test
        )

        classes = model.classes_

        for k in [3, 5]:

            if k <= len(classes):

                score = top_k_accuracy_score(
                    y_test,
                    probabilities,
                    k=k,
                    labels=classes,
                )

                print(
                    f"Top-{k} Accuracy:     "
                    f"{score:.4f}"
                )

    
    # CLASSIFICATION REPORT
    

    print("\nClassification Report:")

    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0,
        )
    )

    return {
        "accuracy": accuracy,
        "balanced_accuracy": balanced_accuracy,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1,
    }



# FEATURE IMPORTANCE


def show_feature_importance(model):

    print("\n" + "=" * 80)
    print("FEATURE IMPORTANCE")
    print("=" * 80)

    try:

        preprocessor = (
            model
            .named_steps["preprocessor"]
        )

        classifier = (
            model
            .named_steps["classifier"]
        )

        feature_names = (
            preprocessor
            .get_feature_names_out()
        )

        importances = classifier.feature_importances_

        importance_df = pd.DataFrame({
            "feature": feature_names,
            "importance": importances,
        })

        importance_df = (
            importance_df
            .sort_values(
                "importance",
                ascending=False
            )
            .head(20)
        )

        print("\nTop 20 transformed features:\n")

        for _, row in importance_df.iterrows():

            print(
                f"{row['feature']:50s}"
                f"{row['importance']:.6f}"
            )

    except Exception as error:

        print(
            "\nCould not calculate feature importance:"
        )

        print(error)



# SAVE MODEL


def save_model(model):

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    package = {
        "model": model,
        "features": FEATURES,
        "target": TARGET,
        "group_column": GROUP_COLUMN,
        "model_type": "RandomForestClassifier",
        "random_state": 42,
    }

    joblib.dump(
        package,
        MODEL_FILE
    )

    print("\n" + "=" * 80)
    print("MODEL SAVED")
    print("=" * 80)

    print(f"\nModel:")
    print(MODEL_FILE)



# MAIN


def main():

    df = load_data()

    validate_columns(df)

    data = prepare_data(df)

    show_target_distribution(data)

    X_train, X_test, y_train, y_test = (
        split_data(data)
    )

    model = build_model()

    model = train_model(
        model,
        X_train,
        y_train
    )

    metrics = evaluate_model(
        model,
        X_test,
        y_test
    )

    show_feature_importance(
        model
    )

    save_model(
        model
    )

    print("\n" + "=" * 80)
    print("CROP RECOMMENDATION MODEL COMPLETE")
    print("=" * 80)

    print(
        f"\nFinal Accuracy: "
        f"{metrics['accuracy']:.4f}"
    )

    print(
        f"Final Macro F1: "
        f"{metrics['macro_f1']:.4f}"
    )


if __name__ == "__main__":
    main()