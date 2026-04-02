# IMPLEMENT: Unit tests for the insights service (pytest)
# Test cases:
# - test_compute_stats_numeric(): DataFrame with numeric column → stats dict has mean, median, std
# - test_compute_stats_categorical(): DataFrame with text column → stats dict has top_values, unique_count
# - test_compute_stats_mixed(): DataFrame with mixed types → each column has correct type key
# - test_detect_outliers(): DataFrame with known outliers → outlier_count is correct
# - test_generate_insights_mocked(): mock the OpenAI client → verify 6 insight dicts returned
#   Use unittest.mock.patch to mock openai.OpenAI
