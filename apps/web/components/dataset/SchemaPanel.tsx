// IMPLEMENT: Dataset schema viewer (Client Component)
// - Props: schema (DatasetSchema[])
// - Render each column as a row: name, inferred type icon, null%, unique count, sample values
// - Color-code types: number (blue), text (green), date (purple), boolean (orange)
// - Show a warning icon if null% > 20% (high null rate)
// - Include a search/filter bar to find a column by name
