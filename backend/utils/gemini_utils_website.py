"""
utils/gemini_utils.py
Gemini AI + Unsplash for BizSolve.
Marketing website only — no e-commerce CTAs.
"""

import json
import os
import re
import random
import requests
from google import genai


def get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set in .env")
    return genai.Client(api_key=api_key)


# ── Safe category fallback queries ───────────────────────────────────────────
# These are curated to never return wrong images for common business types
CATEGORY_SAFE_QUERIES = {
    "oil":         ["cooking oil bottle golden kitchen", "edible oil bottle label", "mustard oil bottle yellow"],
    "edible oil":  ["cooking oil bottle pour kitchen", "vegetable oil golden bottle", "sunflower oil bottle clear"],
    "agro":        ["agriculture farm field harvest", "farming grain crop field", "agricultural produce sacks natural"],
    "grocery":     ["indian grocery store shelves", "spices market colorful bowls", "supermarket food products shelf"],
    "wholesale":   ["warehouse shelves bulk storage", "wholesale goods stacked boxes", "bulk storage industrial shelf"],
    "food":        ["indian food dish plated bowl", "restaurant meal cuisine served", "fresh food ingredients table"],
    "beverage":    ["beverage drink glass refreshing", "juice drink bottle colorful", "tea coffee cup warm"],
    "restaurant":  ["restaurant interior dining table", "indian restaurant food plated", "cafe interior warm ambiance"],
    "fashion":     ["clothing boutique store rack", "fashion apparel folded shelf", "saree kurta ethnic wear display"],
    "clothing":    ["clothing store interior rack", "garments fabric folded display", "apparel shop modern interior"],
    "retail":      ["retail store shelves products", "shop interior display modern", "store products organized shelf"],
    "technology":  ["laptop computer desk workspace", "technology office modern clean", "developer coding screen"],
    "health":      ["healthcare medical professional", "pharmacy medicine products", "wellness natural health product"],
    "beauty":      ["beauty salon interior clean", "cosmetics skincare products", "beauty products flat lay"],
    "education":   ["classroom students studying", "books education desk learning", "school college campus"],
    "real estate": ["modern house exterior architecture", "apartment interior living room", "real estate property building"],
    "fitness":     ["gym fitness equipment interior", "workout exercise modern gym", "fitness studio equipment"],
    "finance":     ["office professional business desk", "finance documents modern office", "business professional meeting"],
}

def get_safe_fallback(category: str) -> str:
    """Return a safe curated query for a category."""
    cat_lower = category.lower()
    for key, queries in CATEGORY_SAFE_QUERIES.items():
        if key in cat_lower:
            return random.choice(queries)
    return f"{category} professional business"


def fetch_image(query: str, category: str = "business") -> str:
    """
    Search Unsplash for an image.
    If the primary query fails or returns nothing, tries a safe category fallback.
    """
    access_key = os.getenv("UNSPLASH_ACCESS_KEY")
    if not access_key:
        print("[Unsplash] No UNSPLASH_ACCESS_KEY — skipping images")
        return ""

    def search(q: str) -> str:
        try:
            res = requests.get(
                "https://api.unsplash.com/search/photos",
                params={"query": q, "orientation": "landscape", "per_page": 15},
                headers={"Authorization": f"Client-ID {access_key}"},
                timeout=6,
            )
            if res.status_code == 200:
                results = res.json().get("results", [])
                if results:
                    return random.choice(results[:5])["urls"]["regular"]
            elif res.status_code == 403:
                print("[Unsplash] 403 — check UNSPLASH_ACCESS_KEY")
        except Exception as e:
            print(f"[Unsplash] error '{q}': {e}")
        return ""

    # Try primary query
    url = search(query)
    if url:
        return url

    # Try safe category fallback (avoids irrelevant images)
    safe_query = get_safe_fallback(category)
    if safe_query != query:
        print(f"[Unsplash] primary failed, trying safe fallback: '{safe_query}'")
        url = search(safe_query)

    return url


def sanitize_cta(text: str) -> str:
    """Replace any e-commerce CTAs with marketing equivalents."""
    if not text:
        return text
    replacements = {
        "shop now":     "View Our Range",
        "buy now":      "Explore Products",
        "order now":    "See Our Offerings",
        "add to cart":  "Learn More",
        "purchase now": "Discover More",
        "shop our":     "Explore Our",
        "buy our":      "Discover Our",
        "order online": "Contact Us",
        "checkout":     "Get in Touch",
    }
    lower = text.lower().strip()
    for bad, good in replacements.items():
        if lower == bad or lower.startswith(bad):
            return good
    return text


