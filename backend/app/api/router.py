from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.documents import router as documents_router
from app.api.routes.highlights import router as highlights_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(documents_router, tags=["documents"])
api_router.include_router(highlights_router, tags=["highlights"])