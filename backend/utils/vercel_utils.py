"""
utils/vercel_utils.py
Marketing website builder — no e-commerce, all CTAs are enquiry/contact based.
"""
import os, re, time, requests

VERCEL_API = "https://api.vercel.com"

def get_token():
    t = os.getenv("VERCEL_TOKEN")
    if not t: raise ValueError("VERCEL_TOKEN not set")
    return t

def slugify(name):
    s = name.lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s.strip())
    return re.sub(r"-+", "-", s)[:40].strip("-")

def parse_color(color):
    if not color: return None
    t = color.strip()
    if t.startswith("#"): return t
    m = {
        "gold":"#e8d5a3","amber":"#c9a96e","navy":"#1e3a5f",
        "white":"#f5f5f5","black":"#111111","red":"#b22222",
        "blue":"#2255aa","green":"#2a7a4b","pink":"#e75480",
        "purple":"#6b3fa0","orange":"#e07b39","teal":"#1a7a7a",
        "yellow":"#e0c040","brown":"#8b5e3c","maroon":"#800000",
        "grey":"#888888","gray":"#888888","silver":"#c0c0c0",
        "indigo":"#4b0082","crimson":"#b22222","emerald":"#2a9a6a",
        "rose":"#c9748a","saffron":"#f59e0b","slate":"#64748b",
    }
    return m.get(t.lower(), "#e8d5a3")

def luminance(hex_color):
    h = hex_color.lstrip("#")
    if len(h) != 6: return 0
    r,g,b = int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
    return 0.299*r + 0.587*g + 0.114*b

def _lighten_hex(hex_color, amount=10):
    try:
        h = hex_color.lstrip("#")
        if len(h) != 6: return hex_color
        r = min(255, int(h[0:2],16) + amount)
        g = min(255, int(h[2:4],16) + amount)
        b = min(255, int(h[4:6],16) + amount)
        return f"#{r:02x}{g:02x}{b:02x}"
    except Exception:
        return hex_color

def strip_md(text):
    if not text: return ""
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", str(text))
    text = re.sub(r"\*(.*?)\*",     r"\1", text)
    return text

def sanitize_cta(text):
    """Ensure no e-commerce language slips through."""
    if not text: return text
    replacements = {
        "shop now":"View Our Range","buy now":"Explore Products",
        "order now":"See Our Offerings","add to cart":"Learn More",
        "purchase now":"Discover More","shop our":"Explore Our",
        "buy our":"Discover Our","order online":"Contact Us",
        "checkout":"Get in Touch","shop":"Explore",
    }
    lower = text.lower().strip()
    for bad, good in replacements.items():
        if lower == bad or lower.startswith(bad):
            return good
    return text


