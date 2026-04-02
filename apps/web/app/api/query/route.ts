// IMPLEMENT: POST /api/query — Submit a natural language question
// - Authenticate user — return 401 if not authenticated
// - Accept body: { question: string, datasetId: string }
// - Verify the dataset exists and belongs to the user
// - Check plan quota: FREE plan users are limited to 20 queries/month. Return 429 if exceeded
// - Generate a pre-signed URL for the dataset file (valid 1 hour)
// - Forward to Python AI engine POST /query with: { question, datasetId, schema, fileUrl }
// - On success: save the Query record to DB (questionText, generatedCode, resultJson, answerText, chartConfig, status: SUCCESS)
// - Increment user.queryCount in the DB
// - Return the full query result: { answer, chartType, chartConfig, data, generatedCode }
// - On AI engine error: save Query with status ERROR and return 500
