from typing import Dict, List


class ExplanationEngine:
    """
    Converts fusion recommendation results into
    simple, traceable explanations.

    Important:
    - Does not invent reasons.
    - Does not use an LLM.
    - Fusion score is NOT treated as probability.
    """

    def __init__(self):
        pass

    def explain_recommendation(self, recommendation: Dict) -> Dict:
        crop = recommendation.get("crop", "Unknown crop")
        category = recommendation.get("category", "Unknown category")

        fusion_score = float(recommendation.get("fusion_score", 0.0))
        historical_score = float(
            recommendation.get("historical_score", 0.0)
        )
        exact_ml_score = float(
            recommendation.get("exact_ml_score", 0.0)
        )
        category_ml_score = float(
            recommendation.get("category_ml_score", 0.0)
        )

        historical_observations = int(
            recommendation.get("historical_observations", 0)
        )

        historical_frequency = float(
            recommendation.get("historical_frequency", 0.0)
        )

        reasons: List[str] = []

        
        # Historical evidence
        

        if historical_observations > 0:
            if historical_frequency >= 0.15:
                reasons.append(
                    f"{crop} has strong historical presence in the "
                    f"selected agricultural context "
                    f"({historical_frequency:.1%} of historical observations)."
                )

            elif historical_frequency >= 0.05:
                reasons.append(
                    f"{crop} has been observed in the selected "
                    f"agricultural context "
                    f"({historical_frequency:.1%} of historical observations)."
                )

            else:
                reasons.append(
                    f"{crop} has historical observations in the "
                    f"selected agricultural context."
                )

        
        # Exact crop ML signal
        

        if exact_ml_score >= 0.50:
            reasons.append(
                "The exact-crop ML model provides a strong supporting signal."
            )

        elif exact_ml_score >= 0.20:
            reasons.append(
                "The exact-crop ML model provides a moderate supporting signal."
            )

        else:
            reasons.append(
                "The exact-crop ML model provides a weaker supporting signal."
            )

        
        # Category ML signal
        

        if category_ml_score >= 0.50:
            reasons.append(
                "The crop-category ML model provides a strong supporting signal."
            )

        elif category_ml_score >= 0.20:
            reasons.append(
                "The crop-category ML model provides a moderate supporting signal."
            )

        else:
            reasons.append(
                "The crop-category ML model provides a weaker supporting signal."
            )

        
        # Overall explanation
        

        if historical_score >= 0.70 and (
            exact_ml_score >= 0.20 or category_ml_score >= 0.20
        ):
            summary = (
                f"{crop} is highly ranked because historical evidence "
                f"and model signals support this recommendation."
            )

        elif historical_score >= 0.40:
            summary = (
                f"{crop} is ranked based on historical agricultural "
                f"evidence together with ML model signals."
            )

        else:
            summary = (
                f"{crop} is included based mainly on the available "
                f"ML and historical signals."
            )

        return {
            "crop": crop,
            "category": category,
            "fusion_score": round(fusion_score, 4),
            "historical_score": round(historical_score, 4),
            "exact_ml_score": round(exact_ml_score, 4),
            "category_ml_score": round(category_ml_score, 4),
            "historical_observations": historical_observations,
            "historical_frequency": round(
                historical_frequency, 4
            ),
            "summary": summary,
            "reasons": reasons,
            "note": (
                "The fusion score is a ranking score, not a probability "
                "or guarantee."
            ),
        }

    def explain_top_recommendations(
        self,
        recommendations: List[Dict],
        top_n: int = 3,
    ) -> List[Dict]:

        explanations = []

        for recommendation in recommendations[:top_n]:
            explanations.append(
                self.explain_recommendation(recommendation)
            )

        return explanations

    