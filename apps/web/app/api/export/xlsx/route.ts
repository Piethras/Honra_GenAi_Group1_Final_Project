// IMPLEMENT: POST /api/export/xlsx — Generate and return an Excel report
// - Authenticate user
// - Accept body: { title: string, queryIds: string[], insightIds: string[] }
// - Fetch selected Query records from DB
// - Use the xlsx npm package to create a workbook:
//   Sheet 1 - Summary: report title, date, insights as text
//   Sheet 2+ - One sheet per query with the result data table
// - Return as binary with Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// - Also save to Supabase Storage and create a Report record in the DB
