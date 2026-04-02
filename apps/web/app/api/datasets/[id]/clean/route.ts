// IMPLEMENT: POST /api/datasets/[id]/clean — Apply data cleaning operations
// - Authenticate and verify dataset ownership
// - Accept body: { operations: [{ column: string, action: 'fill_null' | 'drop_null' | 'trim' | 'lowercase', value?: string }] }
// - Forward the request to the Python AI engine /clean endpoint
// - Python engine applies Pandas operations and saves a new cleaned file to Supabase Storage
// - Update the Dataset record with the new fileUrl and updated schema
// - Return the updated dataset object
