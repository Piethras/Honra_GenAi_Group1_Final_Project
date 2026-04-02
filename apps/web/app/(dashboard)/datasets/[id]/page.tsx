// IMPLEMENT: Dataset detail page
// - Fetch dataset metadata by ID (name, file type, row/column counts, status, schema)
// - Render three tabbed panels:
//   Tab 1 - Preview: DataTable component with first 50 rows
//   Tab 2 - Schema: SchemaPanel listing each column's name, type, null%, unique count
//   Tab 3 - Insights: InsightCard grid showing auto-generated insights
// - Top action bar: "Ask a Question" button (links to /query?datasetId=...)
// - Show skeleton loaders while data is fetching
// - Handle PROCESSING status with a polling refresh every 5 seconds
