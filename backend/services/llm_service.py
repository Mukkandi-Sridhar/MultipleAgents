import base64
import json
import logging
from openai import OpenAI
from config import settings
from prompts import concept_explainer, answer_checker, mistake_diagnoser

logger = logging.getLogger(__name__)

def get_openai_client():
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is not set in environment.")
    return OpenAI(api_key=settings.openai_api_key)

def extract_question_from_image(image_base64: str, media_type: str = "image/jpeg"):
    client = get_openai_client()

    system_prompt = """You are an OCR and homework parser assistant. Your task is to analyze the image, perform OCR, and extract the homework question.
Classify the question's primary academic subject, the specific mathematical/scientific concept, and difficulty level (Easy, Medium, Hard).

Format the output strictly as a JSON object with these keys:
{
  "extracted_text": "...", // The exact text of the question
  "subject": "...",        // e.g. Mathematics, Physics, Chemistry
  "concept": "...",        // The core topic, e.g. Quadratic Equations, Stoichiometry
  "difficulty": "..."      // Easy, Medium, or Hard
}
Do not include any explanation or extra characters, only valid JSON.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1000,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract and analyze the question in this image."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{media_type};base64,{image_base64}"
                            }
                        }
                    ]
                }
            ]
        )
        # Parse the JSON response
        text = response.choices[0].message.content.strip()
        # Find JSON boundaries if LLM added any backticks
        if "{" in text:
            text = text[text.find("{"):text.rfind("}")+1]
        data = json.loads(text)
        return data
    except Exception as e:
        logger.error(f"Error in OCR/Vision extraction: {e}. Falling back to mock data.")
        return {
            "extracted_text": "Calculate: 12 x 15",
            "subject": "Mathematics",
            "concept": "Multiplication / Distributive Property",
            "difficulty": "Easy"
        }

def get_concept_explanation(extracted_text: str, subject: str, concept: str, difficulty: str):
    client = get_openai_client()

    try:
        user_prompt = concept_explainer.USER_PROMPT_TEMPLATE.format(
            extracted_text=extracted_text,
            subject=subject,
            concept=concept,
            difficulty=difficulty
        )
        response = client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1500,
            messages=[
                {"role": "system", "content": concept_explainer.SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ]
        )
        text = response.choices[0].message.content.strip()
        if "{" in text:
            text = text[text.find("{"):text.rfind("}")+1]
        return json.loads(text)
    except Exception as e:
        logger.error(f"Error in concept explanation: {e}")
        return {
            "explanation": "Let's look at the core concept. We can break the problem into simpler parts to solve it step by step.",
            "prompt": "Can you share what your first step would be to solve this problem?"
        }

def evaluate_answer(extracted_text: str, student_answer: str, attempt_number: int):
    client = get_openai_client()

    # Step 1: Check if the answer is correct
    try:
        check_user_prompt = answer_checker.USER_PROMPT_TEMPLATE.format(
            extracted_text=extracted_text,
            student_answer=student_answer
        )
        response = client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1000,
            messages=[
                {"role": "system", "content": answer_checker.SYSTEM_PROMPT},
                {"role": "user", "content": check_user_prompt}
            ]
        )
        text = response.choices[0].message.content.strip()
        if "{" in text:
            text = text[text.find("{"):text.rfind("}")+1]
        check_result = json.loads(text)
        
        if check_result.get("correct") is True:
            return {
                "correct": True,
                "reinforcement": check_result.get("reinforcement"),
                "mastery_question": check_result.get("mastery_question"),
                "mastery_answer": check_result.get("mastery_answer")
            }
    except Exception as e:
        logger.error(f"Error in answer checker API call: {e}")
        return {"check_failed": True, "error": f"Answer checker service call failed: {str(e)}"}

    # Step 2: If incorrect, run mistake diagnoser
    try:
        diagnose_user_prompt = mistake_diagnoser.USER_PROMPT_TEMPLATE.format(
            extracted_text=extracted_text,
            student_answer=student_answer,
            attempt_number=attempt_number
        )
        response = client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1500,
            messages=[
                {"role": "system", "content": mistake_diagnoser.SYSTEM_PROMPT},
                {"role": "user", "content": diagnose_user_prompt}
            ]
        )
        text = response.choices[0].message.content.strip()
        if "{" in text:
            text = text[text.find("{"):text.rfind("}")+1]
        diagnose_result = json.loads(text)
        
        return {
            "correct": False,
            "mistake_type": diagnose_result.get("mistake_type", "conceptual"),
            "explanation": diagnose_result.get("explanation"),
            "hint": diagnose_result.get("hint"),
            "reveal_solution": diagnose_result.get("reveal_solution", False),
            "worked_solution": diagnose_result.get("worked_solution")
        }
    except Exception as e:
        logger.error(f"Error in mistake diagnoser API call: {e}")
        return {"check_failed": True, "error": f"Mistake diagnoser service call failed: {str(e)}"}

def classify_question_text(extracted_text: str):
    client = get_openai_client()
    system_prompt = """You are an expert academic classifier. Your task is to analyze the homework question text.
Classify the question's primary academic subject, the specific mathematical/scientific concept, and difficulty level (Easy, Medium, Hard).

Format the output strictly as a JSON object with these keys:
{
  "subject": "...",        // e.g. Mathematics, Physics, Chemistry
  "concept": "...",        // The core topic, e.g. Quadratic Equations, Distributive Property
  "difficulty": "..."      // Easy, Medium, or Hard
}
Do not include any explanation or extra characters, only valid JSON.
"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            max_tokens=500,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Classify this question text:\n---\n{extracted_text}"}
            ]
        )
        text = response.choices[0].message.content.strip()
        if "{" in text:
            text = text[text.find("{"):text.rfind("}")+1]
        return json.loads(text)
    except Exception as e:
        logger.error(f"Error in question text classification: {e}")
        return {
            "subject": "Mathematics",
            "concept": "Unknown Concept",
            "difficulty": "Medium"
        }


