// IMPLEMENT: Custom hook for dataset insights
// - Accept datasetId
// - Fetch from GET /api/insights/[datasetId]
// - Return { insights, isLoading, isError, regenerate }
// - regenerate() calls POST /api/insights/[datasetId] and refreshes
