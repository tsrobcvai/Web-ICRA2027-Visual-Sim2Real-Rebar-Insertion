# Rebar models

Six `.glb` files, one per bar used in the real-world evaluations:

    rebar_01.glb  rebar_02.glb  rebar_03.glb
    rebar_04.glb  rebar_05.glb  rebar_06.glb

Drop a file in and it appears in the **Real-World Evaluation → Example bars from real-world tests** grid;
until then that
slot shows a "missing" box naming the path it wants. Nothing in `index.html` needs
editing, and the display order is the file number.

- **Format** — binary glTF (`.glb`), with the geometry and any texture embedded in
  the one file. `.gltf` + loose buffers is not wired up. The six bars here are
  meshopt-compressed (`EXT_meshopt_compression` + `KHR_mesh_quantization`), which
  `static/js/vendor/meshopt_decoder.js` decodes; a plain uncompressed `.glb` loads too.
- **Up axis** — glTF is **Y-up**. Exporters handle this; a bar that arrives lying on
  its side was almost certainly exported Z-up.
- **Scale and origin** don't matter. The viewer measures the bounding box, centres
  the bar and backs the camera off to frame it, so bars of different length all
  arrive looking the same size.
- **Size** — simplify and compress. Straight out of Blender a bar is 6–7.5 MB and
  260–310 k triangles, which is slow on a conference wifi and heavy to render six at
  a time. Shipped, they are 109–141 KB and 26–34 k triangles each, 722 KB for all six.
- **Material** — a baked colour texture looks best. A bare metallic material still
  renders (the viewer builds a small gradient environment for it to reflect) but
  reads flatter. These six carry a bare one: dark steel, metallic 0.72, roughness
  0.48. The Blender material's procedural noise bump has no glTF equivalent and is
  dropped on export.

## How these six were made

They come from `rebars_1_to_6.blend` at the repo root, which is kept out of git
(60 MB; `*.blend` is in `.gitignore`). Each bar, `rebar1` … `rebar6`, is exported on
its own with Blender's glTF exporter, then simplified, quantized and compressed with
[gltfpack](https://github.com/zeux/meshoptimizer/tree/master/gltf) 1.2:

```python
# in Blender (bpy), for each N: select only rebarN, then
bpy.ops.export_scene.gltf(filepath=f"rebar_0{N}.glb", export_format="GLB",
                          use_selection=True, export_yup=True, export_materials="EXPORT")
```

```bash
gltfpack -i rebar_0N.glb -o static/models/rebar_0N.glb -si 0.1 -se 0.0005 -cc -ce ext
```

`-si 0.1` asks for a tenth of the triangles, and `-se 0.0005` caps the deviation at
0.05 % of the bar's size — about 0.2 mm, around a pixel even at the viewer's closest
zoom — so the rolled ribs survive; where the cap binds, the simplifier stops short of
the tenth. Going to `-si 0.05 -se 0.002` halves the file again (66 KB for bar 1) but
allows about 0.7 mm, several pixels at full zoom. `-cc` is meshopt compression, and
`-ce ext` picks the `EXT_` spelling of that extension, the only one three.js r147's
GLTFLoader knows.

The viewer is `static/js/models.js` on vendored three.js r147; see the **Rebar
models** section of the top-level README for how it is wired.
