// IMPLEMENT: Auth helper utilities
// - requireAuth(): calls Clerk's auth(), throws a 401 Response if no userId — use at the top of every API route
// - getCurrentUser(clerkId): fetches the User record from DB by Clerk ID
// - requireUser(): combines requireAuth + getCurrentUser — returns the full DB user or throws 401
// - getOrgContext(): returns the active org ID from Clerk's auth context (or null for personal)
// - hasQueryQuota(user): returns true if user has remaining queries for their plan
