import pandas as pd
import numpy as np
from services.llm import generate_insights


def compute_stats(df: pd.DataFrame) -> dict:
    stats = {}
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            series = df[col].dropna()
            stats[col] = {
                "type": "numeric",
                "mean": round(float(series.mean()), 4) if len(series) else None,
                "median": round(float(series.median()), 4) if len(series) else None,
                "std": round(float(series.std()), 4) if len(series) else None,
                "min": round(float(series.min()), 4) if len(series) else None,
                "max": round(float(series.max()), 4) if len(series) else None,
                "null_pct": round(df[col].isna().mean() * 100, 1),
                "q25": round(float(series.quantile(0.25)), 4) if len(series) else None,
                "q75": round(float(series.quantile(0.75)), 4) if len(series) else None,
            }
        else:
            top = df[col].value_counts().head(5).to_dict()
            stats[col] = {
                "type": "categorical",
                "top_values": {str(k): int(v) for k, v in top.items()},
                "unique_count": int(df[col].nunique()),
                "null_pct": round(df[col].isna().mean() * 100, 1),
            }

    # Add correlation for numeric columns
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].corr()
        high_corr = []
        for i in range(len(numeric_cols)):
            for j in range(i + 1, len(numeric_cols)):
                c = corr.iloc[i, j]
                if abs(c) >= 0.7:
                    high_corr.append({
                        "col1": numeric_cols[i],
                        "col2": numeric_cols[j],
                        "correlation": round(float(c), 3),
                    })
        if high_corr:
            stats["_correlations"] = high_corr

    return stats


def run_insight_generation(df: pd.DataFrame) -> list[dict]:
    stats = compute_stats(df)
    return generate_insights(stats, df.shape)
