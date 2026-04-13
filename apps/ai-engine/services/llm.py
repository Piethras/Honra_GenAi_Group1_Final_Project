import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

QUERY_SYSTEM_PROMPT = """You are a data analysis assistant. You will be given:
1. A dataset schema (column names and their types)
2. Sample rows from the dataset
3. A user question in plain English

Your job:
- Write valid Python (Pandas) code to answer the question.
- The dataframe is already loaded as `df`.
- Assign the FINAL result to a variable called `result`.
- `result` MUST be a dict: {"data": [...list of row dicts...], "columns": [...column names...]}
- Also assign a 1-2 sentence plain English answer to a variable called `answer`.
- Do NOT import anything. Do NOT use file I/O. Do NOT print. Only use `df`, `pd`, and basic Python.
- Return ONLY a valid JSON object with keys: "code", "answer", "chart_type".
- "chart_type" must be one of: bar, line, pie, scatter, area, table.
- Choose chart_type intelligently: use "line" for time-series, "pie" for proportions under 8 categories,
  "bar" for comparisons, "scatter" for correlations, "table" for complex multi-column results."""

INSIGHT_SYSTEM_PROMPT = """You are a senior data analyst. Given statistical summaries of a dataset,
generate exactly 6 insightful observation cards.

Return ONLY a valid JSON object with key "insights" containing an array of 6 objects.
Each object must have:
- "title": short, specific title (under 10 words)
- "description": 1-2 sentences explaining the insight clearly to a non-technical reader
- "type": one of "trend", "outlier", "summary", "correlation"
- "confidence": one of "high", "medium", "low"

Focus on genuinely interesting, non-obvious findings. Avoid generic statements like "the data has X rows"."""


def clean_code(code: str) -> str:
    """Remove markdown formatting and fix indentation from LLM generated code."""
    # Remove markdown code blocks
    if "```" in code:
        lines = code.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        code = "\n".join(lines)
    # Remove leading/trailing whitespace from each line
    lines = code.split("\n")
    # Find minimum indentation
    non_empty_lines = [l for l in lines if l.strip()]
    if non_empty_lines:
        min_indent = min(len(l) - len(l.lstrip()) for l in non_empty_lines)
        lines = [l[min_indent:] if len(l) >= min_indent else l for l in lines]
    return "\n".join(lines).strip()


def generate_query_code(question: str, schema: list[dict], sample_rows: list[dict]) -> dict:
    schema_str = "\n".join([f"  {c['name']} ({c.get('type', 'unknown')})" for c in schema])
    sample_str = json.dumps(sample_rows[:5], indent=2, default=str)

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
        temperature=0.1,
        messages=[
            {"role": "system", "content": QUERY_SYSTEM_PROMPT},
            {"role": "user", "content": f"Schema:\n{schema_str}\n\nSample rows:\n{sample_str}\n\nQuestion: {question}"},
        ],
    )
    text = response.choices[0].message.content.strip()
    print("=== LLM RAW OUTPUT ===")
    print(text)
    print("=== END LLM OUTPUT ===")

    # Remove markdown code blocks if present
    if "```" in text:
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)

    result = json.loads(text)

    # Clean the generated code
    if "code" in result:
        result["code"] = clean_code(result["code"])

    return result


def generate_insights(stats: dict, shape: tuple) -> list[dict]:
    stats_str = json.dumps(stats, indent=2, default=str)

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
        temperature=0.3,
        messages=[
            {"role": "system", "content": INSIGHT_SYSTEM_PROMPT},
            {"role": "user", "content": f"Dataset shape: {shape[0]} rows x {shape[1]} columns\n\nStatistical summary:\n{stats_str}"},
        ],
    )
    result = json.loads(response.choices[0].message.content)
    return result.get("insights", [])


def infer_schema(df) -> list[dict]:
    import pandas as pd
    schema = []
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            col_type = "number"
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            col_type = "date"
        elif pd.api.types.is_bool_dtype(df[col]):
            col_type = "boolean"
        else:
            col_type = "string"
        schema.append({
            "name": col,
            "type": col_type,
            "nullCount": int(df[col].isna().sum()),
            "uniqueCount": int(df[col].nunique()),
            "sampleValues": [str(v) for v in df[col].dropna().head(3).tolist()],
        })
    return schema