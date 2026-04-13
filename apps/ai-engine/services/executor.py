import pandas as pd
import signal
from typing import Any

# ── Patterns that must never appear in LLM-generated code ─────
BLOCKED_PATTERNS = [
    "import ", "__import__", "exec(", "eval(", "open(", "os.", "sys.",
    "subprocess", "socket", "requests", "urllib", "http.",
    "__builtins__", "__class__", "__dict__", "__globals__",
    "getattr", "setattr", "delattr", "vars(", "globals(", "locals(",
    "compile(", "breakpoint(", "input(", "print(",
]

# ── Allowed safe built-ins ─────────────────────────────────────
SAFE_BUILTINS: dict[str, Any] = {
    "abs": abs, "all": all, "any": any, "bool": bool,
    "dict": dict, "enumerate": enumerate, "filter": filter,
    "float": float, "int": int, "isinstance": isinstance,
    "len": len, "list": list, "map": map, "max": max,
    "min": min, "range": range, "reversed": reversed,
    "round": round, "set": set, "sorted": sorted,
    "str": str, "sum": sum, "tuple": tuple, "type": type,
    "zip": zip, "None": None, "True": True, "False": False,
}


def is_safe(code: str) -> tuple[bool, str]:
    code_lower = code.lower()
    for pattern in BLOCKED_PATTERNS:
        if pattern.lower() in code_lower:
            return False, f"Blocked pattern detected: '{pattern}'"
    return True, ""


def execute_code(code: str, df: pd.DataFrame, timeout: int = 20) -> dict:
    safe, reason = is_safe(code)
    if not safe:
        raise ValueError(f"Code safety check failed: {reason}")

    local_ns: dict[str, Any] = {
        "df": df.copy(),
        "pd": pd,
        "__builtins__": SAFE_BUILTINS,
    }

    def _timeout_handler(signum, frame):
        raise TimeoutError("Code execution timed out after 20 seconds")

    # Use SIGALRM only on Unix systems
    try:
        signal.signal(signal.SIGALRM, _timeout_handler)
        signal.alarm(timeout)
        try:
            exec(code, local_ns)  # noqa: S102
        finally:
            signal.alarm(0)
    except AttributeError:
        # Windows doesn't support SIGALRM — run without timeout
        exec(code, local_ns)  # noqa: S102

    result = local_ns.get("result")
    if result is None:
        raise ValueError("Code did not assign a value to 'result'")
    if not isinstance(result, dict):
        raise ValueError("'result' must be a dict with 'data' and 'columns' keys")

    # Sanitize: convert all values to JSON-safe types
    data = result.get("data", [])
    if isinstance(data, pd.DataFrame):
        data = data.to_dict(orient="records")

    sanitized = []
    for row in data:
        sanitized.append({
            k: (None if pd.isna(v) else (float(v) if hasattr(v, '__float__') and not isinstance(v, str) else str(v) if not isinstance(v, (int, float, bool, str, type(None))) else v))
            for k, v in (row.items() if isinstance(row, dict) else {})
        })

    return {
        "data": sanitized,
        "columns": result.get("columns", list(sanitized[0].keys()) if sanitized else []),
        "answer": local_ns.get("answer", ""),
    }
