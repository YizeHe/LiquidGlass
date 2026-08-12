/**
 * Liquid Glass component showcase — vanilla JS
 */
(function () {
  "use strict";

  /** @type {WeakMap<Element, {supported:boolean, refresh:Function, destroy:Function}>} */
  const instances = new WeakMap();
  /** Keep strong refs so GC doesn't drop while elements live in DOM */
  const live = new Set();

  /**
   * Apply liquidGlass; re-apply safely by destroying prior instance.
   * @param {Element} el
   * @param {Object} [opts]
   */
  function applyGlass(el, opts) {
    if (!el || typeof liquidGlass !== "function") return null;
    const prev = instances.get(el);
    if (prev) {
      try {
        prev.destroy();
      } catch (_) {
        /* noop */
      }
      live.delete(prev);
    }
    const inst = liquidGlass(el, opts || {});
    instances.set(el, inst);
    live.add(inst);
    return inst;
  }

  function getGlass(el) {
    return instances.get(el) || null;
  }

  function parseOpts(el) {
    const raw = el.getAttribute("data-glass-opts");
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (_) {
      return {};
    }
  }

  function refreshWhenReady(el) {
    const inst = getGlass(el);
    if (!inst) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        inst.refresh();
      });
    });
  }

  /** Pointer glare for larger surfaces */
  function bindGlare(el) {
    if (!el.classList.contains("lg-glare")) return;
    el.addEventListener(
      "pointermove",
      function (e) {
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const gx = ((e.clientX - rect.left) / rect.width) * 100;
        const gy = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty("--gx", gx.toFixed(1) + "%");
        el.style.setProperty("--gy", gy.toFixed(1) + "%");
      },
      { passive: true }
    );
  }

  function mountAllGlass() {
    document.querySelectorAll("[data-glass]").forEach(function (el) {
      applyGlass(el, parseOpts(el));
      bindGlare(el);
    });
    // Navbar is glass but not tagged data-glass (explicit id)
    const nav = document.getElementById("navbar");
    if (nav) {
      applyGlass(nav, { scale: -100, mapBlur: 12, blur: 3, border: 0.08 });
      bindGlare(nav);
    }
  }

  // ---------- Dropdown ----------
  function initDropdown() {
    const root = document.getElementById("dropdown-root");
    const btn = document.getElementById("dropdown-btn");
    const menu = document.getElementById("dropdown-menu");
    if (!root || !btn || !menu) return;

    let open = false;

    function setOpen(next) {
      open = next;
      root.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        menu.hidden = false;
        if (!getGlass(menu)) {
          applyGlass(menu, parseOpts(menu));
          bindGlare(menu);
        }
        refreshWhenReady(menu);
        const first = menu.querySelector('[role="menuitem"]');
        if (first) first.focus();
      } else {
        menu.hidden = true;
      }
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!open);
    });

    menu.addEventListener("click", function (e) {
      const item = e.target.closest('[role="menuitem"]');
      if (item) setOpen(false);
    });

    document.addEventListener("click", function (e) {
      if (!open) return;
      if (!root.contains(e.target)) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
        btn.focus();
      }
    });
  }

  // ---------- Tabs ----------
  function initTabs() {
    const root = document.getElementById("tabs-root");
    if (!root) return;
    const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
    const panels = {
      overview: document.getElementById("panel-overview"),
      activity: document.getElementById("panel-activity"),
      members: document.getElementById("panel-members"),
    };

    function activate(name) {
      tabs.forEach(function (tab) {
        const on = tab.dataset.tab === name;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
      });
      Object.keys(panels).forEach(function (key) {
        const panel = panels[key];
        if (!panel) return;
        const on = key === name;
        panel.hidden = !on;
        panel.classList.toggle("is-active", on);
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        activate(tab.dataset.tab);
      });
      tab.addEventListener("keydown", function (e) {
        const i = tabs.indexOf(tab);
        let next = -1;
        if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
        if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = tabs.length - 1;
        if (next >= 0) {
          e.preventDefault();
          tabs[next].focus();
          activate(tabs[next].dataset.tab);
        }
      });
    });
  }

  // ---------- Search ----------
  function initSearch() {
    const input = document.getElementById("search-input");
    const clear = document.getElementById("search-clear");
    if (!input || !clear) return;

    function sync() {
      clear.hidden = !input.value;
    }

    input.addEventListener("input", sync);
    clear.addEventListener("click", function () {
      input.value = "";
      sync();
      input.focus();
    });
    sync();
  }

  // ---------- Slider ----------
  function initSlider() {
    const slider = document.getElementById("volume-slider");
    const label = document.getElementById("slider-value");
    if (!slider || !label) return;

    function sync() {
      label.textContent = slider.value;
      slider.setAttribute("aria-valuenow", slider.value);
    }

    slider.addEventListener("input", sync);
    sync();
  }

  // ---------- Segmented: liquid droplet thumb ----------
  /**
   * Glass droplet that slides between Day / Week / Month.
   * Motion stretch (longer while traveling) + landing squash (flatter from inertia),
   * resting slightly enlarged like a magnifying lens — spring physics akin to the float card.
   */
  class SegmentDroplet {
    constructor(root) {
      this.root = root;
      this.thumb = root.querySelector(".seg-thumb");
      this.segments = Array.from(root.querySelectorAll(".segment"));
      if (!this.thumb || !this.segments.length) return;

      this.pad = 5;
      this.x = 0;
      this.y = 0;
      this.w = 40;
      this.h = 36;
      this.tx = 0;
      this.ty = 0;
      this.tw = 40;
      this.th = 36;
      this.vx = 0;
      this.vy = 0;
      this.vw = 0;
      this.vh = 0;
      this.stiffness = 0.16;
      this.damping = 0.7;
      // resting magnifier scale (enlarged droplet)
      this.bulge = 1.14;
      // impact residual: positive = flatter (squashed vertically)
      this.impact = 0;
      this.prevSpeed = 0;
      this.activeIndex = Math.max(
        0,
        this.segments.findIndex(function (s) {
          return s.classList.contains("is-active");
        })
      );
      this.dragging = false;
      this.ready = false;
      this._glassReady = false;

      var self = this;
      this.segments.forEach(function (btn, i) {
        btn.addEventListener("click", function () {
          if (self.dragging) return;
          self.select(i);
        });
      });

      // Drag the track to scrub the droplet (click still handled by segment buttons)
      root.addEventListener("pointerdown", function (e) {
        if (e.button != null && e.button !== 0) return;
        self._downX = e.clientX;
        self._downY = e.clientY;
        self._moved = false;
        self._pressing = true;
        try {
          root.setPointerCapture(e.pointerId);
        } catch (_) {}
      });
      root.addEventListener("pointermove", function (e) {
        if (!self._pressing) return;
        if (
          Math.abs(e.clientX - self._downX) > 5 ||
          Math.abs(e.clientY - self._downY) > 5
        ) {
          self._moved = true;
          self.dragging = true;
        }
        if (self.dragging) self.snapToPointer(e.clientX, true);
      });
      root.addEventListener("pointerup", function (e) {
        if (!self._pressing) return;
        var wasDragging = self.dragging;
        self._pressing = false;
        self.dragging = false;
        if (root.hasPointerCapture && root.hasPointerCapture(e.pointerId)) {
          root.releasePointerCapture(e.pointerId);
        }
        if (wasDragging || self._moved) {
          // Snap after scrub; skip if pure click (segment handler will select)
          self.snapToPointer(e.clientX, false);
        }
      });
      root.addEventListener("pointercancel", function () {
        self._pressing = false;
        self.dragging = false;
      });

      window.addEventListener("resize", function () {
        self.layout(true);
      });

      // Wait a frame so layout/fonts settle
      requestAnimationFrame(function () {
        self.ensureGlass();
        self.layout(true);
        self.ready = true;
        self.tick();
      });
    }

    ensureGlass() {
      if (this._glassReady || !this.thumb) return;
      applyGlass(this.thumb, parseOpts(this.thumb));
      bindGlare(this.thumb);
      this._glassReady = true;
      refreshWhenReady(this.thumb);
    }

    layout(instant) {
      var rootRect = this.root.getBoundingClientRect();
      var seg = this.segments[this.activeIndex];
      if (!seg) return;
      var r = seg.getBoundingClientRect();
      var left = r.left - rootRect.left;
      var top = r.top - rootRect.top;
      this.tx = left;
      this.ty = top;
      this.tw = r.width;
      this.th = r.height;
      if (instant || !this.ready) {
        this.x = this.tx;
        this.y = this.ty;
        this.w = this.tw;
        this.h = this.th;
        this.vx = this.vy = this.vw = this.vh = 0;
        this.impact = 0;
        this.render();
        if (this._glassReady) refreshWhenReady(this.thumb);
      }
    }

    select(index) {
      if (index < 0 || index >= this.segments.length) return;
      this.activeIndex = index;
      this.segments.forEach(function (s, i) {
        var on = i === index;
        s.classList.toggle("is-active", on);
        s.setAttribute("aria-pressed", on ? "true" : "false");
      });
      this.layout(false);
    }

    indexFromX(clientX) {
      var rootRect = this.root.getBoundingClientRect();
      var rel = clientX - rootRect.left;
      var best = 0;
      var bestDist = Infinity;
      for (var i = 0; i < this.segments.length; i++) {
        var r = this.segments[i].getBoundingClientRect();
        var cx = r.left - rootRect.left + r.width / 2;
        var d = Math.abs(rel - cx);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      return best;
    }

    snapToPointer(clientX, freeDrag) {
      var i = this.indexFromX(clientX);
      if (freeDrag) {
        // While dragging, follow the pointer more loosely within track
        var rootRect = this.root.getBoundingClientRect();
        var seg = this.segments[i];
        var r = seg.getBoundingClientRect();
        var left = r.left - rootRect.left;
        var top = r.top - rootRect.top;
        // blend toward nearest segment under finger
        this.tx = left;
        this.ty = top;
        this.tw = r.width;
        this.th = r.height;
        if (i !== this.activeIndex) {
          this.activeIndex = i;
          this.segments.forEach(function (s, idx) {
            var on = idx === i;
            s.classList.toggle("is-active", on);
            s.setAttribute("aria-pressed", on ? "true" : "false");
          });
        }
      } else {
        this.select(i);
      }
    }

    tick() {
      if (!this.thumb) return;

      var k = this.stiffness;
      var d = this.damping;
      this.vx = (this.vx + (this.tx - this.x) * k) * d;
      this.vy = (this.vy + (this.ty - this.y) * k) * d;
      this.vw = (this.vw + (this.tw - this.w) * k) * d;
      this.vh = (this.vh + (this.th - this.h) * k) * d;
      this.x += this.vx;
      this.y += this.vy;
      this.w += this.vw;
      this.h += this.vh;

      var speed = Math.hypot(this.vx, this.vy) + Math.abs(this.vw) * 0.35;
      // Landing impact: was moving, now nearly settled → flatten briefly
      if (this.prevSpeed > 1.8 && speed < 0.55 && !this.dragging) {
        this.impact = Math.min(0.16, 0.05 + this.prevSpeed * 0.035);
      }
      this.impact *= 0.88;
      if (this.impact < 0.001) this.impact = 0;
      this.prevSpeed = speed;

      this.render(speed);
      requestAnimationFrame(this.tick.bind(this));
    }

    render(speed) {
      if (speed == null) {
        speed = Math.hypot(this.vx, this.vy);
      }
      // Travel: stretch longer along motion (sides compressed)
      var travel = Math.min(speed / 9, 0.18);
      // Landing: flatten (shorter, a bit taller feel via scaleY dip from impact)
      var flat = this.impact;
      var scaleX = this.bulge * (1 + travel - flat * 0.85);
      var scaleY = this.bulge * (1 - travel * 0.55 - flat * 0.35);
      // Keep a readable minimum
      scaleX = Math.max(0.88, scaleX);
      scaleY = Math.max(0.82, scaleY);

      var cx = this.x + this.w / 2;
      var cy = this.y + this.h / 2;
      // Position via left/top/size, squash via transform around center
      this.thumb.style.left = this.x + "px";
      this.thumb.style.top = this.y + "px";
      this.thumb.style.width = Math.max(1, this.w) + "px";
      this.thumb.style.height = Math.max(1, this.h) + "px";
      this.thumb.style.transform =
        "translate(0,0) scale(" + scaleX + ", " + scaleY + ")";
      this.thumb.style.transformOrigin = "50% 50%";

      // Soft glare follows motion direction
      var gx = 50 + Math.max(-28, Math.min(28, this.vx * 6));
      var gy = 30 + Math.max(-18, Math.min(18, this.vy * 4));
      this.thumb.style.setProperty("--gx", gx.toFixed(1) + "%");
      this.thumb.style.setProperty("--gy", gy.toFixed(1) + "%");
    }
  }

  function initSegmented() {
    var root = document.getElementById("segmented-density");
    if (!root) return;
    window.segmentDroplet = new SegmentDroplet(root);
  }

  // ---------- Floating draggable card (original demo physics) ----------
  class GlassCard {
    constructor(el) {
      this.el = el;
      this.measure();
      var startCenterX =
        window.innerWidth > 960
          ? window.innerWidth * 0.78
          : window.innerWidth > 700
            ? window.innerWidth * 0.72
            : window.innerWidth / 2;
      this.x = startCenterX - this.w / 2;
      this.y = Math.max(72, window.innerHeight * 0.28 - this.h / 2);
      this.tx = this.x;
      this.ty = this.y;
      this.vx = 0;
      this.vy = 0;
      this.dragging = false;
      this.grabDX = 0;
      this.grabDY = 0;
      this.stiffness = 0.12;
      this.damping = 0.72;

      var self = this;
      el.addEventListener("pointerdown", function (e) {
        self.onDown(e);
      });
      el.addEventListener("pointermove", function (e) {
        self.onMove(e);
      });
      el.addEventListener("pointerup", function (e) {
        self.onUp(e);
      });
      el.addEventListener("pointercancel", function (e) {
        self.onUp(e);
      });
      window.addEventListener("resize", function () {
        self.onResize();
      });

      this.clampTarget();
      this.x = this.tx;
      this.y = this.ty;
      this.render();
      requestAnimationFrame(function () {
        self.tick();
      });
    }

    measure() {
      this.w = this.el.offsetWidth;
      this.h = this.el.offsetHeight;
    }

    onDown(e) {
      if (e.target.closest("input, button, a, label")) return;
      this.dragging = true;
      this.grabDX = e.clientX - this.tx;
      this.grabDY = e.clientY - this.ty;
      try {
        this.el.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    onMove(e) {
      var rect = this.el.getBoundingClientRect();
      var gx = ((e.clientX - rect.left) / rect.width) * 100;
      var gy = ((e.clientY - rect.top) / rect.height) * 100;
      this.el.style.setProperty("--gx", gx.toFixed(1) + "%");
      this.el.style.setProperty("--gy", gy.toFixed(1) + "%");
      if (!this.dragging) return;
      this.tx = e.clientX - this.grabDX;
      this.ty = e.clientY - this.grabDY;
      this.clampTarget();
    }

    onUp(e) {
      this.dragging = false;
      if (this.el.hasPointerCapture && this.el.hasPointerCapture(e.pointerId)) {
        this.el.releasePointerCapture(e.pointerId);
      }
    }

    onResize() {
      this.measure();
      this.clampTarget();
    }

    clampTarget() {
      var m = 12;
      var topMin = 72;
      this.tx = Math.min(Math.max(this.tx, m), window.innerWidth - this.w - m);
      this.ty = Math.min(
        Math.max(this.ty, topMin),
        window.innerHeight - this.h - m
      );
    }

    tick() {
      this.vx = (this.vx + (this.tx - this.x) * this.stiffness) * this.damping;
      this.vy = (this.vy + (this.ty - this.y) * this.stiffness) * this.damping;
      this.x += this.vx;
      this.y += this.vy;
      this.render();
      requestAnimationFrame(this.tick.bind(this));
    }

    render() {
      var speed = Math.hypot(this.vx, this.vy);
      var squash = Math.min(speed / 120, 0.08);
      var angle = Math.atan2(this.vy, this.vx);
      this.el.style.transform =
        "translate(" +
        this.x +
        "px, " +
        this.y +
        "px) " +
        "rotate(" +
        angle +
        "rad) scale(" +
        (1 + squash) +
        ", " +
        (1 - squash) +
        ") rotate(" +
        -angle +
        "rad)";
    }
  }

  function initFloatCard() {
    var el = document.getElementById("float-card");
    if (!el) return;
    applyGlass(el, { scale: -112, chroma: 6, mapBlur: 12, blur: 3, border: 0.07 });
    bindGlare(el);
    window.glassCard = new GlassCard(el);
  }

  // ---------- Chips ----------
  function initChips() {
    document.querySelectorAll(".chip-row").forEach(function (row) {
      row.querySelectorAll(".chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
          chip.classList.toggle("is-active");
        });
      });
    });
  }

  // ---------- Progress demo pulse ----------
  function initProgress() {
    const bar = document.getElementById("progress-bar");
    const label = document.getElementById("progress-label");
    if (!bar || !label) return;
    // gentle ambient drift so the bar doesn't feel static
    let p = 72;
    setInterval(function () {
      p = 55 + Math.round(Math.sin(Date.now() / 2800) * 18 + 18);
      bar.style.setProperty("--p", p + "%");
      bar.setAttribute("aria-valuenow", String(p));
      label.textContent = p + "%";
    }, 800);
  }

  // ---------- Modal ----------
  function initModal() {
    const root = document.getElementById("modal-root");
    const modal = document.getElementById("modal");
    const backdrop = document.getElementById("modal-backdrop");
    const openers = [
      document.getElementById("open-modal"),
      document.getElementById("nav-open-modal"),
    ].filter(Boolean);
    const cancel = document.getElementById("modal-cancel");
    const confirm = document.getElementById("modal-confirm");
    if (!root || !modal) return;

    let lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      root.hidden = false;
      document.body.style.overflow = "hidden";
      if (!getGlass(modal)) {
        applyGlass(modal, parseOpts(modal));
        bindGlare(modal);
      }
      refreshWhenReady(modal);
      const focusable = modal.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus();
    }

    function close() {
      root.hidden = true;
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    openers.forEach(function (btn) {
      btn.addEventListener("click", open);
    });
    if (backdrop) backdrop.addEventListener("click", close);
    if (cancel) cancel.addEventListener("click", close);
    if (confirm) {
      confirm.addEventListener("click", function () {
        const input = modal.querySelector("input");
        if (input && navigator.clipboard) {
          navigator.clipboard.writeText(input.value).catch(function () {});
        }
        showToast("Link copied to clipboard");
        close();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (root.hidden) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    });
  }

  // ---------- Toast ----------
  function showToast(message) {
    const host = document.getElementById("toast-host");
    if (!host) return;

    const el = document.createElement("div");
    el.className = "toast lg-surface";
    el.setAttribute("role", "status");
    el.innerHTML =
      '<span class="toast-icon" aria-hidden="true">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>' +
      "</span>" +
      '<span class="toast-text"></span>' +
      '<button type="button" class="toast-dismiss" aria-label="Dismiss">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
      "</button>";
    el.querySelector(".toast-text").textContent = message;

    host.appendChild(el);
    const inst = applyGlass(el, { scale: -95, mapBlur: 10, blur: 2.5, chroma: 5 });

    function dismiss() {
      el.classList.add("is-leaving");
      setTimeout(function () {
        if (inst) {
          try {
            inst.destroy();
          } catch (_) {}
          live.delete(inst);
        }
        el.remove();
      }, 220);
    }

    el.querySelector(".toast-dismiss").addEventListener("click", dismiss);
    setTimeout(dismiss, 4200);
  }

  function initToast() {
    const btn = document.getElementById("show-toast");
    if (!btn) return;
    btn.addEventListener("click", function () {
      showToast("Settings saved successfully");
    });
  }

  // ---------- Tooltip ----------
  function initTooltip() {
    const host = document.getElementById("tooltip-host");
    const tip = document.getElementById("tooltip-pop");
    if (!host || !tip) return;

    function show() {
      tip.hidden = false;
      if (!getGlass(tip)) {
        applyGlass(tip, parseOpts(tip));
      }
      refreshWhenReady(tip);
    }

    function hide() {
      tip.hidden = true;
    }

    host.addEventListener("pointerenter", show);
    host.addEventListener("pointerleave", hide);
    host.addEventListener("focus", show);
    host.addEventListener("blur", hide);
  }

  // ---------- Background image fallback ----
  function initBg() {
    const img = document.querySelector(".bg-photo");
    if (!img) return;
    img.addEventListener("error", function () {
      img.style.display = "none";
    });
  }

  // Boot
  function init() {
    initBg();
    mountAllGlass();
    initDropdown();
    initTabs();
    initSearch();
    initSlider();
    initSegmented();
    initFloatCard();
    initChips();
    initProgress();
    initModal();
    initToast();
    initTooltip();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose for debugging
  window.showcaseGlass = { applyGlass: applyGlass, getGlass: getGlass, showToast: showToast };
})();
