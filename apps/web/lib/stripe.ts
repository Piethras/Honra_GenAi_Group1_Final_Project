// IMPLEMENT: Stripe client singleton
// - Initialize Stripe with STRIPE_SECRET_KEY and API version '2024-06-20'
// - Export the initialized Stripe instance as `stripe`
// - Export PRICE_IDS constant mapping plan names to Stripe price IDs:
//   { PRO: 'price_xxx', TEAM: 'price_yyy' }
// - Export a helper createStripeCustomer(email, name) for new user registration
