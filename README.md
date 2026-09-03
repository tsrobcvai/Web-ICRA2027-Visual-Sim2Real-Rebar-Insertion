# RebarSim — project page

Static project website for **"Visual Sim-to-Real Learning for Robotic Insertion under
Geometric Variations: Application to Rebar Installation"** (ICRA 2027 submission).

Built on the NeRFies / [UMI on Legs](https://umi-on-legs.github.io/) project-page
template: [Bulma](https://bulma.io) does the layout and typography, and
`static/css/index.css` holds the page-specific bits on top of it.

No build step and no CDN — Bulma, the webfonts and every icon are vendored into
`static/`, so the page works offline and over `file://`. Open `index.html` and it
works.

---

## How to fill in the missing content

Every image and video on the page is a **media slot**. A slot points at one or more
file paths; the first path that loads is shown, and if none load the page renders a
highlighted amber box naming the file that is missing. **So adding content = copying a
file to the right path.** No HTML editing needed.

### Videos → `static/videos/`

| File | Where it appears |
| --- | --- |
| `hero.mp4` | Full-screen hero background (desktop) — ✅ **in place** |
| `hero-mobile.mp4` | Same, centre-cropped to portrait for phones — ✅ **in place** |
| `sim/env2_ep1.mp4`, `sim/env9_ep1.mp4`, `sim/env2_ep3.mp4`, `sim/env2_ep2.mp4` | **In Simulation** grid — ✅ **in place** |
| `rollout_01.mp4` … `rollout_04.mp4` | **Real-World Demos** grid — ✅ **in place** |

The clips sit in a plain Bulma column grid (`columns is-multiline`, two per row on
desktop, one per row on mobile). Adding a clip is another
`<div class="column is-half"><figure class="clip">…</figure></div>` — there is no
carousel or scroll handling to keep in sync.

Clips are boxed at 16:9 and letterboxed on black, so mixed aspect ratios still line
up. They autoplay muted on loop and pause when scrolled out of view. A slot marked
`data-once` instead plays through once and shows controls — use that for the long
continuous-operation take. The Continuous-operation block carries no clip yet; it
shows a `soon` chip instead of an empty slot.

The four rollouts came from `static/videos/` under their original names (all
1280×720, 10 fps, 1.6–6.9 s). The number is the display order, so to reorder the
grid, rename the files — the HTML never changes:

| now | was |
| --- | --- |
| `rollout_01.mp4` | `student_9cam_cal0713_semantic_model9500__ee_x0p372_y0p017_z0p277_20260722_124237.mp4` |
| `rollout_02.mp4` | `student_8cam-mdepth-slotseg_model3000__ee_x0p407_y0p044_z0p262_20260725_140540.mp4` |
| `rollout_03.mp4` | `student_9cam_cal0713_semantic_model9500__ee_x0p408_y0p046_z0p267_20260718_120240.mp4` |
| `rollout_04.mp4` | `student_9cam_cal0713_semantic_model9500__ee_x0p404_y0p021_z0p265_20260718_112222.mp4` |

**Encoding** — keep them small so the page loads on a conference wifi:

```bash
ffmpeg -i raw.mov -vf "scale=960:-2" -c:v libx264 -crf 26 -preset slow \
       -pix_fmt yuv420p -movflags +faststart -an static/videos/geometry_01.mp4
```

Aim for ≤ 8 MB per short clip. GitHub Pages has a **1 GB repo / 100 MB per-file**
limit — if the long take gets big, host it on YouTube and embed instead.

The hero was cut from `static/videos/sim/env2.mp4` (32 s, 1280×720). It sits behind
the title under a dark scrim, so it is encoded harder than a clip you actually watch,
and a poster frame covers the first paint:

```bash
# desktop (6.3 MB) and the portrait crop phones get (3.6 MB)
ffmpeg -i static/videos/sim/env2.mp4 -c:v libx264 -crf 30 -preset slow \
       -pix_fmt yuv420p -movflags +faststart -an static/videos/hero.mp4
ffmpeg -i static/videos/sim/env2.mp4 -vf "crop=466:720:(iw-466)/2:0" \
       -c:v libx264 -crf 30 -preset slow -pix_fmt yuv420p -movflags +faststart -an \
       static/videos/hero-mobile.mp4
ffmpeg -ss 3 -i static/videos/hero.mp4 -frames:v 1 -q:v 4 static/images/hero-poster.jpg
```

Swapping the hero for different footage means re-cutting all three. The portrait crop
is 466×720 (0.647); if you change that ratio, update the matching `height`/`min-width`
percentages on the mobile `.hero-video` in `index.html`.

### Figures → `static/images/`

| File | Where it appears | Status |
| --- | --- | --- |
| `motivation.png` | Background, left | final — paper Fig. 1 (`figures_src/motivation.png`) |
| `Picture2.svg` | Background, right | final — real on-site rebar, showing appearance and tolerance spread |
| `framework.png` | Training framework | draft, copied from the paper (`figures_src/pipeline_preview.png`) |
| `hero-poster.jpg` | First frame of the hero, shown while the video loads | generated from `hero.mp4` |
| `teaser.png` | not on the page — only the `og:image` social preview | draft, copied from the paper |
| `pdf.svg`, `arxiv.svg`, `youtube.svg`, `github.svg` | Hero link buttons | vendored icons |
| `favicon.svg` | Browser tab | — |

Anything marked `draft` in the page is a provisional figure lifted from the LaTeX repo
(`/n/fs/rebar/isaaclab/repos/LaTeX-ICRA2027-Visual-Sim2Real-Rebar-Insertion/figures_src/`).
Overwrite the file with the final version and the `draft` tag in `index.html` can be
deleted.

### Text still to fill in (`index.html`)

- Author list + affiliations (currently `Anonymous` — see the double-blind note below)
- The four link buttons (Paper / arXiv / Video / Code) are rendered as disabled
  placeholders with a `soon` chip, in the hero navbar on desktop and under the title
  on mobile. Turn each into an `<a class="navbar-item" href="…">` / `<a class="button
  …" href="…">` and delete its `<span class="soon">soon</span>`.
- Headline numbers: `>90 %`, `1.4 mm` — check against the final paper
- Takeaways and BibTeX sections are stubs behind a `soon` chip

> **Double-blind:** ICRA 2027 review is double-blind. Keep the page anonymous (no
> author names, no lab logo, no institution-identifying repo owner) until the paper is
> accepted, or host it under a neutral account.

---

## Layout

| File | What it is |
| --- | --- |
| `index.html` | The whole page. Bulma classes for layout; one `<section>` per part. |
| `static/css/bulma.min.css` | Bulma v0.9.1, vendored. Do not edit. |
| `static/css/fonts.css` | `@font-face` for the two webfonts. Generated — do not edit. |
| `static/css/index.css` | Everything page-specific: hero, stat row, phase cards, clip grid, media slots. |
| `static/js/index.js` | The media-slot loader, and pausing off-screen clips. That is all it does. |
| `static/fonts/` | Google Sans + Noto Sans, latin/latin-ext subsets. |
| `tools/vendor_fonts.py` | Re-downloads the fonts and regenerates `fonts.css`. Needs network. |
| `tools/bundle_preview.py` | Inlines everything into one `_preview.html` for sharing. |

To change a font, edit the family list at the top of `tools/vendor_fonts.py`, re-run
it, then update the `font-family` rules in `index.css`.

## Local preview

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

(Opening `index.html` via `file://` also works — nothing is fetched over the network —
but a server matches the deployed behaviour more closely.)

For a single file you can email or publish, `python3 tools/bundle_preview.py` writes
`_preview.html` with the CSS, JS, fonts and as much media as fits in its 14 MB budget
base64'd inline. It embeds the cheap assets first and reports whatever it had to skip,
so a squeeze costs the page a video rather than its typography.

## Deploying to GitHub Pages

**Current status:** pushed to
`tsrobcvai/Web-ICRA2027-Visual-Sim2Real-Rebar-Insertion` (**private**), Pages **not**
enabled — deliberately, so nothing is reachable during double-blind review. GitHub
Pages serves to a *public* URL even from a private repo, so enabling it now would
defeat the point.

When the paper is accepted (or when an anonymous host is ready), one flip:

```bash
gh repo edit tsrobcvai/Web-ICRA2027-Visual-Sim2Real-Rebar-Insertion --visibility public --accept-visibility-change-consequences
gh api -X POST repos/tsrobcvai/Web-ICRA2027-Visual-Sim2Real-Rebar-Insertion/pages \
  -f 'source[branch]=main' -f 'source[path]=/'
```

Then the site is at `https://<owner>.github.io/<repo>/`.

For a bare `https://<name>.github.io/` URL, the repo must be named exactly
`<name>.github.io` and owned by that user/organisation.

`.nojekyll` is already present so GitHub serves the files as-is.

## Credits

Template modified from [NeRFies](https://nerfies.github.io/),
[Scaling Up Distilling Down](https://huy-ha.github.io/scalingup/) and
[UMI on Legs](https://umi-on-legs.github.io/). Bulma is MIT. The GitHub mark is from
Font Awesome Free (icons CC BY 4.0). The page is licensed
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