def generate_website_content(
    business: dict,
    tagline: str = None,
    website_goal: str = None,
    current_offers: str = None,
    festival_promotion: str = None,
    promo_code: str = None,
    sections: list = None,
    extra_notes: str = None,
    user_products: list = None,
) -> dict:
    client   = get_client()
    category = business.get("category", "business")
    biz_name = business.get("business_name", "")

    business_context = f"""
Business Name: {biz_name}
Category: {category}
Description: {business.get("description", "")}
Offerings/Services: {business.get("offerings", "")}
Target Audience: {business.get("target_audience", "")}
Primary Goal: {business.get("primary_goal", "")}
Brand Tone: {business.get("brand_tone", "Professional")}
Location: {business.get("location", "")}
""".strip()

    include_offers = bool(current_offers or festival_promotion or promo_code)
    include_faq    = bool(sections and "FAQ" in sections)

    offer_details = ""
    if current_offers:     offer_details += f"Current offer: {current_offers}. "
    if festival_promotion: offer_details += f"Festival promotion: {festival_promotion}. "
    if promo_code:         offer_details += f"Promo code: {promo_code}."

    user_inputs = ""
    if tagline:       user_inputs += f"\nDesired tagline: {tagline}"
    if website_goal:  user_inputs += f"\nWebsite goal: {website_goal}"
    if offer_details: user_inputs += f"\nOffers to highlight: {offer_details}"
    if sections:      user_inputs += f"\nSections to include: {', '.join(sections)}"
    if extra_notes:   user_inputs += f"\nExtra instructions: {extra_notes}"
    if user_products:
        products_str = "\n".join([
            f'  - {p.get("name","")}: {p.get("description","") or "no description"}'
            for p in user_products
        ])
        user_inputs += f"\nUser's actual products (use EXACTLY these names as service titles):\n{products_str}"

    offers_block = f"""
  "offers": {{
    "title": "Catchy offer title based on: {offer_details}",
    "description": "Offer description",
    "cta": "Enquire Now"
  }},""" if include_offers else ""

    faq_block = """
  "faq": [
    {"question": "Common question?", "answer": "Clear answer."}
  ],""" if include_faq else ""

    # Build curated image hint examples for this specific category
    cat_lower = category.lower()
    if "oil" in cat_lower:
        image_hint_examples = """
    - hero: "edible oil bottles golden kitchen pour"
    - about: "oil refinery processing facility interior"  
    - service (groundnut oil): "groundnut oil glass bottle golden"
    - service (mustard oil): "mustard seeds yellow pile organic"
    - service (rice bran oil): "rice bran oil bottle label"
    NEVER use "factory workers" or "fruit processing" — those are wrong category"""
    elif "agro" in cat_lower or "grain" in cat_lower or "wholesale" in cat_lower:
        image_hint_examples = """
    - hero: "grain sacks warehouse natural light"
    - about: "agricultural produce storage warehouse"
    - service (rice): "rice grains white sack burlap"
    - service (dal/pulses): "lentils pulses colorful bowl"
    - service (wheat): "wheat grain golden pile natural"
    NEVER use "factory workers" or "fruit" images"""
    elif "fashion" in cat_lower or "clothing" in cat_lower:
        image_hint_examples = """
    - hero: "clothing boutique store interior modern"
    - about: "fashion store rack colorful clothes"
    - service (saree): "silk saree colorful draped"
    - service (kurta): "ethnic kurta display mannequin"
    - service (jeans): "denim jeans folded shelf display" """
    elif "food" in cat_lower or "restaurant" in cat_lower:
        image_hint_examples = """
    - hero: "indian restaurant interior warm dining"
    - about: "kitchen chef cooking professional"
    - service: describe the actual dish — "biryani bowl steam", "dal tadka bowl" """
    else:
        image_hint_examples = f"""
    - describe the EXACT physical product or scene for {category}
    - be very specific: 3-5 nouns describing exactly what should appear in photo
    - NEVER use vague words like "quality", "professional", "business", "factory workers" """

    prompt = f"""
You are a professional marketing website copywriter.
This is a BROCHURE/MARKETING website — NOT an e-commerce store.
Customers browse and then CONTACT the business offline.

Generate website content for:
{business_context}
{user_inputs}

Return ONLY valid JSON. No markdown. Start with {{

{{
  "hero": {{
    "headline": "Headline max 8 words",
    "subheadline": "Value proposition max 15 words",
    "tagline": "Tagline max 6 words",
    "cta_primary": "Use: 'View Our Products' or 'Explore Our Range' — NEVER 'Shop Now' or 'Buy Now'",
    "cta_secondary": "Use: 'Contact Us' or 'Get in Touch' or 'Enquire Now'",
    "image_hint": "Unsplash query — see rules below"
  }},
  "about": {{
    "title": "About heading",
    "description": "2-3 sentences about mission",
    "highlight_1": "Key strength",
    "highlight_2": "Key strength",
    "highlight_3": "Key strength",
    "image_hint": "Unsplash query — see rules below"
  }},
  "services": [
    {{
      "title": "Product name",
      "description": "What it is and its benefits. No pricing.",
      "icon": "emoji",
      "image_hint": "Unsplash query — see rules below"
    }}
  ],
  "testimonials": [
    {{"name": "Name", "role": "Customer type", "text": "Testimonial about quality."}}
  ]{offers_block}{faq_block},
  "cta": {{
    "headline": "Contact invite headline",
    "subtext": "Invite to enquire about products and pricing",
    "button_text": "Use: 'Contact Us' or 'Enquire Now' — NEVER 'Shop Now'"
  }},
  "footer": {{
    "tagline": "Brand tagline",
    "email": "contact@{biz_name.lower().replace(' ','').replace("'","")}.com",
    "phone": "+91 00000 00000",
    "address": "{business.get('location', '')}"
  }}
}}

IMAGE HINT RULES for category "{category}":
{image_hint_examples}

GENERAL rules:
- Image hints must describe the product/scene DIRECTLY — not workers, not factories unless it is that exact business
- For oil business: ONLY show oil bottles, oil pours, seeds — NOT factories, NOT fruit processing
- 3-5 specific nouns per hint
- BANNED CTA words: Shop, Buy, Order, Purchase, Cart, Checkout

{"Use EXACTLY the user's product names as service titles." if user_products else "Generate 3-5 services."}
Brand tone: {business.get("brand_tone", "Professional")}
Return ONLY the JSON.
"""

    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    raw = response.text.strip()
    raw = re.sub(r"^```json\s*", "", raw)
    raw = re.sub(r"^```\s*",     "", raw)
    raw = re.sub(r"\s*```$",     "", raw)
    raw = raw.strip()

    try:
        content = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Gemini returned invalid JSON: {e}\nRaw: {raw[:500]}")

    # Sanitize CTAs
    hero = content.get("hero", {})
    hero["cta_primary"]   = sanitize_cta(hero.get("cta_primary", "View Our Products"))
    hero["cta_secondary"] = sanitize_cta(hero.get("cta_secondary", "Contact Us"))
    cta_sec = content.get("cta", {})
    cta_sec["button_text"] = sanitize_cta(cta_sec.get("button_text", "Contact Us"))

    if include_offers and "offers" not in content:
        content["offers"] = {"title": "Special Offer", "description": offer_details, "cta": "Enquire Now"}

    # ── Fetch images ──────────────────────────────────────────────────────

    # Hero
    hero_hint  = content.get("hero", {}).pop("image_hint", None)
    hero_query = hero_hint or get_safe_fallback(category)
    content["hero"]["image_url"] = fetch_image(hero_query, category)
    print(f"[Images] Hero: '{hero_query}' → {'✅' if content['hero']['image_url'] else '❌'}")

    # About
    about_hint  = content.get("about", {}).pop("image_hint", None)
    about_query = about_hint or get_safe_fallback(category)
    content["about"]["image_url"] = fetch_image(about_query, category)
    print(f"[Images] About: '{about_query}' → {'✅' if content['about']['image_url'] else '❌'}")

    # Services
    if user_products:
        print(f"[Images] Using {len(user_products)} user product images")
        gemini_services = content.get("services", [])
        content["services"] = [
            {
                "title":       p.get("name", ""),
                "description": gemini_services[i].get("description", p.get("description", ""))
                               if i < len(gemini_services) else p.get("description", ""),
                "icon":        "📦",
                "image_url":   p.get("image_url", ""),
            }
            for i, p in enumerate(user_products)
        ]
    else:
        for svc in content.get("services", []):
            hint  = svc.pop("image_hint", None)
            # Use hint if specific, otherwise use safe category fallback
            query = hint if (hint and len(hint.split()) >= 2) else get_safe_fallback(category)
            svc["image_url"] = fetch_image(query, category)
            print(f"[Images] '{svc.get('title','')}': '{query}' → {'✅' if svc['image_url'] else '❌'}")

    return content