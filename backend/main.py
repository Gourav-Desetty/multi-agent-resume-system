from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os

from backend.config import settings, logger
from backend.api import auth, resumes, jobs, monitoring, reports, settings as app_settings

app = FastAPI(
    title="Multi-Agent Resume Screening & Interview Prep API",
    description="Enterprise-grade recruiting platform backed by LangGraph and Langfuse",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under standard /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(resumes.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(monitoring.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(app_settings.router, prefix="/api")

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception occurred on path {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact the administrator."}
    )

# Foundation endpoints
@app.get("/")
async def root():
    return {
        "message": "Welcome to the Multi-Agent Resume Screening & Interview Prep API",
        "documentation": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }

@app.get("/version")
async def version_info():
    return {
        "name": "recruitment-platform-backend",
        "version": "1.0.0",
        "api_prefix": "/api"
    }

if __name__ == "__main__":
    import uvicorn
    # Use config specifications
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=(settings.ENVIRONMENT == "development")
    )
