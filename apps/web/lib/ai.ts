// IMPLEMENT: AI engine API client
// - Helper functions to call the Python FastAPI AI engine
// - All requests include the X-Secret header using AI_ENGINE_SECRET env var
// - Functions to implement:
//   callQuery(payload): POST /query — send NLQ question and return result
//   callProcess(payload): POST /process — trigger file processing
//   callInsights(payload): POST /insights — trigger insight generation
//   callClean(payload): POST /clean — apply data cleaning operations
// - Add retry logic: 3 attempts with exponential backoff for transient errors
// - Throw typed errors so API routes can return appropriate HTTP status codes
