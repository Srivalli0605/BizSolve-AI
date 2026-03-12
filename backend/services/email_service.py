"""
services/email_service.py
"""

import os
import json
import time
import re
import requests
from fastapi import HTTPException


def _clean_email_html(html: str) -> str:
    """
    Post-process Gemini HTML to remove unwanted elements:
    - Strip all <a href> tags (replace with span keeping inner text)
    - Strip all <button> tags (replace with styled div keeping inner text)
    - Strip all <img> tags completely (no broken image placeholders)
    """

    # Remove <img ...> tags completely
    html = re.sub(r'<img[^>]*>', '', html, flags=re.IGNORECASE)

    # Replace <a href="...">text</a> with just the inner text in a styled span
    html = re.sub(
        r'<a\s[^>]*>(.*?)</a>',
        r'\1',
        html,
        flags=re.IGNORECASE | re.DOTALL
    )

    # Replace <button ...>text</button> with a non-clickable styled div
    def replace_button(m):
        inner = m.group(1)
        return (
            f'<div style="display:inline-block;padding:14px 32px;'
            f'background:#5b6af0;color:#fff;font-size:16px;font-weight:700;'
            f'border-radius:8px;text-align:center;cursor:default;'
            f'font-family:Arial,sans-serif;">{inner}</div>'
        )
    html = re.sub(r'<button[^>]*>(.*?)</button>', replace_button, html,
                  flags=re.IGNORECASE | re.DOTALL)

    return html


def generate_email_with_gemini(
    business_name: str,
    category: str,
    target_audience: str,
    email_type: str,
    offer_details: str,
    discount: str,
    tone: str,
    cta_text: str,
) -> dict:

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured in .env")

    prompt = f"""You are a world-class email marketing designer. Create a stunning HTML marketing email.

Business: {business_name}
Category: {category}
Audience: {target_audience}
Type: {email_type}
Offer: {offer_details}
Discount: {discount if discount else "None"}
Tone: {tone}
CTA Text: {cta_text}

DESIGN — create these sections with inline CSS only:

1. HEADER: Full-width gradient banner with business name in large white text.
   Pick gradient based on category:
   - Retail/Fashion → linear-gradient(135deg,#1a1a2e,#0f3460)
   - Food → linear-gradient(135deg,#c0392b,#e74c3c)
   - Tech → linear-gradient(135deg,#0f0c29,#302b63)
   - Health/Beauty → linear-gradient(135deg,#f093fb,#f5576c)
   - Finance → linear-gradient(135deg,#134e5e,#71b280)
   - Education → linear-gradient(135deg,#4568dc,#b06ab3)
   - Default → linear-gradient(135deg,#667eea,#764ba2)

2. HERO BLOCK: min-height 220px, bold gradient background (different from header).
   - One LARGE relevant emoji centered (font-size:90px, no img tag)
   - Discount/offer in HUGE text (font-size:52px, font-weight:900, color:white)
   - Short bold tagline below

3. OFFER BOX: Highlighted colored box with offer details and discount text.

4. BODY: 2-3 short persuasive paragraphs for {target_audience}.

5. CTA: Show "{cta_text}" as a NON-CLICKABLE styled div — NOT a button or link:
   <div style="display:inline-block;padding:16px 40px;background:#5b6af0;color:#fff;
   font-size:18px;font-weight:700;border-radius:10px;text-align:center;
   font-family:Arial,sans-serif;">{cta_text}</div>

6. BENEFITS ROW: 3 columns with large emoji (font-size:36px) + short benefit text.

7. FOOTER: Dark background, "© 2025 {business_name}. All rights reserved."

ABSOLUTE RULES — violation will break the email:
✗ NO <img> tags at all — use emoji only for visuals
✗ NO <a href> tags at all — no links anywhere  
✗ NO <button> tags — use styled <div> for CTA
✗ NO <style> or <link> tags — inline CSS only
✓ Max width 600px centered
✓ Return ONLY valid JSON, no markdown, no backticks

JSON format:
{{
  "subject": "Subject under 60 chars",
  "preview_text": "Preview under 120 chars",
  "body_html": "complete HTML email",
  "cta_text": "{cta_text}"
}}"""

    url = (
        "https://generativelanguage.googleapis.com/v1beta"
        f"/models/gemini-2.5-flash:generateContent?key={api_key}"
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 1,
            "maxOutputTokens": 8192,
            "responseMimeType": "application/json",
            "thinkingConfig": {"thinkingBudget": 0}
        },
    }

    max_retries = 3
    retry_delays = [10, 20, 30]

    for attempt in range(max_retries):
        try:
            response = requests.post(url, json=payload, timeout=60)

            if response.status_code == 429:
                if attempt < max_retries - 1:
                    time.sleep(retry_delays[attempt])
                    continue
                raise HTTPException(status_code=429, detail="Rate limit reached. Wait 1 minute and try again.")
            if response.status_code == 403:
                raise HTTPException(status_code=500, detail="Gemini API key is invalid.")
            if response.status_code == 404:
                raise HTTPException(status_code=500, detail="Gemini model not found.")
            if response.status_code == 400:
                raise HTTPException(status_code=500, detail=f"Gemini bad request: {response.text}")

            response.raise_for_status()
            data = response.json()
            raw = data["candidates"][0]["content"]["parts"][0]["text"].strip()

            if raw.startswith("```"):
                parts = raw.split("```")
                raw = parts[1] if len(parts) > 1 else parts[0]
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()

            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                raw = match.group(0)

            parsed = json.loads(raw)

            # cta_text fallback to user input if Gemini omits it
            if not parsed.get("cta_text", "").strip():
                parsed["cta_text"] = cta_text

            for field in ["subject", "preview_text", "body_html"]:
                if field not in parsed or not str(parsed[field]).strip():
                    raise HTTPException(status_code=500, detail=f"Gemini response missing field: '{field}'")

            # ✅ Always clean HTML — removes any img/a/button tags Gemini snuck in
            parsed["body_html"] = _clean_email_html(parsed["body_html"])

            return parsed

        except HTTPException:
            raise
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"Gemini returned invalid JSON: {str(e)}")
        except requests.exceptions.Timeout:
            raise HTTPException(status_code=504, detail="Gemini API timed out. Try again.")
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=502, detail=f"Gemini API request failed: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Email generation failed: {str(e)}")


def send_email_via_resend(to: list, subject: str, html: str) -> dict:
    """Brevo API — free, 300 emails/day, no domain needed."""

    api_key = os.environ.get("BREVO_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="BREVO_API_KEY is not configured in .env")

    from_email = os.environ.get("BREVO_FROM_EMAIL", "bizsolveai@gmail.com")
    from_name = os.environ.get("BREVO_FROM_NAME", "BizSolve")

    payload = {
        "sender": {"name": from_name, "email": from_email},
        "to": [{"email": e.strip()} for e in to],
        "subject": subject,
        "htmlContent": html,
    }

    try:
        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={"api-key": api_key, "Content-Type": "application/json"},
            json=payload, timeout=30,
        )
        data = response.json()
        if response.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail=f"Brevo API error: {data.get('message', str(data))}")
        return data
    except HTTPException:
        raise
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Brevo API timed out.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email sending failed: {str(e)}")