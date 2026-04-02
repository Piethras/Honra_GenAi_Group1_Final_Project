// IMPLEMENT: POST /api/billing/portal — Create a Stripe Customer Portal session
// - Authenticate user
// - Look up stripeCustomerId from Subscription table
// - Create a Stripe billing portal session for the customer
// - Return { url } — frontend redirects user to manage their subscription
// - The portal lets users update payment methods, view invoices, and cancel
