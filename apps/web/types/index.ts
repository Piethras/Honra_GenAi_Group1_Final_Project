// IMPLEMENT: Shared TypeScript types and interfaces
// - Re-export Prisma-generated types where convenient
// - Define API response types:
//   QueryResult: { answer: string, chartType: ChartType, chartConfig: ChartConfig, data: Row[], generatedCode: string }
//   InsightCard: { id, title, description, type, confidence, chartConfig }
//   DatasetSchema: { name: string, type: string, nullCount: number, uniqueCount: number }[]
// - Define ChartType enum: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'table'
// - Define ChartConfig: { type: ChartType, xKey?: string, yKey?: string, columns?: string[] }
// - Define PlanLimits: { maxDatasets: number, maxQueriesPerMonth: number, canExport: boolean, canUseTeams: boolean }
