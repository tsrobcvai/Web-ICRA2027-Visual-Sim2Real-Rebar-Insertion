/* ============================================================
   Media slots.

   Every image/video on the page is declared as

     <div class="media-slot"       data-img="path/a.svg,path/b.png"  ...>
     <div class="media-slot video" data-video="static/videos/x.mp4"  ...>

   This script tries each candidate path in order. The first one that
   actually loads is inserted; if none load, the slot renders a
   highlighted "still missing" box showing the exact path to drop the
   file at. So adding footage = copying a file with the right name.
   ============================================================ */

(function () {
  "use strict";

  var slots = document.querySelectorAll(".media-slot");

  slots.forEach(function (slot) {
    var isVideo = slot.hasAttribute("data-video");
    var list = (slot.getAttribute(isVideo ? "data-video" : "data-img") || "")
      .split(",").map(function (s) { return s.trim(); }).filter(Boolean);

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
      v.loop = !slot.classList.contains("portrait");   // long take: play once, with controls
      v.controls = true;
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

  /* Only let a clip run while it is on screen — keeps a page full of
     videos from pinning the CPU. Long takes are left to the user. */
  function observe(v) {
    if (!v.loop || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { v.play().catch(function () {}); }
        else { v.pause(); }
      });
    }, { threshold: 0.25 }).observe(v);
  }
})();
