
from pathlib import Path

import joblib
import pandas as pd
from huggingface_hub import hf_hub_download

from src.fertilizer.services.fertilizer_type_service import (
    FertilizerTypeService,
)


class FertilizerRecommendationService:
    FEATURES = [
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

    REPO_ID = "tuyisenge1j/AgriSense"
    MODEL_FILENAME = "fertilizer_strategy_model.joblib"

    def __init__(self):
        model_path = hf_hub_download(
            repo_id=self.REPO_ID,
            filename=self.MODEL_FILENAME,
            repo_type="model",
        )

        artifact = joblib.load(model_path)

        if isinstance(artifact, dict):
            self.model = artifact["model"]
            self.features = artifact.get(
                "features", self.FEATURES
            )
        else:
            self.model = artifact
            self.features = self.FEATURES

        self.type_service = FertilizerTypeService()

        print("Fertilizer strategy model loaded successfully.")

    def _validate_input(self, data: dict):
        missing = [
            feature
            for feature in self.features
            if feature not in data
        ]

        if missing:
            raise ValueError(
                f"Missing required features: {missing}"
            )

    def _predict_strategy(self, data: dict):
        input_data = {
            feature: data.get(feature)
            for feature in self.features
        }

        X = pd.DataFrame(
            [input_data],
            columns=self.features,
        )

        strategy = str(self.model.predict(X)[0])
        probabilities = self.model.predict_proba(X)[0]

        if hasattr(self.model, "named_steps"):
            classifier = list(
                self.model.named_steps.values()
            )[-1]
        else:
            classifier = self.model

        classes = classifier.classes_

        strategy_probabilities = {
            str(class_name): round(float(probability), 4)
            for class_name, probability in zip(
                classes, probabilities
            )
        }

        strategy_probability = round(
            float(max(probabilities)), 4
        )

        return (
            strategy,
            strategy_probability,
            strategy_probabilities,
        )

    def recommend(self, data: dict):
        self._validate_input(data)

        (
            strategy,
            strategy_probability,
            strategy_probabilities,
        ) = self._predict_strategy(data)

        historical = self.type_service.recommend(
            data,
            strategy=strategy,
        )

        return {
            "strategy": strategy,
            "strategy_probability": strategy_probability,
            "strategy_probabilities": strategy_probabilities,
            "organic": historical.get(
                "organic", {"recommendations": []}
            ),
            "inorganic": historical.get(
                "inorganic", {"recommendations": []}
            ),
            "basis": "Historical agricultural data",
            "note": (
                "Fertilizer types are ranked according to "
                "historical usage patterns. They are not "
                "claims of agronomic superiority."
            ),
        }
