// IMPLEMENT: POST /api/billing/checkout — Create a Stripe Checkout session
// - Authenticate user — return 401 if not authenticated
// - Accept body: { plan: 'PRO' | 'TEAM' }
// - Look up the user's Stripe customer ID from the Subscription table
// - Create a Stripe checkout session in subscription mode with the correct price ID
// - Set success_url to /dashboard?upgraded=1 and cancel_url to /pricing
// - Include userId in session metadata (needed by webhook handler)
// - Return { url: session.url } — the frontend redirects the user to this URL
