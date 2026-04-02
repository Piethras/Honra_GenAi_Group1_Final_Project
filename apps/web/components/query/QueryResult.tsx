// IMPLEMENT: Single query result display (Client Component)
// - Props: result (QueryResult), isLoading (boolean)
// - While loading: show animated skeleton for the chart and text areas
// - When loaded: render the plain-English answer text at the top
// - Below the answer: render the ChartRenderer component
// - Below the chart: render a compact DataTable of the result rows
// - Collapsible "View generated code" section showing the Pandas code in a syntax-highlighted code block
// - "Add to Report" button in the top-right corner
// - Show an error state with the error message if status is ERROR
