import base64
import logging
import io
from pypdf import PdfReader
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from services.llm_service import extract_question_from_image, get_concept_explanation, evaluate_answer, classify_question_text

logger = logging.getLogger(__name__)

router = APIRouter()

class CheckAnswerRequest(BaseModel):
    extracted_text: str
    student_answer: str
    attempt_number: int

@router.post("/demo")
def load_demo():
    return {
        "success": True,
        "extracted_text": "Calculate: 12 x 15",
        "subject": "Mathematics",
        "concept": "Multiplication / Distributive Property",
        "difficulty": "Easy",
        "explanation": "To solve a multiplication problem like 12 x 15, we can use the distributive property to break it down. For example, let's look at 14 x 15. We can break 14 into (10 + 4). Then, we calculate: (10 x 15) + (4 x 15) = 150 + 60 = 210. This makes it much easier to solve in your head or on paper!",
        "prompt": "Can you try applying this exact method to your problem, which is 12 x 15? Break 12 into (10 + 2) and try calculating it."
    }

@router.post("/upload")
async def upload_question(file: UploadFile = File(...)):
    content_type = file.content_type or ""
    filename = file.filename or ""
    is_image = content_type.startswith("image/")
    is_pdf = content_type == "application/pdf" or filename.endswith(".pdf")
    is_text = content_type.startswith("text/") or filename.endswith((".txt", ".md"))

    if not (is_image or is_pdf or is_text):
        raise HTTPException(
            status_code=400, 
            detail="Unsupported format. Please upload an image, PDF, or text file."
        )

    # Check Content-Length header if present
    content_length = file.headers.get("content-length")
    MAX_SIZE = 10 * 1024 * 1024  # 10MB
    if content_length and int(content_length) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds the 10MB maximum limit.")

    try:
        # Read file contents
        contents = await file.read()
        if len(contents) > MAX_SIZE:
            raise HTTPException(status_code=400, detail="File exceeds the 10MB maximum limit.")

        logger.info(f"Received file: {filename}, type: {content_type}, size: {len(contents)} bytes.")

        if is_image:
            image_base64 = base64.b64encode(contents).decode("utf-8")
            extracted_data = extract_question_from_image(image_base64, content_type)
            extracted_text = extracted_data.get("extracted_text", "")
            subject = extracted_data.get("subject", "Mathematics")
            concept = extracted_data.get("concept", "Unknown Concept")
            difficulty = extracted_data.get("difficulty", "Medium")
        elif is_pdf:
            pdf_file = io.BytesIO(contents)
            reader = PdfReader(pdf_file)
            extracted_text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"
            extracted_text = extracted_text.strip()
            
            # Classify parameters using LLM
            extracted_data = classify_question_text(extracted_text)
            subject = extracted_data.get("subject", "Mathematics")
            concept = extracted_data.get("concept", "Unknown Concept")
            difficulty = extracted_data.get("difficulty", "Medium")
        else: # is_text
            extracted_text = contents.decode("utf-8", errors="ignore").strip()
            # Classify parameters using LLM
            extracted_data = classify_question_text(extracted_text)
            subject = extracted_data.get("subject", "Mathematics")
            concept = extracted_data.get("concept", "Unknown Concept")
            difficulty = extracted_data.get("difficulty", "Medium")

        logger.info(f"Extracted question text: '{extracted_text[:60]}...'")

        # Step 2: Explanation & Prompt generation
        explanation_data = get_concept_explanation(
            extracted_text=extracted_text,
            subject=subject,
            concept=concept,
            difficulty=difficulty
        )

        return {
            "success": True,
            "extracted_text": extracted_text,
            "subject": subject,
            "concept": concept,
            "difficulty": difficulty,
            "explanation": explanation_data.get("explanation"),
            "prompt": explanation_data.get("prompt")
        }

    except Exception as e:
        logger.error(f"Error handling upload: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")

@router.post("/check-answer")
def check_answer(req: CheckAnswerRequest):
    logger.info(f"Checking answer. Attempt {req.attempt_number} for question: '{req.extracted_text[:30]}...'")
    try:
        result = evaluate_answer(
            extracted_text=req.extracted_text,
            student_answer=req.student_answer,
            attempt_number=req.attempt_number
        )
        if isinstance(result, dict) and result.get("check_failed") is True:
            raise HTTPException(status_code=502, detail=result.get("error", "LLM evaluation failed."))
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error checking answer: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to evaluate answer: {str(e)}")
