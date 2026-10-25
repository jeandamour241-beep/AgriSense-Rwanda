from pathlib import Path
import joblib
import pandas as pd
from huggingface_hub import hf_hub_download


class CropFusionEngine:

    def __init__(self):

        # PATHS
        
        self.base_dir = Path(__file__).resolve().parents[3]


        self.data_path = (
            self.base_dir
            / "data"
            / "agrisystem"
            / "agriculture_features_v2.csv"
        )

        
        # HUGGING FACE MODEL REPOSITORY
        self.repo_id = "tuyisenge1j/AgriSense"

        # DOWNLOAD EXACT CROP MODEL
        self.exact_model, self.exact_features = self._load_model(
            "crop_recommendation_model.joblib"
        )
        self.category_model, self.category_features = self._load_model(
            "crop_category_model.joblib"
        )

        
        # LOAD HISTORICAL DATA
        
        self.data = pd.read_csv(
            self.data_path,
            low_memory=False
        )

    def _load_model(self, filename):
        try:
            model_path = hf_hub_download(
                repo_id=self.repo_id,
                filename=filename,
                repo_type="model",
            )
            artifact = joblib.load(model_path)
        except Exception as error:
            raise RuntimeError(
                f"Unable to download or load '{filename}' from Hugging Face "
                f"repository '{self.repo_id}': {error}"
            ) from error

        if not isinstance(artifact, dict) or not {"model", "features"}.issubset(artifact):
            raise ValueError(
                f"Model artifact '{filename}' must contain 'model' and 'features'."
            )
        if not hasattr(artifact["model"], "predict_proba"):
            raise ValueError(
                f"Model artifact '{filename}' does not contain a probability-capable model."
            )
        if not hasattr(artifact["model"], "named_steps"):
            raise ValueError(f"Model artifact '{filename}' is missing its expected pipeline.")
        expected_step = "classifier" if filename == "crop_recommendation_model.joblib" else "model"
        if expected_step not in artifact["model"].named_steps:
            raise ValueError(
                f"Model artifact '{filename}' is missing pipeline step '{expected_step}'."
            )
        if not artifact["features"]:
            raise ValueError(f"Model artifact '{filename}' has no feature list.")
        return artifact["model"], artifact["features"]

    
    # ML PREDICTION
    

    def _prepare_input(self, user_input, features):

        row = {}

        for feature in features:
            row[feature] = user_input.get(
                feature,
                None
            )

        return pd.DataFrame([row])


    def exact_crop_predictions(
        self,
        user_input,
        top_n=10
    ):

        X = self._prepare_input(
            user_input,
            self.exact_features
        )

        probabilities = (
            self.exact_model
            .predict_proba(X)[0]
        )

        classes = (
            self.exact_model
            .named_steps["classifier"]
            .classes_
        )

        results = []

        for crop, probability in zip(
            classes,
            probabilities
        ):

            results.append({
                "crop": crop,
                "ml_score": float(probability)
            })

        results.sort(
            key=lambda x: x["ml_score"],
            reverse=True
        )

        return results[:top_n]

    
    # CATEGORY ML
    

    def category_predictions(
        self,
        user_input,
        top_n=10
    ):

        X = self._prepare_input(
            user_input,
            self.category_features
        )

        probabilities = (
            self.category_model
            .predict_proba(X)[0]
        )

        classes = (
            self.category_model
            .named_steps["model"]
            .classes_
        )

        results = []

        for category, probability in zip(
            classes,
            probabilities
        ):

            results.append({
                "category": category,
                "category_score": float(probability)
            })

        results.sort(
            key=lambda x: x["category_score"],
            reverse=True
        )

        return results[:top_n]

    
    # HISTORICAL RECOMMENDATION
    

    def historical_predictions(
        self,
        user_input,
        top_n=10
    ):

        district = user_input.get("s1q2")
        season = user_input.get("season")

        filtered = self.data.copy()

        
        # REQUIRED FILTERS
        

        if district is not None:
            filtered = filtered[
                filtered["s1q2"].astype(str)
                == str(district)
            ]

        if season is not None:
            filtered = filtered[
                filtered["season"].astype(str)
                == str(season)
            ]

        
        # OPTIONAL FILTERS
        

        optional_filters = [
            "s4q13",
            "s4q1",
            "s4q6"
        ]

        for feature in optional_filters:

            value = user_input.get(feature)

            if value is not None:

                temp = filtered[
                    filtered[feature].astype(str)
                    == str(value)
                ]

                # Don't destroy the search if
                # there are no matching observations.
                if len(temp) >= 20:
                    filtered = temp

        if len(filtered) == 0:
            return []

        
        # COUNT HISTORICAL CROPS
        

        grouped = (
            filtered
            .groupby(
                ["s2q4", "CropCategory"],
                dropna=True
            )
            .size()
            .reset_index(name="count")
        )

        total = grouped["count"].sum()

        grouped["historical_frequency"] = (
            grouped["count"] / total
        )

        max_frequency = (
            grouped["historical_frequency"]
            .max()
        )

        if max_frequency > 0:

            grouped["historical_score"] = (
                grouped["historical_frequency"]
                / max_frequency
            )

        else:

            grouped["historical_score"] = 0

        grouped = grouped.sort_values(
            "historical_score",
            ascending=False
        )

        results = []

        for _, row in grouped.head(top_n).iterrows():

            results.append({
                "crop": row["s2q4"],
                "category": row["CropCategory"],
                "historical_count": int(row["count"]),
                "historical_frequency":
                    float(row["historical_frequency"]),
                "historical_score":
                    float(row["historical_score"])
            })

        return results

    
    # FUSION
    

    def recommend(
        self,
        user_input,
        top_n=5
    ):

        exact = self.exact_crop_predictions(
            user_input,
            top_n=20
        )

        category = self.category_predictions(
            user_input,
            top_n=20
        )

        historical = self.historical_predictions(
            user_input,
            top_n=20
        )

        
        # CONVERT RESULTS TO LOOKUP TABLES
        

        exact_map = {
            item["crop"]: item["ml_score"]
            for item in exact
        }

        category_map = {
            item["category"]: item["category_score"]
            for item in category
        }

        historical_map = {
            item["crop"]: item
            for item in historical
        }

        
        # COLLECT ALL CANDIDATE CROPS
        

        candidates = set()

        candidates.update(
            exact_map.keys()
        )

        candidates.update(
            item["crop"]
            for item in historical
        )

        
        # FUSION
        

        results = []

        for crop in candidates:

            exact_score = exact_map.get(
                crop,
                0.0
            )

            historical_info = historical_map.get(
                crop
            )

            if historical_info:

                historical_score = (
                    historical_info[
                        "historical_score"
                    ]
                )

                category = (
                    historical_info["category"]
                )

            else:

                historical_score = 0.0
                category = None

            category_score = category_map.get(
                category,
                0.0
            )

            # -----------------------------------------------------
            # WEIGHTS
            # -----------------------------------------------------
            #
            # Historical evidence:
            #       40%
            #
            # Exact-crop ML:
            #       30%
            #
            # Category ML:
            #       30%
            #
            # This is a ranking score,
            # NOT a probability.
            # -----------------------------------------------------

            fusion_score = (
                0.40 * historical_score
                + 0.30 * exact_score
                + 0.30 * category_score
            )

            results.append({

                "crop": crop,

                "category": category,

                "historical_score":
                    round(
                        historical_score,
                        4
                    ),

                "exact_ml_score":
                    round(
                        exact_score,
                        4
                    ),

                "category_ml_score":
                    round(
                        category_score,
                        4
                    ),

                "fusion_score":
                    round(
                        fusion_score,
                        4
                    ),

                "historical_count":
                    (
                        historical_info[
                            "historical_count"
                        ]
                        if historical_info
                        else 0
                    ),

                "historical_frequency":
                    (
                        historical_info[
                            "historical_frequency"
                        ]
                        if historical_info
                        else 0.0
                    )
            })

        
        # FINAL SORT
        

        results.sort(
            key=lambda x: x["fusion_score"],
            reverse=True
        )

        return results[:top_n]
