/* ============================================================
   RebarSim project page.

   Two jobs.

   1. Media slots. Every image and video is declared as a path and filled in only
      if the file actually exists, so adding content to the page is a file copy
      rather than an HTML edit.

          <div class="media-slot"       data-img="path/a.svg|path/b.png" ...>
          <div class="media-slot video" data-video="static/videos/x.mp4"  ...>

      Candidates are separated by "|" -- NOT by "," which appears inside every
      base64 data: URI (that is what tools/bundle_preview.py substitutes in).
      The first candidate that loads is inserted; if none load, the slot shows
      the exact path to drop the file at.

      Slot attributes:
          data-once      play through once and show controls (a long take)
          data-controls  keep looping, but show controls too
          data-defer     do not fetch until the slot's tab is opened
          data-label / data-hint   wording for the "missing" box

   2. Tab groups. A <div class="eval-tabs"> of <button data-tab="x"> paired with
      sibling <div class="tab-panel" data-panel="x"> blocks. A slot marked
      data-defer inside a panel is not fetched until that tab is opened for the
      first time -- the long takes are tens of megabytes each, and a reader only
      ever watches one or two of them.

   Layout is Bulma's -- the clips sit in a plain column grid, so there is no
   carousel or scroll handling here.
   ============================================================ */

(function () {
  "use strict";

  /* ------------------------------ media slots ------------------------------ */

  document.querySelectorAll(".media-slot").forEach(function (slot) {
    if (!slot.hasAttribute("data-defer")) fill(slot);
  });

  function fill(slot) {
    if (slot.dataset.filled) { return; }        // tabs can ask twice
    slot.dataset.filled = "1";

    var isVideo = slot.hasAttribute("data-video");
    var list = (slot.getAttribute(isVideo ? "data-video" : "data-img") || "")
      .split("|").map(function (s) { return s.trim(); }).filter(Boolean);

    tryNext(slot, list, 0, isVideo);
  }

  function tryNext(slot, list, i, isVideo) {
    if (i >= list.length) { renderPlaceholder(slot, list[0], isVideo); return; }
    var src = list[i];

    if (isVideo) {
      var v = document.createElement("video");
      v.src = src;
      v.muted = true;
      v.playsInline = true;
      v.loop = !slot.hasAttribute("data-once");   // long take: play once
      /* The clips in the demo tabs all want the same furniture, whether they loop
         or not, so a progress bar is not what tells them apart. */
      v.controls = slot.hasAttribute("data-once") || slot.hasAttribute("data-controls");
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
     from pinning the CPU. Long takes are left to the viewer.

     A looping clip with controls can also be paused by the reader, and scrolling
     past it must not undo that, so our own pauses are flagged as ours. */
  function observe(v) {
    if (!v.loop || !("IntersectionObserver" in window)) return;

    v.addEventListener("pause", function () {
      if (v.dataset.autoPause) { delete v.dataset.autoPause; }
      else { v.dataset.userPaused = "1"; }
    });
    v.addEventListener("play", function () { delete v.dataset.userPaused; });

    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          if (!v.dataset.userPaused) { v.play().catch(function () {}); }
        } else {
          pause(v);
        }
      });
    }, { threshold: 0.35 }).observe(v);
  }

  /* Pause without it counting as the reader's choice. */
  function pause(v) {
    if (!v.paused) { v.dataset.autoPause = "1"; }
    v.pause();
  }

  /* ------------------------------ tab groups ------------------------------ */

  document.querySelectorAll(".eval-tabs").forEach(function (bar) {
    var box = bar.parentNode;
    var tabs = bar.querySelectorAll(".eval-tab[data-tab]");
    var panels = box.querySelectorAll(":scope > .tab-panel[data-panel]");

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("is-active"); });
        panels.forEach(function (pn) {
          pn.classList.remove("is-active");
          pn.querySelectorAll("video").forEach(pause);
        });

        tab.classList.add("is-active");
        var panel = box.querySelector('.tab-panel[data-panel="' + tab.dataset.tab + '"]');
        if (!panel) return;
        panel.classList.add("is-active");

        /* First open of this tab: this is where a data-defer clip is fetched.
           Looping clips restart themselves through the observer above, which
           fires as the panel stops being display:none. */
        panel.querySelectorAll(".media-slot").forEach(fill);
      });
    });
  });
})();