def build_html(content_json, branding):
    c        = content_json
    biz_name = branding.get("business_name","Business")
    logo_url = branding.get("logo_url","")
    brand_colors = branding.get("brand_colors",[])

    # ── Colors ───────────────────────────────────────────────────────────
    raw_primary = brand_colors[2] if len(brand_colors)>2 else (brand_colors[0] if brand_colors else None)
    raw_bg_hint = brand_colors[0] if brand_colors else None

    primary   = parse_color(raw_primary) or "#e8d5a3"
    bg_parsed = parse_color(raw_bg_hint) or "#09090b"

    if luminance(bg_parsed) < 80:
        bg      = bg_parsed
        surface = _lighten_hex(bg_parsed, 8)
    else:
        bg      = "#09090b"
        surface = "#0e0e10"

    text_col = "#f0ede8" if luminance(bg) < 128 else "#111111"
    muted    = "rgba(240,237,232,0.5)" if luminance(bg)<128 else "rgba(20,20,20,0.55)"
    border   = "rgba(255,255,255,0.07)" if luminance(bg)<128 else "rgba(0,0,0,0.1)"
    cta_text = "#09090b" if luminance(primary)>140 else "#f0ede8"

    print(f"[HTML] bg={bg} primary={primary}")

    hero   = c.get("hero",{})
    about  = c.get("about",{})
    cta    = c.get("cta",{})
    footer = c.get("footer",{})

    # Sanitize CTAs at HTML build time too (double safety)
    cta_primary   = sanitize_cta(hero.get("cta_primary","View Our Products"))
    cta_secondary = sanitize_cta(hero.get("cta_secondary","Contact Us"))
    cta_btn       = sanitize_cta(cta.get("button_text","Contact Us"))

    # ── Services ─────────────────────────────────────────────────────────
    services_html = ""
    for s in c.get("services",[]):
        img = s.get("image_url","")
        if img:
            img_block = f'''<div style="width:100%;aspect-ratio:4/3;overflow:hidden;background:#111113;display:flex;align-items:center;justify-content:center;padding:8px;">
                <img src="{img}" alt="{strip_md(s.get('title',''))}" style="max-width:100%;max-height:220px;object-fit:contain;display:block;">
            </div>'''
        else:
            img_block = f'<div style="width:100%;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;font-size:3rem;background:{surface};">{s.get("icon","📦")}</div>'

        services_html += f"""<div style="background:{surface};overflow:hidden;cursor:default;" onmouseover="this.style.background='{_lighten_hex(surface,6)}'" onmouseout="this.style.background='{surface}'">
            {img_block}
            <div style="padding:20px 22px 26px;">
                <div style="font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;margin-bottom:10px;color:{text_col};">{strip_md(s.get("title",""))}</div>
                <p style="font-size:0.875rem;color:{muted};line-height:1.65;font-weight:300;">{strip_md(s.get("description",""))}</p>
            </div>
        </div>"""

    # ── Testimonials ─────────────────────────────────────────────────────
    testi_html = ""
    for t in c.get("testimonials",[]):
        testi_html += f"""<div style="background:{surface};border:1px solid {border};border-radius:14px;padding:28px;">
            <div style="font-size:2rem;color:{primary};margin-bottom:12px;">"</div>
            <p style="font-size:0.95rem;color:{muted};line-height:1.7;font-style:italic;margin-bottom:20px;">{strip_md(t.get("text",""))}</p>
            <div style="font-weight:600;font-size:0.875rem;color:{text_col};">{t.get("name","")}</div>
            <div style="font-size:0.78rem;color:{muted};margin-top:2px;">{t.get("role","")}</div>
        </div>"""

    # ── Offers ────────────────────────────────────────────────────────────
    offers_html = ""
    if c.get("offers") and c["offers"].get("title"):
        o = c["offers"]
        offers_html = f"""<section style="background:linear-gradient(135deg,{primary}22,{primary}08);border-top:1px solid {primary}40;border-bottom:1px solid {primary}40;padding:40px 56px;">
        <div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;">
            <div>
                <div style="font-family:'Playfair Display',serif;font-weight:700;font-size:1.2rem;color:{primary};margin-bottom:10px;">🎉 {strip_md(o.get("title",""))}</div>
                <p style="color:{muted};font-size:0.95rem;line-height:1.65;">{strip_md(o.get("description",""))}</p>
            </div>
            <a href="#contact" style="padding:12px 28px;background:{primary};color:{cta_text};border-radius:8px;font-weight:600;font-size:0.9rem;text-decoration:none;white-space:nowrap;">Enquire Now</a>
        </div></section>"""

    # ── FAQ ───────────────────────────────────────────────────────────────
    faq_html = ""
    if c.get("faq"):
        items = "".join([f"""<div style="background:{surface};padding:22px 28px;border-bottom:1px solid {border};">
            <div style="font-weight:500;margin-bottom:8px;color:{text_col};">{strip_md(f.get("question",""))}</div>
            <div style="color:{muted};font-size:0.875rem;line-height:1.6;">{strip_md(f.get("answer",""))}</div>
        </div>""" for f in c["faq"]])
        faq_html = f"""<section style="padding:0 56px 100px;max-width:1100px;margin:0 auto;">
        <div style="font-size:0.7rem;color:{primary};letter-spacing:0.14em;text-transform:uppercase;margin-bottom:40px;display:flex;align-items:center;gap:12px;">FAQ<span style="flex:1;height:1px;background:{border};"></span></div>
        <div style="border-radius:14px;overflow:hidden;border:1px solid {border};">{items}</div></section>"""

    about_img      = about.get("image_url","")
    about_img_html = f'<div style="border-radius:16px;overflow:hidden;aspect-ratio:4/3;"><img src="{about_img}" style="width:100%;height:100%;object-fit:cover;"></div>' if about_img else ""
    about_cols     = "1fr 1fr" if about_img else "1fr"

    logo_html = f'<img src="{logo_url}" style="width:32px;height:32px;border-radius:6px;object-fit:cover;">' if logo_url else f'<div style="width:32px;height:32px;border-radius:8px;background:{primary};"></div>'

    highlights = "".join([
        f'<div style="display:flex;align-items:center;gap:12px;font-size:0.9rem;font-weight:300;color:{text_col};"><span style="width:7px;height:7px;border-radius:50%;background:{primary};display:inline-block;flex-shrink:0;"></span>{strip_md(h)}</div>'
        for h in [about.get("highlight_1"),about.get("highlight_2"),about.get("highlight_3")] if h
    ])

    footer_info = "  ·  ".join([footer.get(k,"") for k in ["email","phone","address"] if footer.get(k)])

    testi_section = ""
    if c.get("testimonials"):
        testi_section = f"""<section style="padding:0 56px 100px;max-width:1100px;margin:0 auto;">
        <div style="font-size:0.7rem;color:{primary};letter-spacing:0.14em;text-transform:uppercase;margin-bottom:40px;display:flex;align-items:center;gap:12px;">What people say<span style="flex:1;height:1px;background:{border};"></span></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;">{testi_html}</div></section>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>{biz_name}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{font-family:'DM Sans',sans-serif;background:{bg};color:{text_col};}}
html{{scroll-behavior:smooth;}}
a{{color:inherit;text-decoration:none;}}
@keyframes fadeUp{{from{{opacity:0;transform:translateY(20px)}}to{{opacity:1;transform:translateY(0)}}}}
.anim{{animation:fadeUp 0.7s ease both;}}
.d1{{animation-delay:.1s}}.d2{{animation-delay:.2s}}.d3{{animation-delay:.3s}}.d4{{animation-delay:.4s}}
@media(max-width:768px){{
  nav .links{{display:none!important;}}
  .hero-inner{{padding:60px 24px!important;}}
  .about-inner{{padding:60px 24px!important;grid-template-columns:1fr!important;}}
  .svc-section{{padding:0 24px 60px!important;}}
  .svc-grid{{grid-template-columns:1fr!important;}}
  .hero-btns{{flex-direction:column;align-items:center;}}
}}
</style>
</head>
<body>

<!-- NAV: "Our Products" scrolls to #services section (no external shop link) -->
<nav style="position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 56px;height:68px;background:{bg}ee;backdrop-filter:blur(20px);border-bottom:1px solid {border};">
  <div style="display:flex;align-items:center;gap:10px;">{logo_html}<span style="font-family:'Playfair Display',serif;font-weight:700;font-size:1.1rem;">{biz_name}</span></div>
  <div class="links" style="display:flex;gap:28px;align-items:center;">
    <a href="#about"    style="color:{muted};font-size:.875rem;transition:color .2s;" onmouseover="this.style.color='{primary}'" onmouseout="this.style.color='{muted}'">About</a>
    <a href="#services" style="color:{muted};font-size:.875rem;transition:color .2s;" onmouseover="this.style.color='{primary}'" onmouseout="this.style.color='{muted}'">Our Products</a>
    <a href="#contact"  style="color:{muted};font-size:.875rem;transition:color .2s;" onmouseover="this.style.color='{primary}'" onmouseout="this.style.color='{muted}'">Contact</a>
    <!-- Primary nav CTA: scrolls to offerings, not an external shop -->
    <a href="#services" style="padding:10px 24px;background:{primary};color:{cta_text};border-radius:8px;font-weight:600;font-size:.875rem;">{cta_primary}</a>
  </div>
</nav>

<!-- HERO: primary button → offerings, secondary → contact -->
<section style="position:relative;min-height:90vh;display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden;">
  <div style="position:absolute;top:20%;left:50%;transform:translate(-50%,-50%);width:800px;height:600px;background:radial-gradient(ellipse,{primary}18 0%,transparent 70%);pointer-events:none;"></div>
  <div class="hero-inner" style="position:relative;z-index:1;padding:80px 32px;max-width:900px;margin:0 auto;">
    <div class="anim d1" style="display:inline-flex;align-items:center;border:1px solid {primary}50;background:{primary}12;padding:6px 20px;border-radius:100px;font-size:.72rem;color:{primary};letter-spacing:.12em;text-transform:uppercase;margin-bottom:32px;">{hero.get("tagline",biz_name)}</div>
    <h1 class="anim d2" style="font-family:'Playfair Display',serif;font-size:clamp(2.4rem,6vw,5rem);font-weight:800;letter-spacing:-.02em;line-height:1.1;margin-bottom:24px;">{strip_md(hero.get("headline",""))}</h1>
    <p class="anim d3" style="font-size:1.1rem;color:{muted};max-width:540px;margin:0 auto 48px;line-height:1.75;font-weight:300;">{strip_md(hero.get("subheadline",""))}</p>
    <div class="anim d4 hero-btns" style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;">
      <!-- Primary: scrolls down to product/service offerings -->
      <a href="#services" style="padding:15px 36px;background:{primary};color:{cta_text};border-radius:9px;font-weight:600;font-size:1rem;">{cta_primary}</a>
      <!-- Secondary: scrolls to contact -->
      <a href="#contact" style="padding:15px 36px;background:rgba(255,255,255,.06);color:{text_col};border:1px solid {border};border-radius:9px;font-size:1rem;">{cta_secondary}</a>
    </div>
  </div>
</section>

{offers_html}

<section id="about">
  <div class="about-inner" style="padding:100px 56px;max-width:1100px;margin:0 auto;display:grid;grid-template-columns:{about_cols};gap:64px;align-items:center;">
    <div>
      <div style="font-size:.7rem;color:{primary};letter-spacing:.14em;text-transform:uppercase;margin-bottom:40px;display:flex;align-items:center;gap:12px;">About us<span style="flex:1;height:1px;background:{border};"></span></div>
      <h2 style="font-family:'Playfair Display',serif;font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;letter-spacing:-.02em;margin-bottom:20px;">{strip_md(about.get("title",""))}</h2>
      <p style="font-size:1.05rem;color:{muted};line-height:1.8;font-weight:300;margin-bottom:36px;">{strip_md(about.get("description",""))}</p>
      <div style="display:flex;flex-direction:column;gap:14px;">{highlights}</div>
    </div>
    {about_img_html}
  </div>
</section>

<!-- SERVICES / PRODUCTS section — this is what nav "Our Products" links to -->
<section id="services" class="svc-section" style="padding:0 56px 100px;max-width:1100px;margin:0 auto;">
  <div style="font-size:.7rem;color:{primary};letter-spacing:.14em;text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:12px;">Our Products & Services<span style="flex:1;height:1px;background:{border};"></span></div>
  <p style="color:{muted};font-size:0.9rem;margin-bottom:40px;font-weight:300;">Browse our range — contact us to enquire about availability and pricing.</p>
  <div class="svc-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1px;background:{border};border:1px solid {border};border-radius:16px;overflow:hidden;">{services_html}</div>
</section>

{testi_section}
{faq_html}

<!-- CONTACT section — all CTAs lead here -->
<section id="contact" style="padding:80px 56px 120px;display:flex;justify-content:center;">
  <div style="max-width:700px;width:100%;border:1px solid {border};border-radius:20px;padding:64px 48px;text-align:center;background:linear-gradient(135deg,{primary}0f 0%,transparent 60%);position:relative;overflow:hidden;">
    <div style="position:absolute;top:-1px;left:15%;right:15%;height:2px;background:linear-gradient(90deg,transparent,{primary},transparent);"></div>
    <h2 style="font-family:'Playfair Display',serif;font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;letter-spacing:-.02em;margin-bottom:16px;">{strip_md(cta.get("headline","Get in Touch"))}</h2>
    <p style="font-size:.95rem;color:{muted};font-weight:300;margin-bottom:36px;line-height:1.65;">{strip_md(cta.get("subtext","Reach out to know more about our products and pricing."))}</p>
    <!-- Contact CTA: mailto link — no shop/cart link -->
    <a href="mailto:{footer.get('email','')}" style="display:inline-block;padding:15px 40px;background:{primary};color:{cta_text};border-radius:9px;font-weight:600;font-size:1rem;">{cta_btn}</a>
    {f'<div style="margin-top:20px;font-size:0.875rem;color:{muted};">📞 {footer.get("phone","")}</div>' if footer.get("phone") else ""}
  </div>
</section>

<footer style="border-top:1px solid {border};padding:32px 56px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
  <div style="font-family:'Playfair Display',serif;font-weight:700;color:{primary};">{biz_name}</div>
  <div style="font-size:.8rem;color:{muted};">{footer_info}</div>
  <div style="font-size:.75rem;color:{muted};opacity:.5;">{strip_md(footer.get("tagline",""))}</div>
</footer>

</body></html>"""


