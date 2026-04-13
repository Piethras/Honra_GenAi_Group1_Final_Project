import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Public client (for client-side use)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (server-side only — has full access)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = 'datasets';

/**
 * Upload a file to Supabase Storage.
 * Returns the storage path.
 */
export async function uploadFile(
  userId: string,
  file: File | Buffer,
  fileName: string,
): Promise<string> {
  const storagePath = `${userId}/${Date.now()}-${fileName}`;
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, file, { upsert: false });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return storagePath;
}

/**
 * Get a signed URL (temporary, expires in `expiresIn` seconds).
 */
export async function getSignedUrl(
  storagePath: string,
  expiresIn = 3600,
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data) throw new Error(`Failed to create signed URL: ${error?.message}`);
  return data.signedUrl;
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(storagePath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}
