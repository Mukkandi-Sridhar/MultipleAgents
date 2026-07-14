import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers.homework import router as homework_router
from routers.followup import router as followup_router
from routers.documents import router as documents_router
from routers.support import router as support_router
from routers.language import router as language_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Aether Agents API", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include agent routers
app.include_router(homework_router, prefix="/api", tags=["Homework Coach"])
app.include_router(followup_router, prefix="/api/followup", tags=["Follow-up"])
app.include_router(documents_router, prefix="/api/documents", tags=["Documents & Reports"])
app.include_router(support_router, prefix="/api/support", tags=["Customer Support"])
app.include_router(language_router, prefix="/api/language", tags=["Language Learning"])

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Aether Agents API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)
