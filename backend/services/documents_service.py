import csv
import io
import json
import logging
from config import settings
from prompts import documents_prompts
from services.llm_service import get_openai_client

logger = logging.getLogger(__name__)

def parse_data(data_raw: str, file_type: str):
    records = []
    if "json" in file_type.lower() or data_raw.strip().startswith("[") or data_raw.strip().startswith("{"):
        try:
            parsed = json.loads(data_raw)
            if isinstance(parsed, list):
                records = parsed
            elif isinstance(parsed, dict):
                records = [parsed]
        except Exception as e:
            logger.error(f"Error parsing JSON: {e}")
    else:
        # Try CSV
        try:
            f = io.StringIO(data_raw.strip())
            reader = csv.DictReader(f)
            records = list(reader)
        except Exception as e:
            logger.error(f"Error parsing CSV: {e}")
    
    # Calculate aggregates
    record_count = len(records)
    sum_value = 0.0
    mean_value = 0.0
    label_sums = {}
    
    # Try to find numeric and label columns
    numeric_keys = []
    label_keys = []
    
    if records:
        first = records[0]
        for k, v in first.items():
            try:
                float(v)
                numeric_keys.append(k)
            except (ValueError, TypeError):
                label_keys.append(k)
        
        # Pick default keys
        val_key = numeric_keys[0] if numeric_keys else None
        lbl_key = label_keys[0] if label_keys else (list(first.keys())[0] if first.keys() else None)
        
        if val_key:
            for r in records:
                try:
                    val = float(r.get(val_key, 0))
                    sum_value += val
                    lbl = r.get(lbl_key, "Unknown")
                    label_sums[lbl] = label_sums.get(lbl, 0.0) + val
                except (ValueError, TypeError):
                    pass
            if record_count > 0:
                mean_value = sum_value / record_count
                
    top_label = "None"
    top_value = 0.0
    if label_sums:
        top_label = max(label_sums, key=label_sums.get)
        top_value = label_sums[top_label]
        
    data_points = []
    for k, v in list(label_sums.items())[:6]:  # Limit to top 6 categories
        data_points.append({"label": str(k), "value": float(v)})
        
    if record_count == 0 or not data_points:
        return {
            "parse_error": "Couldn't detect numeric data in your file — check that it has at least one numeric column.",
            "record_count": 0,
            "sum_value": 0.0,
            "mean_value": 0.0,
            "top_label": "None",
            "top_value": 0.0,
            "data_points": []
        }
        
    return {
        "record_count": record_count,
        "sum_value": sum_value,
        "mean_value": mean_value,
        "top_label": top_label,
        "top_value": top_value,
        "data_points": data_points
    }

def analyze_document(data_raw: str, file_type: str = "csv"):
    logger.info("Analyzing document data...")
    stats = parse_data(data_raw, file_type)
    if "parse_error" in stats:
        raise ValueError(stats["parse_error"])
    
    client = get_openai_client()
    logger.info("Executing document analysis via OpenAI Chat API.")
    row_details = json.dumps(stats["data_points"][:30], indent=2)
    user_prompt = documents_prompts.USER_PROMPT_TEMPLATE.format(
        record_count=stats["record_count"],
        sum_value=stats["sum_value"],
        mean_value=stats["mean_value"],
        top_label=stats["top_label"],
        top_value=stats["top_value"],
        row_details=row_details
    )
    response = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=1500,
        messages=[
            {"role": "system", "content": documents_prompts.SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]
    )
    text = response.choices[0].message.content.strip()
    if "{" in text:
        text = text[text.find("{"):text.rfind("}")+1]
    data = json.loads(text)
    
    return {
        "summary": data.get("summary"),
        "insights": data.get("insights"),
        "data_points": stats["data_points"]
    }
