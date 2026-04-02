// IMPLEMENT: GET /api/datasets — List all datasets for the current user/org
// - Authenticate with Clerk's auth() helper — return 401 if not authenticated
// - If an active org context exists, return org datasets; otherwise return personal datasets
// - Support optional query params: ?status=READY, ?search=sales
// - Return an array of dataset objects with id, name, fileType, rowCount, status, createdAt
// - Order by createdAt DESC
