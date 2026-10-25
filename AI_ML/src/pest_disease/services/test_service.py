from src.pest_disease.services.pest_disease_service import (
    PestDiseaseService,
)


service = PestDiseaseService()


base_input = {
    "s1q1": "Southern",
    "s1q2": "Huye",
    "s1q3": "10",
    "s2q2": 0.5,
    "s2q4": "Maize",
    "s2q7": "April",
    "s2q11": "Improved",

    "s3q1": "Yes",
    "s3q7": "Yes",
    "s3q8": "Inorganic fertilizer",
    "s3q9": "Yes",

    "s4q1": "No",
    "s4q2": "No",
    "s4q3": "No",
    "s4q4": "No",
    "s4q6": "No",
    "s4q8": "No",
    "s4q13": "Yes",
}


print("\n" + "=" * 70)
print("PEST / DISEASE EARLY WARNING - SEASON COMPARISON")
print("=" * 70)


for season in ["Season A", "Season B", "Season C"]:

    test_input = base_input.copy()
    test_input["season"] = season

    result = service.predict(test_input)

    print(f"\n{season}")
    print("-" * 40)
    print(
        f"Probability: {result['risk_percentage']:.2f}%"
    )
    print(
        f"Risk Level:  {result['risk_level']}"
    )
    print(
        f"Prediction:  {result['prediction']}"
    )
    print(
        f"Threshold:   {result['threshold']:.2f}"
    )


print("\n" + "=" * 70)