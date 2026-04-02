// IMPLEMENT: GET /api/query/[id] — Fetch a single saved query result
// - Authenticate and verify the query belongs to the current user
// - Return the full Query record including: questionText, answerText, chartConfig, resultJson, generatedCode, createdAt
// - Return 404 if not found
