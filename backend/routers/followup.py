from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.followup_service import generate_followup

router = APIRouter()

class FollowupRequest(BaseModel):
    lead_name: str
    lead_email: str
    lead_phone: str
    interest_area: str
    meeting_date: str
    meeting_notes: str

@router.post("/generate")
def create_followup(req: FollowupRequest):
    try:
        return generate_followup(
            lead_name=req.lead_name,
            lead_email=req.lead_email,
            lead_phone=req.lead_phone,
            interest_area=req.interest_area,
            meeting_date=req.meeting_date,
            meeting_notes=req.meeting_notes
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
