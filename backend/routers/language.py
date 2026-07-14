from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.language_service import practice_language

router = APIRouter()

class LanguageRequest(BaseModel):
    student_text: str

@router.post("/practice")
def run_practice(req: LanguageRequest):
    try:
        return practice_language(student_text=req.student_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
