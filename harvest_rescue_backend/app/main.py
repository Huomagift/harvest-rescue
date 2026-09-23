import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.routers import farms, risk, alerts, auth
from app.services.satellite import init_earth_engine
from app.services.scheduler import start_scheduler, shutdown_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("harvest_rescue")

app = FastAPI(title="Harvest Rescue AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(farms.router)
app.include_router(risk.router)
app.include_router(alerts.router)



@app.on_event("startup")
def on_startup():
    init_db()
    try:
        init_earth_engine(project_id=settings.gee_project_id)
    except Exception as e:
        # Don't crash the app if GEE auth isn't finished yet — satellite.py's
        # fallback logic handles it per-request.
        logger.warning(f"Earth Engine init failed, will use fallback NDVI values: {e}")

    try:
        start_scheduler()
    except Exception as s_err:
        logger.error(f"Scheduler startup failed: {s_err}")


@app.on_event("shutdown")
def on_shutdown():
    shutdown_scheduler()


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Consistent JSON error shape for anything not already an HTTPException,
    # and never leak internals (stack traces, file paths) to the client.
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.get("/")
def health_check():
    return {"status": "ok", "service": "harvest-rescue-backend"}

