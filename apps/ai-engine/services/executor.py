# IMPLEMENT: Safe Python code execution sandbox
# - BLOCKED_PATTERNS list: import, exec, eval, open, os., sys., __, subprocess, socket, requests, urllib
#
# is_safe(code: str) → bool:
# - Convert code to lowercase and check for any blocked pattern
# - Return False immediately if any pattern is found
# - Log a warning if unsafe code is detected
#
# execute_code(code: str, df: pd.DataFrame, timeout: int = 20) → dict:
# - Call is_safe() first — raise ValueError('Code contains disallowed patterns') if unsafe
# - Set up a restricted namespace: { 'df': df.copy(), 'pd': pd }
# - Use signal.alarm() for a timeout (Linux only — for Windows use threading.Timer)
# - Execute with exec(code, {'__builtins__': {}}, local_ns)
# - Extract local_ns['result'] — must be a dict with 'data' (list of dicts) and 'columns' (list of str)
# - Validate result structure before returning
# - Catch and re-raise TimeoutError, NameError, KeyError, and any pandas exceptions with clear messages
