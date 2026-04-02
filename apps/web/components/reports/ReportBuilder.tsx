// IMPLEMENT: Report builder panel (Client Component)
// - Props: datasetId (optional), onExport(format, selections)
// - Section 1: Report title input
// - Section 2: Checkboxes for selecting which query results to include (fetched from history)
// - Section 3: Checkboxes for selecting which insight cards to include
// - Export buttons: "Export PDF" and "Export XLSX"
// - Clicking Export calls onExport with the format and selected IDs
// - Show a loading state while export is processing
// - Show a download link when the export file is ready
