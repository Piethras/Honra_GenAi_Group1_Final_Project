// IMPLEMENT: Prisma client singleton
// - Import PrismaClient from @prisma/client
// - Use the global singleton pattern to prevent multiple Prisma instances in dev (Next.js hot reload)
// - Pattern: declare global { var prisma: PrismaClient }; export const db = global.prisma ?? new PrismaClient()
// - In development: assign to global.prisma to reuse across hot reloads
// - Export as `db` — all other files import from this module
