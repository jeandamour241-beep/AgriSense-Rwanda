from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "all_data"
    / "all_seasons_cleaned_merged.csv"
)


class DataExplorerService:
    def __init__(self):
        if not DATA_PATH.exists():
            raise FileNotFoundError(
                f"Dataset not found: {DATA_PATH}"
            )

        print("Loading NISR agriculture dataset...")
        self.df = pd.read_csv(DATA_PATH, low_memory=False)

        required = [
            "s1q1",
            "s1q2",
            "season",
            "s2q4",
            "Crop_Area_ha",
            "Harvested_Crop_Area_ha",
            "Yield",
        ]

        missing = [
            column
            for column in required
            if column not in self.df.columns
        ]

        if missing:
            raise ValueError(
                f"Required columns missing: {missing}"
            )

        # Ensure analytics columns are numeric
        for column in [
            "Crop_Area_ha",
            "Harvested_Crop_Area_ha",
            "Yield",
        ]:
            self.df[column] = pd.to_numeric(
                self.df[column],
                errors="coerce",
            )

        print(f"Dataset loaded: {self.df.shape}")

    @staticmethod
    def _clean_label(value):
        if pd.isna(value):
            return None
        return str(value).strip()

    def _filter_data(
        self,
        district=None,
        crop=None,
        season=None,
        province=None,
    ):
        df = self.df

        if province:
            df = df[df["s1q1"] == province]

        if district:
            df = df[df["s1q2"] == district]

        if crop:
            df = df[df["s2q4"] == crop]

        if season:
            df = df[df["season"] == season]

        return df

    def get_filters(self):
        return {
            "provinces": sorted(
                self.df["s1q1"].dropna().astype(str).unique().tolist()
            ),
            "districts": sorted(
                self.df["s1q2"].dropna().astype(str).unique().tolist()
            ),
            "crops": sorted(
                self.df["s2q4"].dropna().astype(str).unique().tolist()
            ),
            "seasons": sorted(
                self.df["season"].dropna().astype(str).unique().tolist()
            ),
        }

    def get_overview(
        self,
        province=None,
        district=None,
        crop=None,
        season=None,
    ):
        df = self._filter_data(
            province=province,
            district=district,
            crop=crop,
            season=season,
        )

        valid_yield = df["Yield"].dropna()
        valid_harvest_area = df[
            "Harvested_Crop_Area_ha"
        ].dropna()

        return {
            "observations": int(len(df)),
            "districts": int(df["s1q2"].nunique()),
            "crops": int(df["s2q4"].nunique()),
            "seasons": int(df["season"].nunique()),
            "harvested_area_ha": round(
                float(valid_harvest_area.sum()), 2
            ),
            "mean_yield": (
                round(float(valid_yield.mean()), 2)
                if not valid_yield.empty
                else None
            ),
            "median_yield": (
                round(float(valid_yield.median()), 2)
                if not valid_yield.empty
                else None
            ),
            "yield_observations": int(len(valid_yield)),
            "source": "NISR Seasonal Agricultural Survey 2024/2025",
            "filters": {
                "province": province,
                "district": district,
                "crop": crop,
                "season": season,
            },
        }

    def get_crop_statistics(
        self,
        province=None,
        district=None,
        season=None,
        limit=15,
    ):
        df = self._filter_data(
            province=province,
            district=district,
            season=season,
        )

        grouped = df.groupby("s2q4", dropna=True).agg(
            observations=("s2q4", "size"),
            crop_area_ha=("Crop_Area_ha", "sum"),
            harvested_area_ha=(
                "Harvested_Crop_Area_ha", "sum"
            ),
            mean_yield=("Yield", "mean"),
            median_yield=("Yield", "median"),
        ).reset_index()

        grouped = grouped.rename(
            columns={"s2q4": "crop"}
        )

        grouped = grouped.sort_values(
            "observations",
            ascending=False,
        ).head(max(1, min(limit, 100)))

        grouped = grouped.where(
            pd.notna(grouped), None
        )

        return grouped.to_dict(orient="records")

    def get_district_comparison(
        self,
        crop=None,
        season=None,
        province=None,
        limit=30,
    ):
        df = self._filter_data(
            province=province,
            crop=crop,
            season=season,
        )

        grouped = df.groupby("s1q2", dropna=True).agg(
            observations=("s1q2", "size"),
            crops=("s2q4", "nunique"),
            crop_area_ha=("Crop_Area_ha", "sum"),
            harvested_area_ha=(
                "Harvested_Crop_Area_ha", "sum"
            ),
            mean_yield=("Yield", "mean"),
            median_yield=("Yield", "median"),
        ).reset_index()

        grouped = grouped.rename(
            columns={"s1q2": "district"}
        )

        grouped = grouped.sort_values(
            "observations",
            ascending=False,
        ).head(max(1, min(limit, 30)))

        grouped = grouped.where(
            pd.notna(grouped), None
        )

        return grouped.to_dict(orient="records")

    def get_season_comparison(
        self,
        district=None,
        crop=None,
        province=None,
    ):
        df = self._filter_data(
            province=province,
            district=district,
            crop=crop,
        )

        grouped = df.groupby("season", dropna=True).agg(
            observations=("season", "size"),
            crops=("s2q4", "nunique"),
            crop_area_ha=("Crop_Area_ha", "sum"),
            harvested_area_ha=(
                "Harvested_Crop_Area_ha", "sum"
            ),
            mean_yield=("Yield", "mean"),
            median_yield=("Yield", "median"),
        ).reset_index()

        grouped = grouped.where(
            pd.notna(grouped), None
        )

        return grouped.to_dict(orient="records")

    def get_data_table(
        self,
        province=None,
        district=None,
        crop=None,
        season=None,
        page=1,
        page_size=20,
    ):
        df = self._filter_data(
            province=province,
            district=district,
            crop=crop,
            season=season,
        )

        page = max(1, int(page))
        page_size = max(1, min(int(page_size), 100))

        columns = [
            "s1q1",
            "s1q2",
            "season",
            "s2q4",
            "Crop_Area_ha",
            "Harvested_Crop_Area_ha",
            "Yield",
        ]

        total = len(df)
        start = (page - 1) * page_size

        records = df[columns].iloc[
            start:start + page_size
        ].copy()

        records = records.rename(
            columns={
                "s1q1": "province",
                "s1q2": "district",
                "s2q4": "crop",
                "Crop_Area_ha": "crop_area_ha",
                "Harvested_Crop_Area_ha": "harvested_area_ha",
                "Yield": "yield",
            }
        )

        records = records.astype(object).where(
            pd.notna(records), None
        )

        return {
            "total": int(total),
            "page": page,
            "page_size": page_size,
            "items": records.to_dict(orient="records"),
        }