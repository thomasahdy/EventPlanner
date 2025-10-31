from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers.user_routers import router
from .db import client  
from .config import settings

app = FastAPI(title="EventPlanner - Phase0 (Auth)")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Angular default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/auth")

@app.get("/")
async def root():
    return {"message": "EventPlanner API — Phase 0 (auth) is running."}
