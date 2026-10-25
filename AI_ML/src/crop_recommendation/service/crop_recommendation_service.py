from typing import Dict, Any

from src.crop_recommendation.fusion.fusion_engine import CropFusionEngine
from src.crop_recommendation.explanation.explanation_engine import (
    ExplanationEngine,
)


class CropRecommendationService:
    """
    Main application service for crop recommendations.

    Combines:
        1. Historical recommendation
        2. Exact-crop ML
        3. Crop-category ML
        4. Fusion ranking
        5. Deterministic explanations
    """

    def __init__(self):

        self.fusion_engine = CropFusionEngine()
        self.explanation_engine = ExplanationEngine()

    # MAIN RECOMMENDATION

    def recommend(
        self,
        user_input: Dict[str, Any],
        top_n: int = 3,
    ) -> Dict[str, Any]:

        
        # VALIDATE INPUT
        

        self._validate_input(user_input)

        
        # FUSION
        

        fusion_results = self.fusion_engine.recommend(
            user_input=user_input,
            top_n=5,
        )

        if not fusion_results:
            return {
                "success": False,
                "message": (
                    "No historical or ML recommendation "
                    "could be generated for the provided input."
                ),
                "recommendations": [],
            }

        
        # PREPARE DATA FOR EXPLANATION ENGINE
        

        explanation_input = []

        for result in fusion_results:

            item = {
                "crop": result.get("crop"),
                "category": result.get("category"),

                "fusion_score": result.get(
                    "fusion_score",
                    0.0,
                ),

                "historical_score": result.get(
                    "historical_score",
                    0.0,
                ),

                "exact_ml_score": result.get(
                    "exact_ml_score",
                    0.0,
                ),

                "category_ml_score": result.get(
                    "category_ml_score",
                    0.0,
                ),

                # Fusion Engine calls this historical_count.
                # Explanation Engine expects historical_observations.
                "historical_observations": result.get(
                    "historical_count",
                    0,
                ),

                "historical_frequency": result.get(
                    "historical_frequency",
                    0.0,
                ),
            }

            explanation_input.append(item)

        
        # EXPLANATIONS
        

        explanations = (
            self.explanation_engine
            .explain_top_recommendations(
                explanation_input,
                top_n=top_n,
            )
        )

        
        # FINAL RESPONSE
        

        return {
            "success": True,

            "input": user_input,

            "recommendations": explanations,

            "metadata": {
                "method": "historical + exact-crop ML + category ML",
                "fusion_weights": {
                    "historical": 0.40,
                    "exact_crop_ml": 0.30,
                    "category_ml": 0.30,
                },
                "score_type": "ranking_score",
                "warning": (
                    "Fusion score is a ranking score, "
                    "not a probability or guarantee."
                ),
            },
        }

    # INPUT VALIDATION

    def _validate_input(
        self,
        user_input: Dict[str, Any],
    ) -> None:

        required_fields = [
            "s1q2",      # district
            "season",
        ]

        missing_fields = [
            field
            for field in required_fields
            if user_input.get(field) is None
        ]

        if missing_fields:

            raise ValueError(
                "Missing required fields: "
                + ", ".join(missing_fields)
            )