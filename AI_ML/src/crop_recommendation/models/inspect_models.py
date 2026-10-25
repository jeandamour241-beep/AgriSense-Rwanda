from pathlib import Path
import joblib


BASE_DIR = Path(__file__).resolve().parents[3]

MODEL_DIR = (
    BASE_DIR
    / "src"
    / "crop_recommendation"
    / "models"
)


MODELS = [
    "crop_recommendation_model.joblib",
    "crop_category_model.joblib",
]


def inspect_model(path: Path):

    print("\n" + "=" * 70)
    print(f"MODEL: {path.name}")
    print("=" * 70)

    if not path.exists():
        print(f"NOT FOUND: {path}")
        return

    artifact = joblib.load(path)

    print("Python type:")
    print(type(artifact))

    if isinstance(artifact, dict):

        print("\nDictionary keys:")

        for key, value in artifact.items():
            print(
                f"  {key}: {type(value)}"
            )

            if hasattr(value, "steps"):
                print(
                    f"      Pipeline steps: "
                    f"{list(value.named_steps.keys())}"
                )

    elif hasattr(artifact, "steps"):

        print("\nPipeline detected.")

        print("Pipeline steps:")

        for name, step in artifact.named_steps.items():

            print(
                f"  {name}: {type(step)}"
            )

    else:

        print("\nObject details:")

        print(
            "Has predict:",
            hasattr(artifact, "predict")
        )

        print(
            "Has predict_proba:",
            hasattr(artifact, "predict_proba")
        )


if __name__ == "__main__":

    for model_name in MODELS:

        inspect_model(
            MODEL_DIR / model_name
        )
