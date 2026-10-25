from src.crop_recommendation.service.crop_recommendation_service import (
    CropRecommendationService,
)


def main():

    print("=" * 80)
    print("AGRISYSTEM - CROP RECOMMENDATION SERVICE")
    print("=" * 80)

    service = CropRecommendationService()

    user_input = {
        "s1q2": "Gicumbi",
        "season": "Season A",

        "s2q2": 0.8,

        "s4q13": "No",
        "s4q1": "Low",
        "s4q6": "Yes",
    }

    result = service.recommend(
        user_input=user_input,
        top_n=3,
    )

    print("\nSUCCESS:")
    print(result["success"])

    if not result["success"]:
        print(result["message"])
        return

    print("\nINPUT:")
    for key, value in result["input"].items():
        print(f"  {key}: {value}")

    print("\n" + "=" * 80)
    print("TOP RECOMMENDATIONS")
    print("=" * 80)

    for index, recommendation in enumerate(
        result["recommendations"],
        start=1,
    ):

        print(
            f"\n{index}. "
            f"{recommendation['crop']}"
        )

        print(
            f"   Category: "
            f"{recommendation['category']}"
        )

        print(
            f"   Fusion score: "
            f"{recommendation['fusion_score']}"
        )

        print(
            f"   Historical frequency: "
            f"{recommendation['historical_frequency']:.1%}"
        )

        print(
            f"   Historical observations: "
            f"{recommendation['historical_observations']}"
        )

        print("\n   Summary:")
        print(
            f"   {recommendation['summary']}"
        )

        print("\n   Reasons:")

        for reason in recommendation["reasons"]:
            print(f"   - {reason}")

        print("\n   Note:")
        print(
            f"   {recommendation['note']}"
        )

    print("\n" + "=" * 80)
    print("METADATA")
    print("=" * 80)

    print(
        f"Method: "
        f"{result['metadata']['method']}"
    )

    print(
        f"Weights: "
        f"{result['metadata']['fusion_weights']}"
    )

    print(
        f"Score type: "
        f"{result['metadata']['score_type']}"
    )


if __name__ == "__main__":
    main()