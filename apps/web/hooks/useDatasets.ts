// IMPLEMENT: Custom hook for fetching the datasets list
// - Use SWR to fetch from GET /api/datasets
// - Return { datasets, isLoading, isError, mutate }
// - mutate() can be called after upload to refresh the list
