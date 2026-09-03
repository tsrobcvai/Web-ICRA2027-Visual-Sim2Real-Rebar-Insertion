#!/usr/bin/env python3
"""Bundle index.html into a single self-contained file for previewing.

Inlines every local stylesheet and script, base64-embeds the webfonts, and
embeds as much media as the budget allows, so the page can be opened (or
published) without the static/ tree next to it. Anything skipped falls back to
the "missing" placeholder and is reported on stdout.

Cheap assets (fonts, icons, figures) are embedded before the multi-megabyte
hero video, so a budget squeeze costs the page a video rather than its type.

    python3 tools/bundle_preview.py [out.html]
"""
import base64
import mimetypes
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "_preview.html"

html = (ROOT / "index.html").read_text(encoding="utf-8")

BUDGET = 14_000_000        # keep the published page under the 16 MB artifact cap
spent = 0
skipped: list[str] = []

mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("image/svg+xml", ".svg")


def data_uri(rel: str) -> str | None:
    """Base64 a repo-relative asset, or None if missing / over budget."""
    global spent
    rel = rel.strip().lstrip("./")
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


# ---------------------------------------------------------------- stylesheets
# Concatenated in document order into one <style>, so the cascade the page
# relies on (bulma first, index.css last) survives bundling.
sheets = re.findall(r'<link rel="stylesheet" href="([^"]+)"', html)
css_parts = []
for href in sheets:
    text = (ROOT / href.lstrip("./")).read_text(encoding="utf-8")
    # @font-face urls are relative to the stylesheet (static/css/../fonts/x).
    def font(m: re.Match) -> str:
        uri = data_uri("static/fonts/" + Path(m.group(1)).name)
        return f"url({uri})" if uri else m.group(0)
    text = re.sub(r'url\(\.\./fonts/([^)]+)\)', font, text)
    css_parts.append(f"/* ---- {href} ---- */\n{text}")
css = "\n\n".join(css_parts)

scripts = re.findall(r'<script src="([^"]+)"></script>', html)
js = "\n\n".join((ROOT / s.lstrip("./")).read_text(encoding="utf-8") for s in scripts)


# ---------------------------------------------------------------- media
def embed_attr(attr: str):
    """For the "|"-separated slot candidate lists."""
    # "|" is the candidate separator, not "," -- a base64 data: URI has commas.
    def sub(m: re.Match) -> str:
        out = [data_uri(c) or c.strip() for c in m.group(1).split("|")]
        return f'{attr}="' + "|".join(out) + '"'
    return sub


def embed_src(m: re.Match) -> str:
    """For plain src=/poster= attributes pointing into static/."""
    attr, path = m.group(1), m.group(2)
    uri = data_uri(path)
    return f'{attr}="{uri}"' if uri else m.group(0)


# Order matters: the small stuff goes in first (see the module docstring).
html = re.sub(r'(src|poster|href)="((?:\./)?static/(?:images|fonts)/[^"]+)"', embed_src, html)
html = re.sub(r'data-img="([^"]+)"', embed_attr("data-img"), html)
html = re.sub(r'data-video="([^"]+)"', embed_attr("data-video"), html)
html = re.sub(r'(src)="((?:\./)?static/videos/[^"]+)"', embed_src, html)

def collapse(pattern: str, text: str, replacement: str) -> str:
    """Swap the first match for `replacement` and drop every later one.

    Not `re.sub(..., count=n-1)` then a second pass: with a single match that
    count is 0, which re.sub reads as "replace them all" -- so the tag would be
    deleted and there would be nothing left to inline into.
    """
    if not re.search(pattern, text):
        return text
    text = re.sub(pattern, lambda m: replacement, text, count=1)
    return re.sub(pattern, "", text)


html = collapse(r'[ \t]*<link rel="stylesheet" href="[^"]+">\n?', html,
                f"<style>\n{css}\n</style>\n")
html = collapse(r'[ \t]*<script src="[^"]+"></script>\n?', html,
                f"<script>\n{js}\n</script>\n")

# The artifact host supplies <!doctype>/<head>/<body>; emit page content only.
head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
title = re.search(r"<title>.*?</title>", head, re.S).group(0)
style = re.search(r"<style>.*?</style>", head, re.S).group(0)

OUT.write_text(title + "\n" + style + "\n" + body, encoding="utf-8")
print(f"wrote {OUT}  ({OUT.stat().st_size / 1e6:.1f} MB)")
if skipped:
    print("over budget, left as placeholders:", ", ".join(skipped))
