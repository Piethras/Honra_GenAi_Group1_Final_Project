// IMPLEMENT: GET /api/datasets/[id]/schema — Return just the schema JSON
// - Authenticate and verify dataset ownership
// - Return the schema field from the Dataset record
// - Schema format: [{ name: string, type: string, nullCount: number, uniqueCount: number }]
// - Used by the Schema tab in the dataset detail page
