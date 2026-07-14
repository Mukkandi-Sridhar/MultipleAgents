import json
import logging
from config import settings
from prompts import followup_prompts
from services.llm_service import get_openai_client

logger = logging.getLogger(__name__)

def generate_followup(lead_name: str, lead_email: str, lead_phone: str, interest_area: str, meeting_date: str, meeting_notes: str):
    client = get_openai_client()
    
    logger.info("Executing followup generator via OpenAI Chat API.")
    user_prompt = followup_prompts.USER_PROMPT_TEMPLATE.format(
        lead_name=lead_name,
        lead_email=lead_email,
        lead_phone=lead_phone,
        interest_area=interest_area,
        meeting_date=meeting_date,
        meeting_notes=meeting_notes
    )
    response = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=1500,
        messages=[
            {"role": "system", "content": followup_prompts.SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]
    )
    text = response.choices[0].message.content.strip()
    if "{" in text:
        text = text[text.find("{"):text.rfind("}")+1]
    return json.loads(text)
