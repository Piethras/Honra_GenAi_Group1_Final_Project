// IMPLEMENT: Data cleaning suggestions panel (Client Component)
// - Props: schema (DatasetSchema[]), datasetId (string), onCleaningApplied (fn)
// - Scan the schema for issues: high null%, mixed types detected
// - Display a list of auto-detected issues with fix suggestions:
//   "Column 'age' has 15% null values — Fill with median or Drop rows"
// - Each suggestion has a toggle (Apply / Skip)
// - "Apply Selected Fixes" button calls POST /api/datasets/[id]/clean
// - Show a success toast when cleaning is applied; call onCleaningApplied() to refresh data
