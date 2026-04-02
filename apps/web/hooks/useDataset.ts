// IMPLEMENT: Custom hook for fetching a single dataset
// - Accept datasetId as parameter
// - Use SWR or TanStack Query to fetch from GET /api/datasets/[id]
// - Return { dataset, isLoading, isError, mutate }
// - Poll every 3 seconds if dataset status is PROCESSING, stop polling when READY or ERROR
