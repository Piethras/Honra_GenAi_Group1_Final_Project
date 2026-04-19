from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
import json

from services.loader import load_dataframe
from services.llm import generate_eda_narrative

router = APIRouter()


class EDARequest(BaseModel):
    fileUrl: str
    fileType: str = "csv"


@router.post("/summary")
async def eda_summary(req: EDARequest):
    """Generate full EDA summary including stats, distributions and correlations."""
    try:
        df = await load_dataframe(req.fileUrl, req.fileType)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to load dataset: {e}")

    # ── Numeric columns stats ─────────────────────────────────
    numeric_cols = df.select_dtypes(include='number').columns.tolist()
    stats = []
    for col in numeric_cols:
        s = df[col].dropna()
        stats.append({
            "column": col,
            "mean": round(float(s.mean()), 2),
            "median": round(float(s.median()), 2),
            "std": round(float(s.std()), 2),
            "min": round(float(s.min()), 2),
            "max": round(float(s.max()), 2),
            "missing": int(df[col].isna().sum()),
        })

    # ── Distributions (top 10 value counts per column) ────────
    distributions = []
    for col in df.columns[:10]:  # limit to first 10 columns
        if pd.api.types.is_numeric_dtype(df[col]):
            # Bin numeric columns into 8 buckets
            try:
                counts = pd.cut(df[col].dropna(), bins=8).value_counts().sort_index()
                distributions.append({
                    "column": col,
                    "type": "numeric",
                    "values": [str(k) for k in counts.index],
                    "counts": [int(v) for v in counts.values],
                })
            except Exception:
                pass
        else:
            counts = df[col].value_counts().head(10)
            distributions.append({
                "column": col,
                "type": "categorical",
                "values": [str(k) for k in counts.index],
                "counts": [int(v) for v in counts.values],
            })

    # ── Correlations ──────────────────────────────────────────
    correlations = []
    if len(numeric_cols) >= 2:
        corr_matrix = df[numeric_cols].corr()
        pairs = []
        for i in range(len(numeric_cols)):
            for j in range(i + 1, len(numeric_cols)):
                col_a = numeric_cols[i]
                col_b = numeric_cols[j]
                val = corr_matrix.loc[col_a, col_b]
                if not pd.isna(val):
                    pairs.append({
                        "colA": col_a,
                        "colB": col_b,
                        "correlation": round(float(val), 3),
                        "strength": "strong" if abs(val) > 0.7 else "moderate" if abs(val) > 0.4 else "weak",
                        "direction": "positive" if val > 0 else "negative",
                    })
        correlations = sorted(pairs, key=lambda x: abs(x["correlation"]), reverse=True)[:10]

    # ── AI Narrative ──────────────────────────────────────────
    try:
        narrative = generate_eda_narrative(stats, distributions, len(df), len(df.columns))
    except Exception:
        narrative = "Unable to generate narrative at this time."

    return {
        "rowCount": len(df),
        "columnCount": len(df.columns),
        "numericColumns": len(numeric_cols),
        "stats": stats,
        "distributions": distributions,
        "correlations": correlations,
        "narrative": narrative,
    }