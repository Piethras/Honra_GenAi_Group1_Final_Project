// IMPLEMENT: POST /api/export/pdf — Generate and return a PDF report
// - Authenticate user
// - Accept body: { title: string, queryIds: string[], insightIds: string[] }
// - Fetch the selected Query and Insight records from DB (verify ownership)
// - Build an HTML string using buildReportHTML() helper (branded, print-ready layout)
// - Use Puppeteer (or puppeteer-core + chromium) to render HTML to PDF
// - Return the PDF as a binary response with Content-Type: application/pdf
// - Also save the PDF to Supabase Storage and create a Report record in the DB
// - Set Content-Disposition: attachment; filename="report.pdf" for auto-download
