// IMPLEMENT: Chat-style NLQ input (Client Component)
// - Props: onSubmit(question: string), isLoading (boolean), disabled (boolean)
// - Textarea input that auto-resizes up to ~4 lines
// - Submit on Enter key (Shift+Enter for newline) or click of Submit button
// - Disabled state while a query is running (shows spinner in the button)
// - Show character count if approaching a limit
// - Below the input: example question chips (e.g., "Show me total sales by month")
//   clicking a chip fills the input with that question
