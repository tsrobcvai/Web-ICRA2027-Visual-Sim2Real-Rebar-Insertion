/* ============================================================
   GRIT project page.

   Two jobs, in this order:

   1. Filmstrips -- each demo row scrolls horizontally and, when it has
      enough clips to overflow, wraps around end-to-end.
   2. Media slots -- every image/video is declared as a path and filled
      in only if the file actually exists.

   Strips are built first so that the clones they create get filled by
   the loader too.
   ============================================================ */

(function () {
  "use strict";

  var GAP = 20;          // must match the .strip gap in style.css
  var COPIES = 3;        // one visible copy, one spare on each side

  /* ---------------------------------------------------------------
     1. Filmstrips
     --------------------------------------------------------------- */
  document.querySelectorAll(".demo-row").forEach(function (row) {
    var wrap = row.querySelector(".strip-wrap");
    var strip = row.querySelector(".strip");
    var nav = row.querySelector(".row-nav");
    var arrows = row.querySelectorAll(".arrow");
    if (!strip) return;

    // One lap = the width of the original clip list, including the gap
    // that will sit between one copy and the next.
    var lap = strip.scrollWidth + GAP;
    // Looping needs a copy at least as wide as the window, otherwise the
    // spare copies cannot cover the edges. A row that already fits keeps
    // the plain end-stop behaviour.
    var loops = strip.scrollWidth > strip.clientWidth && lap >= strip.clientWidth;

    if (loops) {
      var originals = Array.prototype.slice.call(strip.children);
      for (var c = 1; c < COPIES; c++) {
        originals.forEach(function (clip) {
          var copy = clip.cloneNode(true);
          copy.setAttribute("aria-hidden", "true");
          strip.appendChild(copy);
        });
      }
      strip.style.scrollSnapType = "none";   // snapping fights the wrap
      strip.scrollLeft = lap;                // park in the middle copy
      wrap.classList.add("more");
    }

    // Pull scrollLeft back into the middle copy. Because the content is
    // periodic, shifting by exactly one lap shows the same pixels, so the
    // jump is invisible. Returns the shift it applied.
    function rewrap() {
      if (!loops) return 0;
      var d = 0;
      if (strip.scrollLeft >= 2 * lap) d = -lap;
      else if (strip.scrollLeft < lap) d = lap;
      if (d) strip.scrollLeft += d;
      return d;
    }

    function step() {
      var clip = strip.querySelector(".clip");
      return clip ? clip.offsetWidth + GAP : strip.clientWidth * 0.8;
    }

    function sync() {
      if (loops) return;                     // no ends to report
      var max = strip.scrollWidth - strip.clientWidth;
      var at = strip.scrollLeft;
      nav.classList.toggle("hidden", max < 2);
      wrap.classList.toggle("more", at < max - 2);
      arrows[0].disabled = at < 2;
      arrows[1].disabled = at > max - 2;
    }

    // Wrap-aware glide, used by the arrows. The browser's own smooth
    // scrolling would be cancelled by the wrap, so animate it here and
    // carry the wrap shift into the animation's origin.
    var anim = null;
    function glide(dist) {
      if (!loops) {
        strip.scrollBy({ left: dist, behavior: "smooth" });
        return;
      }
      cancelAnimationFrame(anim);
      var from = strip.scrollLeft, t0 = performance.now(), dur = 320;
      (function frame(t) {
        var k = Math.min(1, (t - t0) / dur);
        strip.scrollLeft = from + dist * (1 - Math.pow(1 - k, 3));
        from += rewrap();
        if (k < 1) anim = requestAnimationFrame(frame);
      })(t0);
    }

    arrows.forEach(function (b) {
      b.addEventListener("click", function () { glide(Number(b.dataset.dir) * step()); });
    });

    /* The wheel drives the strip -- but a looping strip has no end to stop
       at, which would trap the page. So the hijack lasts one lap: keep
       scrolling the same way past a full turn and the page takes over
       again. Pausing, or reversing, arms it for another lap. */
    var travelled = 0, lastDir = 0, lastAt = 0;

    strip.addEventListener("wheel", function (e) {
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d || strip.scrollWidth <= strip.clientWidth) return;

      var now = performance.now(), dir = d < 0 ? -1 : 1;
      if (now - lastAt > 400 || dir !== lastDir) travelled = 0;
      lastAt = now;
      lastDir = dir;

      if (loops) {
        if (travelled >= lap) return;        // a full turn done: let the page scroll
        travelled += Math.abs(d);
      } else {
        var max = strip.scrollWidth - strip.clientWidth;
        var at = strip.scrollLeft;
        if ((d < 0 && at < 2) || (d > 0 && at > max - 2)) return;   // at an end
      }

      e.preventDefault();
      cancelAnimationFrame(anim);
      strip.scrollLeft += d;
      rewrap();
    }, { passive: false });

    strip.addEventListener("scroll", function () { rewrap(); sync(); }, { passive: true });
    window.addEventListener("resize", sync);
    sync();
    setTimeout(sync, 400);      // clips settle after their media loads
    setTimeout(sync, 2000);
  });

  /* ---------------------------------------------------------------
     2. Media slots

       <div class="media-slot"       data-img="path/a.svg|path/b.png"  ...>
       <div class="media-slot video" data-video="static/videos/x.mp4"  ...>

     Candidates are separated by "|" -- NOT by "," which appears inside
     every base64 data: URI (that is what tools/bundle_preview.py
     substitutes in). The first candidate that loads is inserted; if none
     load, the slot shows the exact path to drop the file at.
     --------------------------------------------------------------- */
  document.querySelectorAll(".media-slot").forEach(function (slot) {
    var isVideo = slot.hasAttribute("data-video");
    var list = (slot.getAttribute(isVideo ? "data-video" : "data-img") || "")
      .split("|").map(function (s) { return s.trim(); }).filter(Boolean);

    tryNext(slot, list, 0, isVideo);
  });

  function tryNext(slot, list, i, isVideo) {
    if (i >= list.length) { renderPlaceholder(slot, list[0], isVideo); return; }
    var src = list[i];

    if (isVideo) {
      var v = document.createElement("video");
      v.src = src;
      v.muted = true;
      v.playsInline = true;
      v.loop = !slot.hasAttribute("data-once");   // long take: play once, with controls
      v.controls = true;
      v.preload = "metadata";
      v.addEventListener("loadeddata", function () { swap(slot, v); observe(v); }, { once: true });
      v.addEventListener("error", function () { tryNext(slot, list, i + 1, isVideo); }, { once: true });
    } else {
      var probe = new Image();
      probe.onload = function () {
        probe.alt = slot.getAttribute("data-label") || "";
        swap(slot, probe);
        justify(slot, probe);
      };
      probe.onerror = function () { tryNext(slot, list, i + 1, isVideo); };
      probe.src = src;
    }
  }

  /* Inside a .fig-row, give each figure a flex weight equal to its aspect
     ratio. Widths then come out proportional to the ratios, which makes every
     image in the row exactly the same height — no gap under the wider one. */
  function justify(slot, img) {
    var fig = slot.closest(".fig");
    if (!fig || !fig.parentElement.classList.contains("fig-row")) return;
    if (!img.naturalWidth || !img.naturalHeight) return;
    fig.style.setProperty("--r", img.naturalWidth / img.naturalHeight);
  }

  function swap(slot, el) {
    slot.innerHTML = "";
    slot.style.minHeight = "0";
    slot.appendChild(el);
    slot.classList.add("filled");
  }

  function renderPlaceholder(slot, path, isVideo) {
    var label = slot.getAttribute("data-label") || (isVideo ? "Video" : "Figure");
    var hint = slot.getAttribute("data-hint") || "";
    var box = document.createElement("div");
    box.className = "slot-box";
    box.innerHTML =
      '<div class="slot-icon">' + (isVideo ? "&#9654;" : "&#9633;") + "</div>" +
      '<div class="slot-title">' + label + " &middot; " +
        (slot.getAttribute("data-state") || "missing") + "</div>" +
      (path ? '<div class="slot-path">' + path + "</div>" : "") +
      (hint ? '<div class="slot-hint">' + hint + "</div>" : "");
    slot.innerHTML = "";
    slot.appendChild(box);
  }

  /* Only let a clip run while it is on screen -- keeps a page full of
     videos from pinning the CPU. A clip scrolled out of its strip counts
     as off screen too, since the strip clips it. Long takes are left to
     the viewer. */
  function observe(v) {
    if (!v.loop || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { v.play().catch(function () {}); }
        else { v.pause(); }
      });
    }, { threshold: 0.55 }).observe(v);
  }
})();
