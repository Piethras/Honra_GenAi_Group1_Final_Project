// IMPLEMENT: GET /api/query/history — Get the user's query history
// - Authenticate user
// - Accept optional query param: ?datasetId=... to filter by dataset
// - Return last 50 queries ordered by createdAt DESC
// - Each item includes: id, questionText, answerText, chartConfig, status, createdAt, dataset name
