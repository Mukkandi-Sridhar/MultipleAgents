import json
import logging
from config import settings
from prompts import language_prompts
from services.llm_service import get_openai_client

logger = logging.getLogger(__name__)

# Simple in-memory storage for streak and XP
STREAK_STATE = {"streak": 2, "xp": 120}

def practice_language(student_text: str):
    logger.info(f"Processing student sentence: '{student_text[:30]}...'")
    STREAK_STATE["streak"] += 1
    STREAK_STATE["xp"] += 10
    
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
        "streak": STREAK_STATE["streak"],
        "xp": STREAK_STATE["xp"]
    }
