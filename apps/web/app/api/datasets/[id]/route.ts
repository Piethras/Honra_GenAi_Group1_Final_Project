// IMPLEMENT: GET /api/datasets/[id] — Fetch single dataset metadata
// - Authenticate and verify the dataset belongs to the current user or their org
// - Return 404 if not found or unauthorized
// - Return full dataset object including: id, name, schema, status, rowCount, columnCount, createdAt
//
// DELETE /api/datasets/[id] — Delete a dataset
// - Authenticate and verify ownership
// - Delete the file from Supabase Storage
// - Delete all related Query and Insight records via cascade or manual deletion
// - Delete the Dataset record from DB
// - Return 204 No Content on success
