import json
import re
import httpx
from bs4 import BeautifulSoup
from ai_optimizer import get_client


def parse_manual_content(content: str, index: int) -> dict:
    """Parse manually pasted content (plain text or HTML)."""
    soup = BeautifulSoup(content, "html.parser")
    has_html = bool(soup.find())

    if has_html:
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        title_tag = soup.find("h1")
        h2s = [h.get_text(strip=True) for h in soup.find_all("h2")]
        h3s = [h.get_text(strip=True) for h in soup.find_all("h3")]
        text = soup.get_text(separator=" ", strip=True)
        has_faq = bool(soup.find(["details", "summary"])) or bool(
            re.search(r"câu hỏi|faq|thường gặp", text.lower())
        )
        has_table = bool(soup.find("table"))
        has_list = bool(soup.find(["ul", "ol"]))
        ext_links = [a["href"] for a in soup.find_all("a", href=True) if a["href"].startswith("http")]
        sections = []
        for h2 in soup.find_all("h2"):
            section_text = []
            for sib in h2.next_siblings:
                if sib.name == "h2":
                    break
                if hasattr(sib, "get_text"):
                    section_text.append(sib.get_text(separator=" ", strip=True))
            sections.append({"heading": h2.get_text(strip=True), "words": len(" ".join(section_text).split())})
        title = title_tag.get_text(strip=True) if title_tag else (h2s[0] if h2s else "")
        ext_count = len(ext_links)
    else:
        lines = content.splitlines()
        text = content
        h1_lines = [l.lstrip("#").strip() for l in lines if re.match(r"^#\s", l) and not re.match(r"^##", l)]
        h2s = [l.lstrip("#").strip() for l in lines if re.match(r"^##\s", l) and not re.match(r"^###", l)]
        h3s = [l.lstrip("#").strip() for l in lines if re.match(r"^###\s", l)]
        title = h1_lines[0] if h1_lines else (lines[0].strip() if lines else "")
        has_faq = bool(re.search(r"câu hỏi|faq|thường gặp", text.lower()))
        has_table = bool(re.search(r"\|.+\|", text))
        has_list = bool(re.search(r"^\s*[-*•]\s+", text, re.MULTILINE))
        ext_count = len(re.findall(r"https?://\S+", text))
        sections = []
        current_h2, current_words = None, []
        for line in lines:
            if re.match(r"^##\s", line) and not re.match(r"^###", line):
                if current_h2:
                    sections.append({"heading": current_h2, "words": len(" ".join(current_words).split())})
                current_h2 = line.lstrip("#").strip()
                current_words = []
            elif current_h2:
                current_words.append(line)
        if current_h2:
            sections.append({"heading": current_h2, "words": len(" ".join(current_words).split())})

    word_count = len(text.split())
    has_stats = bool(re.search(r"\d+[\.,]?\d*\s*%|\d+\s*(triệu|tỷ|nghìn|người|năm)", text))

    return {
        "url": f"Nội dung paste #{index}",
        "source": "manual",
        "title": title,
        "h2s": h2s,
        "h3s": h3s,
        "word_count": word_count,
        "sections": sections,
        "has_faq": has_faq,
        "has_table": has_table,
        "has_list": has_list,
        "has_stats": has_stats,
        "external_links_count": ext_count,
        "text_snippet": text[:1500],
    }


def crawl_competitor(url: str) -> dict | None:
    """Fetch and extract key SEO signals from a competitor URL."""
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        }
        resp = httpx.get(url, headers=headers, timeout=10, follow_redirects=True)
        resp.raise_for_status()
    except Exception as e:
        return {"url": url, "error": str(e)}

    soup = BeautifulSoup(resp.text, "html.parser")

    # Remove script/style noise
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    title = soup.find("h1")
    h2s = [h.get_text(strip=True) for h in soup.find_all("h2")]
    h3s = [h.get_text(strip=True) for h in soup.find_all("h3")]
    text = soup.get_text(separator=" ", strip=True)
    word_count = len(text.split())

    # Detect special content types
    has_faq = bool(soup.find(["details", "summary"])) or bool(
        re.search(r"câu hỏi|faq|thường gặp", text.lower())
    )
    has_table = bool(soup.find("table"))
    has_list = bool(soup.find(["ul", "ol"]))
    has_stats = bool(re.search(r"\d+[\.,]?\d*\s*%|\d+\s*(triệu|tỷ|nghìn|người|năm)", text))

    ext_links = [a["href"] for a in soup.find_all("a", href=True) if a["href"].startswith("http")]

    # Per-section word counts (rough: split by H2)
    sections = []
    for h2 in soup.find_all("h2"):
        section_text = []
        for sib in h2.next_siblings:
            if sib.name == "h2":
                break
            if hasattr(sib, "get_text"):
                section_text.append(sib.get_text(separator=" ", strip=True))
        sections.append({
            "heading": h2.get_text(strip=True),
            "words": len(" ".join(section_text).split()),
        })

    return {
        "url": url,
        "title": title.get_text(strip=True) if title else "",
        "h2s": h2s,
        "h3s": h3s,
        "word_count": word_count,
        "sections": sections,
        "has_faq": has_faq,
        "has_table": has_table,
        "has_list": has_list,
        "has_stats": has_stats,
        "external_links_count": len(ext_links),
        "text_snippet": text[:1500],
    }


