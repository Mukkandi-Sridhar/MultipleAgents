from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.documents_service import analyze_document

router = APIRouter()

class DocumentRequest(BaseModel):
    data_raw: str
    file_type: str = "csv"

@router.post("/analyze")
def run_analysis(req: DocumentRequest):
    try:
        return analyze_document(data_raw=req.data_raw, file_type=req.file_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
