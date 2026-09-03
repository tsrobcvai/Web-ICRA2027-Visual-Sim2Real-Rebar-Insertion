/* ============================================================
   RebarSim project page.

   One job: media slots. Every image and video is declared as a path and
   filled in only if the file actually exists, so adding content to the
   page is a file copy rather than an HTML edit.

       <div class="media-slot"       data-img="path/a.svg|path/b.png" ...>
       <div class="media-slot video" data-video="static/videos/x.mp4"  ...>

   Candidates are separated by "|" -- NOT by "," which appears inside every
   base64 data: URI (that is what tools/bundle_preview.py substitutes in).
   The first candidate that loads is inserted; if none load, the slot shows
   the exact path to drop the file at.

   Layout is Bulma's -- the clips sit in a plain column grid, so there is no
   carousel or scroll handling here.
   ============================================================ */

(function () {
  "use strict";

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
      v.controls = slot.hasAttribute("data-once");
      v.preload = "metadata";
      v.addEventListener("loadeddata", function () { swap(slot, v); observe(v); }, { once: true });
      v.addEventListener("error", function () { tryNext(slot, list, i + 1, isVideo); }, { once: true });
    } else {
      var probe = new Image();
      probe.onload = function () {
        probe.alt = slot.getAttribute("data-label") || "";
        swap(slot, probe);
      };
      probe.onerror = function () { tryNext(slot, list, i + 1, isVideo); };
      probe.src = src;
    }
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
      '<div class="slot-title">' + label + " &middot; missing</div>" +
      (path ? '<div class="slot-path">' + path + "</div>" : "") +
      (hint ? '<div class="slot-hint">' + hint + "</div>" : "");
    slot.innerHTML = "";
    slot.appendChild(box);
  }

  /* Only let a clip run while it is on screen -- keeps a page full of videos
     from pinning the CPU. Long takes are left to the viewer. */
  function observe(v) {
    if (!v.loop || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { v.play().catch(function () {}); }
        else { v.pause(); }
      });
    }, { threshold: 0.35 }).observe(v);
  }
})();
