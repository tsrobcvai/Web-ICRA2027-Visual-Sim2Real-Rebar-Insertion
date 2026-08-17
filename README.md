# GRIT — project page

Static project website for **"Visual Sim-to-Real Learning for Robotic Insertion under
Geometric Variations: Application to Rebar Installation"** (ICRA 2027 submission).

Plain HTML/CSS/JS. No build step, no CDN, no dependencies — open `index.html` in a
browser and it works.

---

## How to fill in the missing content

Every image and video on the page is a **media slot**. A slot points at one or more
file paths; the first path that loads is shown, and if none load the page renders a
highlighted amber box saying which file is missing. **So adding content = copying a
file to the right path.** No HTML editing needed.

### Videos → `static/videos/`

| File | Where it appears |
| --- | --- |
| `sim_01.mp4` … `sim_04.mp4` | **In Simulation** section — waiting for upload |
| `rollout_01.mp4` … `rollout_04.mp4` | Row 1 — rollouts across initial states and bars ✅ **in place** |
| `long_run.mp4` | Row 2 — one long uncut grasp→insert take |
| `failure_01.mp4`, `failure_02.mp4` | Row 3 — failure cases |

The four rollouts came from `static/videos/` under their original names (all
1280×720, 10 fps, 1.6–6.9 s). The number is the display order in the row, so to
reorder the strip, rename the files — the HTML never changes:

| now | was |
| --- | --- |
| `rollout_01.mp4` | `student_9cam_cal0713_semantic_model9500__ee_x0p372_y0p017_z0p277_20260722_124237.mp4` |
| `rollout_02.mp4` | `student_8cam-mdepth-slotseg_model3000__ee_x0p407_y0p044_z0p262_20260725_140540.mp4` |
| `rollout_03.mp4` | `student_9cam_cal0713_semantic_model9500__ee_x0p404_y0p021_z0p265_20260718_112222.mp4` |
| `rollout_04.mp4` | `student_9cam_cal0713_semantic_model9500__ee_x0p408_y0p046_z0p267_20260718_120240.mp4` |

Each row is a horizontal filmstrip: the wheel (or the arrow buttons, or a swipe)
moves through that row's clips. A row whose clips are wider than the window **wraps
around end-to-end** — the strip is cloned three times and `scrollLeft` is shifted by
exactly one lap at the seam, so the wrap is invisible. To keep an endless strip from
trapping the page, the wheel hijack lasts **one lap**; keep scrolling the same way past
a full turn and the page scrolls again (pausing or reversing arms another lap).

A row that already fits on screen does not scroll or loop, and hides its arrows — with
the 440 px clip width that means roughly **three or more clips before a row starts
looping**. Adding a clip is just another `<figure class="clip">`; the cloning, arrows
and edge fade pick it up on their own.

Short clips autoplay muted on loop and pause when scrolled out of view;
`long_run.mp4` carries `data-once` so it plays through with controls instead.
Clips are boxed at 16:9 and letterboxed on black, so mixed aspect ratios still line up.

**Encoding** — keep them small so the page loads on a conference wifi:

```bash
ffmpeg -i raw.mov -vf "scale=960:-2" -c:v libx264 -crf 26 -preset slow \
       -pix_fmt yuv420p -movflags +faststart -an static/videos/geometry_01.mp4
```

Aim for ≤ 8 MB per short clip. GitHub Pages has a **1 GB repo / 100 MB per-file**
limit — if `long_run.mp4` gets big, host it on YouTube and embed instead.

### Figures → `static/images/`

| File | Where it appears | Status |
| --- | --- | --- |
| `motivation.png` | Background, left | final — paper Fig. 1 (`figures_src/motivation.png`) |
| `Picture2.svg` | Background, right | final — real on-site rebar, showing appearance and tolerance spread |
| `framework.png` | Training framework | draft, copied from the paper (`figures_src/pipeline_preview.png`) |
| `teaser.png` | not on the page — only the `og:image` social preview | draft, copied from the paper |

Anything marked `draft` in the page is a provisional figure lifted from the LaTeX repo
(`/n/fs/rebar/isaaclab/repos/LaTeX-ICRA2027-Visual-Sim2Real-Rebar-Insertion/figures_src/`).
Overwrite the file with the final version and the `draft` tag in `index.html` can be
deleted.

### Text still marked TBD in `index.html`

- Author list + affiliations (currently `Anonymous` — see the double-blind note below)
- The four link buttons (Paper / arXiv / Video / Code) are rendered disabled; replace
  `class="btn btn-disabled"` with `class="btn"` and set the real `href`
- Headline numbers: `>95 %`, `9 designs`, `1.3 mm` — check against the final paper
- BibTeX entry

> **Double-blind:** ICRA 2027 review is double-blind. Keep the page anonymous (no
> author names, no lab logo, no institution-identifying repo owner) until the paper is
> accepted, or host it under a neutral account.

---

## Local preview

```bash
cd /n/fs/rebar/isaaclab/repos/rebar-insertion-project-page
python3 -m http.server 8000     # then open http://localhost:8000
```

(Opening `index.html` via `file://` also works, but a server matches the deployed
behaviour more closely.)

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

For a bare `https://<name>.github.io/` URL (like the reference site
`rebarbot.github.io`), the repo must be named exactly `<name>.github.io` and owned by
that user/organisation.

`.nojekyll` is already present so GitHub serves the files as-is.
