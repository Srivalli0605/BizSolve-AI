"""
utils/gemini_utils.py
Gemini AI + Unsplash for BizSolve.
This is a MARKETING website generator — no e-commerce, no shop/buy/order CTAs.
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


def fetch_image(query: str, fallback: str = "business") -> str:
    """Search Unsplash for an image."""
    access_key = os.getenv("UNSPLASH_ACCESS_KEY")
    if not access_key:
        print("[Unsplash] No UNSPLASH_ACCESS_KEY set — skipping images")
        return ""

    def search(q: str) -> str:
        try:
            res = requests.get(
                "https://api.unsplash.com/search/photos",
                params={"query": q, "orientation": "landscape", "per_page": 10},
                headers={"Authorization": f"Client-ID {access_key}"},
                timeout=6,
            )
            if res.status_code == 200:
                results = res.json().get("results", [])
                if results:
                    pick = random.choice(results[:5])
                    return pick["urls"]["regular"]
            elif res.status_code == 403:
                print("[Unsplash] 403 Forbidden — check your UNSPLASH_ACCESS_KEY")
        except Exception as e:
            print(f"[Unsplash] error for '{q}': {e}")
        return ""

    url = search(query)
    if not url and fallback and fallback != query:
        url = search(fallback)
    return url


def sanitize_cta(text: str) -> str:
    """Replace any e-commerce CTAs with marketing equivalents."""
    if not text:
        return text
    replacements = {
        "shop now":      "View Our Range",
        "buy now":       "Explore Products",
        "order now":     "See Our Offerings",
        "add to cart":   "Learn More",
        "purchase now":  "Discover More",
        "shop our":      "Explore Our",
        "buy our":       "Discover Our",
        "order online":  "Contact Us",
        "checkout":      "Get in Touch",
        "shop":          "Explore",
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

    prompt = f"""
You are a professional marketing website copywriter.
This is a BROCHURE/MARKETING website — NOT an e-commerce store.
The business does NOT sell online. Customers contact them to enquire or buy offline.

Generate website content for this business:

{business_context}
{user_inputs}

Return ONLY valid JSON. No markdown. No explanation. Start with {{

{{
  "hero": {{
    "headline": "Attention-grabbing headline (max 8 words)",
    "subheadline": "Supporting value proposition (max 15 words)",
    "tagline": "Memorable tagline (max 6 words)",
    "cta_primary": "MUST be one of: 'View Our Products', 'Explore Our Range', 'See Our Offerings', 'Discover More', 'View Products' — NEVER 'Shop Now', 'Buy Now', 'Order Now', 'Add to Cart'",
    "cta_secondary": "MUST be one of: 'Contact Us', 'Get in Touch', 'Enquire Now', 'Learn More', 'About Us'",
    "image_hint": "Unsplash query — 3-5 specific words"
  }},
  "about": {{
    "title": "About section heading",
    "description": "2-3 sentences about mission and values",
    "highlight_1": "Key strength 1",
    "highlight_2": "Key strength 2",
    "highlight_3": "Key strength 3",
    "image_hint": "Unsplash query — 3-5 words"
  }},
  "services": [
    {{
      "title": "Product/service name",
      "description": "1-2 sentence description — what it is, its benefits. No pricing, no 'buy' language.",
      "icon": "emoji",
      "image_hint": "Unsplash query — describe EXACT product e.g. 'groundnut oil bottle pour', 'mustard seeds yellow', 'rice bran oil tin'"
    }}
  ],
  "testimonials": [
    {{"name": "Name", "role": "Customer type", "text": "Realistic testimonial about quality/service, not about buying."}}
  ]{offers_block}{faq_block},
  "cta": {{
    "headline": "Reach out headline — e.g. 'Interested? Let's Talk.' or 'Get in Touch with Us'",
    "subtext": "Invite them to contact — e.g. 'Reach out to know more about our products and pricing.'",
    "button_text": "MUST be: 'Contact Us' or 'Enquire Now' or 'Get in Touch' — NEVER 'Shop Now' or 'Buy Now'"
  }},
  "footer": {{
    "tagline": "Short brand tagline",
    "email": "contact@{biz_name.lower().replace(' ','').replace("'","")}.com",
    "phone": "+91 00000 00000",
    "address": "{business.get('location', '')}"
  }}
}}

CRITICAL rules:
1. This is a MARKETING site — visitors browse and then CONTACT the business. No online selling.
2. CTA buttons must invite enquiry/exploration, NEVER purchase: use 'View Products', 'Enquire Now', 'Contact Us', 'Get in Touch', 'Explore Range'
3. BANNED words in CTAs: Shop, Buy, Order, Purchase, Cart, Checkout, Pay
4. image_hint must describe the ACTUAL PHYSICAL PRODUCT — for oils: 'groundnut oil bottle golden kitchen', for fashion: 'saree silk colorful display', for food: 'biryani bowl steam rice'
5. NEVER write vague image hints like 'quality product' or 'business growth'
{"6. Use EXACTLY the user's product names as service titles." if user_products else "6. Generate 3-5 services matching their offerings."}
Brand tone: {business.get("brand_tone", "Professional")}
Return ONLY the JSON object.
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

    # ── Sanitize any accidental shop/buy CTAs ─────────────────────────────
    hero = content.get("hero", {})
    hero["cta_primary"]   = sanitize_cta(hero.get("cta_primary", "View Our Products"))
    hero["cta_secondary"] = sanitize_cta(hero.get("cta_secondary", "Contact Us"))

    cta_section = content.get("cta", {})
    cta_section["button_text"] = sanitize_cta(cta_section.get("button_text", "Contact Us"))

    if include_offers and "offers" not in content:
        content["offers"] = {"title": "Special Offer", "description": offer_details, "cta": "Enquire Now"}

    # ── Fetch Unsplash images using Gemini's hints ────────────────────────

    # Hero
    hero_hint  = content.get("hero", {}).pop("image_hint", None)
    hero_query = hero_hint or f"{category} product professional"
    content["hero"]["image_url"] = fetch_image(hero_query, category)
    print(f"[Images] Hero: '{hero_query}' → {'✅' if content['hero']['image_url'] else '❌'}")

    # About
    about_hint  = content.get("about", {}).pop("image_hint", None)
    about_query = about_hint or f"{category} business interior"
    content["about"]["image_url"] = fetch_image(about_query, f"{category} professional")
    print(f"[Images] About: '{about_query}' → {'✅' if content['about']['image_url'] else '❌'}")

    # Services / Products
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
            query = hint or f"{svc.get('title','')} {category} product"
            svc["image_url"] = fetch_image(query, category)
            print(f"[Images] Service '{svc.get('title','')}': '{query}' → {'✅' if svc['image_url'] else '❌'}")

    return content