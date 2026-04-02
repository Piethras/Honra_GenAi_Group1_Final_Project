# IMPLEMENT: Supabase storage client for the Python engine
# - Initialize the Supabase Python client using SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
# - download_file(signed_url: str) → bytes: use httpx to download the file content
# - upload_file(bucket: str, path: str, content: bytes, content_type: str) → str:
#   Upload to Supabase storage and return the new storage path
# - generate_signed_url(path: str, expires_in: int) → str:
#   Generate a temporary pre-signed URL for a stored file
# - Used by the clean router to save cleaned files back to storage
