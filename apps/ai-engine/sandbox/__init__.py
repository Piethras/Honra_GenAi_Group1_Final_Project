# This package contains the code execution sandbox utilities.
# IMPLEMENT: Any additional sandbox isolation logic here.
# Future enhancement: Replace exec() with a Docker-in-Docker sandbox or
# a restricted subprocess with seccomp filters for stronger isolation.
# For MVP: the restricted namespace + BLOCKED_PATTERNS in executor.py is sufficient.
