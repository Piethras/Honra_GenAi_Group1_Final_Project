from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
import math

from services.loader import load_dataframe

router = APIRouter()


class PreviewRequest(BaseModel):
    fileUrl: str
    fileType: str = "csv"
    page: int = 1
    pageSize: int = 50


class PreviewResponse(BaseModel):
    rows: list[dict]
    total: int
    page: int
    pageSize: int
    totalPages: int


@router.post("/", response_model=PreviewResponse)
async def preview_dataset(req: PreviewRequest):
    try:
        df = await load_dataframe(req.fileUrl, req.fileType)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to load dataset: {e}")

    total = len(df)
    total_pages = math.ceil(total / req.pageSize)
    start = (req.page - 1) * req.pageSize
    end = start + req.pageSize

    page_df = df.iloc[start:end]

    # Sanitize for JSON
    rows = []
    for _, row in page_df.iterrows():
        sanitized = {}
        for col, val in row.items():
            import pandas as pd
            if pd.isna(val):
                sanitized[col] = None
            elif hasattr(val, "item"):
                sanitized[col] = val.item()
            else:
                sanitized[col] = str(val) if not isinstance(val, (int, float, bool, str, type(None))) else val
        rows.append(sanitized)

    return PreviewResponse(
        rows=rows,
        total=total,
        page=req.page,
        pageSize=req.pageSize,
        totalPages=total_pages,
    )
