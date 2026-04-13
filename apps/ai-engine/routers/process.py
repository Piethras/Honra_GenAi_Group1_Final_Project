from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import httpx
import os

from services.loader import load_dataframe
from services.llm import infer_schema
from services.insights_svc import run_insight_generation

router = APIRouter()


class ProcessRequest(BaseModel):
    datasetId: str
    storagePath: str
    fileType: str = "csv"
    fileUrl: str = ""
    callbackUrl: str = ""


async def do_process(datasetId: str, fileUrl: str, fileType: str, callbackUrl: str):
    """Background task: parse file, infer schema, generate insights, POST results back to Next.js."""
    try:
        df = await load_dataframe(fileUrl, fileType)
        schema = infer_schema(df)
        insights = run_insight_generation(df)

        payload = {
            "datasetId": datasetId,
            "rowCount": len(df),
            "columnCount": len(df.columns),
            "schema": schema,
            "insights": insights,
            "status": "READY",
        }
    except Exception as e:
        payload = {
            "datasetId": datasetId,
            "status": "ERROR",
            "error": str(e),
        }

    if callbackUrl:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                await client.post(
                    callbackUrl,
                    json=payload,
                    headers={"X-Secret": os.environ.get("AI_ENGINE_SECRET", "")},
                )
        except Exception as e:
            print(f"Callback failed for dataset {datasetId}: {e}")


@router.post("/")
async def process_dataset(req: ProcessRequest, background_tasks: BackgroundTasks):
    if not req.fileUrl:
        raise HTTPException(status_code=400, detail="fileUrl is required")

    background_tasks.add_task(
        do_process,
        req.datasetId,
        req.fileUrl,
        req.fileType,
        req.callbackUrl,
    )

    return {"status": "processing", "datasetId": req.datasetId}
