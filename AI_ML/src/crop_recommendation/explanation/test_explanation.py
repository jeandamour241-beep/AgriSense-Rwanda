from src.crop_recommendation.explanation.explanation_engine import ExplanationEngine

def main():

    engine = ExplanationEngine()

    fusion_results = [
        {
            "crop": "Maize",
            "category": "Maize",
            "fusion_score": 0.5858,
            "historical_score": 0.9176,
            "exact_ml_score": 0.2394,
            "category_ml_score": 0.2759,
            "historical_observations": 156,
            "historical_frequency": 0.1948,
        },
        {
            "crop": "Bush bean",
            "category": "Bush bean",
            "fusion_score": 0.5371,
            "historical_score": 1.0000,
            "exact_ml_score": 0.0752,
            "category_ml_score": 0.0728,
            "historical_observations": 170,
            "historical_frequency": 0.2122,
        },
        {
            "crop": "Cassava",
            "category": "Cassava",
            "fusion_score": 0.4042,
            "historical_score": 0.7479,
            "exact_ml_score": 0.1500,
            "category_ml_score": 0.1800,
            "historical_observations": 127,
            "historical_frequency": 0.1586,
        },
    ]

    results = engine.explain_top_recommendations(
        fusion_results,
        top_n=3,
    )

    print("=" * 80)
    print("AGRISYSTEM - EXPLANATION ENGINE")
    print("=" * 80)

    for index, result in enumerate(results, start=1):

        print(f"\n{index}. {result['crop']}")
        print(f"   Category: {result['category']}")
        print(f"   Fusion score: {result['fusion_score']}")
        print(
            f"   Historical observations: "
            f"{result['historical_observations']}"
        )
        print(
            f"   Historical frequency: "
            f"{result['historical_frequency']:.1%}"
        )

        print("\n   Summary:")
        print(f"   {result['summary']}")

        print("\n   Reasons:")

        for reason in result["reasons"]:
            print(f"   - {reason}")

        print("\n   Note:")
        print(f"   {result['note']}")

        print("-" * 80)


if __name__ == "__main__":
    main()