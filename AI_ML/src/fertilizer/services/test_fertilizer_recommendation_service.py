from src.fertilizer.services.fertilizer_recommendation_service import (
    FertilizerRecommendationService,
)


def main():
    service = FertilizerRecommendationService()

    user_input = {
        "s1q1": "South",
        "s1q2": "Huye",
        "s1q3": "LSF",
        "season": "Season A",
        "s2q2": 0.5,
        "s2q4": "Sweet potato",
        "s2q7": "Between 01-15/10",
        "s2q11": "Improved seeds",
        "s4q1": "Low",
        "s4q6": "Yes",
    }

    print("=" * 80)
    print("FERTILIZER RECOMMENDATION ASSISTANT")
    print("=" * 80)

    result = service.recommend(user_input)

    print("\nSTRATEGY")
    print("-" * 80)

    print(
        f"Recommended strategy: "
        f"{result['strategy']}"
    )

    print(
        f"Strategy probability: "
        f"{result['strategy_probability'] * 100:.2f}%"
    )

    print("\nStrategy probabilities:")

    for strategy, probability in result[
        "strategy_probabilities"
    ].items():
        print(
            f"- {strategy}: "
            f"{probability * 100:.2f}%"
        )

    print("\n" + "-" * 80)
    print("ORGANIC FERTILIZER")
    print("-" * 80)

    organic = result["organic"]

    print(
        f"Historical records used: "
        f"{organic.get('records_used', 0)}"
    )

    print(
        f"Matching level: "
        f"{organic.get('matching_level', [])}"
    )

    for item in organic.get("recommendations", []):
        print(
            f"- {item['type']}: "
            f"{item['historical_percentage']}% "
            f"({item['historical_count']} records)"
        )

    print("\n" + "-" * 80)
    print("INORGANIC FERTILIZER")
    print("-" * 80)

    inorganic = result["inorganic"]

    print(
        f"Historical records used: "
        f"{inorganic.get('records_used', 0)}"
    )

    print(
        f"Matching level: "
        f"{inorganic.get('matching_level', [])}"
    )

    for item in inorganic.get("recommendations", []):
        print(
            f"- {item['type']}: "
            f"{item['historical_percentage']}% "
            f"({item['historical_count']} records)"
        )

    print("\n" + "=" * 80)
    print("BASIS")
    print("=" * 80)

    print(result["basis"])
    print(result["note"])


if __name__ == "__main__":
    main()