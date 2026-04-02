# IMPLEMENT: POST /query — NLQ endpoint
# Request body (Pydantic model):
#   question: str — the user's plain-English question
#   datasetId: str — for logging/reference
#   schema: list[dict] — column name + type info
#   fileUrl: str — pre-signed Supabase URL to download the dataset file
#
# Implementation steps:
# 1. Download the dataset file using httpx (async HTTP client)
# 2. Parse into a Pandas DataFrame (detect CSV vs XLSX from URL extension)
# 3. Extract sample rows (first 10) for the prompt
# 4. Call services/llm.py generate_query_code(question, schema, sample_rows)
# 5. Validate the generated code using services/executor.py is_safe()
# 6. Execute the code safely using services/executor.py execute_code(code, df)
# 7. Build and return QueryResponse:
#    answer, chartType, chartConfig, data (list of row dicts), generatedCode
# 8. Catch execution errors and return a 500 with a clear error message
# 9. Add a 20-second timeout for the entire request (configurable)
