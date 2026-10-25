
from pathlib import Path

import joblib
import pandas as pd
from huggingface_hub import hf_hub_download

from src.irrigation.advice.historical_irrigation_advice import (
    HistoricalIrrigationAdvice,
)


class IrrigationRecommendationService:
    """
    Irrigation Recommendation Service.

    Combines:
    1. ML irrigation decision model.
    2. Historical irrigation advice.

    Uses the existing trained model and historical advice engine.
    Does not create a new dataset.
    """

    REPO_ID = "tuyisenge1j/AgriSense"
    MODEL_FILENAME = "irrigation_decision_model.joblib"

    DEFAULT_FEATURES = [
        "s1q1",
        "s1q2",
        "s1q3",
        "season",
        "s2q2",
        "s2q4",
        "s2q7",
        "s2q11",
        "s4q1",
        "s4q6",
    ]

    def __init__(self):
        # Download from Hugging Face and reuse its local cache.
        downloaded_model_path = hf_hub_download(
            repo_id=self.REPO_ID,
            filename=self.MODEL_FILENAME,
            repo_type="model",
        )

        self.model_path = Path(downloaded_model_path)

        # Load the existing trained artifact.
        artifact = joblib.load(self.model_path)

        if not isinstance(artifact, dict):
            raise TypeError(
                "Invalid irrigation model artifact. "
                "Expected a dictionary."
            )

        if "pipeline" not in artifact:
            raise KeyError(
                "The irrigation model artifact does not contain "
                "'pipeline'."
            )

        # Actual trained sklearn pipeline.
        self.model = artifact["pipeline"]

        # Training metadata.
        self.features = artifact.get(
            "features",
            self.DEFAULT_FEATURES,
        )

        self.target = artifact.get("target", "s4q14")

        self.group_column = artifact.get(
            "group_column",
            "Segment_ID",
        )

        self.model_metrics = artifact.get("metrics", {})
        self.training_filter = artifact.get("filter", {})

        # Keep the existing historical advice engine.
        self.historical_advice = HistoricalIrrigationAdvice()

        print("Irrigation decision model loaded successfully.")
        print(f"Model path: {self.model_path}")

    def predict(self, user_input: dict) -> dict:
        """
        Generate an irrigation recommendation.

        user_input must contain all features required by the
        trained model.
        """
        if not isinstance(user_input, dict):
            raise TypeError("user_input must be a dictionary.")

        # Validate required features.
        missing_features = [
            feature
            for feature in self.features
            if feature not in user_input
        ]

        if missing_features:
            raise ValueError(
                "Missing required irrigation features: "
                f"{missing_features}"
            )

        # Build input with the exact training feature order.
        model_input = pd.DataFrame(
            [
                {
                    feature: user_input[feature]
                    for feature in self.features
                }
            ],
            columns=self.features,
        )

        # Predict irrigation decision.
        prediction = str(
            self.model.predict(model_input)[0]
        ).strip()

        probability_yes = None
        confidence = None

        # Calculate probabilities when supported.
        if hasattr(self.model, "predict_proba"):
            probabilities = self.model.predict_proba(
                model_input
            )[0]

            if hasattr(self.model, "classes_"):
                classes = [
                    str(value).strip()
                    for value in self.model.classes_
                ]
            elif hasattr(self.model, "named_steps"):
                final_estimator = list(
                    self.model.named_steps.values()
                )[-1]

                classes = [
                    str(value).strip()
                    for value in final_estimator.classes_
                ]
            else:
                classes = []

            # Find the probability for the positive "Yes" class.
            yes_index = next(
                (
                    index
                    for index, value in enumerate(classes)
                    if value.casefold() == "yes"
                ),
                None,
            )

            if yes_index is not None:
                probability_yes = float(
                    probabilities[yes_index]
                )

            confidence = float(max(probabilities))

        # Preserve the existing decision logic.
        irrigation_needed = prediction.casefold() == "yes"

        if irrigation_needed:
            decision = "IRRIGATION RECOMMENDED"
        else:
            decision = "IRRIGATION NOT RECOMMENDED"

        # Historical advice is only provided when irrigation
        # is recommended.
        historical_advice = None

        if irrigation_needed:
            historical_advice = (
                self.historical_advice.get_advice(user_input)
            )

        return {
            "decision": decision,
            "irrigation_needed": irrigation_needed,
            "prediction": prediction,
            "confidence": (
                round(confidence * 100, 2)
                if confidence is not None
                else None
            ),
            "probability_irrigation": (
                round(probability_yes * 100, 2)
                if probability_yes is not None
                else None
            ),
            "historical_advice": historical_advice,
            "model": {
                "target": self.target,
                "features": self.features,
                "metrics": self.model_metrics,
            },
            "note": (
                "The irrigation decision is based on a trained "
                "machine-learning model using historical Rwanda "
                "agricultural survey data. Historical irrigation "
                "technique, water source, irrigation tool and cost "
                "information are provided only when irrigation is "
                "recommended. These historical recommendations do "
                "not represent real-time weather or soil-moisture "
                "predictions."
            ),
        }

    @staticmethod
    def print_result(result: dict) -> None:
        """Print the recommendation in a readable format."""

        print()
        print("=" * 80)
        print("IRRIGATION RECOMMENDATION")
        print("=" * 80)

        print(f"\nDecision: {result['decision']}")
        print(f"Irrigation needed: {result['irrigation_needed']}")
        print(f"Prediction: {result['prediction']}")

        confidence = result.get("confidence")
        print(
            "Confidence: "
            f"{confidence}%" if confidence is not None
            else "Confidence: N/A"
        )

        probability = result.get("probability_irrigation")
        print(
            "Probability of irrigation: "
            f"{probability}%" if probability is not None
            else "Probability of irrigation: N/A"
        )

        print()
        print("-" * 80)
        print("HISTORICAL IRRIGATION ADVICE")
        print("-" * 80)

        advice = result.get("historical_advice")

        if not advice:
            print("No historical irrigation advice provided.")
        else:
            print(
                "\nHistorical observations:",
                advice.get("observations", "N/A"),
            )

            sections = [
                ("Technique", "technique"),
                ("Water source", "water_source"),
                ("Irrigation tool", "irrigation_tool"),
            ]

            for label, key in sections:
                item = advice.get(key)
                print(f"\n{label}:")

                if item:
                    print(f"  Label: {item.get('label', 'N/A')}")
                    print(
                        "  Historical usage: "
                        f"{item.get('percentage', 'N/A')}%"
                    )
                    print(
                        "  Observations: "
                        f"{item.get('count', 'N/A')}"
                    )
                else:
                    print("  No historical data.")

            cost = advice.get("historical_cost")
            print("\nHistorical irrigation cost:")

            if cost:
                for key in (
                    "observations",
                    "q25",
                    "median",
                    "q75",
                    "min",
                    "max",
                ):
                    print(f"  {key}: {cost.get(key, 'N/A')}")
            else:
                print("  No historical cost data.")

            advice_note = advice.get("note")
            if advice_note:
                print("\nAdvice note:")
                print(advice_note)

        print()
        print("-" * 80)
        print("NOTE")
        print("-" * 80)
        print(result["note"])
        print("=" * 80)


if __name__ == "__main__":
    print("=" * 80)
    print("LOADING IRRIGATION RECOMMENDATION SERVICE")
    print("=" * 80)

    try:
        service = IrrigationRecommendationService()

        print("\nModel loaded successfully.")
        print(f"Model path: {service.model_path}")
        print(f"Target: {service.target}")
        print(f"Features: {service.features}")
        print(f"Training metrics: {service.model_metrics}")

        # Example test input. These values must match the
        # categories and formats used during model training.
        test_input = {
            "s1q1": "West",
            "s1q2": "Nyabihu",
            "s1q3": "Stratum 1",
            "season": "Season A",
            "s2q2": 0.8,
            "s2q4": "Irish potato",
            "s2q7": "Normal",
            "s2q11": "Improved seed",
            "s4q1": "Low",
            "s4q6": "Yes",
        }

        print("\nTEST INPUT")
        print("-" * 80)

        for key, value in test_input.items():
            print(f"{key}: {value}")

        result = service.predict(test_input)
        service.print_result(result)

    except Exception as error:
        print("\n" + "=" * 80)
        print("ERROR")
        print("=" * 80)
        print(type(error).__name__)
        print(str(error))
        raise
