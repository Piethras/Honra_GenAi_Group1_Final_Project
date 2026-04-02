// IMPLEMENT: GET /api/datasets/[id]/preview — Return paginated data rows
// - Authenticate and verify dataset ownership
// - Accept query params: ?page=1 (default), ?limit=50 (max 200)
// - Generate a temporary signed URL for the file from Supabase Storage
// - Fetch the file and parse it (CSV: use PapaParse server-side; XLSX: use xlsx npm package)
// - Return { rows: [...], total: number, page: number, schema: dataset.schema }
// - Cache response for 60 seconds (add Cache-Control header)
