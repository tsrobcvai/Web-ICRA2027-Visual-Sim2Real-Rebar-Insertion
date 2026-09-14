/* ============================================================
   Rebar model viewers.

   Same contract as the media slots in index.js -- a slot names a file and fills
   itself in only if that file loads, so adding a bar is a file copy:

       <div class="model-slot" data-model="static/models/rebar_01.glb"
            data-label="Bar 1"></div>

   A slot builds its WebGL context the first time it scrolls into view, and the
   render loop only ticks the viewers that are actually on screen -- six live
   canvases at once would otherwise pin a laptop fan for a section most readers
   scroll straight past.

   If the .glb does not load the slot shows the same "missing" box the media
   slots use, naming the path to drop the file at. That is also what happens
   over file://, where browsers refuse the XHR a loader needs; the deployed page
   is served over https, so it only affects opening index.html locally.

   Needs static/js/vendor/{three.min,GLTFLoader,OrbitControls,meshopt_decoder}.js
   ahead of it. The first three are three.js r147 classic builds, which attach to
   the THREE global -- no module loader, no CDN, no build step. The bars ship
   meshopt-compressed (EXT_meshopt_compression); meshopt_decoder.js is the decoder
   GLTFLoader needs for that, and attaches to the MeshoptDecoder global.
   ============================================================ */

(function () {
  "use strict";

  var slots = document.querySelectorAll(".model-slot[data-model]");
  if (!slots.length) return;

  if (typeof THREE === "undefined" || !THREE.GLTFLoader || !THREE.OrbitControls) {
    slots.forEach(function (slot) { placeholder(slot, "three.js failed to load"); });
    return;
  }

  var live = [];          // viewers currently on screen
  var ticking = false;

  slots.forEach(function (slot) {
    if (!("IntersectionObserver" in window)) { build(slot); return; }
    var io = new IntersectionObserver(function (entries, obs) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        obs.disconnect();
        build(slot);
      }
    }, { rootMargin: "200px" });
    io.observe(slot);
  });

  /* ------------------------------ one viewer ------------------------------ */

  function build(slot) {
    var url = slot.getAttribute("data-model");

    var loader = new THREE.GLTFLoader();
    if (typeof MeshoptDecoder !== "undefined") { loader.setMeshoptDecoder(MeshoptDecoder); }
    loader.load(
      url,
      function (gltf) { mount(slot, gltf.scene); },
      null,
      function () { placeholder(slot); }
    );
  }

  function mount(slot, model) {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    scene.environment = studio(renderer);   // so a metallic material has something to reflect
    scene.add(new THREE.HemisphereLight(0xffffff, 0x5a5f66, 0.85));

    var key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(1, 1.6, 1.2);
    scene.add(key);

    var rim = new THREE.DirectionalLight(0xffffff, 0.45);
    rim.position.set(-1.2, 0.4, -1);
    scene.add(rim);

    /* Centre the bar on the origin and back the camera off far enough to hold its
       bounding sphere, so bars of different length all arrive framed. */
    var box = new THREE.Box3().setFromObject(model);
    var size = box.getSize(new THREE.Vector3());
    model.position.sub(box.getCenter(new THREE.Vector3()));
    scene.add(model);

    var camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
    var radius = Math.max(size.length() / 2, 1e-3);
    var dist = radius / Math.sin((camera.fov * Math.PI / 180) / 2) * 1.12;
    camera.position.set(dist * 0.5, dist * 0.3, dist * 0.8);
    camera.near = dist / 100;
    camera.far = dist * 100;
    camera.updateProjectionMatrix();

    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.autoRotate = !reducedMotion(); // OrbitControls suspends this while dragging
    controls.autoRotateSpeed = 1.1;
    controls.minDistance = dist * 0.35;
    controls.maxDistance = dist * 3;
    controls.update();

    slot.innerHTML = "";
    slot.classList.add("filled");
    slot.appendChild(renderer.domElement);

    var viewer = { renderer: renderer, scene: scene, camera: camera, controls: controls };
    resize();

    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(resize).observe(slot);
    } else {
      window.addEventListener("resize", resize);
    }

    /* Tick only while on screen. */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { setLive(viewer, e.isIntersecting); });
      }, { threshold: 0.05 }).observe(slot);
    } else {
      setLive(viewer, true);
    }

    function resize() {
      var w = slot.clientWidth, h = slot.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);       // so a paused viewer is not blank after a resize
    }
  }

  /* ------------------------------ shared bits ------------------------------ */

  function setLive(viewer, on) {
    var i = live.indexOf(viewer);
    if (on && i < 0) { live.push(viewer); start(); }
    if (!on && i >= 0) { live.splice(i, 1); }
  }

  function start() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(tick);
  }

  function tick() {
    if (!live.length) { ticking = false; return; }   // nothing on screen: stop burning frames
    live.forEach(function (v) {
      v.controls.update();
      v.renderer.render(v.scene, v.camera);
    });
    requestAnimationFrame(tick);
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* A two-stop vertical gradient standing in for a softbox. Cheap, and without it
     any material exported with metalness near 1 renders as a black silhouette. */
  function studio(renderer) {
    var c = document.createElement("canvas");
    c.width = 8; c.height = 256;
    var g = c.getContext("2d").createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.55, "#c9ccd1");
    g.addColorStop(1, "#6f7378");
    var ctx = c.getContext("2d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 256);

    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;

    var pmrem = new THREE.PMREMGenerator(renderer);
    var env = pmrem.fromEquirectangular(tex).texture;
    pmrem.dispose();
    tex.dispose();
    return env;
  }

  /* Same markup and classes the media slots use, so a missing bar looks like any
     other missing file rather than a broken widget. */
  function placeholder(slot, note) {
    var label = slot.getAttribute("data-label") || "Model";
    var path = slot.getAttribute("data-model") || "";
    var hint = note || slot.getAttribute("data-hint") || "";
    var box = document.createElement("div");
    box.className = "slot-box";
    box.innerHTML =
      '<div class="slot-icon">&#9673;</div>' +
      '<div class="slot-title">' + label + " &middot; missing</div>" +
      (path ? '<div class="slot-path">' + path + "</div>" : "") +
      (hint ? '<div class="slot-hint">' + hint + "</div>" : "");
    slot.innerHTML = "";
    slot.appendChild(box);
  }
})();
