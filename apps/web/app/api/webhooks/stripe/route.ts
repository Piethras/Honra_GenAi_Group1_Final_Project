// IMPLEMENT: POST /api/webhooks/stripe — Handle Stripe webhook events
// - Verify webhook signature using stripe.webhooks.constructEvent and STRIPE_WEBHOOK_SECRET
// - Handle these events:
//   'checkout.session.completed' → Upsert Subscription record, update user.plan to PRO or TEAM
//   'customer.subscription.updated' → Update subscription status and plan in DB
//   'customer.subscription.deleted' → Set status to 'canceled', reset user.plan to FREE
//   'invoice.payment_failed' → Set subscription status to 'past_due', optionally email user
// - Use upsert (not create) for idempotency — Stripe can send the same event more than once
// - Return 200 OK; return 400 for signature failures
