import json
import logging
from typing import Dict
from config import settings
from prompts import language_prompts
from services.llm_service import get_openai_client

logger = logging.getLogger(__name__)

# Simple in-memory per-user storage for streak and XP keyed by session_id
USER_STREAK_STATE: Dict[str, dict] = {}

def practice_language(student_text: str, session_id: str = "default"):
    logger.info(f"Processing student sentence for session '{session_id}': '{student_text[:30]}...'")
    if session_id not in USER_STREAK_STATE:
        USER_STREAK_STATE[session_id] = {"streak": 2, "xp": 120}
    
    state = USER_STREAK_STATE[session_id]
    state["streak"] += 1
    state["xp"] += 10
    
    client = get_openai_client()
    logger.info("Executing language tutor via OpenAI Chat API.")
    user_prompt = language_prompts.USER_PROMPT_TEMPLATE.format(student_text=student_text)
    response = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=1000,
        messages=[
            {"role": "system", "content": language_prompts.SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]
    )
    text = response.choices[0].message.content.strip()
    if "{" in text:
        text = text[text.find("{"):text.rfind("}")+1]
    data = json.loads(text)
    return {
        "corrected_text": data.get("corrected_text"),
        "explanation": data.get("explanation"),
        "vocabulary_suggestion": data.get("vocabulary_suggestion"),
        "streak": state["streak"],
        "xp": state["xp"]
    }
