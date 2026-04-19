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

def generate_cleaning_suggestions(profile: list[dict], row_count: int) -> list[dict]:
    profile_str = json.dumps(profile, indent=2)

    prompt = f"""You are a data cleaning expert. Given this dataset profile, suggest specific cleaning actions.

Dataset has {row_count} rows.
Column profiles:
{profile_str}

Return ONLY a valid JSON object with key "suggestions" containing an array of objects.
Each object must have:
- "column": column name (or "all" for dataset-wide actions)
- "issue": short description of the problem
- "action": one of "fill_missing_mean", "fill_missing_median", "fill_missing_mode", "remove_duplicates", "remove_outliers", "drop_column"
- "reason": one sentence explaining why

Only suggest actions where there is a real issue. Maximum 8 suggestions."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
        temperature=0.1,
        messages=[
            {"role": "user", "content": prompt}
        ],
    )
    text = response.choices[0].message.content.strip()
    result = json.loads(text)
    return result.get("suggestions", [])


def generate_eda_narrative(stats: list[dict], distributions: list[dict], row_count: int, col_count: int) -> str:
    stats_str = json.dumps(stats[:5], indent=2, default=str)
    dist_summary = [{"column": d["column"], "type": d["type"], "topValue": d["values"][0] if d["values"] else "N/A"} for d in distributions[:5]]
    dist_str = json.dumps(dist_summary, indent=2)

    prompt = f"""You are a data analyst. Write a clear, plain English summary of this dataset for a non-technical audience.

Dataset: {row_count} rows, {col_count} columns
Numeric column statistics: {stats_str}
Column distributions (top values): {dist_str}

Write 3-4 sentences that:
1. Describe what kind of data this appears to be
2. Highlight the most interesting numeric ranges or patterns
3. Mention any notable distributions or dominant categories

Return ONLY the narrative text, no JSON, no bullet points."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content.strip()

def generate_model_explanation(results: dict) -> str:
    results_str = json.dumps(results, indent=2, default=str)

    prompt = f"""You are a data science teacher explaining model results to a non-technical person.

Model results:
{results_str}

Write 3-4 plain English sentences that:
1. State what the model does and what it predicts
2. Explain how well it performed in simple terms (e.g. "The model was correct 85% of the time")
3. Mention the most important feature(s) that influence the prediction
4. Give one practical takeaway

Return ONLY the explanation text, no JSON, no bullet points."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content.strip()

def generate_conclusions(basic_info: dict, eda_summary: dict = None,
                         model_results: dict = None, cleaning_summary: dict = None,
                         top_queries: list = None) -> dict:

    context_parts = []

    # Basic info
    context_parts.append(f"""DATASET INFORMATION:
- Name: {basic_info['name']}
- Total rows: {basic_info['rows']}
- Total columns: {basic_info['columns']}
- Column names: {', '.join(basic_info['columnNames'])}""")

    # Cleaning details
    if cleaning_summary:
        context_parts.append(f"""DATA CLEANING PERFORMED:
- Rows removed: {cleaning_summary.get('rowsRemoved', 0)} out of {basic_info['rows']} ({round(cleaning_summary.get('rowsRemoved', 0) / basic_info['rows'] * 100, 1)}% of data)
- Operations applied: {'; '.join(cleaning_summary.get('changes', ['None']))}
- Rows remaining after cleaning: {cleaning_summary.get('finalRows', basic_info['rows'])}""")

    # EDA details with actual numbers
    if eda_summary:
        stats = eda_summary.get('stats', [])
        correlations = eda_summary.get('correlations', [])
        distributions = eda_summary.get('distributions', [])

        stats_detail = []
        for s in stats:
            stats_detail.append(
                f"  {s['column']}: min={s['min']}, max={s['max']}, mean={s['mean']}, median={s['median']}, std={s['std']}, missing={s['missing']}"
            )

        corr_detail = []
        for c in correlations[:5]:
            corr_detail.append(
                f"  {c['colA']} & {c['colB']}: r={c['correlation']} ({c['strength']} {c['direction']} correlation)"
            )

        dist_detail = []
        for d in distributions[:5]:
            if d['values'] and d['counts']:
                top = list(zip(d['values'][:3], d['counts'][:3]))
                top_str = ', '.join([f"{v} ({c} occurrences)" for v, c in top])
                dist_detail.append(f"  {d['column']}: top values — {top_str}")

        context_parts.append(f"""EXPLORATORY DATA ANALYSIS RESULTS:
Numeric column statistics:
{chr(10).join(stats_detail) if stats_detail else 'No numeric columns found'}

Top correlations between columns:
{chr(10).join(corr_detail) if corr_detail else 'No significant correlations found'}

Value distributions (top occurrences):
{chr(10).join(dist_detail) if dist_detail else 'No distribution data'}

