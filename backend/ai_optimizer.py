import os
import json
import anthropic
from dotenv import load_dotenv

load_dotenv()


def get_client(api_key: str = "") -> anthropic.Anthropic:
    key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    if not key:
        raise ValueError("Chưa có API key. Vui lòng nhập Anthropic API key trong phần Cài đặt.")
    return anthropic.Anthropic(api_key=key)


def ai_analyze(data: dict, checklist_results: list, api_key: str = "") -> dict:
    h1 = data.get("h1", "")
    seo_title = data.get("seo_title", "")
    meta_desc = data.get("meta_desc", "")
    content_text = data.get("content_text", "")
    main_kw = data.get("main_keyword", "")
    secondary_kws = data.get("secondary_keywords", "")

    failed = [r for r in checklist_results if not r["pass"]]
    failed_list = "\n".join(f"- {r['category']}: {r['check']}" for r in failed) or "Không có"

    prompt = f"""Bạn là chuyên gia SEO content người Việt. Hãy phân tích bài viết sau theo checklist SEO chuẩn.

**Thông tin bài viết:**
- Từ khóa chính: {main_kw}
- Từ khóa phụ: {secondary_kws}
- Tiêu đề H1: {h1}
- Tiêu đề SEO: {seo_title}
- Meta Description: {meta_desc}

**Nội dung bài (500 ký tự đầu):**
{content_text[:500]}

**Các tiêu chí đã FAIL:**
{failed_list}

Trả về JSON với cấu trúc sau (chỉ JSON, không có text khác):
{{
  "spelling_pass": true,
  "spelling_errors": ["lỗi 1", "lỗi 2"],
  "title_insight_pass": true,
  "title_insight_note": "nhận xét ngắn về tiêu đề",
  "meta_insight_pass": true,
  "meta_insight_note": "nhận xét ngắn về meta desc",
  "overall_assessment": "đánh giá tổng thể 2–3 câu",
  "suggestions": [
    {{
      "area": "Tên phần",
      "issue": "Vấn đề cụ thể",
      "suggestion": "Gợi ý cải thiện",
      "example": "Ví dụ cụ thể"
    }}
  ]
}}"""

    try:
        client = get_client(api_key)
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0]
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0]
        return json.loads(raw.strip())
    except ValueError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": f"Lỗi phân tích AI: {str(e)}"}
