# Deploying the project page

> [!IMPORTANT]
> **The live page is <https://rebarsim.github.io/>.** Publishing means pushing a new
> commit to **`rebarsim/rebarsim.github.io`**, not to this repo.
>
> - **Pushing this repo publishes nothing.** This is the source; its `main` is not a deploy.
> - **Do not enable GitHub Pages on this repo.**
>   `https://tsrobcvai.github.io/Web-ICRA2027-Visual-Sim2Real-Rebar-Insertion/` is not
>   the page, and must stay a 404.
> - **Never push this repo's history to the site repo.**

## Why two repos

| | repo | holds |
| --- | --- | --- |
| **source** | `tsrobcvai/Web-ICRA2027-Visual-Sim2Real-Rebar-Insertion` (this one) | the page, plus `tools/`, the READMEs and the full history |
| **site** | `rebarsim/rebarsim.github.io` | the page files only, served at <https://rebarsim.github.io/> |

ICRA 2027 review is double-blind. The site is a GitHub user site under a neutral
account, so its URL names nobody, and every commit on it is authored and committed as
`Anonymous <anonymous@users.noreply.github.com>`. This repo is the opposite: its URL
carries the `tsrobcvai` org, its commits carry real names and emails, and its README
names local paths and the sibling LaTeX repo. Serving the page from here would put all
of that one click away from a reviewer. The page already assumes the split: `og:url`
and `og:image` in `index.html` point at rebarsim.github.io.

## How to deploy

Commit the change here first. A deploy then copies this repo's **committed** tree into a
clone of the site repo, minus the dev-only files, as one anonymous commit:

```bash
# once: clone the site repo next to this one
git clone git@github.com:rebarsim/rebarsim.github.io.git ../rebarsim.github.io

# every deploy, from the root of this repo
git -C ../rebarsim.github.io pull --ff-only
out=$(mktemp -d)
git archive HEAD | tar -x -C "$out"             # committed files only, no stray drafts
rsync -a --delete \
      --exclude /.git --exclude /README.md --exclude /DEPLOY.md \
      --exclude /.gitignore --exclude /tools/ --exclude /static/models/README.md \
      --exclude /static/videos/sim/env2.mp4 --exclude /static/videos/sim/env3.mp4 \
      --exclude /static/videos/sim/env9.mp4 \
      "$out"/ ../rebarsim.github.io/
cd ../rebarsim.github.io
git add -A && git status --short                 # read this before committing
git -c user.name=Anonymous -c user.email=anonymous@users.noreply.github.com \
    commit -m "Update project page"
git push origin main
```

What stays behind, and why:

| left out | why |
| --- | --- |
| `README.md` | the site keeps its own short anonymous README; this one names paths and repos |
| `DEPLOY.md`, `tools/`, `.gitignore`, `static/models/README.md` | dev-only |
| `static/videos/sim/env2.mp4`, `env3.mp4`, `env9.mp4` | raw footage the hero was cut from; nothing on the page loads them |

`rsync --delete` leaves the excluded paths alone on the site side, so the site's own
README survives, and anything removed here (an old clip, say) is removed there too.

## Checks

- **Before committing:** `git status --short` in the site clone should list page files
  only: `index.html`, `static/…`. A `README.md`, `tools/` or `DEPLOY.md` in that list
  means the exclusions went wrong.
- **After committing:** `git log -1 --format='%an <%ae> / %cn <%ce>'` must read
  `Anonymous <anonymous@users.noreply.github.com>` on both sides. If a real name shows
  up, do not push; run `git reset --soft HEAD~1` and commit again.
- **After pushing:** GitHub rebuilds in a minute or two, and its CDN keeps serving the
  old copy for up to ten minutes, so check <https://rebarsim.github.io/?v=1> (any fresh
  query string) rather than trusting a normal reload.
