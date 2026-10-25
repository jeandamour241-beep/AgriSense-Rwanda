from src.fertilizer.services.fertilizer_type_service import (
    FertilizerTypeService,
)


service = FertilizerTypeService()


user_input = {
    "s1q1": "West",
    "s1q2": "Nyabihu",
    "s1q3": "LSF",
    "season": "Season A",

    "s2q2": 0.5,
    "s2q4": "Bush bean",
    "s2q7": "Between 01-15/10",
    "s2q11": "Improved seeds",

    "s4q1": "Low",
    "s4q6": "Yes",
}


print("=" * 80)
print("FERTILIZER TYPE HISTORICAL RECOMMENDATION")
print("=" * 80)



# EXAMPLE: BOTH


strategy = "BOTH"


result = service.recommend(
    user_input=user_input,
    strategy=strategy,
)


print("\nStrategy:")
print(strategy)



# ORGANIC


print("\n" + "-" * 80)
print("ORGANIC FERTILIZER")
print("-" * 80)

organic = result["organic"]

if organic:

    print(
        f"Historical records used: "
        f"{organic['records_used']}"
    )

    print(
        f"Matching level: "
        f"{organic['matching_level']}"
    )

    for item in organic[
        "recommendations"
    ]:

        print(
            f"- {item['type']}: "
            f"{item['historical_percentage']}%"
            f" ({item['historical_count']} records)"
        )



# INORGANIC


print("\n" + "-" * 80)
print("INORGANIC FERTILIZER")
print("-" * 80)

inorganic = result["inorganic"]

if inorganic:

    print(
        f"Historical records used: "
        f"{inorganic['records_used']}"
    )

    print(
        f"Matching level: "
        f"{inorganic['matching_level']}"
    )

    for item in inorganic[
        "recommendations"
    ]:

        print(
            f"- {item['type']}: "
            f"{item['historical_percentage']}%"
            f" ({item['historical_count']} records)"
        )


print("\n" + "=" * 80)
print("DONE")
print("=" * 80)