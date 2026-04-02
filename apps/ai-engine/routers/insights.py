# IMPLEMENT: POST /insights — Trigger insight generation for a dataset
# Request body:
#   datasetId: str
#   fileUrl: str — pre-signed URL to download the dataset
#   schema: list[dict]
#
# Implementation:
# 1. Download and parse the dataset file into a Pandas DataFrame
# 2. Call services/insights.py generate_insights(df) to:
#    a. Compute statistical summaries (compute_stats)
#    b. Call GPT-4o with the stats to generate 6 insight cards as JSON
# 3. Return the list of insight dicts:
#    [{ title, description, type, confidence, chartConfig }]
# 4. Handle GPT-4o errors and DataFrame parsing errors gracefully