def build_optimize_prompt(article: dict, competitors: list[dict]) -> str:
    comp_summaries = []
    for i, c in enumerate(competitors, 1):
        if "error" in c:
            comp_summaries.append(f"**Đối thủ {i} ({c['url']}):** Không crawl được — {c['error']}")
            continue
        comp_summaries.append(f"""**Đối thủ {i} ({c['url']}):**
- Tiêu đề H1: {c['title']}
- H2 headings: {', '.join(c['h2s'][:8]) or 'Không có'}
- H3 headings: {', '.join(c['h3s'][:6]) or 'Không có'}
- Số từ: {c['word_count']}
- Sections (H2 → số từ): {json.dumps(c['sections'][:6], ensure_ascii=False)}
- Có FAQ: {'✓' if c['has_faq'] else '✗'} | Có bảng: {'✓' if c['has_table'] else '✗'} | Có số liệu: {'✓' if c['has_stats'] else '✗'}
- External links: {c['external_links_count']}
- Đoạn nội dung mẫu: {c['text_snippet'][:400]}""")

    return f"""Bạn là chuyên gia SEO content người Việt, chuyên gap analysis và tối ưu bài viết để lên top Google.

## BÀI VIẾT CỦA NGƯỜI DÙNG

- Từ khóa chính: {article.get('main_keyword', '')}
- Từ khóa phụ: {article.get('secondary_keywords', '')}
- H1: {article.get('h1', '')}
- SEO Title: {article.get('seo_title', '')}
- Meta Description: {article.get('meta_desc', '')}
- Nội dung (đoạn đầu): {article.get('content_text', '')[:800]}

## NỘI DUNG ĐỐI THỦ

{chr(10).join(comp_summaries)}

## YÊU CẦU PHÂN TÍCH

Dựa trên so sánh bài của user và các đối thủ, hãy:

1. **Phát hiện tone bài gốc** (formal / friendly / neutral / expert)
2. **Gap analysis 4 chiều**:
   - Section/heading đối thủ có mà bài mình thiếu
   - Từ khóa semantic/LSI đối thủ dùng nhiều mà bài mình chưa có
   - Phần nào đối thủ viết sâu hơn đáng kể (so word count)
   - Loại nội dung đặc biệt đối thủ có (FAQ, bảng, ví dụ, số liệu)
3. **E-E-A-T comparison**: đối thủ có gì mình thiếu (external link, số liệu, trích dẫn chuyên gia)
4. **Priority roadmap**: sắp xếp theo impact ranking cao nhất trước
5. **Rewrite mẫu**: viết lại cùng tone bài gốc cho các phần cần cải thiện

Trả về JSON (chỉ JSON, không có text khác):
{{
  "tone": "friendly",
  "gap_analysis": {{
    "missing_sections": ["Tên section đối thủ có mà bài thiếu"],
    "missing_keywords": ["keyword 1", "keyword 2"],
    "depth_gaps": [
      {{"section": "tên heading", "competitor_avg_words": 400, "your_words": 100, "note": "gợi ý"}}
    ],
    "format_gaps": ["Đối thủ có FAQ schema", "Đối thủ có bảng so sánh giá"],
    "eeat_gaps": ["Thiếu trích dẫn nguồn", "Không có số liệu thống kê"]
  }},
  "roadmap": [
    {{
      "priority": "high",
      "category": "Content Gap",
      "action": "Bổ sung section ...",
      "reason": "3/3 đối thủ top đều có section này",
      "rewrite_key": "section_faq"
    }}
  ],
  "rewrites": [
    {{
      "key": "section_faq",
      "part": "Section FAQ",
      "instruction": "Thêm section FAQ cuối bài với 5 câu hỏi thường gặp",
      "example": "## Câu hỏi thường gặp về [từ khóa]\\n\\n**[Câu hỏi 1]?**\\n[Trả lời ngắn gọn, súc tích]..."
    }}
  ],
  "summary": "Tóm tắt 2-3 điều quan trọng nhất cần làm ngay để tăng ranking"
}}"""


def optimize_article(article: dict, competitors_input: list[dict], api_key: str = "") -> dict:
    competitors = []
    manual_index = 1
    for item in competitors_input:
        url = item.get("url", "").strip()
        manual = item.get("manual_content", "").strip()
        if manual:
            competitors.append(parse_manual_content(manual, manual_index))
            manual_index += 1
        elif url:
            competitors.append(crawl_competitor(url))

    competitors = [c for c in competitors if c]
    if not competitors:
        return {"error": "Không có dữ liệu đối thủ hợp lệ"}

    prompt = build_optimize_prompt(article, competitors)

    try:
        client = get_client(api_key)
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0]
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0]
        result = json.loads(raw.strip())
        result["competitors_crawled"] = [
            {
                "url": c.get("url"),
                "ok": "error" not in c,
                "word_count": c.get("word_count"),
                "source": c.get("source", "url"),
            }
            for c in competitors
        ]
        return result
    except Exception as e:
        return {"error": str(e)}
