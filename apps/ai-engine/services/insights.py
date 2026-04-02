# IMPLEMENT: Automated insight generation service
#
# compute_stats(df: pd.DataFrame) → dict:
# - Iterate over all columns
# - For numeric columns: compute mean, median, std, min, max, null_pct
# - For categorical columns: compute top 3 values with counts, unique_count, null_pct
# - Return a dict keyed by column name with the stats nested inside
#
# detect_outliers(df: pd.DataFrame) → list[dict]:
# - For each numeric column, use IQR method: values below Q1-1.5*IQR or above Q3+1.5*IQR are outliers
# - Return a list of { column, outlier_count, outlier_pct, sample_values }
# - Used to enrich the insight prompt with outlier information
#
# generate_insights(df: pd.DataFrame) → list[dict]:
# - Call compute_stats() and detect_outliers()
# - Call llm.generate_insight_descriptions() with the combined stats + outlier data
# - Return the list of 6 insight cards
