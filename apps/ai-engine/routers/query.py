from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Optional
import time
import traceback

from services.llm import generate_query_code
from services.executor import execute_code
from services.loader import load_dataframe

router = APIRouter()


class QueryRequest(BaseModel):
    question: str
    datasetId: str
    db_schema: list[dict]
    fileUrl: str
    fileType: str = "csv"


class QueryResponse(BaseModel):
    answer: str
    chartType: str
    chartConfig: dict
    data: list[dict]
    generatedCode: str
    durationMs: int


@router.post("/", response_model=QueryResponse)
async def run_query(req: QueryRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    start = time.time()

    try:
        df = await load_dataframe(req.fileUrl, req.fileType)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=422, detail=f"Failed to load dataset: {e}")

    sample = df.head(10).to_dict(orient="records")

    try:
        llm_output = generate_query_code(req.question, req.schema, sample)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {e}")

    code = llm_output.get("code", "")
    answer = llm_output.get("answer", "")
    chart_type = llm_output.get("chart_type", "bar")

    if not code:
        raise HTTPException(status_code=500, detail="LLM returned no code")

    try:
        exec_result = execute_code(code, df)
    except ValueError as e:
        traceback.print_exc()
        raise HTTPException(status_code=422, detail=f"Code execution failed: {e}")
    except TimeoutError:
        raise HTTPException(status_code=408, detail="Code execution timed out")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Unexpected execution error: {e}")

    data = exec_result.get("data", [])
    columns = exec_result.get("columns", [])
    if not answer:
        answer = exec_result.get("answer", "")

    chart_config = {
        "type": chart_type,
        "columns": columns,
        "xKey": columns[0] if columns else None,
        "yKey": columns[1] if len(columns) > 1 else None,
    }

    duration_ms = int((time.time() - start) * 1000)

    return QueryResponse(
        answer=answer,
        chartType=chart_type,
        chartConfig=chart_config,
        data=data,
        generatedCode=code,
        durationMs=duration_ms,
    )
