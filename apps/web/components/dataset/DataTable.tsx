// IMPLEMENT: Paginated, sortable data table (Client Component)
// - Props: rows (Row[]), columns (DatasetSchema), total (number), page (number), onPageChange (fn)
// - Render a <table> with column headers matching the schema
// - Clicking a column header toggles sort ASC/DESC (client-side sort for current page)
// - Show column type badges in the header (text, number, date, boolean)
// - Pagination controls at the bottom: Previous / Next / page numbers
// - For large datasets (>1000 rows), use react-virtual for virtual scrolling
// - Highlight null/empty cells in a muted color
// - Show a loading skeleton (shimmer rows) when isLoading is true
