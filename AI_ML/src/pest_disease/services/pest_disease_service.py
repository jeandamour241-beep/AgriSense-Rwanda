
import joblib
import pandas as pd
from huggingface_hub import hf_hub_download


class PestDiseaseService:
    """
    Pest / Disease Early Warning prediction service.

    Uses the trained V3 Random Forest model.

    Training target:
        s2q42 > 0  -> pest/disease damage risk
        s2q42 == 0 -> no recorded damage
    """

    REPO_ID = "tuyisenge1j/AgriSense"
    MODEL_FILENAME = "pest_disease_early_warning_v3.joblib"

    FEATURES = [
        "s1q1",
        "s1q2",
        "s1q3",
        "season",
        "s2q2",
        "s2q4",
        "s2q7",
        "s2q11",
        "s3q1",
        "s3q7",
        "s3q8",
        "s3q9",
        "s4q1",
        "s4q2",
        "s4q3",
        "s4q4",
        "s4q6",
        "s4q8",
        "s4q13",
    ]

    def __init__(self):
        # Download the model from Hugging Face.
        # The downloaded file is cached locally.
        self.model_path = hf_hub_download(
            repo_id=self.REPO_ID,
            filename=self.MODEL_FILENAME,
            repo_type="model",
        )

        artifact = joblib.load(self.model_path)

        # Training normally saves a dictionary containing
        # the model and its decision threshold.
        if isinstance(artifact, dict):
            if "model" not in artifact:
                raise KeyError(
                    "Pest/disease model artifact does not contain "
                    "the 'model' key."
                )

            self.model = artifact["model"]
            self.threshold = float(
                artifact.get("threshold", 0.50)
            )
            self.features = artifact.get(
                "features", self.FEATURES
            )
        else:
            # Support a directly saved model as a fallback.
            self.model = artifact
            self.threshold = 0.50
            self.features = self.FEATURES

        if not hasattr(self.model, "predict_proba"):
            raise TypeError(
                "The pest/disease model must support predict_proba()."
            )

        if not 0 <= self.threshold <= 1:
            raise ValueError(
                f"Invalid model threshold: {self.threshold}"
            )

        print("Pest/Disease model loaded successfully.")
        print(f"Model path: {self.model_path}")
        print(f"Decision threshold: {self.threshold:.2f}")

    def _validate_input(self, data: dict) -> None:
        if not isinstance(data, dict):
            raise TypeError("Input data must be a dictionary.")

        missing = [
            feature
            for feature in self.features
            if feature not in data
        ]

        if missing:
            raise ValueError(
                f"Missing required features: {missing}"
            )

    @staticmethod
    def _risk_level(probability: float) -> str:
        """
        Convert probability into a presentation risk level.
        These levels do not change the model's trained target.
        """
        if probability >= 0.75:
            return "CRITICAL"

        if probability >= 0.50:
            return "HIGH"

        if probability >= 0.30:
            return "MEDIUM"

        return "LOW"

    def predict(self, data: dict) -> dict:
        """Generate a pest/disease damage-risk prediction."""

        self._validate_input(data)

        # Preserve the feature order used by the trained model.
        input_data = {
            feature: data[feature]
            for feature in self.features
        }

        X = pd.DataFrame(
            [input_data],
            columns=self.features,
        )

        probabilities = self.model.predict_proba(X)[0]

        # Find the probability of the positive class (damage risk).
        # Do not assume the positive class is always at index 1.
        if hasattr(self.model, "classes_"):
            classes = list(self.model.classes_)
        elif hasattr(self.model, "named_steps"):
            final_estimator = list(
                self.model.named_steps.values()
            )[-1]
            classes = list(final_estimator.classes_)
        else:
            raise AttributeError(
                "Cannot determine model classes for predict_proba()."
            )

        positive_index = next(
            (
                index
                for index, label in enumerate(classes)
                if str(label).strip() in ("1", "True")
                or label == 1
                or label is True
            ),
            None,
        )

        if positive_index is None:
            raise ValueError(
                "Could not identify the positive class (1) "
                f"in model classes: {classes}"
            )

        probability = float(probabilities[positive_index])

        prediction = int(probability >= self.threshold)
        risk_level = self._risk_level(probability)

        return {
            "prediction": prediction,
            "risk_probability": round(probability, 4),
            "risk_percentage": round(probability * 100, 2),
            "risk_level": risk_level,
            "threshold": self.threshold,
            "model": "Random Forest V3",
            "note": (
                "This prediction estimates pest/disease damage risk "
                "from historical agricultural survey features. "
                "It is not a real-time field inspection or a "
                "confirmed diagnosis."
            ),
        }


if __name__ == "__main__":
    service = PestDiseaseService()

    # Example values only. Ensure categorical values match
    # the values and formats used during model training.
    test_input = {
        "s1q1": "West",
        "s1q2": "Nyabihu",
        "s1q3": "Stratum 1",
        "season": "Season A",
        "s2q2": 0.8,
        "s2q4": "Irish potato",
        "s2q7": "Normal",
        "s2q11": "Improved seed",
        "s3q1": "Yes",
        "s3q7": "Yes",
        "s3q8": "No",
        "s3q9": "Yes",
        "s4q1": "Low",
        "s4q2": "No",
        "s4q3": "No",
        "s4q4": "No",
        "s4q6": "Yes",
        "s4q8": "No",
        "s4q13": "No",
    }

    result = service.predict(test_input)

    print("\nPEST / DISEASE EARLY WARNING")
    print("-" * 40)

    for key, value in result.items():
        print(f"{key}: {value}")
