# IMPLEMENT: FastAPI application entry point
# - Initialize the FastAPI app with title and description
# - Define a verify_secret dependency that reads X-Secret header and compares to AI_ENGINE_SECRET env var
#   → Raise HTTP 403 Forbidden if it does not match
# - Include all routers with their prefixes and the verify_secret dependency:
#   query.router → prefix='/query'
#   insights.router → prefix='/insights'
#   process.router → prefix='/process'
#   clean.router → prefix='/clean'
# - Add a health check endpoint: GET / → returns {"status": "ok"}
# - Configure CORS to only accept requests from the Next.js app domain
