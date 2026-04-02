# IMPLEMENT: POST /clean — Apply data cleaning operations to a dataset
# Request body:
#   fileUrl: str — pre-signed URL to download the current file
#   operations: list[dict] — [{ column, action, value? }]
#     Supported actions: 'fill_null' (fill with value), 'drop_null', 'trim', 'lowercase', 'uppercase'
#
# Implementation:
# 1. Download and parse the file into a Pandas DataFrame
# 2. Apply each operation in order:
#    fill_null → df[col].fillna(value)
#    drop_null → df.dropna(subset=[col])
#    trim → df[col].str.strip()
#    lowercase → df[col].str.lower()
# 3. Re-compute schema stats after cleaning
# 4. Upload the cleaned file back to Supabase Storage (use the Supabase Python client)
# 5. Return { newFileUrl, schema, rowCount, columnCount }
