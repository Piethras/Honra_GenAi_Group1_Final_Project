// IMPLEMENT: POST /api/datasets/upload — Handle file upload
// - Authenticate user — return 401 if not authenticated
// - Accept multipart/form-data with a single 'file' field
// - Validate: file must be CSV, XLSX, or JSON; max size 50MB
// - Upload the file to Supabase Storage at path: {userId}/{timestamp}-{filename}
// - Create a Dataset record in the DB with status PROCESSING
// - Fire-and-forget: POST to Python AI engine /process to parse the file and update the schema
// - Return immediately with { id: dataset.id } — do not wait for processing
// - Handle Supabase upload errors and DB errors with proper 500 responses