def get_project_domain(project_name, headers):
    try:
        time.sleep(3)
        res = requests.get(f"{VERCEL_API}/v9/projects/{project_name}", headers=headers, timeout=10)
        if res.status_code == 200:
            for d in res.json().get("alias",[]):
                name = d.get("domain","") if isinstance(d,dict) else d
                if name and "vercel.app" in name and len(name.split("-"))<6:
                    return f"https://{name}"
    except Exception as e:
        print(f"[Vercel] domain fetch failed: {e}")
    return ""


def deploy_to_vercel(business_name, content_json, branding):
    token        = get_token()
    slug         = slugify(business_name)
    project_name = f"{slug}-bizsolve"
    html         = build_html(content_json, branding)
    auth_headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload      = {
        "name": project_name,
        "files": [{"file":"index.html","data":html}],
        "projectSettings": {"framework": None},
        "target": "production",
    }
    res = requests.post(f"{VERCEL_API}/v13/deployments", headers=auth_headers, json=payload, timeout=30)
    if res.status_code not in (200,201):
        raise Exception(f"Vercel failed: {res.status_code} — {res.text[:300]}")
    data    = res.json()
    aliases = data.get("alias",[])
    for a in aliases:
        name = a.get("domain","") if isinstance(a,dict) else a
        if name and "vercel.app" in name and project_name in name and len(name.replace(project_name,"").strip("-"))<5:
            url = f"https://{name}" if not name.startswith("http") else name
            return {"url":url,"project_name":project_name,"deployment_id":data.get("id","")}
    clean = get_project_domain(project_name, auth_headers)
    if clean:
        return {"url":clean,"project_name":project_name,"deployment_id":data.get("id","")}
    return {"url":f"https://{project_name}.vercel.app","project_name":project_name,"deployment_id":data.get("id","")}