// IMPLEMENT: Supabase storage helpers
// - Initialize Supabase admin client using SUPABASE_SERVICE_ROLE_KEY (server-side only)
// - Export supabaseAdmin client for use in API routes
// - Function getSignedUrl(storagePath, expiresInSeconds): generates a temporary pre-signed URL
// - Function uploadFile(bucket, path, file): uploads a file and returns the storage path
// - Function deleteFile(bucket, path): deletes a file from storage
// - Function getFileRows(storagePath, page, limit): downloads the file, parses it, returns paginated rows
// - Support CSV (use csv-parse or Papa Parse), XLSX (use xlsx), JSON file types
