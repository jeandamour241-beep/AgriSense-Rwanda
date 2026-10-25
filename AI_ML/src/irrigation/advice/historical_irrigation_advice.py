from pathlib import Path

import pandas as pd


class HistoricalIrrigationAdvice:

    TECHNIQUE_MAP = {
        "1": "Surface irrigation",
        "2": "Flood irrigation",
        "3": "Drip irrigation",
        "4": "Sprinkler irrigation",
        "5": "Pivot irrigation",
        "6": "Traditional techniques",
    }

    WATER_SOURCE_MAP = {
        "1": "Rainwater harvesting",
        "2": "Water treatment plant",
        "3": "Underground water",
        "4": "Lake/stream water",
        "5": "Water catchment (dam)",
        "6": "Other source",
    }

    TOOL_MAP = {
        "1": "Irrigation machine",
        "2": "Moto pump",
        "3": "Tube wells",
        "4": "Water can",
        "5": "Water channels",
        "6": "Jerycan/basin",
        "7": "Another tool",
    }

    def __init__(self):

        base_dir = Path(__file__).resolve().parents[3]

        self.data_path = (
            base_dir
            / "data"
            / "agrisystem"
            / "agriculture_features_v2.csv"
        )

        self.df = pd.read_csv(
            self.data_path,
            low_memory=False,
        )

        # Only historical plots that actually
        # practiced irrigation.
        self.df = self.df[
            self.df["s4q13"]
            .astype(str)
            .str.strip()
            .str.lower()
            .isin(["yes", "1"])
        ].copy()

        # Keep only rows where plot irrigation
        # decision is Yes.
        self.df = self.df[
            self.df["s4q14"]
            .astype(str)
            .str.strip()
            .str.lower()
            .isin(["yes", "1"])
        ].copy()

    # ========================================================
    # NORMALIZATION
    # ========================================================

    @staticmethod
    def normalize(value):

        if value is None:
            return None

        value = str(value).strip()

        if value == "":
            return None

        return value

    # ========================================================
    # FILTER SIMILAR HISTORICAL PLOTS
    # ========================================================

    def find_similar_plots(
        self,
        user_input,
        min_observations=20,
    ):

        filters = [
            "s1q2",
            "season",
            "s2q4",
        ]

        filtered = self.df.copy()

        
        # First: strongest contextual filters
        

        for column in filters:

            value = self.normalize(
                user_input.get(column)
            )

            if value is None:
                continue

            candidate = filtered[
                filtered[column]
                .astype(str)
                .str.strip()
                .str.lower()
                == value.lower()
            ]

            # Only apply the filter if it does not
            # destroy historical coverage.
            if len(candidate) >= min_observations:
                filtered = candidate

        
        # Optional contextual filters
        

        optional_filters = [
            "s4q1",
            "s4q6",
        ]

        for column in optional_filters:

            value = self.normalize(
                user_input.get(column)
            )

            if value is None:
                continue

            candidate = filtered[
                filtered[column]
                .astype(str)
                .str.strip()
                .str.lower()
                == value.lower()
            ]

            if len(candidate) >= min_observations:
                filtered = candidate

        
        # Area similarity
        

        area = user_input.get("s2q2")

        if area is not None:

            try:

                area = float(area)

                filtered = filtered.copy()

                filtered["_area_distance"] = (
                    filtered["s2q2"]
                    .astype(float)
                    .sub(area)
                    .abs()
                )

                # Keep closest historical observations.
                filtered = filtered.sort_values(
                    "_area_distance"
                )

            except (
                ValueError,
                TypeError,
            ):
                pass

        return filtered

    # ========================================================
    # MOST COMMON CATEGORY
    # ========================================================

    def _most_common(
    self,
    df,
    column,
    mapping,
    ):

        if df.empty:
            return None

        values = (
            df[column]
            .dropna()
            .astype(str)
            .str.strip()
        )

        values = values[
            ~values.str.lower().isin(
                [
                    "",
                    "nan",
                    "none",
                    "null",
                ]
            )
        ]

        if values.empty:
            return None

        counts = values.value_counts()

        raw_value = counts.index[0]
        top_count = int(counts.iloc[0])

        total = int(counts.sum())

        percentage = (
            top_count / total * 100
        )

    # --------------------------------------------
    # Normalize values such as:
    # "5.0" -> "5"
    # "2.0" -> "2"
    # --------------------------------------------

        normalized_code = raw_value

        try:
            numeric_value = float(raw_value)

            if numeric_value.is_integer():
                normalized_code = str(
                int(numeric_value)
                )

        except (ValueError, TypeError):
            pass

    # --------------------------------------------
    # If dataset already contains the full label,
    # preserve it.
    # --------------------------------------------

        if raw_value in mapping:
            label = mapping[raw_value]

        elif normalized_code in mapping:
            label = mapping[normalized_code]

        else:
            label = raw_value

        return {
            "code": normalized_code,
            "label": label,
            "count": top_count,
            "percentage": round(
                percentage,
                2,
            ),
        }

    # ========================================================
    # HISTORICAL COST
    # ========================================================

    def _cost_summary(self, df):

        if df.empty:
            return None

        if "s4q18" not in df.columns:
            return None

        cost = pd.to_numeric(
            df["s4q18"],
            errors="coerce",
        ).dropna()

        # Remove negative/invalid values.
        cost = cost[cost >= 0]

        if cost.empty:
            return None

        q25 = cost.quantile(0.25)
        median = cost.median()
        q75 = cost.quantile(0.75)

        return {
            "observations": int(len(cost)),
            "q25": round(float(q25), 2),
            "median": round(
                float(median),
                2,
            ),
            "q75": round(
                float(q75),
                2,
            ),
            "min": round(
                float(cost.min()),
                2,
            ),
            "max": round(
                float(cost.max()),
                2,
            ),
        }

    # ========================================================
    # MAIN ADVICE
    # ========================================================

    def get_advice(self, user_input):

        similar = self.find_similar_plots(
            user_input
        )

        observations = len(similar)

        technique = self._most_common(
            similar,
            "s4q15",
            self.TECHNIQUE_MAP,
        )

        water_source = self._most_common(
            similar,
            "s4q16",
            self.WATER_SOURCE_MAP,
        )

        irrigation_tool = self._most_common(
            similar,
            "s4q17",
            self.TOOL_MAP,
        )

        cost = self._cost_summary(
            similar
        )

        return {
            "historical_observations": observations,

            "technique": technique,

            "water_source": water_source,

            "irrigation_tool": irrigation_tool,

            "historical_cost": cost,

            "note": (
                "These recommendations are based on "
                "historical NISR agricultural survey "
                "patterns among similar irrigated plots. "
                "They do not represent real-time weather "
                "or soil-moisture predictions."
            ),
        }



# TEST


if __name__ == "__main__":

    engine = HistoricalIrrigationAdvice()

    test_input = {
        "s1q2": "Huye",
        "season": "Season A",
        "s2q4": "Maize",
        "s2q2": 0.8,
        "s4q1": "Low",
        "s4q6": "Yes",
    }

    result = engine.get_advice(
        test_input
    )

    print("\n" + "=" * 80)
    print("HISTORICAL IRRIGATION ADVICE")
    print("=" * 80)

    print(
        f"\nHistorical observations: "
        f"{result['historical_observations']}"
    )

    print("\nTechnique:")
    print(result["technique"])

    print("\nWater source:")
    print(result["water_source"])

    print("\nIrrigation tool:")
    print(result["irrigation_tool"])

    print("\nHistorical cost:")
    print(result["historical_cost"])

    print("\nNote:")
    print(result["note"])