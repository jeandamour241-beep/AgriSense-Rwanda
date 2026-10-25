from src.crop_recommendation.fusion.fusion_engine import (
    CropFusionEngine
)


def main():

    engine = CropFusionEngine()

    user_input = {

        # Location
        "s1q1": "Kigali",
        "s1q2": "Gasabo",
        "s1q3": None,

        # Season
        "season": "Season B",

        # Plot
        "s2q2": 0.8,

        # Sowing period
        "s2q7": None,

        # Land / environment
        "s4q1": "Low",
        "s4q6": "Yes",
        "s4q13": "No",
    }

    print("\n")
    print("=" * 80)
    print("RWANDA AGRISYSTEM - CROP FUSION ENGINE")
    print("=" * 80)

    results = engine.recommend(
        user_input,
        top_n=5
    )

    print("\nFINAL RECOMMENDATIONS")
    print("-" * 80)

    for index, result in enumerate(
        results,
        start=1
    ):

        print(
            f"\n{index}. {result['crop']}"
        )

        print(
            f"   Category: "
            f"{result['category']}"
        )

        print(
            f"   Fusion score: "
            f"{result['fusion_score']:.4f}"
        )

        print(
            f"   Historical score: "
            f"{result['historical_score']:.4f}"
        )

        print(
            f"   Exact ML score: "
            f"{result['exact_ml_score']:.4f}"
        )

        print(
            f"   Category ML score: "
            f"{result['category_ml_score']:.4f}"
        )

        print(
            f"   Historical observations: "
            f"{result['historical_count']}"
        )

        print(
            f"   Historical frequency: "
            f"{result['historical_frequency']:.2%}"
        )


if __name__ == "__main__":
    main()
