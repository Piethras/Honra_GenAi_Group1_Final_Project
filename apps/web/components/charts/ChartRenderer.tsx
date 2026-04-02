// IMPLEMENT: Dynamic chart renderer (Client Component)
// - Props: chartConfig (ChartConfig), data (Row[]), compact (boolean, default false)
// - Switch on chartConfig.type to render the correct chart:
//   'bar' → BarChart (Recharts)
//   'line' → LineChart (Recharts)
//   'area' → AreaChart (Recharts)
//   'pie' → PieChart (Recharts)
//   'scatter' → ScatterChart (Recharts)
//   'table' → DataTable component (no chart, just the data)
// - In compact mode: hide legend, reduce padding (used inside InsightCard)
// - In full mode: show legend, tooltips, axis labels
// - All charts are responsive (use ResponsiveContainer from Recharts)
// - Show a "No data to display" placeholder if data is empty
