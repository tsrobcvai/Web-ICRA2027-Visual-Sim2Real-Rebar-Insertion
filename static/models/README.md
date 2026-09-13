# Rebar models

Six `.glb` files, one per bar used in the real-world evaluations:

    rebar_01.glb  rebar_02.glb  rebar_03.glb
    rebar_04.glb  rebar_05.glb  rebar_06.glb

Drop a file in and it appears in the **Real-World Evaluation → Example bars from real-world tests** grid;
until then that
slot shows a "missing" box naming the path it wants. Nothing in `index.html` needs
editing, and the display order is the file number.

- **Format** — binary glTF (`.glb`), with the geometry and any texture embedded in
  the one file. `.gltf` + loose buffers is not wired up.
- **Up axis** — glTF is **Y-up**. Exporters handle this; a bar that arrives lying on
  its side was almost certainly exported Z-up.
- **Scale and origin** don't matter. The viewer measures the bounding box, centres
  the bar and backs the camera off to frame it, so bars of different length all
  arrive looking the same size.
- **Size** — decimate first. Raw photogrammetry output is often 50–200 MB, which is
  both unusable on a conference wifi and over GitHub's **100 MB per-file** limit.
  Aim for **≤ 2 MB per bar**: a few tens of thousands of triangles and a 1–2 k
  texture is far more than this grid can show at ~300 px.
- **Material** — a baked colour texture looks best. A bare metallic material still
  renders (the viewer builds a small gradient environment for it to reflect) but
  reads flatter.

The viewer is `static/js/models.js` on vendored three.js r147; see the **Rebar
models** section of the top-level README for how it is wired.
