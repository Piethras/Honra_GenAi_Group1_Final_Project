// IMPLEMENT: API integration tests (Vitest)
// Test each Next.js API route using a test HTTP client (msw or direct fetch to test server)
//
// Test cases:
// - datasets/upload: missing file → 400; valid file → 200 with dataset ID
// - datasets/[id]: unauthorized access → 401; valid request → 200
// - query: Free plan user at limit → 429; valid query → 200 with answer + chart
// - webhooks/clerk: invalid signature → 400; valid user.created → 201 user in DB
// - webhooks/stripe: checkout.session.completed → user plan updated in DB
// Mock Clerk auth using @clerk/nextjs/testing utilities
// Mock Supabase calls using jest.mock or msw
