# RebarSim — project page

Static project website for **"Visual Sim-to-Real Learning for Robotic Insertion under
Geometric Variations: Application to Rebar Installation"** (ICRA 2027 submission).

Built on the NeRFies / [UMI on Legs](https://umi-on-legs.github.io/) project-page
template: [Bulma](https://bulma.io) does the layout and typography, and
`static/css/index.css` holds the page-specific bits on top of it.

No build step and no CDN — Bulma, the webfonts, every icon and three.js are vendored
into `static/`, so the page works offline. Open `index.html` and it works, with one
exception: the six rebar models need XHR to load a `.glb`, which browsers refuse over
`file://`, so those six slots stay placeholders unless the page is served over http.
Everything else is unaffected.

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
| `sim/showcase.mp4` | **In Simulation** — full-width showcase under the section heading — ✅ **in place** |
| `sim/env2_ep1.mp4`, `sim/env9_ep1.mp4`, `sim/env2_ep3.mp4`, `sim/env2_ep2.mp4` | **In Simulation** grid — ✅ **in place** |
| `real/rebar1/*.mp4`, `real/rebar2/*.mp4` | **Real-World Evaluation** grid, at the foot of the page — ✅ **in place** |
| `long_demo.mp4` | **Demos → Uncut long demo** tab — ✅ **in place** |
| `robust_background.mp4` | **Demos → Cluttered scene** tab — ✅ **in place** |
| `robust_perturbation.mp4` | **Demos → Perturbation** tab — ✅ **in place** |
| `highlights.mp4` | **Demos → Highlights** tab — ⬜ **missing**, shows a `soon` chip |

The clips sit in a plain Bulma column grid (`columns is-multiline`, two per row on
desktop, three in the real-world grid, one per row on mobile). Adding a clip is another
`<div class="column is-half"><figure class="clip">…</figure></div>` (`is-one-third` in
the real-world grid) — there is no carousel or scroll handling to keep in sync. The
grid clips carry no captions.

Clips are boxed at 16:9 and letterboxed on black, so mixed aspect ratios still line
up. They autoplay muted on loop and pause when scrolled out of view. Two attributes
change that: `data-once` plays through once instead of looping — `long_demo.mp4` uses
it, so a 5½-minute take does not loop at a reader — and `data-controls` keeps the loop
but shows the progress bar anyway. Both put controls on the clip, which is what makes
the four clips in the demo tabs look like one set rather than two.

The long take and the two robustness clips are 1604×720 (2.23:1) rather than 16:9,
because each carries a side panel of the policy's camera inputs. They sit in a
full-width `column` under `figure class="clip ultrawide"`, which boxes them at their
own ratio (`.clip.ultrawide` in `static/css/index.css`) instead of letterboxing them
inside a 16:9 half-column, where the burnt-in labels would be unreadable.

The six real-world rollouts sit in a 2 × 3 grid, one row per folder:
`static/videos/real/rebar1/` on top, `rebar2/` under it (all 1280×720, 10 fps,
2.0–5.0 s). They are used as recorded, under their original names — already H.264
with the index at the front — so reordering them means moving their `column` blocks
in `index.html`. They replaced four earlier clips, `rollout_01.mp4` … `rollout_04.mp4`,
which are gone from the tree but still in git history.

The long take and the two robustness clips came from
`isaaclab_rollout/exports/long_demo/` (all 1604×720, 15 fps), re-encoded on the way in:

| now | was | length |
| --- | --- | --- |
| `long_demo.mp4` | `5m41 Uncut Demo.mp4` | 5 m 41 s — 49 attempts, 45 / 4 |
| `robust_background.mp4` | `background_changes.mp4` | 1 m 41 s |
| `robust_perturbation.mp4` | `perturbation.mp4` | 1 m 10 s |

`5m41 Uncut Demo.mp4` is 111 MB at source, over GitHub's 100 MB per-file limit, so all
three have to be re-encoded. **Keep the native 1604×720 and spend the budget on
bitrate** — a first pass scaled them to 1280 wide at CRF 28, which came to 34 MB for
the three and was visibly soft: the bar's ribbing smeared, the rack clips mushy, the
extrusion texture gone. Two things caused that, and the downscale was the larger one.
Each clip is shown 960 px wide, so on a HiDPI screen a 1280-wide file is *upscaled*
1.5×, and 1604 is already below what such a screen wants.

```bash
ffmpeg -i "5m41 Uncut Demo.mp4" -c:v libx264 -crf 23 -preset slow \
       -pix_fmt yuv420p -movflags +faststart -an static/videos/long_demo.mp4
```

| clip | source | CRF | shipped |
| --- | --- | --- | --- |
| `long_demo.mp4` | 111 MB | 23 | 57 MB (1.40 Mbps) |
| `robust_background.mp4` | 51 MB | 22 | 33 MB (2.72 Mbps) |
| `robust_perturbation.mp4` | 24 MB | 22 | 15 MB (1.73 Mbps) |

The long take gets CRF 23 rather than 22 only to stay clear of the 100 MB limit; at
this bitrate the burnt-in counter is indistinguishable from source. Going to CRF 20
costs about 50 % more for a difference that needs an A/B at 1:1 pixels to see.

105 MB of video looks reckless for a project page, and would be, except that **all
three sit behind a tab and none of them autoplays** — `data-defer` means a clip is not
fetched until its tab is opened, and `data-once`/`data-controls` mean it waits to be
played. A reader who scrolls past the section downloads none of it, and one who opens a
tab downloads one clip. That is what makes the quality close to free here, and it is
also why the short clips elsewhere on the page, which *do* autoplay, are still held to
a few megabytes.

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

The **In Simulation** showcase is set up like the "Task Tracking without Simulating
Tasks" video on [UMI on Legs](https://umi-on-legs.github.io/): the heading sits on a
black band and the clip runs the full width of the window straight under it, outside
any container, muted and looping with no controls (`.sim-showcase` in
`static/css/index.css`). The four grid clips follow in a section of their own.

It is `showcase_video/v4_18s_400env_p2_AW_fresh/showcase.mp4` (1920×1080, 30 fps, 18 s,
CRF 16), copied in without re-encoding. It was only remuxed: the render wrote the index
at the end of the file, so a browser would have had to fetch the tail before playing.

```bash
ffmpeg -i showcase.mp4 -c copy -movflags +faststart static/videos/sim/showcase.mp4
```

The same render also exists at CRF 24 (`showcase_1080p_small.mp4`, 14 MB), and was
passed over. Shown edge to edge, its pull-back across the 400 environments smears —
table textures and the rack's slot beads go soft — and at its worst frame it falls to
32 dB luma PSNR against the rendered PNGs, where CRF 16 keeps 39 dB. The price is
weight: at 38 MB this is the heaviest clip on the page that autoplays, and while the
first 8 s run at about 7 Mbps, the 4 s pull-back averages about 38 Mbps, so a slow
connection will stall there on the first loop.

### Demo tabs

The **Demos** section is a tab group, after the Real-World Evaluations block on the
[OmniReset page](https://weirdlabuw.github.io/omnireset/): a row of pills over one
visible panel, one short line of plain words per panel. Adding a tab is a button plus
a sibling panel — the JS pairs them by name, there is no list to keep in sync:

```html
<div class="eval-tabs">
  <button class="eval-tab" data-tab="myclip">My clip</button>
</div>
<div class="tab-panel" data-panel="myclip">
  <p class="tab-line">One line of plain words.</p>
  <figure class="clip ultrawide">
    <div class="media-slot video" data-video="static/videos/x.mp4" data-defer></div>
  </figure>
</div>
```

`is-active` on one button and one panel is the open tab. A slot marked **`data-defer`
is not fetched until its tab is opened for the first time** — with three long takes in
the group, a reader who watches one downloads one. The open-by-default tab must *not*
carry `data-defer`, or it will sit empty until clicked.

To promote the Highlights tab once `highlights.mp4` exists: delete its
`<span class="soon">soon</span>`, and move its button and panel to the front of the
group, taking `is-active` off `uncut` and putting it on `highlights`.

### Rebar models → `static/models/`

Six `.glb` files, `rebar_01.glb` … `rebar_06.glb`, shown as drag-to-rotate viewers at
the head of **Real-World Evaluation → Example bars from real-world tests**. Same contract as a media slot: drop the file in and it
appears, and until then the slot names the path it wants. The file-level details —
Y-up, ≤ 2 MB per bar, why decimating matters — are in `static/models/README.md`.

The viewer is `static/js/models.js` on three.js **r147**, vendored under
`static/js/vendor/` as the *classic* (non-module) builds so there is still no CDN, no
import map and no build step. r147 is the last release that ships `examples/js`, which
is where `GLTFLoader` and `OrbitControls` come from; upgrading means switching the page
to ES modules, which in turn gives up `file://`.

Each viewer builds its WebGL context the first time it scrolls into view, and the
render loop only ticks the viewers currently on screen — six live canvases would
otherwise spin a laptop fan for a section most readers scroll past.

### Figures → `static/images/`

| File | Where it appears | Status |
| --- | --- | --- |
| `motivation.png` | Background, left | final — paper Fig. 1 (`figures_src/motivation.png`) |
| `Picture2.svg` | Background, right | final — real on-site rebar, showing appearance and tolerance spread |
| `framework.png` | Training framework | draft, copied from the paper (`figures_src/framework.png`), downscaled to 2000 px wide |
| `hero-poster.jpg` | First frame of the hero, shown while the video loads | generated from `hero.mp4` |
| `teaser.png` | not on the page — only the `og:image` social preview | draft, copied from the paper |
| `pdf.svg`, `arxiv.svg`, `youtube.svg`, `github.svg` | Hero link buttons | vendored icons |
| `favicon.svg` | Browser tab | — |

Anything marked `draft` in the page is a provisional figure lifted from the LaTeX repo
(`../LaTeX-ICRA2027-Visual-Sim2Real-Rebar-Insertion/figures_src/`). Overwrite the file
with the final version and the `draft` tag in `index.html` can be deleted.

The paper's figures are typeset for a two-column page, so they arrive much larger than
this page can show — `framework.png` is 3886 px wide at source against a 960 px
container. Downscale to **2000 px wide** on the way in: sharp on a retina screen,
roughly a quarter of the file size, and a reader who wants the detail can still open
the image itself.

```bash
ffmpeg -i ../LaTeX-.../figures_src/framework.png -vf "scale=2000:-1:flags=lanczos" \
       static/images/framework.png
```

### Text still to fill in (`index.html`)

- Author list + affiliations (currently `Anonymous` — see the double-blind note below)
- The four link buttons (Paper / arXiv / Video / Code) are rendered as disabled
  placeholders with a `soon` chip, in the hero navbar on desktop and under the title
  on mobile. Turn each into an `<a class="navbar-item" href="…">` / `<a class="button
  …" href="…">` and delete its `<span class="soon">soon</span>`.
- Headline numbers: `>90 %`, `1.4 mm` — check against the final paper. The `>90 %`
  is what `long_demo.mp4` shows on screen: 45 successes in 49 consecutive attempts
  (91.8 %), so the two should be kept consistent.
- There is no Takeaways or BibTeX section any more; both were `soon` stubs and were
  removed. A citation block will need adding back once the paper is out.
- `static/videos/highlights.mp4` — the **Demos → Highlights** tab, still a `soon` chip
- `static/models/rebar_01.glb` … `rebar_06.glb` — the six reconstructed bars

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
| `static/js/index.js` | The media-slot loader, the tab groups, and pausing off-screen clips. |
| `static/js/models.js` | The six rebar model viewers: lazy WebGL, camera framing, missing-file box. |
| `static/js/vendor/` | three.js r147 + `GLTFLoader` + `OrbitControls`, classic builds. Do not edit. |
| `static/models/` | `rebar_01.glb` … `rebar_06.glb`, plus a README with the file contract. |
| `static/fonts/` | Google Sans + Noto Sans, latin/latin-ext subsets. |
| `tools/vendor_fonts.py` | Re-downloads the fonts and regenerates `fonts.css`. Needs network. |
| `tools/bundle_preview.py` | Inlines everything into one `_preview.html` for sharing. |

To change a font, edit the family list at the top of `tools/vendor_fonts.py`, re-run
it, then update the `font-family` rules in `index.css`.

## Local preview

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

(Opening `index.html` via `file://` mostly works — nothing is fetched over the network
— but the six rebar models stay placeholders there, because loading a `.glb` needs an
XHR that browsers refuse for `file://` origins. Use the server to see them.)

For a single file you can email or publish, `python3 tools/bundle_preview.py` writes
`_preview.html` with the CSS, JS, fonts and as much media as fits in its 14 MB budget
base64'd inline. It embeds the cheap assets first and reports whatever it had to skip,
so a squeeze costs the page a video rather than its typography.

## Publishing

This repo is **public**, and GitHub Pages serves it directly from `main`:

<https://tsrobcvai.github.io/Web-ICRA2027-Visual-Sim2Real-Rebar-Insertion/>

So **pushing to `main` publishes**. There is no separate build or deploy step —
GitHub rebuilds within a minute or so of the push, and `.nojekyll` is present so the
files are served as-is.

```bash
git push origin main        # this is the deploy
```

### What that means while the paper is under review

ICRA 2027 review is double-blind, and the page itself is written for that — the
authors are `Anonymous`, affiliations are withheld. The repository around it is not
anonymous, and cannot be made so while it is the thing being served:

- the URL carries the `tsrobcvai` org name;
- every commit is authored under a real name and institutional email;
- this README names local paths and the sibling LaTeX repo.

That is a deliberate choice, not an oversight. Keep it in mind before adding anything
to the page that a reviewer is not supposed to see, and keep the on-page anonymity
(author list, affiliations, acknowledgements) intact.

An earlier version of this file described a two-repo split — a private source repo
here and an anonymous public `rebarsim/rebarsim.github.io` user site — and warned
against publishing from this one. That is no longer how the page is served; it is
served from here. `rebarsim.github.io` still exists and still holds an older copy of
the page, so if it is not wanted it should be taken down rather than left to drift
out of date.

## Credits

Template modified from [NeRFies](https://nerfies.github.io/),
[Scaling Up Distilling Down](https://huy-ha.github.io/scalingup/) and
[UMI on Legs](https://umi-on-legs.github.io/). Bulma is MIT. The GitHub mark is from
Font Awesome Free (icons CC BY 4.0). The page is licensed
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