AI EDA narrative: {eda_summary.get('narrative', '')}""")

    # Model results with actual numbers
    if model_results:
        feat_detail = []
        for f in model_results.get('featureImportance', [])[:5]:
            feat_detail.append(f"  {f['feature']}: importance score = {f['importance']}")

        if model_results.get('r2Score') is not None:
            samples = model_results.get('predictionSamples', [])[:5]
            sample_detail = []
            for i, s in enumerate(samples):
                diff_pct = abs(s['actual'] - s['predicted']) / abs(s['actual']) * 100 if s['actual'] != 0 else 0
                sample_detail.append(f"  Sample {i+1}: actual={s['actual']}, predicted={s['predicted']}, error={round(diff_pct, 1)}%")

            context_parts.append(f"""REGRESSION MODEL RESULTS:
- Model type: {model_results.get('modelType')}
- Target column being predicted: {model_results.get('targetColumn')}
- R² Score: {model_results.get('r2Score')} (means the model explains {round(model_results.get('r2Score', 0) * 100, 1)}% of variance in the target)
- RMSE: {model_results.get('rmse')} (average prediction error)
- Training samples: {model_results.get('trainSize')}
- Testing samples: {model_results.get('testSize')}

Feature importance (which columns most influence the prediction):
{chr(10).join(feat_detail)}

Prediction samples (actual vs predicted):
{chr(10).join(sample_detail)}

Model explanation: {model_results.get('explanation', '')}""")

        elif model_results.get('accuracy') is not None:
            class_dist = model_results.get('classDistribution', [])
            class_detail = ', '.join([f"{c['class']}: {c['count']} rows" for c in class_dist])

            context_parts.append(f"""CLASSIFICATION MODEL RESULTS:
- Model type: {model_results.get('modelType')}
- Target column being predicted: {model_results.get('targetColumn')}
- Accuracy: {model_results.get('accuracy')}%
- Classes predicted: {', '.join(model_results.get('classes', []))}
- Class distribution: {class_detail}
- Training samples: {model_results.get('trainSize')}
- Testing samples: {model_results.get('testSize')}

Feature importance (which columns most influence classification):
{chr(10).join(feat_detail)}

Model explanation: {model_results.get('explanation', '')}""")

    # Queries answered
    if top_queries:
        query_detail = []
        for q in top_queries[:5]:
            query_detail.append(f"  Q: {q.get('questionText', '')}\n  A: {q.get('answerText', '')}")
        context_parts.append(f"""KEY QUESTIONS ANSWERED DURING ANALYSIS:
{chr(10).join(query_detail)}""")

    context = '\n\n'.join(context_parts)

    prompt = f"""You are a senior data scientist writing a final, comprehensive analysis report. 
Your conclusions must be SPECIFIC, DATA-DRIVEN, and PRECISE — always cite actual numbers, column names, and values from the context provided.
Never make vague statements. Every claim must reference actual data.

ANALYSIS CONTEXT:
{context}

Write a complete conclusions report with these exact sections. Be very specific and detailed:

1. OVERVIEW: Describe exactly what dataset was analysed (name, size, columns). State the purpose of the analysis.

2. KEY FINDINGS: List 5-7 specific findings. Each finding MUST include actual numbers or values. 
   Example format: "The Sales column ranges from X to Y with a mean of Z" or "Standard Class accounts for X% of all shipments (N occurrences)"

3. DATA QUALITY: Describe the exact state of data quality — list any columns with missing values and exact counts, 
   how many duplicates were found, what cleaning operations were done and how many rows were affected.

4. PATTERNS AND RELATIONSHIPS: Describe specific correlations with their exact r values. 
   Describe the top value distributions with actual counts. 
   Example: "Column A and Column B show a strong positive correlation (r=0.85), suggesting..."

5. PREDICTIONS: If a model was trained, state exactly what it predicts, the exact accuracy/R² score, 
   which features were most important (with scores), and what the average prediction error is.
   If no model was run, state "No predictive model was trained during this analysis."

6. RECOMMENDATIONS: Provide 4-5 specific, actionable recommendations based on the actual findings.
   Each recommendation should reference specific columns or values found in the analysis.

Return ONLY a valid JSON object with these exact keys:
"overview" (string),
"keyFindings" (array of strings, each with specific numbers),
"dataQuality" (string with exact numbers),
"patternsAndRelationships" (string with exact correlation values and counts),
"predictions" (string with exact model metrics),
"recommendations" (array of strings, each actionable and specific)

Every section must reference actual numbers and column names from the context. Do not use vague language."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
        temperature=0.1,
        messages=[{"role": "user", "content": prompt}],
    )
    text = response.choices[0].message.content.strip()
    return json.loads(text)