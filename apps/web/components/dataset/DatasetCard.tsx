// IMPLEMENT: Dataset list card (Client Component)
// - Props: dataset (Dataset)
// - Show: file type icon, name, status badge, row count, column count, upload date
// - Status badge colors: PROCESSING=yellow+spinner, READY=green, ERROR=red
// - Clicking the card navigates to /datasets/[id]
// - Hover shows "Query" and "Delete" action buttons
// - Delete triggers a confirmation dialog before calling DELETE /api/datasets/[id]
