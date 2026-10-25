from pathlib import Path
import pandas as pd



# PATH


PROJECT_ROOT = Path(__file__).resolve().parents[3]

DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "agrisystem"
    / "agriculture_features_v2.csv"
)



# LOAD DATA


print("=" * 80)
print("PEST / DISEASE EARLY WARNING - FEATURE AUDIT")
print("=" * 80)

df = pd.read_csv(DATA_PATH)

print(f"\nDataset shape: {df.shape}")



# TARGET INFORMATION


TARGET = "s2q42"

if TARGET not in df.columns:
    raise ValueError(f"Target column '{TARGET}' not found.")

target_df = df[TARGET].dropna()

print("\n" + "=" * 80)
print("TARGET ANALYSIS")
print("=" * 80)

print(f"Total rows:        {len(df):,}")
print(f"Target available:  {len(target_df):,}")
print(f"Target missing:    {df[TARGET].isna().sum():,}")

print("\nTarget distribution:")

print(
    pd.Series(
        {
            "No damage (0)": (target_df == 0).sum(),
            "Damage (>0)": (target_df > 0).sum(),
        }
    )
)

positive_rate = (target_df > 0).mean()

print(f"\nPositive rate: {positive_rate:.4%}")



# ALL COLUMNS


print("\n" + "=" * 80)
print("ALL DATASET COLUMNS")
print("=" * 80)

for i, column in enumerate(df.columns, start=1):

    non_null = df[column].notna().sum()
    missing = df[column].isna().sum()
    unique = df[column].nunique(dropna=True)

    print(
        f"{i:03d}. "
        f"{column:<30} "
        f"non-null={non_null:>7,} "
        f"missing={missing:>7,} "
        f"unique={unique:>5}"
    )



# CANDIDATE FEATURES


candidate_features = [
    "s1q1",
    "s1q2",
    "s1q3",
    "season",

    "s2q2",
    "s2q4",
    "s2q7",
    "s2q8",
    "s2q11",
    "s2q12",

    "s4q1",
    "s4q6",

    # irrigation context
    "s4q13",
    "s4q14",
]


print("\n" + "=" * 80)
print("CANDIDATE FEATURE CHECK")
print("=" * 80)

for column in candidate_features:

    if column not in df.columns:
        print(f"[MISSING] {column}")
        continue

    print(f"\n[{column}]")

    print(f"Type:       {df[column].dtype}")
    print(f"Non-null:   {df[column].notna().sum():,}")
    print(f"Missing:    {df[column].isna().sum():,}")
    print(f"Unique:     {df[column].nunique(dropna=True):,}")

    print("Sample values:")

    print(
        df[column]
        .value_counts(dropna=False)
        .head(15)
        .to_string()
    )



# POSSIBLE LEAKAGE COLUMNS


possible_leakage = [
    "s2q42",

    "s2q24",
    "s2q24_d",
    "s2q24_disease",

    "s3q18",
    "s3q19",
    "s3q20",
    "s3q21",
    "s3q22",
    "s3q23",
    "s3q24",
]


print("\n" + "=" * 80)
print("POSSIBLE LEAKAGE / POST-EVENT FEATURES")
print("=" * 80)

for column in possible_leakage:

    if column not in df.columns:
        print(f"[NOT FOUND] {column}")
        continue

    print(
        f"{column:<25} "
        f"non-null={df[column].notna().sum():>7,} "
        f"unique={df[column].nunique(dropna=True):>5}"
    )



# TARGET CORRELATION FOR NUMERIC VARIABLES


print("\n" + "=" * 80)
print("NUMERIC FEATURE RELATIONSHIP WITH TARGET")
print("=" * 80)

numeric_columns = df.select_dtypes(include="number").columns.tolist()

numeric_columns = [
    c for c in numeric_columns
    if c != TARGET
]

correlations = []

for column in numeric_columns:

    temp = df[[column, TARGET]].dropna()

    if len(temp) < 100:
        continue

    correlation = temp[column].corr(
        (temp[TARGET] > 0).astype(int)
    )

    correlations.append(
        {
            "feature": column,
            "correlation": correlation,
            "non_null": len(temp),
            "unique": temp[column].nunique(),
        }
    )


correlation_df = (
    pd.DataFrame(correlations)
    .sort_values(
        "correlation",
        key=lambda x: x.abs(),
        ascending=False,
    )
)


print(
    correlation_df
    .head(30)
    .to_string(index=False)
)



# SAVE AUDIT


OUTPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "agrisystem"
    / "pest_disease_feature_audit.csv"
)

correlation_df.to_csv(
    OUTPUT_PATH,
    index=False
)

print("\n" + "=" * 80)
print("AUDIT COMPLETE")
print("=" * 80)

print(f"\nSaved correlation audit to:")
print(OUTPUT_PATH)