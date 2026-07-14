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

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Serve frontend static files if the directory exists
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    # Mount assets directory for css/js files
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Catch-all route to serve index.html or other static files directly
    @app.get("/{path_name:path}")
    async def serve_frontend(path_name: str):
        if path_name.startswith("api"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not Found")
            
        file_path = os.path.join(static_dir, path_name)
        if path_name and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"detail": "Not Found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)

