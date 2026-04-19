from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.loader import load_dataframe
from services.llm import generate_conclusions

router = APIRouter()


class ConclusionsRequest(BaseModel):
    fileUrl: str
    fileType: str = "csv"
    datasetName: str
    edaSummary: Optional[dict] = None
    modelResults: Optional[dict] = None
    cleaningSummary: Optional[dict] = None
    topQueries: Optional[list] = None


@router.post("/generate")
async def generate(req: ConclusionsRequest):
    try:
        df = await load_dataframe(req.fileUrl, req.fileType)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to load dataset: {e}")

    basic_info = {
        "name": req.datasetName,
        "rows": len(df),
        "columns": len(df.columns),
        "columnNames": df.columns.tolist()[:10],
    }

    try:
        conclusions = generate_conclusions(
            basic_info=basic_info,
            eda_summary=req.edaSummary,
            model_results=req.modelResults,
            cleaning_summary=req.cleaningSummary,
            top_queries=req.topQueries,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conclusion generation failed: {e}")

    return conclusions