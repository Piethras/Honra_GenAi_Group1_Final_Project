from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import io
import json

from services.loader import load_dataframe
from services.llm import generate_cleaning_suggestions

router = APIRouter()


class CleanRequest(BaseModel):
    fileUrl: str
    fileType: str = "csv"
    db_schema: list[dict]
    operations: list[dict] = []


class ProfileRequest(BaseModel):
    fileUrl: str
    fileType: str = "csv"


@router.post("/profile")
async def profile_dataset(req: ProfileRequest):
    """Analyse dataset and return cleaning profile."""
    try:
        df = await load_dataframe(req.fileUrl, req.fileType)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to load dataset: {e}")

    profile = []
    for col in df.columns:
        missing = int(df[col].isna().sum())
        missing_pct = round((missing / len(df)) * 100, 1)
        duplicates = int(df.duplicated().sum())

        col_profile = {
            "name": col,
            "type": str(df[col].dtype),
            "missing": missing,
            "missingPct": missing_pct,
            "unique": int(df[col].nunique()),
            "duplicateRows": duplicates,
        }

        if pd.api.types.is_numeric_dtype(df[col]):
            col_profile["min"] = float(df[col].min()) if not df[col].isna().all() else None
            col_profile["max"] = float(df[col].max()) if not df[col].isna().all() else None
            col_profile["mean"] = round(float(df[col].mean()), 2) if not df[col].isna().all() else None
            col_profile["std"] = round(float(df[col].std()), 2) if not df[col].isna().all() else None

        profile.append(col_profile)

    return {
        "rowCount": len(df),
        "columnCount": len(df.columns),
        "totalDuplicates": int(df.duplicated().sum()),
        "totalMissing": int(df.isna().sum().sum()),
        "columns": profile,
    }


@router.post("/apply")
async def apply_cleaning(req: CleanRequest):
    """Apply cleaning operations and return cleaned data as JSON."""
    try:
        df = await load_dataframe(req.fileUrl, req.fileType)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to load dataset: {e}")

    original_rows = len(df)
    changes = []

    for op in req.operations:
        op_type = op.get("type")

        if op_type == "remove_duplicates":
            before = len(df)
            df = df.drop_duplicates()
            removed = before - len(df)
            changes.append(f"Removed {removed} duplicate rows")

        elif op_type == "fill_missing":
            col = op.get("column")
            strategy = op.get("strategy", "mean")
            if col and col in df.columns:
                if strategy == "mean" and pd.api.types.is_numeric_dtype(df[col]):
                    df[col] = df[col].fillna(df[col].mean())
                elif strategy == "median" and pd.api.types.is_numeric_dtype(df[col]):
                    df[col] = df[col].fillna(df[col].median())
                elif strategy == "mode":
                    df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "Unknown")
                elif strategy == "drop":
                    df = df.dropna(subset=[col])
                changes.append(f"Filled missing values in '{col}' using {strategy}")

        elif op_type == "drop_column":
            col = op.get("column")
            if col and col in df.columns:
                df = df.drop(columns=[col])
                changes.append(f"Dropped column '{col}'")

        elif op_type == "remove_outliers":
            col = op.get("column")
            if col and col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                before = len(df)
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                df = df[~((df[col] < (Q1 - 1.5 * IQR)) | (df[col] > (Q3 + 1.5 * IQR)))]
                removed = before - len(df)
                changes.append(f"Removed {removed} outliers from '{col}'")

        elif op_type == "fill_all_missing":
            for col in df.columns:
                if df[col].isna().sum() > 0:
                    if pd.api.types.is_numeric_dtype(df[col]):
                        df[col] = df[col].fillna(df[col].median())
                    else:
                        df[col] = df[col].fillna("Unknown")
            changes.append("Filled all missing values")

    final_rows = len(df)

    # Convert cleaned dataframe to CSV string for upload
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_content = csv_buffer.getvalue()

    return {
        "originalRows": original_rows,
        "finalRows": final_rows,
        "rowsRemoved": original_rows - final_rows,
        "changes": changes,
        "csvContent": csv_content,
        "columns": df.columns.tolist(),
        "schema": [
            {
                "name": col,
                "type": "number" if pd.api.types.is_numeric_dtype(df[col]) else
                        "date" if pd.api.types.is_datetime64_any_dtype(df[col]) else "string"
            }
            for col in df.columns
        ]
    }


@router.post("/suggest")
async def suggest_cleaning(req: ProfileRequest):
    """Use AI to suggest cleaning operations."""
    try:
        df = await load_dataframe(req.fileUrl, req.fileType)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to load dataset: {e}")

    profile = []
    for col in df.columns:
        missing = int(df[col].isna().sum())
        missing_pct = round((missing / len(df)) * 100, 1)
        profile.append({
            "name": col,
            "type": str(df[col].dtype),
            "missing": missing,
            "missingPct": missing_pct,
            "unique": int(df[col].nunique()),
        })

    try:
        suggestions = generate_cleaning_suggestions(profile, len(df))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI suggestion failed: {e}")

    return {"suggestions": suggestions}
