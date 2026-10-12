#!/usr/bin/env python3
"""
IRON ARENA — partial stamper (optional tooling, NOT required for deployment)
=============================================================================
Every HTML page in the repo root is already complete, static and deployable.
This script only keeps shared blocks in sync. Each page contains marker pairs:

    <!--#head-->…<!--/head-->        <title>, meta, OG, Twitter, JSON-LD, CSS
    <!--#sprite-->…<!--/sprite-->    inline SVG icon sprite (works on file://)
    <!--#loader-->…<!--/loader-->
    <!--#header-->…<!--/header-->
    <!--#footer-->…<!--/footer-->
    <!--#floating-->…<!--/floating-->
    <!--#scripts-->…<!--/scripts-->

After editing anything in tools/partials/ or PAGES below, run:

    python3 tools/build.py

It also regenerates sitemap.xml. Change SITE_URL when you deploy elsewhere.
"""
import json, re, pathlib, datetime, html

ROOT = pathlib.Path(__file__).resolve().parent.parent
PARTIALS = ROOT / "tools" / "partials"

# ---------------------------------------------------------------- config
SITE_URL = "https://rahmaniho.github.io/Gym/"     # ← trailing slash required
SITE_NAME = "آیرون آرنا | IRON ARENA"
OG_IMAGE = "assets/img/og-image.jpg"
THEME_COLOR = "#0A0A0A"

COMMON_JS = ["assets/js/lqip.js", "assets/vendor/gsap.min.js", "assets/js/main.js", "assets/js/karensoft-credit.js"]

PAGES = {
    "index.html": dict(
        title="آیرون آرنا | باشگاه بدنسازی لاکچری آقایان و بانوان — سانس صبح و عصر",
        desc="آیرون آرنا، باشگاه بدنسازی و فیتنس لوکس آقایان و بانوان در تهران؛ دو سانس صبح و عصر، مربیان دارای مدرک بین‌المللی، تجهیزات Hammer Strength، InBody، اسپا و برنامهٔ غذایی شخصی.",
        js=["assets/js/data.js", "assets/js/blog-data.js", "assets/js/blog.js", "assets/js/pages.js"], priority="1.0"),
    "programs.html": dict(
        title="کتابخانهٔ تمرینات و برنامه‌های آماده | آیرون آرنا",
        desc="بیش از ۳۰ حرکت بدنسازی با ست و تکرار، عضلات درگیر، سطح دشواری و نکتهٔ فنی؛ به‌همراه چهار برنامهٔ هفتگی آماده و قابل چاپ.",
        js=["assets/js/data.js", "assets/js/pages.js"], priority="0.9"),
    "diet.html": dict(
        title="مرکز تغذیه — برنامهٔ غذایی، مکمل و محاسبهٔ آب | آیرون آرنا",
        desc="برنامهٔ غذایی ۷ روزه بر اساس شاخص توده بدنی، راهنمای مکمل‌ها، محاسبه‌گر آب روزانه و راهنمای تغذیهٔ قبل و بعد از تمرین.",
        js=["assets/js/data.js", "assets/js/pages.js"], priority="0.9"),
    "bmi.html": dict(
        title="محاسبه BMI، کالری و برنامهٔ غذایی و تمرینی رایگان | آیرون آرنا",
        desc="شاخص توده بدنی، BMR، TDEE و درشت‌مغذی‌هایتان را در ۳۰ ثانیه بسنجید و برنامهٔ غذایی ۷ روزه و برنامهٔ تمرینی شخصی دریافت کنید — کاملاً رایگان.",
        js=["assets/js/data.js", "assets/vendor/chart.umd.min.js", "assets/js/pages.js", "assets/js/bmi.js"], priority="0.9"),
    "coaches.html": dict(
        title="مربیان حرفه‌ای آقایان و بانوان | آیرون آرنا",
        desc="با تیم مربیان آیرون آرنا آشنا شوید؛ دارندگان مدارک IFBB، ACE، NASM و ISSA و قهرمانان ملی بدنسازی، فیتنس بانوان، MMA و تغذیهٔ ورزشی.",
        js=["assets/js/data.js", "assets/js/pages.js"], priority="0.8"),
    "pricing.html": dict(
        title="تعرفه‌ها و پلن‌های عضویت — نقره‌ای، طلایی، الماس | آیرون آرنا",
        desc="مقایسهٔ کامل پلن‌های عضویت آیرون آرنا با ۲۰٪ تخفیف عضویت سالانه، جلسهٔ اول رایگان و پاسخ به سؤالات متداول.",
        js=["assets/js/data.js", "assets/js/pages.js"], priority="0.8",
        extra_ld="faq"),
    "gallery.html": dict(
        title="گالری تصاویر باشگاه | آیرون آرنا",
        desc="گشتی تصویری در سالن‌های آیرون آرنا؛ سالن وزنه، رینگ MMA، استودیو بانوان، اسپا و ریکاوری و فضای لابی.",
        js=["assets/js/data.js", "assets/js/pages.js"], priority="0.6"),
    "blog.html": dict(
        title="مجلهٔ آیرون آرنا — تمرین، تغذیه، مکمل و انگیزه",
        desc="مقالات تخصصی و کاربردی دربارهٔ تمرین بدنسازی، تغذیه، مکمل، ریکاوری، سلامت و انگیزه — نوشتهٔ مربیان آیرون آرنا.",
        js=["assets/js/blog-data.js", "assets/js/blog.js"], priority="0.8"),
    "blog-post.html": dict(
        title="مقاله | مجلهٔ آیرون آرنا",
        desc="مقالات تخصصی تمرین و تغذیه از مربیان آیرون آرنا.",
        js=["assets/js/blog-data.js", "assets/js/blog.js"], og_type="article", priority=None),
    "contact.html": dict(
        title="تماس با ما و رزرو سانس | آیرون آرنا",
        desc="رزرو جلسهٔ رایگان، مشاورهٔ عضویت و تماس با آیرون آرنا؛ نشانی، تلفن، ساعات کاری سانس صبح و عصر و مسیر روی نقشه.",
        js=["assets/js/data.js", "assets/js/pages.js"], priority="0.7"),
    "404.html": dict(
        title="صفحه پیدا نشد | آیرون آرنا",
        desc="صفحه‌ای که به دنبال آن بودید پیدا نشد.",
        js=[], noindex=True, priority=None),
}

