from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

from routers import query, insights, process, preview, clean, eda, modelling, conclusions

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("InsightForge AI Engine starting up...")
    yield
    print("Shutting down.")

app = FastAPI(
    title="InsightForge AI Engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production to your Next.js domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Internal auth guard ────────────────────────────────────────
def verify_secret(x_secret: str = Header(...)):
    expected = os.environ.get("AI_ENGINE_SECRET", "")
    if not expected or x_secret != expected:
        raise HTTPException(status_code=403, detail="Forbidden")

auth = Depends(verify_secret)

# ── Routers ───────────────────────────────────────────────────
app.include_router(query.router,    prefix="/query",    dependencies=[auth])
app.include_router(insights.router, prefix="/insights", dependencies=[auth])
app.include_router(process.router,  prefix="/process",  dependencies=[auth])
app.include_router(preview.router,  prefix="/preview",  dependencies=[auth])
app.include_router(clean.router,    prefix="/clean",    dependencies=[auth])
app.include_router(eda.router,      prefix="/eda",      dependencies=[auth])
app.include_router(modelling.router, prefix="/modelling", dependencies=[auth])
app.include_router(conclusions.router, prefix="/conclusions", dependencies=[auth])
@app.get("/health")
async def health():
    return {"status": "ok"}
