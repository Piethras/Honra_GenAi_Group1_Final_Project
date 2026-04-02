# IMPLEMENT: Unit tests for the code execution sandbox (pytest)
# Test cases:
# - test_safe_code_passes(): valid Pandas aggregation code → is_safe() returns True
# - test_import_blocked(): code with 'import os' → is_safe() returns False
# - test_exec_blocked(): code with 'exec(...)' → is_safe() returns False
# - test_subprocess_blocked(): code with 'subprocess' → is_safe() returns False
# - test_execute_simple_sum(): execute sum code, verify result dict structure
# - test_execute_groupby(): execute groupby code, verify rows in result
# - test_execute_timeout(): code with time.sleep(30) → raises TimeoutError
# - test_execute_invalid_result(): code that doesn't set 'result' → raises KeyError or returns empty
