#!/usr/bin/env python3
"""Bundle index.html into a single self-contained file for previewing.

Inlines the stylesheet and script and base64-embeds any image that exists,
so the page can be opened (or published) without the static/ tree next to it.
Videos are NOT embedded -- their slots fall back to the "missing" placeholder,
which is what an un-filled slot looks like on the real site anyway.

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


def data_uri(rel: str) -> str | None:
    p = ROOT / rel
    if not p.is_file():
        return None
    mime = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def embed_imgs(m: re.Match) -> str:
    out = []
    for cand in m.group(1).split(","):
        out.append(data_uri(cand.strip()) or cand.strip())
    return 'data-img="' + ",".join(out) + '"'


html = re.sub(r'data-img="([^"]+)"', embed_imgs, html)
html = re.sub(r'<link rel="stylesheet"[^>]*>', f"<style>\n{css}\n</style>", html)
html = re.sub(r'<script src="[^"]*"></script>', f"<script>\n{js}\n</script>", html)

# The artifact host supplies <!doctype>/<head>/<body>; emit page content only.
head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
title = re.search(r"<title>.*?</title>", head, re.S).group(0)
style = re.search(r"<style>.*?</style>", head, re.S).group(0)

OUT.write_text(title + "\n" + style + "\n" + body)
print(f"wrote {OUT}  ({OUT.stat().st_size / 1e6:.1f} MB)")
