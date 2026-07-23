import base64
import csv
import io
import json
import logging
import re
import xml.etree.ElementTree as ET
import zipfile
import pypdf
from config import settings
from prompts import documents_prompts
from services.llm_service import get_openai_client

logger = logging.getLogger(__name__)

def clean_float(val):
    """Clean formatted strings ($1,200.50, 15%, €50, (450.00)) into float values."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    
    s = str(val).strip()
    if not s:
        return None

    # Check accounting negative format e.g. (1,234.56) or ($100)
    is_negative = False
    if s.startswith("(") and s.endswith(")"):
        is_negative = True
        s = s[1:-1].strip()
    elif s.startswith("-"):
        is_negative = True
        s = s[1:].strip()
    elif s.startswith("+"):
        s = s[1:].strip()

    # Strip common currency symbols, percent signs
    s = re.sub(r'[$€£₹¥₩₺฿%]', '', s).strip()
    s = s.replace(",", "").strip()

    # Match numeric float at start of string or standalone
    match = re.search(r'^-?\d+(?:\.\d+)?', s)
    if match:
        try:
            num = float(match.group(0))
            return -num if is_negative else num
        except ValueError:
            pass

    try:
        num = float(s)
        return -num if is_negative else num
    except (ValueError, TypeError):
        return None


def parse_xlsx(binary_data: bytes) -> list[dict]:
    """Parse .xlsx binary content into dictionary records using zipfile and xml parsing."""
    try:
        zf = zipfile.ZipFile(io.BytesIO(binary_data))
        shared_strings = []
        if "xl/sharedStrings.xml" in zf.namelist():
            ss_data = zf.read("xl/sharedStrings.xml")
            tree = ET.fromstring(ss_data)
            for elem in tree.iter():
                if elem.tag.endswith("t"):
                    shared_strings.append(elem.text or "")

        sheet_name = None
        for name in zf.namelist():
            if name.startswith("xl/worksheets/sheet") and name.endswith(".xml"):
                sheet_name = name
                break
        if not sheet_name:
            return []

        sheet_data = zf.read(sheet_name)
        tree = ET.fromstring(sheet_data)

        ns = ""
        if tree.tag.startswith("{"):
            ns = tree.tag.split("}")[0] + "}"

        rows = []
        row_elems = tree.findall(f".//{ns}row") or tree.findall(".//row")
        for row_elem in row_elems:
            cell_elems = row_elem.findall(f"{ns}c") or row_elem.findall("c")
            row_vals = []
            for c in cell_elems:
                cell_type = c.attrib.get("t", "")
                val_elem = c.find(f"{ns}v") or c.find("v")
                val_text = val_elem.text if val_elem is not None else ""
                if cell_type == "s" and val_text.isdigit():
                    idx = int(val_text)
                    val = shared_strings[idx] if idx < len(shared_strings) else val_text
                else:
                    val = val_text
                row_vals.append(val)
            if any(str(v).strip() for v in row_vals):
                rows.append(row_vals)

        if len(rows) >= 2:
            headers = [str(h).strip() or f"Column_{i+1}" for i, h in enumerate(rows[0])]
            records = []
            for row in rows[1:]:
                rec = {}
                for idx, h in enumerate(headers):
                    rec[h] = row[idx] if idx < len(row) else ""
                records.append(rec)
            return records
    except Exception as e:
        logger.error(f"Error parsing XLSX data: {e}")
    return []


def parse_pdf(binary_data: bytes) -> str:
    """Extract text from binary PDF data using pypdf."""
    try:
        pdf_file = io.BytesIO(binary_data)
        reader = pypdf.PdfReader(pdf_file)
        text_pages = []
        for page in reader.pages:
            txt = page.extract_text()
            if txt:
                text_pages.append(txt)
        return "\n".join(text_pages)
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        return ""


def extract_records_from_text(data_raw: str) -> list[dict]:
    """Extract records from JSON, Markdown table, CSV/TSV, or space-separated text."""
    trimmed = data_raw.strip()

    # 1. Try JSON
    if trimmed.startswith("[") or trimmed.startswith("{"):
        try:
            parsed = json.loads(trimmed)
            if isinstance(parsed, list):
                res = []
                for idx, item in enumerate(parsed):
                    if isinstance(item, dict):
                        res.append(item)
                    elif isinstance(item, list) and len(item) >= 2:
                        res.append({"label": str(item[0]), "value": item[1]})
                if res:
                    return res
            elif isinstance(parsed, dict):
                return [parsed]
        except Exception as e:
            logger.debug(f"JSON parse attempt failed: {e}")

    lines = [line.strip() for line in data_raw.splitlines() if line.strip()]
    if not lines:
        return []

    # 2. Try Markdown table (| Col 1 | Col 2 |)
    md_lines = [l for l in lines if l.startswith("|") and l.endswith("|")]
    if len(md_lines) >= 2:
        rows = []
        for line in md_lines:
            # Skip separator lines e.g. |---|---|
            if set(line.replace("|", "").strip()) <= {"-", ":", " "}:
                continue
            cells = [c.strip() for c in line.strip("|").split("|")]
            rows.append(cells)
        if len(rows) >= 2:
            headers = [h or f"Column_{i+1}" for i, h in enumerate(rows[0])]
            records = []
            for row in rows[1:]:
                rec = {}
                for idx, h in enumerate(headers):
                    rec[h] = row[idx] if idx < len(row) else ""
                records.append(rec)
            if records:
                return records

    # 3. Try CSV / TSV / Semicolon / Pipe
    delimiter = ","
    header_line = lines[0]
    if ";" in header_line and header_line.count(";") >= header_line.count(","):
        delimiter = ";"
    elif "\t" in header_line:
        delimiter = "\t"
    elif "|" in header_line:
        delimiter = "|"

    if delimiter != ",":
        try:
            f = io.StringIO("\n".join(lines))
            reader = csv.DictReader(f, delimiter=delimiter)
            raw_records = list(reader)
            if raw_records and len(raw_records[0].keys()) > 1:
                return raw_records
        except Exception as e:
            logger.debug(f"Delimiter CSV parsing failed: {e}")

    # 4. Multi-space or tab separated lines (e.g. PDF text tables with multi-word labels)
    space_rows = []
    for l in lines:
        parts = re.split(r'\t+|\s{2,}', l)
        if len(parts) >= 2:
            space_rows.append(parts)
    if len(space_rows) >= 2 and len(space_rows[0]) > 1:
        headers = [h.strip() or f"Column_{i+1}" for i, h in enumerate(space_rows[0])]
        records = []
        for row in space_rows[1:]:
            rec = {}
            for idx, h in enumerate(headers):
                rec[h] = row[idx] if idx < len(row) else ""
            records.append(rec)
        if records:
            return records

    # 5. Standard CSV parsing
    try:
        f = io.StringIO("\n".join(lines))
        reader = csv.DictReader(f, delimiter=",")
        raw_records = list(reader)
        if raw_records and len(raw_records[0].keys()) > 1:
            records = []
            for r in raw_records:
                new_r = dict(r)
                if None in new_r:
                    extra = new_r.pop(None)
                    for k, v in list(new_r.items()):
                        if v is not None:
                            v_str = str(v).strip()
                            if re.search(r'[$€£₹¥]?\d+$', v_str):
                                if isinstance(extra, list):
                                    new_r[k] = v_str + "," + ",".join(str(e).strip() for e in extra)
                                else:
                                    new_r[k] = v_str + "," + str(extra).strip()
                                break
                records.append(new_r)
            return records
    except Exception as e:
        logger.debug(f"CSV parsing attempt failed: {e}")

    # 6. Fallback CSV sniffer
    try:
        f = io.StringIO("\n".join(lines))
        dialect = csv.Sniffer().sniff("\n".join(lines[:10]))
        f.seek(0)
        reader = csv.DictReader(f, dialect=dialect)
        records = list(reader)
        if records and len(records[0].keys()) > 1:
            return records
    except Exception:
        pass

    # 7. Key-value line extractor (e.g., "Product A  150" or "Revenue: $5,000")
    kv_records = []
    for l in lines:
        match = re.search(r'^(.*?)[::\t\s]+([$€£₹¥]?[-+]?\d[\d,]*(\.\d+)?%?)$', l)
        if match:
            lbl = match.group(1).strip()
            val = match.group(2).strip()
            if lbl and val:
                kv_records.append({"Label": lbl, "Value": val})
    if kv_records:
        return kv_records

    return []


def parse_data(data_raw: str, file_type: str = "csv"):
    binary_bytes = None

    # Handle Base64 / Data URL inputs
    if data_raw.startswith("data:") and ";base64," in data_raw:
        try:
            _, encoded = data_raw.split(";base64,", 1)
            binary_bytes = base64.b64decode(encoded)
        except Exception as e:
            logger.error(f"Error decoding base64 data URL: {e}")

    elif file_type.lower() in ("xlsx", "pdf") or data_raw.startswith("%PDF") or data_raw.startswith("PK\x03\x04"):
        try:
            binary_bytes = base64.b64decode(data_raw)
        except Exception:
            binary_bytes = data_raw.encode("latin1", errors="ignore")

    records = []

    if binary_bytes:
        if file_type.lower() == "pdf" or binary_bytes.startswith(b"%PDF"):
            extracted_text = parse_pdf(binary_bytes)
            records = extract_records_from_text(extracted_text)
        elif file_type.lower() in ("xlsx", "xls") or binary_bytes.startswith(b"PK\x03\x04"):
            records = parse_xlsx(binary_bytes)
        else:
            try:
                data_raw = binary_bytes.decode("utf-8", errors="ignore")
            except Exception:
                pass

    if not records:
        records = extract_records_from_text(data_raw)

    if not records:
        return {
            "parse_error": "Couldn't detect numeric data in your file — check that it has at least one numeric column.",
            "record_count": 0,
            "sum_value": 0.0,
            "mean_value": 0.0,
            "top_label": "None",
            "top_value": 0.0,
            "data_points": []
        }

    # Normalize records list if rows were raw lists
    normalized_records = []
    for r in records:
        if isinstance(r, dict):
            normalized_records.append(r)
        elif isinstance(r, (list, tuple)) and len(r) >= 2:
            normalized_records.append({"Label": str(r[0]), "Value": r[1]})

    records = normalized_records
    if not records:
        return {
            "parse_error": "Couldn't detect numeric data in your file — check that it has at least one numeric column.",
            "record_count": 0,
            "sum_value": 0.0,
            "mean_value": 0.0,
            "top_label": "None",
            "top_value": 0.0,
            "data_points": []
        }

    # Evaluate numeric and label candidate scores across ALL records
    keys = list(records[0].keys())
    numeric_counts = {k: 0 for k in keys}
    label_counts = {k: 0 for k in keys}

    for r in records:
        for k in keys:
            val = r.get(k)
            c_val = clean_float(val)
            if c_val is not None:
                numeric_counts[k] += 1
            if val is not None and str(val).strip():
                label_counts[k] += 1

    numeric_keys = [k for k, count in numeric_counts.items() if count > 0]
    
    # Exclude metadata/year/ID keys from val_key selection if other numeric keys exist
    preferred_val_keys = [
        k for k in numeric_keys 
        if k.lower() not in ("id", "year", "yr", "date", "index", "#", "no", "row", "sr", "zip", "code")
    ]
    
    val_key = preferred_val_keys[0] if preferred_val_keys else (numeric_keys[0] if numeric_keys else None)
    
    # Pick label key (prefer non-val_key column with text)
    label_candidates = [k for k in keys if k != val_key]
    lbl_key = label_candidates[0] if label_candidates else val_key

    # Prefer label keys with name-like headers
    for k in label_candidates:
        if any(term in k.lower() for term in ("name", "product", "item", "category", "label", "desc", "title", "region", "type", "store", "city")):
            lbl_key = k
            break

    sum_value = 0.0
    valid_record_count = 0
    label_sums = {}

    if val_key:
        for r in records:
            c_val = clean_float(r.get(val_key))
            if c_val is not None:
                sum_value += c_val
                valid_record_count += 1
                lbl = str(r.get(lbl_key, "Unknown")).strip() if lbl_key else "Unknown"
                if not lbl:
                    lbl = "Unknown"
                label_sums[lbl] = label_sums.get(lbl, 0.0) + c_val

    # Fallback for categorical datasets (e.g. applicant lists, rosters, logs) with no numeric metric columns
    if valid_record_count == 0 or not label_sums:
        cat_candidates = [
            k for k in keys 
            if k.lower() not in ("id", "link", "resume", "url", "applied at", "created_at", "updated_at", "timestamp")
        ]
        
        cat_key = cat_candidates[0] if cat_candidates else (keys[0] if keys else None)
        for k in cat_candidates:
            if any(term in k.lower() for term in ("position", "status", "role", "category", "title", "department", "type", "name", "state", "city")):
                cat_key = k
                break

        if cat_key:
            for r in records:
                lbl = str(r.get(cat_key, "Unknown")).strip() or "Unknown"
                if len(lbl) > 50:
                    lbl = lbl[:47] + "..."
                label_sums[lbl] = label_sums.get(lbl, 0.0) + 1.0
                valid_record_count += 1
            sum_value = float(valid_record_count)

    if valid_record_count == 0 or not label_sums:
        return {
            "parse_error": "Could not parse any records from your file — check that it is a valid CSV, JSON, XLSX, PDF, or text table.",
            "record_count": 0,
            "sum_value": 0.0,
            "mean_value": 0.0,
            "top_label": "None",
            "top_value": 0.0,
            "data_points": []
        }

    mean_value = (sum_value / valid_record_count) if val_key else 1.0

    # Sort categories by frequency/value descending
    sorted_label_sums = dict(sorted(label_sums.items(), key=lambda item: item[1], reverse=True))

    top_label = max(sorted_label_sums, key=sorted_label_sums.get)
    top_value = sorted_label_sums[top_label]

    data_points = []
    for k, v in list(sorted_label_sums.items())[:6]:  # Limit to top 6 categories
        data_points.append({"label": str(k), "value": float(v)})

    return {
        "record_count": valid_record_count,
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

