from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.loader import load_dataframe
from services.insights_svc import run_insight_generation

router = APIRouter()


class InsightRequest(BaseModel):
    datasetId: str
    fileUrl: str
    fileType: str = "csv"


class InsightResponse(BaseModel):
    insights: list[dict]


@router.post("/", response_model=InsightResponse)
async def generate_insights_endpoint(req: InsightRequest):
    try:
        df = await load_dataframe(req.fileUrl, req.fileType)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to load dataset: {e}")

    try:
        insights = run_insight_generation(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insight generation failed: {e}")

    return InsightResponse(insights=insights)
