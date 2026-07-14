from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from services.support_service import handle_support_chat

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class SupportRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

@router.post("/chat")
def run_chat(req: SupportRequest):
    try:
        history_list = [{"role": msg.role, "content": msg.content} for msg in req.history]
        return handle_support_chat(message=req.message, chat_history=history_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