BUSINESS_LD = {
    "@context": "https://schema.org",
    "@type": ["ExerciseGym", "HealthClub"],
    "@id": SITE_URL + "#gym",
    "name": "IRON ARENA — آیرون آرنا",
    "alternateName": "باشگاه بدنسازی آیرون آرنا",
    "description": "باشگاه بدنسازی و فیتنس لاکچری آقایان و بانوان با دو سانس صبح و عصر",
    "url": SITE_URL,
    "logo": SITE_URL + "assets/img/icon-512.png",
    "image": SITE_URL + OG_IMAGE,
    "telephone": "+98-21-2200-0000",
    "email": "info@ironarena.ir",
    "priceRange": "$$$",
    "currenciesAccepted": "IRR",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "بلوار نلسون ماندلا (جردن)، نبش خیابان طاهری، برج آرنا",
        "addressLocality": "تهران",
        "addressRegion": "تهران",
        "addressCountry": "IR",
    },
    "geo": {"@type": "GeoCoordinates", "latitude": 35.7700, "longitude": 51.4140},
    "openingHoursSpecification": [
        {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"], "opens": "06:00", "closes": "12:00"},
        {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"], "opens": "16:00", "closes": "23:00"},
        {"@type": "OpeningHoursSpecification", "dayOfWeek": "Thursday", "opens": "07:00", "closes": "12:00"},
        {"@type": "OpeningHoursSpecification", "dayOfWeek": "Thursday", "opens": "16:00", "closes": "21:00"},
        {"@type": "OpeningHoursSpecification", "dayOfWeek": "Friday", "opens": "08:00", "closes": "12:00"},
    ],
    "amenityFeature": [
        {"@type": "LocationFeatureSpecification", "name": n, "value": True}
        for n in ["Sauna", "Parking", "InBody body composition", "Women-only studio", "MMA ring", "Massage & recovery"]
    ],
    "sameAs": ["https://instagram.com/ironarena.club", "https://t.me/ironarena_club"],
}

FAQ_LD = None  # filled from assets/js/data.js FAQ at build time (see build_faq_ld)

HEAD_BOOT = (
    "(function(){var d=document.documentElement;d.classList.add('js');try{"
    "var t=localStorage.getItem('ia-theme'),g=localStorage.getItem('ia-gender');"
    "if(t==='light'||t==='dark')d.setAttribute('data-theme',t);"
    "if(g==='male'||g==='female')d.setAttribute('data-gender',g);"
    "if(sessionStorage.getItem('ia-loaded')||matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('no-loader');"
    "}catch(e){d.classList.add('no-loader');}})();"
)


def build_faq_ld():
    """Extract FAQ question/answer pairs from data.js so JSON-LD == visible content."""
    src = (ROOT / "assets/js/data.js").read_text(encoding="utf-8")
    m = re.search(r"faq:\s*\[(.*?)\n\s*\]", src, re.S)
    if not m:
        return None
    pairs = re.findall(r"q:\s*\"(.*?)\",\s*a:\s*\"(.*?)\"", m.group(1), re.S)
    return {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in pairs],
    }


