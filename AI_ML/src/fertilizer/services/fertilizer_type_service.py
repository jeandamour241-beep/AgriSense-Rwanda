from pathlib import Path

import pandas as pd


class FertilizerTypeService:

    # =========================================================
    # PATH
    # =========================================================

    BASE_DIR = Path(__file__).resolve().parents[3]

    DATA_PATH = (
        BASE_DIR
        / "data"
        / "all_data"
        / "all_seasons_cleaned_merged.csv"
    )

    # =========================================================
    # FEATURES USED TO FIND SIMILAR HISTORICAL RECORDS
    # =========================================================

    CONTEXT_FEATURES = [
        "s1q1",      # Province
        "s1q2",      # District
        "s1q3",      # Stratum
        "season",
        "s2q2",      # Plot area
        "s2q4",      # Crop
        "s2q7",      # Sowing period
        "s2q11",     # Seed type
        "s4q1",      # Erosion
        "s4q6",      # Consolidated site
    ]

    # =========================================================
    # ORGANIC FERTILIZER
    # =========================================================

    ORGANIC_COLUMN = "s3q2b"

    # =========================================================
    # INORGANIC FERTILIZER
    #
    # Questionnaire allows multiple fertilizer types.
    # The dataset stores them in multiple columns.
    # =========================================================

    INORGANIC_COLUMNS = [
        "s3q101",
        "s3q102",
        "s3q103",
        "s3q104",
    ]

    def __init__(self):

        if not self.DATA_PATH.exists():
            raise FileNotFoundError(
                f"Fertilizer dataset not found: "
                f"{self.DATA_PATH}"
            )

        print("Loading fertilizer historical data...")

        self.data = pd.read_csv(
            self.DATA_PATH,
            low_memory=False,
        )

        print(
            f"Fertilizer historical data loaded: "
            f"{self.data.shape}"
        )

    # =========================================================
    # NORMALIZE VALUES
    # =========================================================

    @staticmethod
    def _clean_value(value):

        if pd.isna(value):
            return None

        value = str(value).strip()

        if not value:
            return None

        return value

    # =========================================================
    # BUILD INPUT ROW
    # =========================================================

    def _prepare_input(self, user_input):

        row = {}

        for feature in self.CONTEXT_FEATURES:
            row[feature] = user_input.get(
                feature
            )

        return row

    # =========================================================
    # FILTER HISTORICAL DATA
    # =========================================================

    def _filter_history(
        self,
        user_input,
        strategy=None,
    ):

        df = self.data.copy()

        # OPTIONAL STRATEGY FILTER
        #
        # This is derived from the strategy model:
        #
        # BOTH
        # ORGANIC_ONLY
        # INORGANIC_ONLY
        # NONE
        #
        # We recreate it from historical data only for filtering.

        if strategy is not None:

            organic = (
                df["s3q3"]
                .astype(str)
                .str.strip()
                .str.lower()
            )

            inorganic = (
                df["s3q9"]
                .astype(str)
                .str.strip()
                .str.lower()
            )

            organic_yes = organic.isin(
                ["yes", "1", "1.0"]
            )

            inorganic_yes = inorganic.isin(
                ["yes", "1", "1.0"]
            )

            if strategy == "BOTH":

                df = df[
                    organic_yes
                    & inorganic_yes
                ]

            elif strategy == "ORGANIC_ONLY":

                df = df[
                    organic_yes
                    & ~inorganic_yes
                ]

            elif strategy == "INORGANIC_ONLY":

                df = df[
                    ~organic_yes
                    & inorganic_yes
                ]

            elif strategy == "NONE":

                df = df[
                    ~organic_yes
                    & ~inorganic_yes
                ]

        # REMOVE UNKNOWN STRATEGY

        return df

    # =========================================================
    # SIMILARITY LEVELS
    # =========================================================

    def _candidate_filters(
        self,
        user_input,
    ):

        filters = []

        # LEVEL 1
        # District + Crop + Season

        filters.append(
            [
                "s1q2",
                "s2q4",
                "season",
            ]
        )

        # LEVEL 2
        # District + Crop

        filters.append(
            [
                "s1q2",
                "s2q4",
            ]
        )

        # LEVEL 3
        # Crop + Season

        filters.append(
            [
                "s2q4",
                "season",
            ]
        )

        # LEVEL 4
        # Crop

        filters.append(
            [
                "s2q4",
            ]
        )

        # LEVEL 5
        # District

        filters.append(
            [
                "s1q2",
            ]
        )

        # LEVEL 6
        # Season

        filters.append(
            [
                "season",
            ]
        )

        return filters

    # =========================================================
    # APPLY FILTER
    # =========================================================

    def _apply_filter(
        self,
        df,
        user_input,
        columns,
    ):

        result = df.copy()

        for column in columns:

            value = user_input.get(
                column
            )

            if value is None:
                continue

            value = str(value).strip()

            result = result[
                result[column]
                .astype(str)
                .str.strip()
                .eq(value)
            ]

        return result

    # =========================================================
    # ORGANIC TYPE RANKING
    # =========================================================

    def recommend_organic_types(
        self,
        user_input,
        strategy=None,
        top_n=5,
        minimum_records=20,
    ):

        base = self._filter_history(
            user_input,
            strategy=strategy,
        )

        filters = self._candidate_filters(
            user_input
        )

        selected = None
        selected_level = None

        # Find the most specific useful historical group

        for filter_columns in filters:

            candidate = self._apply_filter(
                base,
                user_input,
                filter_columns,
            )

            if len(candidate) >= minimum_records:

                selected = candidate

                selected_level = (
                    filter_columns
                )

                break

        # Fallback to all available history

        if selected is None:

            selected = base

            selected_level = [
                "ALL_AVAILABLE_HISTORY"
            ]

        if len(selected) == 0:

            return {
                "available": False,
                "message": (
                    "No historical organic "
                    "fertilizer records found."
                ),
                "recommendations": [],
            }

        # Remove missing values

        values = (
            selected[
                self.ORGANIC_COLUMN
            ]
            .dropna()
            .astype(str)
            .str.strip()
        )

        values = values[
            values != ""
        ]

        if len(values) == 0:

            return {
                "available": False,
                "message": (
                    "No organic fertilizer "
                    "type information available."
                ),
                "recommendations": [],
            }

        # Frequency

        counts = (
            values
            .value_counts()
        )

        total = counts.sum()

        recommendations = []

        for fertilizer_type, count in (
            counts.head(top_n).items()
        ):

            percentage = (
                count / total * 100
            )

            recommendations.append(
                {
                    "type": fertilizer_type,
                    "historical_count": int(count),
                    "historical_percentage": round(
                        float(percentage),
                        2,
                    ),
                }
            )

        return {
            "available": True,
            "records_used": int(len(selected)),
            "matching_level": selected_level,
            "recommendations": recommendations,
        }

    # =========================================================
    # INORGANIC TYPE RANKING
    # =========================================================

    def recommend_inorganic_types(
        self,
        user_input,
        strategy=None,
        top_n=5,
        minimum_records=20,
    ):

        base = self._filter_history(
            user_input,
            strategy=strategy,
        )

        filters = self._candidate_filters(
            user_input
        )

        selected = None
        selected_level = None

        # Find useful historical group

        for filter_columns in filters:

            candidate = self._apply_filter(
                base,
                user_input,
                filter_columns,
            )

            if len(candidate) >= minimum_records:

                selected = candidate

                selected_level = (
                    filter_columns
                )

                break

        # Fallback

        if selected is None:

            selected = base

            selected_level = [
                "ALL_AVAILABLE_HISTORY"
            ]

        if len(selected) == 0:

            return {
                "available": False,
                "message": (
                    "No historical inorganic "
                    "fertilizer records found."
                ),
                "recommendations": [],
            }

        # Collect multiple fertilizer columns

        fertilizer_values = []

        for column in self.INORGANIC_COLUMNS:

            if column not in selected.columns:
                continue

            values = (
                selected[column]
                .dropna()
                .astype(str)
                .str.strip()
            )

            values = values[
                values != ""
            ]

            fertilizer_values.extend(
                values.tolist()
            )

        if not fertilizer_values:

            return {
                "available": False,
                "message": (
                    "No inorganic fertilizer "
                    "type information available."
                ),
                "recommendations": [],
            }

        # Frequency

        counts = (
            pd.Series(
                fertilizer_values
            )
            .value_counts()
        )

        total = counts.sum()

        recommendations = []

        for fertilizer_type, count in (
            counts.head(top_n).items()
        ):

            percentage = (
                count / total * 100
            )

            recommendations.append(
                {
                    "type": fertilizer_type,
                    "historical_count": int(count),
                    "historical_percentage": round(
                        float(percentage),
                        2,
                    ),
                }
            )

        return {
            "available": True,
            "records_used": int(len(selected)),
            "matching_level": selected_level,
            "recommendations": recommendations,
        }

    # =========================================================
    # COMPLETE RECOMMENDATION
    # =========================================================

    def recommend(
        self,
        user_input,
        strategy=None,
    ):

        result = {
            "strategy": strategy,
            "organic": None,
            "inorganic": None,
        }

        # ORGANIC

        if strategy in [
            "ORGANIC_ONLY",
            "BOTH",
        ]:

            result["organic"] = (
                self.recommend_organic_types(
                    user_input=user_input,
                    strategy=strategy,
                    top_n=5,
                )
            )

        # INORGANIC

        if strategy in [
            "INORGANIC_ONLY",
            "BOTH",
        ]:

            result["inorganic"] = (
                self.recommend_inorganic_types(
                    user_input=user_input,
                    strategy=strategy,
                    top_n=5,
                )
            )

        return result