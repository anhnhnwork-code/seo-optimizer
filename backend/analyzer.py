from bs4 import BeautifulSoup
import re


def analyze_article(data: dict) -> dict:
    h1 = data.get("h1", "").strip()
    seo_title = data.get("seo_title", "").strip()
    meta_desc = data.get("meta_desc", "").strip()
    content_html = data.get("content", "").strip()
    main_kw = data.get("main_keyword", "").strip().lower()
    secondary_kws = [
        kw.strip().lower()
        for kw in data.get("secondary_keywords", "").split(",")
        if kw.strip()
    ]

    soup = BeautifulSoup(content_html, "html.parser")
    content_text = soup.get_text(separator=" ", strip=True)

    results = []

    # ── 2. Tiêu đề bài viết (H1) ──────────────────────────────────────────
    if h1:
        results.append({
            "id": "h1_length",
            "category": "Tiêu đề bài viết (H1)",
            "check": "Tiêu đề < 65 ký tự",
            "group": "Tiêu chuẩn dễ đọc",
            "pass": len(h1) < 65,
            "value": f"{len(h1)} ký tự",
        })

    # ── 3. Tiêu đề SEO ────────────────────────────────────────────────────
    if seo_title:
        results.append({
            "id": "seo_title_length",
            "category": "Tiêu đề SEO",
            "check": "Tiêu đề < 65 ký tự",
            "group": "Tiêu chuẩn SEO",
            "pass": len(seo_title) < 65,
            "value": f"{len(seo_title)} ký tự",
        })
        ctr_signals = ["?", "!", "top", "số 1", "tốt nhất", "miễn phí", "nhanh",
                       "hiệu quả", "đơn giản", "2024", "2025", "2026", "bí quyết", "cách"]
        has_ctr = any(p in seo_title.lower() for p in ctr_signals)
        results.append({
            "id": "seo_title_ctr",
            "category": "Tiêu đề SEO",
            "check": "Chứa yếu tố kích thích click (CTR)",
            "group": "Tiêu chuẩn SEO",
            "pass": has_ctr,
            "value": "Có" if has_ctr else "Chưa có",
        })

    # ── 4. Mô tả SEO ──────────────────────────────────────────────────────
    if meta_desc:
        desc_len = len(meta_desc)
        results.append({
            "id": "meta_desc_length",
            "category": "Mô tả SEO",
            "check": "Độ dài 120–160 ký tự (2–3 dòng)",
            "group": "Tiêu chuẩn SEO",
            "pass": 120 <= desc_len <= 160,
            "value": f"{desc_len} ký tự",
        })
        if main_kw:
            has_main = main_kw in meta_desc.lower()
            has_sec = any(kw in meta_desc.lower() for kw in secondary_kws)
            results.append({
                "id": "meta_desc_keyword",
                "category": "Mô tả SEO",
                "check": "Có chứa từ khóa chính/phụ",
                "group": "Tiêu chuẩn SEO",
                "pass": has_main or has_sec,
                "value": f'Chính: {"✓" if has_main else "✗"}  Phụ: {"✓" if has_sec else "✗"}',
            })

    # ── 5. Đoạn Sapo ──────────────────────────────────────────────────────
    if content_html:
        paragraphs = soup.find_all("p")
        sapo = paragraphs[0].get_text() if paragraphs else content_text[:500]

        if main_kw:
            first_150 = sapo[:150].lower()
            results.append({
                "id": "sapo_main_kw",
                "category": "Đoạn Sapo đầu bài",
                "check": "Từ khóa chính ở 150 ký tự đầu",
                "group": "Tiêu chuẩn SEO",
                "pass": main_kw in first_150,
                "value": "Có" if main_kw in first_150 else "Không",
            })

        if paragraphs:
            has_bold_sapo = bool(paragraphs[0].find(["strong", "b"]))
            results.append({
                "id": "sapo_bold",
                "category": "Đoạn Sapo đầu bài",
                "check": "Bôi đậm từ khóa chính trong sapo",
                "group": "Tiêu chuẩn dễ đọc",
                "pass": has_bold_sapo,
                "value": "Có" if has_bold_sapo else "Không",
            })

    # ── 6. Trình bày ──────────────────────────────────────────────────────
    if content_html:
        bolds = soup.find_all(["strong", "b"])
        results.append({
            "id": "formatting_bold",
            "category": "Trình bày",
            "check": "Có bôi đậm ý cần nhấn mạnh (≥ 3 chỗ)",
            "group": "Tiêu chuẩn dễ đọc",
            "pass": len(bolds) >= 3,
            "value": f"{len(bolds)} đoạn bôi đậm",
        })
        blockquotes = soup.find_all("blockquote")
        italics = soup.find_all(["em", "i"])
        results.append({
            "id": "formatting_highlight",
            "category": "Trình bày",
            "check": "Làm nổi bật đoạn quan trọng (blockquote / in nghiêng)",
            "group": "Tiêu chuẩn dễ đọc",
            "pass": len(blockquotes) + len(italics) > 0,
            "value": f"Blockquote: {len(blockquotes)}, In nghiêng: {len(italics)}",
        })

        sentences = [s.strip() for s in re.split(r"[.!?]+", content_text) if len(s.strip()) > 20]
        if sentences:
            avg_len = sum(len(s) for s in sentences) / len(sentences)
            results.append({
                "id": "sentence_length",
                "category": "Trình bày",
                "check": "Câu ngắn (100–350 ký tự/câu)",
                "group": "Tiêu chuẩn dễ đọc",
                "pass": 100 <= avg_len <= 350,
                "value": f"TB {avg_len:.0f} ký tự/câu ({len(sentences)} câu)",
            })

        all_ps = soup.find_all("p")
        if all_ps:
            long_ps = [p for p in all_ps if len(p.get_text()) > 500]
            results.append({
                "id": "paragraph_length",
                "category": "Trình bày",
                "check": "Đoạn ngắn (≤ 3 câu, không quá 3 dòng)",
                "group": "Tiêu chuẩn dễ đọc",
                "pass": len(long_ps) == 0,
                "value": f"{len(long_ps)} đoạn quá dài / {len(all_ps)} đoạn tổng",
            })

    # ── 9. UL – LI ────────────────────────────────────────────────────────
    if content_html:
        uls = soup.find_all("ul")
        ols = soup.find_all("ol")
        results.append({
            "id": "lists",
            "category": "UL – LI",
            "check": "Sử dụng Bullet cho ý dạng liệt kê",
            "group": "Tiêu chuẩn dễ đọc",
            "pass": len(uls) + len(ols) > 0,
            "value": f"UL: {len(uls)}, OL: {len(ols)}",
        })

    # ── 10. Heading ───────────────────────────────────────────────────────
    if content_html:
        h2s = soup.find_all("h2")
        h3s = soup.find_all("h3")
        results.append({
            "id": "heading_structure",
            "category": "Heading trong bài",
            "check": "Có H2 và H3 trong bài",
            "group": "Tiêu chuẩn dễ đọc",
            "pass": len(h2s) > 0 and len(h3s) > 0,
            "value": f"H2: {len(h2s)}, H3: {len(h3s)}",
        })
        if main_kw or secondary_kws:
            heading_text = " ".join(h.get_text().lower() for h in soup.find_all(["h2", "h3"]))
            has_kw = (main_kw in heading_text) or any(kw in heading_text for kw in secondary_kws)
            results.append({
                "id": "heading_keyword",
                "category": "Heading trong bài",
                "check": "Từ khóa chính/phụ trong heading",
                "group": "Tiêu chuẩn SEO",
                "pass": has_kw,
                "value": "Có" if has_kw else "Không",
            })

    # ── 11. Mật độ từ khóa ────────────────────────────────────────────────
    if content_html and main_kw:
        word_count = len(content_text.split())
        kw_count = content_text.lower().count(main_kw)
        density = (kw_count / word_count * 100) if word_count > 0 else 0
        results.append({
            "id": "keyword_density",
            "category": "Mật độ từ khóa",
            "check": "Mật độ từ khóa 1–3%",
            "group": "Tiêu chuẩn SEO",
            "pass": 1 <= density <= 3,
            "value": f"{density:.1f}% ({kw_count} lần / {word_count} từ)",
        })
        if secondary_kws:
            has_sec = any(kw in content_text.lower() for kw in secondary_kws)
            results.append({
                "id": "secondary_keywords",
                "category": "Mật độ từ khóa",
                "check": "Có từ khóa phụ/liên quan trong bài",
                "group": "Tiêu chuẩn SEO",
                "pass": has_sec,
                "value": "Có" if has_sec else "Không",
            })

    # ── 12. Tối ưu ảnh ────────────────────────────────────────────────────
    if content_html:
        images = soup.find_all("img")
        if images:
            with_alt = [img for img in images if img.get("alt", "").strip()]
            results.append({
                "id": "img_alt",
                "category": "Tối ưu ảnh",
                "check": "Tất cả ảnh có ALT text",
                "group": "Tiêu chuẩn SEO",
                "pass": len(with_alt) == len(images),
                "value": f"{len(with_alt)}/{len(images)} ảnh có ALT",
            })
            if main_kw:
                with_kw = [img for img in images if main_kw in img.get("alt", "").lower()]
                results.append({
                    "id": "img_alt_keyword",
                    "category": "Tối ưu ảnh",
                    "check": "ALT ảnh chứa từ khóa chính",
                    "group": "Tiêu chuẩn SEO",
                    "pass": len(with_kw) > 0,
                    "value": f"{len(with_kw)}/{len(images)} ảnh có từ khóa trong ALT",
                })

    # ── 13. Liên kết nội bộ ───────────────────────────────────────────────
    if content_html:
        all_links = soup.find_all("a", href=True)
        results.append({
            "id": "internal_links",
            "category": "Liên kết nội bộ",
            "check": "Có liên kết nội bộ trong bài",
            "group": "Tiêu chuẩn SEO",
            "pass": len(all_links) > 0,
            "value": f"{len(all_links)} liên kết",
        })

    # ── 14. External Links ────────────────────────────────────────────────
    if content_html:
        ext_links = [a for a in soup.find_all("a", href=True) if a["href"].startswith("http")]
        results.append({
            "id": "external_links",
            "category": "External Link",
            "check": "Có liên kết ngoài (dẫn nguồn, tham khảo)",
            "group": "Tiêu chuẩn SEO",
            "pass": len(ext_links) > 0,
            "value": f"{len(ext_links)} external link",
        })

    # ── 15. Đoạn kết bài ──────────────────────────────────────────────────
    if content_html and main_kw and content_text:
        last_150 = content_text[-150:].lower()
        results.append({
            "id": "conclusion_keyword",
            "category": "Đoạn kết bài",
            "check": "Từ khóa trong 150 ký tự cuối",
            "group": "Tiêu chuẩn SEO",
            "pass": main_kw in last_150,
            "value": "Có" if main_kw in last_150 else "Không",
        })

    passed = sum(1 for r in results if r["pass"])
    total = len(results)
    score = round(passed / total * 100) if total > 0 else 0

    return {"score": score, "passed": passed, "total": total, "results": results}
