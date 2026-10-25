
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent

DATA_PATH = ROOT / "data" / "all_data" / "all_seasons_cleaned_merged.csv"
PEST_SUMMARY_PATH = (
    ROOT / "data" / "agrisystem" / "pest_district_season_summary.csv"
)

print("=" * 70)
print("1. LOAD SOURCE DATA")
print("=" * 70)

if not DATA_PATH.exists():
    raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

df = pd.read_csv(DATA_PATH, low_memory=False)

print("Dataset shape:", df.shape)

required = ["season", "s4q13", "s4q14"]
for col in required:
    print(f"{col}: {'FOUND' if col in df.columns else 'MISSING'}")

print("\n" + "=" * 70)
print("2. LOCATION COLUMNS")
print("=" * 70)

for col in ["s1q1", "s1q2", "s1q3"]:
    if col in df.columns:
        print(f"\n{col} — sample values:")
        print(df[col].value_counts(dropna=False).head(15).to_string())

print("\n" + "=" * 70)
print("3. SEASON VALUES")
print("=" * 70)

print(df["season"].value_counts(dropna=False).to_string())

print("\n" + "=" * 70)
print("4. s4q13 VALUES")
print("=" * 70)

print(df["s4q13"].value_counts(dropna=False).to_string())

print("\n" + "=" * 70)
print("5. s4q14 VALUES")
print("=" * 70)

print(df["s4q14"].value_counts(dropna=False).to_string())

print("\n" + "=" * 70)
print("6. s4q13 × s4q14")
print("=" * 70)

print(
    pd.crosstab(
        df["s4q13"].fillna("MISSING"),
        df["s4q14"].fillna("MISSING"),
        dropna=False,
        margins=True,
    ).to_string()
)

print("\n" + "=" * 70)
print("7. EXISTING PEST SUMMARY")
print("=" * 70)

if PEST_SUMMARY_PATH.exists():
    pest = pd.read_csv(PEST_SUMMARY_PATH)
    print("Shape:", pest.shape)
    print("Columns:", pest.columns.tolist())
    print(pest.head(10).to_string(index=False))
else:
    print("Pest summary not found at:", PEST_SUMMARY_PATH)

print("\nInspection completed. No files were modified.")
