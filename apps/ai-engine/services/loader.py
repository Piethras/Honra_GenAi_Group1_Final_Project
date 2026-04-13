import pandas as pd
import httpx
import io
from typing import Optional


async def load_dataframe(file_url: str, file_type: str, sheet: Optional[str] = None) -> pd.DataFrame:
    """Fetch a file from a signed URL and load it into a DataFrame."""
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.get(file_url)
        response.raise_for_status()
        content = response.content

    ext = file_type.lower().strip(".")

    if ext == "csv":
        # Try multiple encodings
        for encoding in ["utf-8", "latin-1", "utf-16"]:
            try:
                df = pd.read_csv(io.BytesIO(content), encoding=encoding)
                break
            except UnicodeDecodeError:
                continue
        else:
            df = pd.read_csv(io.BytesIO(content), encoding="utf-8", errors="replace")

    elif ext in ("xlsx", "xls"):
        kwargs = {"sheet_name": sheet or 0}
        df = pd.read_excel(io.BytesIO(content), **kwargs)

    elif ext == "json":
        try:
            df = pd.read_json(io.BytesIO(content))
        except Exception:
            import json
            data = json.loads(content)
            if isinstance(data, list):
                df = pd.json_normalize(data)
            else:
                df = pd.json_normalize([data])
    else:
        raise ValueError(f"Unsupported file type: {file_type}")

    # Clean column names
    df.columns = [str(c).strip() for c in df.columns]

    # Parse obvious date columns
    for col in df.columns:
        if any(kw in col.lower() for kw in ["date", "time", "created", "updated", "at"]):
            try:
                df[col] = pd.to_datetime(df[col], infer_datetime_format=True, errors="coerce")
            except Exception:
                pass

    return df
