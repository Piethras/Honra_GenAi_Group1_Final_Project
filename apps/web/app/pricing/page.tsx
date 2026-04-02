// IMPLEMENT: Pricing page (public)
// - Display three plan tiers: Free, Pro ($15/mo), Team ($49/mo)
// - Each card shows: price, feature list, query limits, CTA button
// - Free: 20 queries/month, 3 datasets, no export
// - Pro: unlimited queries, unlimited datasets, PDF/XLSX export
// - Team: Pro features + org accounts, RBAC, team management
// - CTA buttons call /api/billing/checkout with the selected plan
// - Highlight the recommended plan visually
