/* ============================================================
   Media slots.

   Every image/video on the page is declared as

     <div class="media-slot"       data-img="path/a.svg|path/b.png"  ...>
     <div class="media-slot video" data-video="static/videos/x.mp4"  ...>

   Candidates are separated by "|" -- NOT by "," which appears inside every
   base64 data: URI (that is what tools/bundle_preview.py substitutes in).

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
     videos from pinning the CPU. A clip scrolled out of its strip counts as
     off screen too, since the strip clips it. Long takes are left to the user. */
  function observe(v) {
    if (!v.loop || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { v.play().catch(function () {}); }
        else { v.pause(); }
      });
    }, { threshold: 0.55 }).observe(v);
  }

  /* ----------------------------------------------------------------
     Filmstrips. Each demo row scrolls horizontally: the wheel moves
     through its clips, and hands scrolling back to the page once the
     strip hits either end, so it never traps the reader.
     ---------------------------------------------------------------- */
  document.querySelectorAll(".demo-row").forEach(function (row) {
    var wrap = row.querySelector(".strip-wrap");
    var strip = row.querySelector(".strip");
    var nav = row.querySelector(".row-nav");
    var arrows = row.querySelectorAll(".arrow");
    if (!strip) return;

    function step() {
      var clip = strip.querySelector(".clip");
      return clip ? clip.offsetWidth + 20 : strip.clientWidth * 0.8;
    }
    function maxScroll() { return strip.scrollWidth - strip.clientWidth; }

    function sync() {
      var max = maxScroll();
      var at = strip.scrollLeft;
      nav.classList.toggle("hidden", max < 2);
      wrap.classList.toggle("more", at < max - 2);
      arrows[0].disabled = at < 2;
      arrows[1].disabled = at > max - 2;
    }

    arrows.forEach(function (b) {
      b.addEventListener("click", function () {
        strip.scrollBy({ left: Number(b.dataset.dir) * step(), behavior: "smooth" });
      });
    });

    strip.addEventListener("wheel", function (e) {
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      var max = maxScroll();
      if (!d || max < 2) return;
      var at = strip.scrollLeft;
      if ((d < 0 && at < 2) || (d > 0 && at > max - 2)) return;  // at an end: let the page scroll
      e.preventDefault();
      strip.scrollLeft = at + d;
    }, { passive: false });

    strip.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
    // Clips load asynchronously, so the strip's width settles late.
    setTimeout(sync, 400);
    setTimeout(sync, 2000);
  });
})();
