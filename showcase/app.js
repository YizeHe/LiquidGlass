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

  // ---------- Segmented ----------
  function initSegmented() {
    document.querySelectorAll(".segmented").forEach(function (group) {
      const segs = Array.from(group.querySelectorAll(".segment"));
      segs.forEach(function (btn) {
        btn.addEventListener("click", function () {
          segs.forEach(function (s) {
            const on = s === btn;
            s.classList.toggle("is-active", on);
            s.setAttribute("aria-pressed", on ? "true" : "false");
          });
        });
      });
    });
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
