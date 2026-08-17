#!/usr/bin/env python3
"""Bundle index.html into a single self-contained file for previewing.

Inlines the stylesheet and script and base64-embeds every image and video that
exists, so the page can be opened (or published) without the static/ tree next
to it. Media is embedded until BUDGET is spent; anything skipped falls back to
the "missing" placeholder and is reported on stdout.

    python3 tools/bundle_preview.py [out.html]
"""
import base64
import mimetypes
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "_preview.html"

html = (ROOT / "index.html").read_text()
css = (ROOT / "static/css/style.css").read_text()
js = (ROOT / "static/js/main.js").read_text()


BUDGET = 12_000_000        # keep the published page under the 16 MB artifact cap
spent = 0
skipped: list[str] = []


def data_uri(rel: str) -> str | None:
    global spent
    p = ROOT / rel
    if not p.is_file():
        return None
    cost = p.stat().st_size * 4 // 3
    if spent + cost > BUDGET:
        skipped.append(rel)
        return None
    spent += cost
    mime = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def embed(attr: str):
    # "|" is the candidate separator, not "," -- a base64 data: URI contains a comma.
    def sub(m: re.Match) -> str:
        out = [data_uri(c.strip()) or c.strip() for c in m.group(1).split("|")]
        return f'{attr}="' + "|".join(out) + '"'
    return sub


html = re.sub(r'data-img="([^"]+)"', embed("data-img"), html)
html = re.sub(r'data-video="([^"]+)"', embed("data-video"), html)
html = re.sub(r'<link rel="stylesheet"[^>]*>', f"<style>\n{css}\n</style>", html)
html = re.sub(r'<script src="[^"]*"></script>', f"<script>\n{js}\n</script>", html)

# The artifact host supplies <!doctype>/<head>/<body>; emit page content only.
head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
title = re.search(r"<title>.*?</title>", head, re.S).group(0)
style = re.search(r"<style>.*?</style>", head, re.S).group(0)

OUT.write_text(title + "\n" + style + "\n" + body)
print(f"wrote {OUT}  ({OUT.stat().st_size / 1e6:.1f} MB)")
if skipped:
    print("over budget, left as placeholders:", ", ".join(skipped))
