# IMPLEMENT: LLM interaction service
# - Initialize OpenAI client with API key from OPENAI_API_KEY env var
# - Read model name from OPENAI_MODEL env var (default: 'claude-sonnet-4-20250514')
#   Note: The roadmap uses 'gpt-4o' but this is configurable via env var
#
# generate_query_code(question, schema, sample_rows) → dict:
# - Build the system prompt (see Section 5.2 of roadmap — SYSTEM_PROMPT)
# - Format schema as "column_name (type)" lines
# - Format sample_rows as a string representation
# - Call OpenAI chat completion with response_format={ "type": "json_object" }
# - Parse and return the JSON result: { code, answer, chart_type }
# - Wrap in try/except — raise a custom LLMError on failure
# - Implement retry with exponential backoff (3 attempts) for rate limit / timeout errors
#
# generate_insight_descriptions(stats_dict) → list[dict]:
# - Build prompt with the stats dict serialized as JSON (see Section 5.4 of roadmap)
# - Request exactly 6 insight cards as a JSON array
# - Parse and return the array of { title, description, type, confidence } dicts
