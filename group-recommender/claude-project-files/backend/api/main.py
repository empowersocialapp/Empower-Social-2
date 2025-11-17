from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.api.routes import router
import os

app = FastAPI(
    title="Group Recommender API",
    description="Local group and organization recommendation system",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

# Test mode routes
from backend.api.test_routes import router as test_router
app.include_router(test_router, prefix="/api/test")

# Serve frontend
frontend_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
test_frontend_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "test")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")
    
    @app.get("/")
    async def read_root():
        return FileResponse(os.path.join(frontend_path, "index.html"))

# Serve test mode frontend
if os.path.exists(test_frontend_path):
    @app.get("/test/profile.html")
    async def test_profile():
        return FileResponse(os.path.join(test_frontend_path, "profile.html"))
    
    @app.get("/test/recommendations.html")
    async def test_recommendations():
        return FileResponse(os.path.join(test_frontend_path, "recommendations.html"))

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Group Recommender API is running"}

