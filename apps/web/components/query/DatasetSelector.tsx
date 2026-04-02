// IMPLEMENT: Dataset selector dropdown (Client Component)
// - Fetch the user's READY datasets from GET /api/datasets?status=READY
// - Render a styled <select> or shadcn/ui Combobox
// - Show: dataset name, file type badge, row count
// - Pre-select if a datasetId is passed as a prop (from URL query param)
// - onChange: call onSelect(datasetId) to notify the parent query page
// - Show an empty state if no READY datasets exist, with a link to upload one
