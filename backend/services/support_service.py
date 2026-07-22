import json
import logging
import os
from config import settings
from prompts import support_prompts
from services.llm_service import get_openai_client

logger = logging.getLogger(__name__)

# Resolve path relative to backend directory
FAQ_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/faq.json"))

def find_best_faq_match(user_query: str):
    if not os.path.exists(FAQ_PATH):
        logger.warning(f"FAQ database file not found at: {FAQ_PATH}")
        return None, 0.0
        
    try:
        with open(FAQ_PATH, "r") as f:
            faqs = json.load(f)
    except Exception as e:
        logger.error(f"Error reading FAQ JSON: {e}")
        return None, 0.0
        
    query_tokens = set(user_query.lower().replace("?", "").split())
    best_faq = None
    best_score = 0.0
    
    # Simple stop words to discard from small token match
    stop_words = {"what", "is", "how", "do", "you", "does", "the", "a", "an", "i", "can", "to", "my", "our", "with", "at", "on"}
    filtered_query = query_tokens - stop_words
    if not filtered_query:
        filtered_query = query_tokens
    
    for faq in faqs:
        question_tokens = set(faq["question"].lower().replace("?", "").split()) - stop_words
        overlap = filtered_query.intersection(question_tokens)
        
        # Jaccard overlap score
        score = len(overlap) / max(len(filtered_query), 1)
        if score > best_score:
            best_score = score
            best_faq = faq
            
    return best_faq, best_score

def handle_support_chat(message: str, chat_history):
    logger.info(f"Handling support chat for message: '{message[:30]}...'")
    faq, score = find_best_faq_match(message)
    
    logger.info(f"FAQ Match score: {score:.2f}")
    if score >= 0.15 and faq:
        faq_context = f"Question: {faq['question']}\nAnswer: {faq['answer']}"
    else:
        faq_context = "No relevant FAQ article found in the database. You must inform the user that their request is being escalated to human support."
        
    client = get_openai_client()
    logger.info("Executing support chat via OpenAI Chat API.")
    history_formatted = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chat_history])
    
    user_prompt = support_prompts.USER_PROMPT_TEMPLATE.format(
        faq_context=faq_context,
        user_question=message,
        chat_history=history_formatted
    )
    
    response = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=1000,
        messages=[
            {"role": "system", "content": support_prompts.SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]
    )
    text = response.choices[0].message.content.strip()
    if "{" in text:
        text = text[text.find("{"):text.rfind("}")+1]
    return json.loads(text)
