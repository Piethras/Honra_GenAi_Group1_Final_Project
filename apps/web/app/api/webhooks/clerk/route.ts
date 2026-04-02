// IMPLEMENT: POST /api/webhooks/clerk — Handle Clerk webhook events
// - Verify the webhook signature using svix and CLERK_WEBHOOK_SECRET
// - Handle these events:
//   'user.created' → Create a new User record in the DB (clerkId, email, name, avatarUrl)
//   'user.updated' → Update name and avatarUrl in the User record
//   'user.deleted' → Delete the user and all their data (cascade)
//   'organization.created' → Create a new Organization record
//   'organizationMembership.created' → Create OrgMember record with appropriate role
//   'organizationMembership.deleted' → Remove OrgMember record
// - Return 200 OK for all handled events; return 400 for signature failures
