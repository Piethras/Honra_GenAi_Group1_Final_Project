// IMPLEMENT: GET /api/insights/[datasetId] — Fetch auto-generated insights for a dataset
// - Authenticate and verify dataset ownership
// - Return all Insight records for this dataset from the DB
// - If no insights exist yet (dataset still PROCESSING), return empty array with a 202 status
// - Each insight: { id, title, description, type, confidence, chartConfig, createdAt }
//
// POST /api/insights/[datasetId] — Manually trigger insight regeneration
// - Authenticate and verify ownership
// - Call Python engine POST /insights with the dataset file URL and schema
// - Delete existing insights and insert fresh ones returned by the engine
// - Return the new insights array