def head_for(name, meta):
    url = SITE_URL + ("" if name == "index.html" else name)
    t, d = html.escape(meta["title"]), html.escape(meta["desc"])
    og_type = meta.get("og_type", "website")
    robots = "noindex, follow" if meta.get("noindex") else "index, follow, max-image-preview:large"
    lds = [BUSINESS_LD]
    if meta.get("extra_ld") == "faq":
        faq = build_faq_ld()
        if faq:
            lds.append(faq)
    ld_html = "\n".join(
        f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False, separators=(",", ":"))}</script>' for x in lds)
    return f"""<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{t}</title>
<meta name="description" content="{d}">
<meta name="robots" content="{robots}">
<meta name="author" content="IRON ARENA">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="{THEME_COLOR}">
<meta name="color-scheme" content="dark light">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="{SITE_NAME}">
<meta property="og:locale" content="fa_IR">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE_URL}{OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="آیرون آرنا — باشگاه بدنسازی لاکچری">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{t}">
<meta name="twitter:description" content="{d}">
<meta name="twitter:image" content="{SITE_URL}{OG_IMAGE}">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="preload" href="assets/fonts/vazirmatn-arabic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/style.css">
<link rel="stylesheet" href="assets/css/print.css" media="print">
<script>{HEAD_BOOT}</script>
{ld_html}"""


def sprite():
    s = (ROOT / "assets/img/icons.svg").read_text(encoding="utf-8").strip()
    logo = ('<symbol id="logo" viewBox="0 0 48 48" fill="none" stroke="currentColor">'
            '<path d="M24 2.5 42.6 13.25v21.5L24 45.5 5.4 34.75v-21.5z" stroke-width="1.4" opacity=".6"/>'
            '<path d="M15.5 35 24 13l8.5 22" stroke-width="3.2" stroke-linecap="square"/>'
            '<path d="M11 27.5h26" stroke-width="2"/>'
            '<rect x="8" y="23.5" width="3.2" height="8" rx="1" fill="currentColor" stroke="none"/>'
            '<rect x="36.8" y="23.5" width="3.2" height="8" rx="1" fill="currentColor" stroke="none"/></symbol>')
    s = s.replace('<svg xmlns="http://www.w3.org/2000/svg" style="display:none">',
                  '<svg xmlns="http://www.w3.org/2000/svg" class="sr-only" aria-hidden="true" focusable="false">' + logo, 1)
    return s


def scripts_for(meta):
    files = COMMON_JS + meta.get("js", [])
    return "\n".join(f'<script src="{f}" defer></script>' for f in files)


def mark_current(block, name):
    target = "index.html" if name == "404.html" else name
    if name == "blog-post.html":
        target = "blog.html"
    return re.sub(rf'(<a(?: class="[^"]*")? href="{re.escape(target)}")', r'\1 aria-current="page"', block)


def stamp(text, key, content):
    pat = re.compile(rf"<!--#{key}-->.*?<!--/{key}-->", re.S)
    if not pat.search(text):
        return text
    return pat.sub(lambda _: f"<!--#{key}-->\n{content}\n<!--/{key}-->", text)


def main():
    parts = {p.stem: p.read_text(encoding="utf-8").strip() for p in PARTIALS.glob("*.html")}
    spr = sprite()
    for name, meta in PAGES.items():
        f = ROOT / name
        if not f.exists():
            print("skip (missing):", name)
            continue
        t = f.read_text(encoding="utf-8")
        t = stamp(t, "head", head_for(name, meta))
        t = stamp(t, "sprite", spr)
        t = stamp(t, "loader", parts["loader"])
        t = stamp(t, "header", mark_current(parts["header"], name))
        t = stamp(t, "footer", parts["footer"])
        t = stamp(t, "floating", parts["floating"])
        t = stamp(t, "scripts", scripts_for(meta))
        f.write_text(t, encoding="utf-8")
        print("stamped:", name)

    # sitemap.xml (blog posts included from blog-data ids)
    today = datetime.date.today().isoformat()
    urls = [(SITE_URL + ("" if n == "index.html" else n), m["priority"]) for n, m in PAGES.items() if m.get("priority")]
    bd = ROOT / "assets/js/blog-data.js"
    if bd.exists():
        for pid in re.findall(r'id:\s*"(post-\d+)"', bd.read_text(encoding="utf-8")):
            urls.append((f"{SITE_URL}blog-post.html?id={pid}", "0.7"))
    xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u, p in urls:
        xml.append(f"  <url><loc>{html.escape(u)}</loc><lastmod>{today}</lastmod><priority>{p}</priority></url>")
    xml.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(xml) + "\n", encoding="utf-8")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /tools/\n\nSitemap: {SITE_URL}sitemap.xml\n", encoding="utf-8")
    print("sitemap.xml + robots.txt written")


if __name__ == "__main__":
    main()
