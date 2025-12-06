from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers.user_routers import router
from .routers.event_routers import router as event_router
from .db import client  
from .config import settings
import os

app = FastAPI(title="EventPlanner - Phase0 (Auth)")

# CORS middleware configuration
# Allow origins from environment variable or default to localhost for development
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:4200,http://localhost:80,http://localhost")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/auth")
app.include_router(event_router)

@app.get("/")
async def root():
    return {"message": "EventPlanner API — Phase 0 (auth) is running."}

@app.on_event("shutdown")
async def shutdown_event():
    client.close()