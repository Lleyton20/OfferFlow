import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.applications import router as applications_router
from app.api.assistant import router as assistant_router
from app.api.auth import router as auth_router
from app.api.capture import router as capture_router
from app.api.contacts import router as contacts_router
from app.api.internal import router as internal_router
from app.api.interviews import router as interviews_router
from app.api.jobs import router as jobs_router
from app.api.resumes import router as resumes_router
from app.api.tokens import router as tokens_router
from app.database import Base, SessionLocal, engine
from app.services import job_scheduler

# Uvicorn only configures its own loggers; without this, app-level INFO logs (such as
# job refresh results) never reach the platform's log stream.
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logging.getLogger("httpx").setLevel(logging.WARNING)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    stop_refresh = job_scheduler.start(SessionLocal)
    yield
    if stop_refresh is not None:
        stop_refresh.set()


app = FastAPI(title="OfferFlow API", lifespan=lifespan)

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(applications_router)
app.include_router(resumes_router)
app.include_router(contacts_router)
app.include_router(interviews_router)
app.include_router(assistant_router)
app.include_router(capture_router)
app.include_router(tokens_router)
app.include_router(jobs_router)
app.include_router(internal_router)


@app.get("/")
def root():
    return {"message": "OfferFlow API is running"}
