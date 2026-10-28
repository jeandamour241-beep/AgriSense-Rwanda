from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

# from src.crop_recommendation.service.crop_recommendation_service import (
#     CropRecommendationService,
# )
# from src.irrigation.services.irrigation_recommendation_service import (
#     IrrigationRecommendationService,
# )
# from src.pest_disease.services.pest_disease_service import PestDiseaseService
from src.fertilizer.services.fertilizer_recommendation_service import (
    FertilizerRecommendationService,
)
from src.data_explorer.data_explorer_service import DataExplorerService


app = FastAPI(
    title="Rwanda AgriSystem AI Service",
    version="1.0.0",
)


class CropRecommendationRequest(BaseModel):
    s1q2: str
    season: str
    s2q2: Optional[float] = None
    s4q13: Optional[str] = None
    s4q1: Optional[str] = None
    s4q6: Optional[str] = None


# recommendation_service = CropRecommendationService()
# irrigation_service = IrrigationRecommendationService()
# pest_disease_service = PestDiseaseService()
fertilizer_recommendation_service = (
    FertilizerRecommendationService()
)
data_explorer_service = DataExplorerService()


@app.get("/")
def main():
    return {
        "status": "running",
        "message": "main"
    }

@app.get("/health")
def health():
    return {
        "success": True,
        "service": "Rwanda AgriSystem AI",
        "status": "running",
    }


# @app.post("/crop-recommendation")
# def crop_recommendation(request: CropRecommendationRequest):
#     try:
#         user_input = request.model_dump(exclude_none=True)

#         result = recommendation_service.recommend(
#             user_input=user_input,
#             top_n=3,
#         )

#         return result
#     except ValueError as error:
#         raise HTTPException(status_code=422, detail=str(error)) from error
#     except Exception as error:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Crop recommendation failed: {error}",
#         ) from error


# @app.post("/irrigation/recommend")
# def irrigation_recommendation(data: dict):
#     """
#     Generate irrigation recommendation
#     using the trained irrigation model
#     and historical irrigation advice.
#     """

#     try:
#         result = irrigation_service.predict(data)

#         return {
#             "success": True,
#             "data": result,
#         }

#     except ValueError as error:
#         return {
#             "success": False,
#             "error": str(error),
#         }

#     except Exception as error:
#         return {
#             "success": False,
#             "error": "Internal server error",
#             "details": str(error),
#         }


# @app.post("/pest-disease/recommend")
# def pest_disease_recommendation(data: dict):
#     try:
#         result = pest_disease_service.predict(data)

#         return {
#             "success": True,
#             "data": result
#         }

#     except ValueError as error:
#         return {
#             "success": False,
#             "error": str(error)
#         }

#     except Exception as error:
#         return {
#             "success": False,
#             "error": "Internal server error",
#             "details": str(error)
#         }


@app.post("/fertilizer/recommend")
def fertilizer_recommendation(data: dict):
    try:
        result = fertilizer_recommendation_service.recommend(data)

        return {
            "success": True,
            "data": result,
        }

    except ValueError as error:
        return {
            "success": False,
            "error": str(error),
        }

    except Exception as error:
        print(f"Fertilizer recommendation error: {error}")

        return {
            "success": False,
            "error": "Internal server error",
        }


@app.get("/data-explorer/filters")
def get_data_explorer_filters():
    return {
        "success": True,
        "data": data_explorer_service.get_filters(),
    }


@app.get("/data-explorer/overview")
def get_data_explorer_overview(
    province: str | None = None,
    district: str | None = None,
    crop: str | None = None,
    season: str | None = None,
):
    return {
        "success": True,
        "data": data_explorer_service.get_overview(
            province=province,
            district=district,
            crop=crop,
            season=season,
        ),
    }


@app.get("/data-explorer/crops")
def get_data_explorer_crops(
    province: str | None = None,
    district: str | None = None,
    season: str | None = None,
    limit: int = Query(default=15, ge=1, le=100),
):
    return {
        "success": True,
        "data": data_explorer_service.get_crop_statistics(
            province=province,
            district=district,
            season=season,
            limit=limit,
        ),
    }


@app.get("/data-explorer/districts")
def get_data_explorer_districts(
    crop: str | None = None,
    season: str | None = None,
    province: str | None = None,
    limit: int = Query(default=30, ge=1, le=30),
):
    return {
        "success": True,
        "data": data_explorer_service.get_district_comparison(
            crop=crop,
            season=season,
            province=province,
            limit=limit,
        ),
    }


@app.get("/data-explorer/seasons")
def get_data_explorer_seasons(
    district: str | None = None,
    crop: str | None = None,
    province: str | None = None,
):
    return {
        "success": True,
        "data": data_explorer_service.get_season_comparison(
            district=district,
            crop=crop,
            province=province,
        ),
    }


@app.get("/data-explorer/table")
def get_data_explorer_table(
    province: str | None = None,
    district: str | None = None,
    crop: str | None = None,
    season: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    return {
        "success": True,
        "data": data_explorer_service.get_data_table(
            province=province,
            district=district,
            crop=crop,
            season=season,
            page=page,
            page_size=page_size,
        ),
    }


