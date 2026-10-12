#!/usr/bin/env python3
"""Build assets/img/icons.svg — an SVG <symbol> sprite from lucide-static (ISC) +
simple-icons (CC0) brand marks.  Usage: python3 tools/build_icons.py <node_modules>"""
import re, sys, pathlib
nm = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "node_modules")
LUCIDE = """dumbbell sun moon sunrise moon-star arrow-left arrow-right arrow-up chevron-down chevron-up
chevron-left chevron-right menu x check star award shield-check utensils activity heart-pulse car
sparkles flame trophy users user clock map-pin phone mail send search calendar timer play plus minus
droplets download share-2 copy link quote zap target scale ruler leaf waves crown gem medal calculator
book-open bike heart filter maximize-2 image info triangle-alert circle-check badge-check printer salad
egg beef milk pill coffee glass-water move-horizontal sliders-horizontal scan-line flower-2 swords
graduation-cap stretch-horizontal footprints bed alarm-clock brain apple sandwich soup wheat fish
chart-pie gauge list flask-conical shirt lock smile clipboard-list external-link rotate-ccw eye loader-circle venus mars""".split()
BRANDS = "instagram whatsapp telegram youtube x aparat".split()
out = ['<svg xmlns="http://www.w3.org/2000/svg" style="display:none">']
missing = []
for n in LUCIDE:
    p = nm / "lucide-static/icons" / f"{n}.svg"
    if not p.exists(): missing.append(n); continue
    s = p.read_text()
    inner = re.search(r"<svg[^>]*>(.*)</svg>", s, re.S).group(1)
    inner = re.sub(r"\s+", " ", inner).strip()
    out.append(f'<symbol id="i-{n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">{inner}</symbol>')
for n in BRANDS:
    s = (nm / "simple-icons/icons" / f"{n}.svg").read_text()
    path = re.search(r'<path d="([^"]+)"', s).group(1)
    out.append(f'<symbol id="b-{n}" viewBox="0 0 24 24" fill="currentColor"><path d="{path}"/></symbol>')
out.append("</svg>")
pathlib.Path("assets/img/icons.svg").write_text("\n".join(out) + "\n")
print("missing:", missing)
