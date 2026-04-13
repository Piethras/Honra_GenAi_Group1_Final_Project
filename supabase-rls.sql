-- ============================================================
-- InsightForge — Supabase Row-Level Security Setup
-- Run this in your Supabase SQL editor BEFORE going live.
-- ============================================================

-- Enable RLS on all user-data tables
ALTER TABLE "Dataset"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Query"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Insight"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report"   ENABLE ROW LEVEL SECURITY;

-- ── Dataset policies ─────────────────────────────────────────
-- Users can only see their own datasets
CREATE POLICY "Users see own datasets"
  ON "Dataset" FOR ALL
  USING (
    "userId" = (SELECT id FROM "User" WHERE "clerkId" = auth.uid()::text)
  );

-- Org members can read their org's datasets
CREATE POLICY "Org members see org datasets"
  ON "Dataset" FOR SELECT
  USING (
    "orgId" IN (
      SELECT om."orgId" FROM "OrgMember" om
      JOIN "User" u ON u.id = om."userId"
      WHERE u."clerkId" = auth.uid()::text
    )
  );

-- ── Query policies ───────────────────────────────────────────
CREATE POLICY "Users see own queries"
  ON "Query" FOR ALL
  USING (
    "userId" = (SELECT id FROM "User" WHERE "clerkId" = auth.uid()::text)
  );

-- ── Insight policies ─────────────────────────────────────────
-- Insights are scoped to the dataset owner
CREATE POLICY "Users see insights for own datasets"
  ON "Insight" FOR SELECT
  USING (
    "datasetId" IN (
      SELECT id FROM "Dataset"
      WHERE "userId" = (SELECT id FROM "User" WHERE "clerkId" = auth.uid()::text)
    )
  );

-- ── Report policies ──────────────────────────────────────────
CREATE POLICY "Users see own reports"
  ON "Report" FOR ALL
  USING (
    "userId" = (SELECT id FROM "User" WHERE "clerkId" = auth.uid()::text)
  );

-- ── Storage bucket policy ────────────────────────────────────
-- Run in Supabase dashboard > Storage > Policies
-- Bucket: datasets (private)
-- Policy: authenticated users can only access their own prefix

-- INSERT policy
CREATE POLICY "Users upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'datasets'
    AND (storage.foldername(name))[1] = (SELECT id FROM "User" WHERE "clerkId" = auth.uid()::text)
  );

-- SELECT policy (signed URLs handle this — but belt-and-suspenders)
CREATE POLICY "Users read own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'datasets'
    AND (storage.foldername(name))[1] = (SELECT id FROM "User" WHERE "clerkId" = auth.uid()::text)
  );
