"""
SmartAgri AI - Chatbot API Routes
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from utils.security import get_current_user_id
from services.chatbot_service import process_message

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

class ChatMessage(BaseModel):
    message: str
    context: Optional[str] = None

@router.post("/")
async def chat(msg: ChatMessage, user_id: int = Depends(get_current_user_id)):
    result = process_message(msg.message)
    return result
