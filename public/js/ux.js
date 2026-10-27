/* ==========================================================================
   TG-PANEL — AURORA PRO UX ENGINE  v4.0.0
   --------------------------------------------------------------------------
   Zero-dependency enhancement layer. It does NOT replace any existing
   controller: it wraps them, adds missing affordances and fixes cosmetic
   bugs (un-hydrated icons, hanging progress feedback, missing a11y labels).

   Public API: window.TGUX
     .openPalette() / .closePalette() / .openAppearance() / .openHelp()
     .setPref(key, value) / .resetPrefs() / .registerCommand(cmd)
     .toast(message, type)
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'tgpanel_ux_prefs_v4';
  var RECENT_KEY = 'tgpanel_ux_recent_v4';
  var DEFAULTS = {
    accent: 'cyan',
    density: 'comfortable',
    motion: 'full',
    mode: 'panel',      // 'panel' = respect the admin's theme_mode setting
    wallpaper: 26,       // percent opacity
    focus: false,
    premium: true
  };

  /* ------------------------------------------------------------------ *
   * Inline icon set — used for our own UI and as an offline fallback
   * for <i data-lucide> nodes when the Lucide CDN is unavailable.
   * ------------------------------------------------------------------ */
  var P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
    command: '<path d="M18 8a3 3 0 1 0-3-3v14a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V5a3 3 0 1 0-3 3z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    palette: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="9" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="16" cy="9" r="1"/><path d="M12 21a9 9 0 0 1 0-18"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    'arrow-up': '<path d="M12 19V5M5 12l7-7 7 7"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M8 13h8"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    server: '<rect x="3" y="3" width="18" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/><path d="M7 7h.01M7 17h.01"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M18 21a6 6 0 0 0-2-4.5"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21h-4v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    package: '<path d="m12 2 9 5-9 5-9-5 9-5zM3 7v10l9 5 9-5V7M12 12v10"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8-8L21 6.5l-2 2 1.5 1.5-2 2L17 10.5l-2.5 2.5"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>',
    'hard-drive': '<path d="M2 14h20M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5M2 14l2.4-8A2 2 0 0 1 6.3 4.6h11.4A2 2 0 0 1 19.6 6L22 14M6 17h.01M10 17h.01"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    archive: '<rect x="2" y="4" width="20" height="5" rx="1"/><path d="M4 9v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9M10 13h4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    radio: '<circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 19.1a10 10 0 0 0 0-14.2"/>',
    network: '<rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M12 8v5M5 16v-3h14v3"/>',
    'map-pin': '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    terminal: '<path d="m4 17 6-5-6-5M12 19h8"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    'shopping-bag': '<path d="M5 8h14l1 13H4L5 8zM9 8V6a3 3 0 0 1 6 0v2"/>',
    wrench: '<path d="M21 3a6 6 0 0 1-7.7 7.7L5 19a2.8 2.8 0 0 1-4-4l8.3-8.3A6 6 0 0 1 17 3l-4 4 4 4 4-8z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
    book: '<path d="M4 4a2 2 0 0 1 2-2h14v18H6a2 2 0 0 0-2 2zM4 18a2 2 0 0 1 2-2h14"/>',
    'log-out': '<path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5M15 17l5-5-5-5M20 12H9"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    sparkles: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 2.8 2.8M9.9 5.2A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.1 3.8M6.1 6.1A17 17 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 3.4-.6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
    'external-link': '<path d="M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>'
  };

  function icon(name, cls) {
    var body = P[name] || P.sparkles;
    return '<svg class="' + (cls || '') + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ------------------------------------------------------------------ *
   * Preferences
   * ------------------------------------------------------------------ */
  var prefs = Object.assign({}, DEFAULTS);

  function loadPrefs() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      Object.keys(DEFAULTS).forEach(function (k) {
        if (saved[k] !== undefined && typeof saved[k] === typeof DEFAULTS[k]) prefs[k] = saved[k];
      });
    } catch (e) { /* ignore malformed storage */ }
  }

  function savePrefs() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (e) {}
  }

  function setRootAttr(name, value) {
    document.documentElement.setAttribute(name, value);
  }

  function applyPrefs() {
    var root = document.documentElement;
    setRootAttr('data-ux-accent', prefs.accent);
    setRootAttr('data-ux-density', prefs.density);
    setRootAttr('data-ux-motion', prefs.motion);
    setRootAttr('data-ux-focus', prefs.focus ? 'on' : 'off');
    root.style.setProperty('--ux-wallpaper-opacity', (prefs.wallpaper / 100).toFixed(2));

    var link = document.getElementById('ux-premium-css');
    if (link) link.disabled = !prefs.premium;

    if (prefs.mode === 'dark' || prefs.mode === 'light') {
      root.classList.remove(prefs.mode === 'dark' ? 'light' : 'dark');
      root.classList.add(prefs.mode);
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', root.classList.contains('light') ? '#f4f7fb' : '#05070d');
  }

  function setPref(key, value) {
    if (!(key in DEFAULTS)) return;
    prefs[key] = value;
    savePrefs();
    applyPrefs();
    renderAppearance();
    if (key === 'mode') syncThemeButton();
  }

  function resetPrefs() {
    prefs = Object.assign({}, DEFAULTS);
    savePrefs();
    applyPrefs();
    renderAppearance();
    syncThemeButton();
  }

  /* ------------------------------------------------------------------ *
   * Small helpers
   * ------------------------------------------------------------------ */
  var lastFocused = null;

  function toast(message, type) {
    if (window.app && typeof window.app.toast === 'function') {
      window.app.toast(message, type || 'info');
      return;
    }
    var box = document.getElementById('toast-container');
    if (!box) return;
    var el = document.createElement('div');
    el.className = 'ux-simple-toast';
    el.style.cssText = 'padding:12px 16px;border-radius:14px;background:rgba(15,20,32,.96);border:1px solid rgba(148,163,184,.22);box-shadow:0 18px 40px rgba(0,0,0,.5);color:#eef3fb;font-size:12px;pointer-events:auto';
    el.textContent = message;
    box.appendChild(el);
    setTimeout(function () { el.remove(); }, 4200);
  }

  function announce(message) {
    var live = document.getElementById('ux-live-region');
    if (live) live.textContent = message;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Copied to clipboard', 'success'); },
        function () { toast('Could not copy', 'error'); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Copied to clipboard', 'success'); } catch (e) { toast('Could not copy', 'error'); }
      ta.remove();
    }
  }

  /* ------------------------------------------------------------------ *
   * Static shell: skip link, live region, progress, FAB
   * ------------------------------------------------------------------ */
  function injectShell() {
    if (!$('#ux-skip-link')) {
      var skip = document.createElement('a');
      skip.id = 'ux-skip-link';
      skip.className = 'ux-skip-link';
      skip.href = '#main-content';
      skip.textContent = 'Skip to content';
      skip.addEventListener('click', function (e) {
        e.preventDefault();
        var main = document.getElementById('main-content');
        if (main) { main.focus({ preventScroll: true }); main.scrollTop = 0; }
      });
      document.body.appendChild(skip);
      var mainEl = document.getElementById('main-content');
      if (mainEl && !mainEl.hasAttribute('tabindex')) mainEl.setAttribute('tabindex', '-1');
    }
    if (!$('#ux-live-region')) {
      var live = document.createElement('div');
      live.id = 'ux-live-region';
      live.className = 'ux-sr-only';
      live.setAttribute('aria-live', 'polite');
      live.setAttribute('aria-atomic', 'true');
      document.body.appendChild(live);
    }
    if (!$('#ux-progress')) {
      var bar = document.createElement('div');
      bar.id = 'ux-progress';
      bar.className = 'ux-progress';
      bar.innerHTML = '<span></span>';
      document.body.appendChild(bar);
    }
    if (!$('#ux-scrolltop')) {
      var fab = document.createElement('button');
      fab.id = 'ux-scrolltop';
      fab.className = 'ux-fab';
      fab.type = 'button';
      fab.title = 'Back to top';
      fab.setAttribute('aria-label', 'Back to top');
      fab.innerHTML = icon('arrow-up');
      fab.addEventListener('click', function () {
        var main = document.getElementById('main-content');
        if (main) main.scrollTo({ top: 0, behavior: prefs.motion === 'reduced' ? 'auto' : 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      document.body.appendChild(fab);
      var scroller = document.getElementById('main-content');
      if (scroller) {
        scroller.addEventListener('scroll', function () {
          fab.classList.toggle('is-visible', scroller.scrollTop > 420);
        }, { passive: true });
      }
    }
    var toastBox = document.getElementById('toast-container');
    if (toastBox) {
      toastBox.setAttribute('aria-live', 'polite');
      toastBox.setAttribute('aria-label', 'Notifications');
    }
  }

  /* ------------------------------------------------------------------ *
   * Network activity progress bar (wraps fetch, never alters responses)
   * ------------------------------------------------------------------ */
  var pending = 0;
  var progressTimer = null;
  function progressStart() {
    var bar = document.getElementById('ux-progress');
    if (!bar) return;
    pending++;
    bar.classList.add('is-visible');
    var fill = $('span', bar);
    if (fill) fill.style.width = '38%';
    clearInterval(progressTimer);
    progressTimer = setInterval(function () {
      var w = parseFloat((fill && fill.style.width) || '38') || 38;
      if (fill) fill.style.width = Math.min(88, w + (88 - w) * 0.18) + '%';
    }, 320);
  }
  function progressEnd() {
    pending = Math.max(0, pending - 1);
    if (pending > 0) return;
    clearInterval(progressTimer);
    var bar = document.getElementById('ux-progress');
    if (!bar) return;
    var fill = $('span', bar);
    if (fill) fill.style.width = '100%';
    setTimeout(function () {
      bar.classList.remove('is-visible');
      if (fill) setTimeout(function () { fill.style.width = '0%'; }, 220);
    }, 180);
  }
  function patchFetch() {
    if (typeof window.fetch !== 'function' || window.fetch.__uxWrapped) return;
    var original = window.fetch;
    var wrapped = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var tracked = /\/api\//i.test(url) && !(init && init.method && init.method.toUpperCase() === 'HEAD');
      if (tracked) progressStart();
      return original.apply(this, arguments).then(function (res) {
        if (tracked) progressEnd();
        return res;
      }, function (err) {
        if (tracked) progressEnd();
        throw err;
      });
    };
    wrapped.__uxWrapped = true;
    window.fetch = wrapped;
  }

  /* ------------------------------------------------------------------ *
   * Icon hydration — fixes icons missing after AJAX view swaps and keeps
   * the UI usable when the Lucide CDN is blocked/offline.
   * ------------------------------------------------------------------ */
  function hydrateIcons(root) {
    var scope = root || document;
    var nodes = $$('i[data-lucide], [data-lucide]:not(svg)', scope);
    if (!nodes.length) return;
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch (e) {}
      // Anything lucide could not resolve is replaced with our inline icon.
      nodes = $$('i[data-lucide]', scope);
    }
    nodes.forEach(function (node) {
      if (node.tagName !== 'I') return;
      var name = node.getAttribute('data-lucide');
      var holder = document.createElement('span');
      holder.className = node.className || '';
      holder.setAttribute('data-ux-icon', name || 'sparkles');
      holder.style.display = 'inline-flex';
      holder.innerHTML = icon(name, '');
      var svg = holder.firstChild;
      if (svg) {
        svg.style.width = '1em';
        svg.style.height = '1em';
      }
      if (node.parentNode) node.parentNode.replaceChild(holder, node);
    });
  }

  var mutationTimer = null;
  function observeMutations() {
    if (typeof MutationObserver !== 'function') return;
    var target = document.getElementById('view-container') || document.body;
    var observer = new MutationObserver(function (records) {
      var needsIcons = false;
      var needsA11y = false;
      for (var i = 0; i < records.length; i++) {
        if (records[i].addedNodes.length) { needsIcons = true; needsA11y = true; }
      }
      if (!needsIcons) return;
      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(function () {
        hydrateIcons(document);
        if (needsA11y) {
          enhanceForms(document);
          wrapTables(document);
        }
      }, 80);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ------------------------------------------------------------------ *
   * Progressive form / table enhancements
   * ------------------------------------------------------------------ */
  function enhanceForms(root) {
    $$('input[type="password"]', root || document).forEach(function (input) {
      if (input.dataset.uxPassword === '1') return;
      if (/xterm|ace_/i.test(input.className || '')) return;
      input.dataset.uxPassword = '1';
      input.style.paddingRight = '40px';
      var wrap = document.createElement('span');
      wrap.style.cssText = 'position:relative;display:block';
      if (input.parentNode) input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.title = 'Show password';
      btn.setAttribute('aria-label', 'Show password');
      btn.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;display:grid;place-items:center;border:0;background:transparent;color:#94a3b8;cursor:pointer;padding:0';
      btn.innerHTML = icon('eye');
      var s = $('svg', btn); if (s) { s.style.width = '16px'; s.style.height = '16px'; }
      btn.addEventListener('click', function () {
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.innerHTML = icon(show ? 'eye-off' : 'eye');
        var s2 = $('svg', btn); if (s2) { s2.style.width = '16px'; s2.style.height = '16px'; }
        btn.title = show ? 'Hide password' : 'Show password';
      });
      wrap.appendChild(btn);
    });

    $$('textarea', root || document).forEach(function (ta) {
      if (ta.dataset.uxGrow === '1') return;
      if (/xterm|ace_/i.test(ta.className || '')) return;
      ta.dataset.uxGrow = '1';
      var grow = function () { ta.style.height = 'auto'; ta.style.height = Math.min(420, ta.scrollHeight + 4) + 'px'; };
      ta.addEventListener('input', grow);
    });

    // Give icon-only buttons an accessible name when they lack one.
    $$('button', root || document).forEach(function (btn) {
      if (btn.getAttribute('aria-label') || btn.getAttribute('title') || btn.textContent.trim()) return;
      var svg = $('svg', btn);
      if (!svg) return;
      var label = btn.getAttribute('onclick') || '';
      btn.setAttribute('aria-label', label ? 'Panel action: ' + label.slice(0, 60) : 'Panel action');
    });
  }

  function wrapTables(root) {
    $$('table', root || document).forEach(function (table) {
      var p = table.parentNode;
      if (!p || (p.classList && p.classList.contains('ux-table-wrap'))) return;
      var wrap = document.createElement('div');
      wrap.className = 'ux-table-wrap';
      wrap.style.cssText = 'width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch';
      p.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  /* ------------------------------------------------------------------ *
   * Header controls
   * ------------------------------------------------------------------ */
  var appearanceEl = null;

  function injectHeaderControls() {
    var actions = document.getElementById('header-actions');
    if (!actions) {
      var themeBtn = document.getElementById('header-theme-toggle-btn');
      actions = themeBtn ? themeBtn.parentNode : null;
    }
    if (!actions || actions.dataset.uxEnhanced === '1') return;
    actions.dataset.uxEnhanced = '1';

    // Tag the pre-existing icon-only buttons so the stylesheet can size them
    // without touching text buttons ("Sign In", "Admin Area") or the search pill.
    Array.prototype.forEach.call(actions.children, function (child) {
      if (child.tagName !== 'BUTTON') return;
      if (child.id === 'header-admin-toggle-btn' || child.id === 'header-login-btn') return;
      child.classList.add('ux-icon-btn');
    });

    // System status pill
    var pill = document.createElement('span');
    pill.id = 'ux-status-pill';
    pill.className = 'ux-status-pill';
    pill.innerHTML = '<span class="ux-dot"></span><span class="ux-status-label">Online</span>';
    actions.insertBefore(pill, actions.firstChild);

    // Command palette trigger (a real search affordance)
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'ux-search-trigger';
    trigger.id = 'ux-search-trigger';
    trigger.setAttribute('aria-label', 'Open command palette');
    trigger.innerHTML = icon('search') + '<span>Search or jump to…</span><kbd>Ctrl K</kbd>';
    trigger.addEventListener('click', function () { openPalette(); });
    actions.insertBefore(trigger, pill.nextSibling);

    // Appearance button
    var appearanceBtn = document.createElement('button');
    appearanceBtn.type = 'button';
    appearanceBtn.id = 'ux-appearance-btn';
    appearanceBtn.className = 'ux-icon-btn';
    appearanceBtn.title = 'Appearance & display settings';
    appearanceBtn.setAttribute('aria-label', 'Appearance settings');
    appearanceBtn.innerHTML = icon('palette', 'w-4 h-4');
    var s = $('svg', appearanceBtn); if (s) { s.style.width = '16px'; s.style.height = '16px'; }
    appearanceBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleAppearance(); });
    actions.insertBefore(appearanceBtn, trigger.nextSibling);

    // Repurpose the legacy theme toggle so it stays in sync with prefs.
    var legacyToggle = document.getElementById('header-theme-toggle-btn');
    if (legacyToggle) {
      legacyToggle.removeAttribute('onclick');
      legacyToggle.title = 'Toggle dark / light mode (T)';
      legacyToggle.setAttribute('aria-label', 'Toggle dark / light mode');
      legacyToggle.addEventListener('click', function () { toggleMode(); });
      legacyToggle.innerHTML = icon(document.documentElement.classList.contains('light') ? 'sun' : 'moon', 'w-4 h-4');
    }

    updateConnectionStatus();
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
  }

  function updateConnectionStatus() {
    var pill = document.getElementById('ux-status-pill');
    if (!pill) return;
    var online = navigator.onLine !== false;
    pill.classList.toggle('is-offline', !online);
    var label = $('.ux-status-label', pill);
    if (label) label.textContent = online ? 'All systems live' : 'Offline mode';
  }

  function toggleMode() {
    var isLight = document.documentElement.classList.contains('light');
    setPref('mode', isLight ? 'dark' : 'light');
    announce(isLight ? 'Dark mode enabled' : 'Light mode enabled');
  }

  function syncThemeButton() {
    var btn = document.getElementById('header-theme-toggle-btn');
    if (!btn) return;
    var isLight = document.documentElement.classList.contains('light');
    btn.innerHTML = icon(isLight ? 'sun' : 'moon', 'w-4 h-4');
    var svg = $('svg', btn);
    if (svg) { svg.style.width = '16px'; svg.style.height = '16px'; if (isLight) svg.style.color = '#fbbf24'; }
  }

  /* ------------------------------------------------------------------ *
   * Appearance popover
   * ------------------------------------------------------------------ */
  function toggleAppearance() {
    if (appearanceEl) { closeAppearance(); return; }
    appearanceEl = document.createElement('div');
    appearanceEl.id = 'ux-appearance';
    appearanceEl.className = 'ux-appearance';
    appearanceEl.setAttribute('role', 'dialog');
    appearanceEl.setAttribute('aria-label', 'Appearance settings');
    document.body.appendChild(appearanceEl);
    renderAppearance();
    setTimeout(function () {
      document.addEventListener('click', outsideAppearance, true);
    }, 0);
  }

  function closeAppearance() {
    if (appearanceEl) appearanceEl.remove();
    appearanceEl = null;
    document.removeEventListener('click', outsideAppearance, true);
  }

  function outsideAppearance(e) {
    if (!appearanceEl) return;
    if (appearanceEl.contains(e.target) || (e.target.closest && e.target.closest('#ux-appearance-btn'))) return;
    closeAppearance();
  }

  function renderAppearance() {
    if (!appearanceEl) return;
    var accents = [
      { id: 'cyan', color: '#22d3ee', label: 'Cyan' },
      { id: 'violet', color: '#a78bfa', label: 'Violet' },
      { id: 'emerald', color: '#34d399', label: 'Emerald' },
      { id: 'amber', color: '#fbbf24', label: 'Amber' },
      { id: 'rose', color: '#fb7185', label: 'Rose' }
    ];
    function seg(group, items) {
      return '<div class="ux-segmented">' + items.map(function (it) {
        return '<button type="button" data-pref="' + group + '" data-value="' + it.id + '" class="' + (prefs[group] === it.id ? 'is-active' : '') + '">' + it.label + '</button>';
      }).join('') + '</div>';
    }
    appearanceEl.innerHTML =
      '<div class="ux-appearance-head"><h4>Appearance</h4><button type="button" data-ux-close aria-label="Close">' + icon('x') + '</button></div>' +
      '<label class="ux-field-label">Colour mode</label>' +
      seg('mode', [{ id: 'panel', label: 'Panel' }, { id: 'dark', label: 'Dark' }, { id: 'light', label: 'Light' }]) +
      '<label class="ux-field-label">Accent colour</label>' +
      '<div class="ux-swatches">' + accents.map(function (a) {
        return '<button type="button" class="ux-swatch ' + (prefs.accent === a.id ? 'is-active' : '') + '" data-pref="accent" data-value="' + a.id + '" title="' + a.label + '" aria-label="' + a.label + ' accent" style="--swatch:' + a.color + '"></button>';
      }).join('') + '</div>' +
      '<label class="ux-field-label">Interface density</label>' +
      seg('density', [{ id: 'comfortable', label: 'Comfortable' }, { id: 'compact', label: 'Compact' }]) +
      '<label class="ux-field-label">Wallpaper intensity — <span id="ux-wall-value">' + prefs.wallpaper + '%</span></label>' +
      '<input type="range" min="0" max="80" value="' + prefs.wallpaper + '" class="ux-range" id="ux-wall-range" aria-label="Wallpaper intensity">' +
      '<div style="margin-top:12px">' +
      '<label class="ux-toggle-row"><span>Animations<small>Transitions and reveal effects</small></span><input type="checkbox" class="ux-switch" data-toggle="motion" ' + (prefs.motion === 'full' ? 'checked' : '') + '></label>' +
      '<label class="ux-toggle-row"><span>Focus mode<small>Hide the background wallpaper</small></span><input type="checkbox" class="ux-switch" data-toggle="focus" ' + (prefs.focus ? 'checked' : '') + '></label>' +
      '<label class="ux-toggle-row"><span>Premium styling<small>Turn off to use the classic look</small></span><input type="checkbox" class="ux-switch" data-toggle="premium" ' + (prefs.premium ? 'checked' : '') + '></label>' +
      '</div>' +
      '<button type="button" class="ux-reset" data-ux-reset>Reset to defaults</button>';

    $('[data-ux-close]', appearanceEl).addEventListener('click', closeAppearance);
    $('[data-ux-reset]', appearanceEl).addEventListener('click', function () {
      resetPrefs();
      toast('Appearance reset to defaults', 'success');
    });
    $$('[data-pref]', appearanceEl).forEach(function (btn) {
      btn.addEventListener('click', function () {
        setPref(btn.getAttribute('data-pref'), btn.getAttribute('data-value'));
      });
    });
    $$('[data-toggle]', appearanceEl).forEach(function (input) {
      input.addEventListener('change', function () {
        var key = input.getAttribute('data-toggle');
        if (key === 'motion') setPref('motion', input.checked ? 'full' : 'reduced');
        else setPref(key, input.checked);
      });
    });
    var range = $('#ux-wall-range', appearanceEl);
    range.addEventListener('input', function () {
      var value = parseInt(range.value, 10);
      var out = $('#ux-wall-value', appearanceEl);
      if (out) out.textContent = value + '%';
      prefs.wallpaper = value;
      document.documentElement.style.setProperty('--ux-wallpaper-opacity', (value / 100).toFixed(2));
      savePrefs();
    });
  }

  /* ------------------------------------------------------------------ *
   * Command palette
   * ------------------------------------------------------------------ */
  var overlayEl = null;
  var filtered = [];
  var activeIndex = 0;
  var extraCommands = [];
  var serverCommands = [];

  function registerCommand(cmd) {
    if (!cmd || !cmd.label || typeof cmd.run !== 'function') return;
    extraCommands.push(cmd);
  }

  function viewLabel(view) {
    return String(view || '')
      .replace(/^#/, '')
      .split(/[-/]/)
      .filter(Boolean)
      .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
      .join(' ') || 'Overview';
  }

  function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (e) { return []; }
  }

  function rememberView(view) {
    if (!view) return;
    var list = getRecent().filter(function (v) { return v !== view; });
    list.unshift(view);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6))); } catch (e) {}
  }

  function baseCommands() {
    var cmds = [];

    // Navigation derived from the actual sidebar (so themes/roles stay in sync).
    $$('a.nook-nav-item[id^="nav-"]').forEach(function (link) {
      var view = (link.id || '').replace(/^nav-/, '');
      var label = (link.textContent || '').trim().replace(/\s+/g, ' ') || viewLabel(view);
      var iconName = 'layout';
      var i = link.getAttribute('data-lucide') ? link : link.querySelector('[data-lucide]');
      if (i) iconName = i.getAttribute('data-lucide') || 'layout';
      cmds.push({
        label: label,
        hint: 'Go to ' + viewLabel(view),
        group: 'Navigation',
        icon: iconName,
        keywords: view + ' ' + label + ' page',
        run: function () { go(view); }
      });
    });

    cmds.push(
      { label: 'Appearance & display', hint: 'Colour mode, accent, density, wallpaper', group: 'Actions', icon: 'palette', keywords: 'theme colour dark light accent settings', run: function () { toggleAppearance(); } },
      { label: 'Toggle dark / light mode', hint: 'Switch colour mode', group: 'Actions', icon: 'moon', keywords: 'theme night day', run: function () { toggleMode(); } },
      { label: 'Keyboard shortcuts', hint: 'See every shortcut', group: 'Actions', icon: 'keyboard', keywords: 'help keys hotkeys', run: function () { openHelp(); } },
      { label: 'Toggle focus mode', hint: 'Hide the background wallpaper', group: 'Actions', icon: 'sparkles', keywords: 'wallpaper background distraction', run: function () { setPref('focus', !prefs.focus); toast(prefs.focus ? 'Focus mode on' : 'Focus mode off', 'info'); } },
      { label: 'Switch server', hint: 'Open the server switcher', group: 'Actions', icon: 'layers', keywords: 'servers instances jump', run: function () { if (window.app && window.app.showServerSwitcherModal) window.app.showServerSwitcherModal(); else go('user-servers'); } },
      { label: 'Copy page link', hint: 'Copy the current URL', group: 'Actions', icon: 'copy', keywords: 'share url link', run: function () { copyText(window.location.href); } },
      { label: 'Reload panel', hint: 'Refresh the current view', group: 'Actions', icon: 'refresh', keywords: 'refresh restart', run: function () { window.location.reload(); } },
      { label: 'Back to top', hint: 'Scroll the page up', group: 'Actions', icon: 'arrow-up', keywords: 'scroll up', run: function () { var m = document.getElementById('main-content'); if (m) m.scrollTo({ top: 0, behavior: 'smooth' }); } },
      { label: 'Toggle mobile menu', hint: 'Open / close the sidebar', group: 'Actions', icon: 'menu', keywords: 'sidebar navigation drawer', run: function () { if (window.app && window.app.toggleMobileSidebar) window.app.toggleMobileSidebar(); } }
    );

    if (window.app && window.app.user && window.auth && typeof window.auth.logout === 'function') {
      cmds.push({ label: 'Sign out', hint: 'End this session', group: 'Actions', icon: 'log-out', keywords: 'logout exit', run: function () { window.auth.logout(); } });
    }

    // Recently visited views
    getRecent().slice(0, 4).forEach(function (view) {
      cmds.push({
        label: viewLabel(view),
        hint: 'Recent · ' + view,
        group: 'Recent',
        icon: 'clock',
        keywords: view,
        run: function () { go(view); }
      });
    });

    return cmds.concat(serverCommands, extraCommands);
  }

  function go(view) {
    if (window.app && typeof window.app.navigate === 'function') window.app.navigate(view);
    else window.location.hash = view;
  }

  function fuzzyScore(item, query) {
    if (!query) return 1;
    var hay = (item.label + ' ' + (item.hint || '') + ' ' + (item.keywords || '') + ' ' + (item.group || '')).toLowerCase();
    var q = query.toLowerCase().trim();
    if (!q) return 1;
    if (item.label.toLowerCase() === q) return 120;
    if (item.label.toLowerCase().indexOf(q) === 0) return 95;
    if (item.label.toLowerCase().indexOf(q) > -1) return 78;
    if (hay.indexOf(q) > -1) return 55;
    // subsequence match
    var i = 0, hits = 0;
    for (var c = 0; c < hay.length && i < q.length; c++) {
      if (hay[c] === q[i]) { i++; hits++; }
    }
    if (i === q.length) return 18 + hits;
    // every token present
    var tokens = q.split(/\s+/);
    if (tokens.length > 1 && tokens.every(function (t) { return hay.indexOf(t) > -1; })) return 30;
    return 0;
  }

  function openPalette(prefill) {
    if (overlayEl) { var i = $('#ux-palette-input'); if (i) i.focus(); return; }
    lastFocused = document.activeElement;
    overlayEl = document.createElement('div');
    overlayEl.className = 'ux-overlay';
    overlayEl.id = 'ux-command-palette';
    overlayEl.innerHTML =
      '<div class="ux-palette" role="dialog" aria-modal="true" aria-label="Command palette">' +
        '<div class="ux-palette-search">' +
          '<span class="ux-palette-search-icon">' + icon('search') + '</span>' +
          '<input id="ux-palette-input" class="ux-palette-input" type="text" autocomplete="off" spellcheck="false" aria-label="Search commands" placeholder="Search pages, servers and actions…">' +
          '<kbd>ESC</kbd>' +
        '</div>' +
        '<div class="ux-palette-results" id="ux-palette-results" role="listbox"></div>' +
        '<div class="ux-palette-footer">' +
          '<span><kbd>Up</kbd><kbd>Down</kbd> navigate</span>' +
          '<span><kbd>Enter</kbd> select</span>' +
          '<span><kbd>esc</kbd> close</span>' +
          '<span style="margin-left:auto;opacity:.7">TG-PANEL Command</span>' +
        '</div>' +
      '</div>';
    overlayEl.addEventListener('mousedown', function (e) { if (e.target === overlayEl) closePalette(); });
    document.body.appendChild(overlayEl);

    var input = $('#ux-palette-input', overlayEl);
    input.value = prefill || '';
    input.addEventListener('input', function () { renderResults(input.value); });
    input.addEventListener('keydown', paletteKeydown);
    $$('.ux-palette-item', overlayEl).forEach(function (b, idx) {
      b.addEventListener('mouseenter', function () { activeIndex = idx; markActive(); });
    });
    renderResults(input.value);
    setTimeout(function () { input.focus(); input.select(); }, 10);
    announce('Command palette opened');
  }

  function closePalette() {
    if (!overlayEl) return;
    overlayEl.remove();
    overlayEl = null;
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function renderResults(query) {
    if (!overlayEl) return;
    var all = baseCommands();
    filtered = all.map(function (item) { return { item: item, score: fuzzyScore(item, query) }; })
      .filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 40)
      .map(function (r) { return r.item; });
    activeIndex = 0;

    var box = $('#ux-palette-results', overlayEl);
    if (!filtered.length) {
      box.innerHTML = '<div class="ux-palette-empty">No results for “' + esc(query) + '”.<br><span style="font-size:11px;opacity:.7">Try a page name, a server, or “theme”.</span></div>';
      return;
    }
    var groups = {};
    filtered.forEach(function (item, idx) {
      var g = item.group || 'Other';
      if (!groups[g]) groups[g] = [];
      groups[g].push({ item: item, idx: idx });
    });
    var order = ['Recent', 'Navigation', 'Servers', 'Actions', 'Other'];
    var names = Object.keys(groups).sort(function (a, b) {
      var ai = order.indexOf(a), bi = order.indexOf(b);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
    box.innerHTML = names.map(function (g) {
      return '<div class="ux-palette-group-label">' + esc(g) + '</div>' + groups[g].map(function (entry) {
        return '<button type="button" class="ux-palette-item" role="option" data-index="' + entry.idx + '">' +
          '<span class="ux-palette-item-icon">' + icon(entry.item.icon || 'sparkles') + '</span>' +
          '<span class="ux-palette-item-text"><strong>' + esc(entry.item.label) + '</strong><small>' + esc(entry.item.hint || '') + '</small></span>' +
          '<span class="ux-palette-item-hint">Go</span>' +
        '</button>';
      }).join('');
    }).join('');

    $$('.ux-palette-item', box).forEach(function (btn) {
      btn.addEventListener('mouseenter', function () { activeIndex = parseInt(btn.getAttribute('data-index'), 10); markActive(); });
      btn.addEventListener('click', function () { execute(parseInt(btn.getAttribute('data-index'), 10)); });
    });
    markActive();
  }

  function markActive() {
    if (!overlayEl) return;
    var items = $$('.ux-palette-item', overlayEl);
    items.forEach(function (b, i) { b.classList.toggle('is-active', i === activeIndex); });
    var active = items[activeIndex];
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });
  }

  function execute(index) {
    var item = filtered[index];
    if (!item) return;
    closePalette();
    try { item.run(); } catch (e) {
      console.error('[TGUX] command failed:', e);
      toast('That action could not be completed', 'error');
    }
  }

  function paletteKeydown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(filtered.length - 1, activeIndex + 1); markActive(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(0, activeIndex - 1); markActive(); }
    else if (e.key === 'Enter') { e.preventDefault(); execute(activeIndex); }
    else if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
    else if (e.key === 'Tab') { e.preventDefault(); }
  }

  /* ------------------------------------------------------------------ *
   * Keyboard shortcut help
   * ------------------------------------------------------------------ */
  var helpEl = null;
  var SHORTCUTS = [
    ['Open command palette', ['Ctrl', 'K']],
    ['Keyboard shortcuts', ['?']],
    ['Go to overview', ['G', 'O']],
    ['Go to my servers', ['G', 'S']],
    ['Go to console', ['G', 'C']],
    ['Go to file manager', ['G', 'F']],
    ['Go to admin area', ['G', 'A']],
    ['Go to profile', ['G', 'P']],
    ['Toggle dark / light', ['T']],
    ['Appearance settings', ['Ctrl', '⇧', 'P']],
    ['Focus search / palette', ['/']],
    ['Close any dialog', ['Esc']]
  ];

  function openHelp() {
    if (helpEl) { closeHelp(); return; }
    helpEl = document.createElement('div');
    helpEl.className = 'ux-overlay';
    helpEl.id = 'ux-help-overlay';
    helpEl.innerHTML =
      '<div class="ux-help" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">' +
        '<h3>Keyboard shortcuts</h3>' +
        '<p>Move around the panel without lifting your hands off the keyboard.</p>' +
        '<div class="ux-help-grid">' + SHORTCUTS.map(function (row) {
          return '<div class="ux-help-row"><span>' + esc(row[0]) + '</span><div>' + row[1].map(function (k) { return '<kbd>' + esc(k) + '</kbd>'; }).join('') + '</div></div>';
        }).join('') + '</div>' +
        '<p style="margin:18px 0 0;font-size:10.5px">Tip: press <kbd>Ctrl</kbd> <kbd>K</kbd> and type anything — pages, servers, or actions.</p>' +
      '</div>';
    helpEl.addEventListener('mousedown', function (e) { if (e.target === helpEl) closeHelp(); });
    document.body.appendChild(helpEl);
  }
  function closeHelp() {
    if (helpEl) helpEl.remove();
    helpEl = null;
  }

  /* ------------------------------------------------------------------ *
   * Global shortcuts
   * ------------------------------------------------------------------ */
  var chord = { key: '', at: 0 };
  function isTyping(target) {
    if (!target) return false;
    var tag = target.tagName;
    return target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  function onKeydown(e) {
    var mod = e.ctrlKey || e.metaKey;

    if (e.key === 'Escape') {
      if (overlayEl) { closePalette(); return; }
      if (helpEl) { closeHelp(); return; }
      if (appearanceEl) { closeAppearance(); return; }
      var modal = document.getElementById('modal-container');
      if (modal && modal.children.length && window.auth && typeof window.auth.closeModal === 'function') {
        window.auth.closeModal();
      }
      return;
    }

    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      overlayEl ? closePalette() : openPalette();
      return;
    }
    if (mod && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault(); toggleAppearance(); return;
    }
    if (mod && e.key === '/') { e.preventDefault(); openHelp(); return; }

    if (isTyping(e.target) || mod || e.altKey) return;

    if (e.key === '?' || (e.key === '/' && e.shiftKey)) { e.preventDefault(); openHelp(); return; }
    if (e.key === '/') { e.preventDefault(); openPalette(); return; }

    // Two-key "g" chords
    var now = Date.now();
    if (chord.key === 'g' && now - chord.at < 1100) {
      var serverId = window.app && window.app.currentServerId;
      var map = {
        o: 'user-overview',
        s: 'user-servers',
        c: serverId ? 'server-manage/' + serverId + '/console' : 'user-servers',
        f: serverId ? 'server-manage/' + serverId + '/files' : 'user-servers',
        a: 'admin-overview',
        p: 'user-profile',
        m: 'user-marketplace',
        l: 'user-activity'
      };
      var dest = map[e.key.toLowerCase()];
      chord = { key: '', at: 0 };
      if (dest) {
        e.preventDefault();
        if (!serverId && (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'f')) {
          toast('Select a server first', 'info');
        }
        go(dest);
        return;
      }
    }
    if (e.key.toLowerCase() === 'g') { chord = { key: 'g', at: Date.now() }; return; }
    chord = { key: '', at: 0 };

    if (e.key.toLowerCase() === 't') { e.preventDefault(); toggleMode(); }
  }

  /* ------------------------------------------------------------------ *
   * Router integration: transitions, titles, active state, recents
   * ------------------------------------------------------------------ */
  function onViewChange(view) {
    var container = document.getElementById('view-container');
    if (container) {
      container.style.animation = 'none';
      // Reflow to restart the CSS keyframe on every navigation.
      void container.offsetWidth;
      container.style.animation = '';
    }
    var main = document.getElementById('main-content');
    if (main) main.scrollTop = 0;
    rememberView(view);
    markActiveNav(view);
    var base = (document.getElementById('tab-title') || {}).textContent || 'TG-PANEL';
    document.title = view ? viewLabel(view) + ' · ' + base : base;
  }

  function markActiveNav(view) {
    $$('a.nook-nav-item').forEach(function (link) {
      var id = (link.id || '').replace(/^nav-/, '');
      var active = id && view && (view === id || view.indexOf(id) === 0);
      link.classList.toggle('active', !!active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function wrapRouter() {
    if (!window.app) return;
    if (typeof window.app.navigate === 'function' && !window.app.navigate.__uxWrapped) {
      var originalNavigate = window.app.navigate;
      var wrappedNavigate = function (view, params) {
        onViewChange(String(view || '').replace(/^#/, ''));
        return originalNavigate.call(this, view, params);
      };
      wrappedNavigate.__uxWrapped = true;
      window.app.navigate = wrappedNavigate;
    }
    if (typeof window.app.handleRoute === 'function' && !window.app.handleRoute.__uxWrapped) {
      var originalRoute = window.app.handleRoute;
      var wrappedRoute = function () {
        var view = window.location.hash.replace(/^#/, '') || 'user-overview';
        onViewChange(view);
        return originalRoute.apply(this, arguments);
      };
      wrappedRoute.__uxWrapped = true;
      window.app.handleRoute = wrappedRoute;
    }
    // Keep prefs in sync if another controller toggles the theme.
    if (typeof window.app.toggleTheme === 'function' && !window.app.toggleTheme.__uxWrapped) {
      var originalTheme = window.app.toggleTheme;
      var wrappedTheme = function () {
        var result = originalTheme.apply(this, arguments);
        setTimeout(syncThemeButton, 0);
        return result;
      };
      wrappedTheme.__uxWrapped = true;
      window.app.toggleTheme = wrappedTheme;
    }
  }

  /* ------------------------------------------------------------------ *
   * Lazy-load servers into the palette (best effort, never blocks UI)
   * ------------------------------------------------------------------ */
  function loadServers() {
    try {
      var token = localStorage.getItem('mpanel_token');
      if (!token || !window.fetch) return;
      window.fetch('/api/servers', { headers: { Authorization: 'Bearer ' + token } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data) return;
          var list = Array.isArray(data) ? data : (data.servers || data.data || []);
          if (!Array.isArray(list)) return;
          serverCommands = list.slice(0, 30).map(function (s) {
            return {
              label: s.name || ('Server #' + s.id),
              hint: (s.status || 'server') + ' · #' + s.id,
              group: 'Servers',
              icon: 'server',
              keywords: (s.name || '') + ' ' + (s.server_type || '') + ' ' + (s.id || ''),
              run: function () { go('server-manage/' + s.id + '/console'); if (window.app) window.app.currentServerId = s.id; }
            };
          });
        })
        .catch(function () {});
    } catch (e) {}
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  function init() {
    loadPrefs();
    applyPrefs();
    injectShell();
    injectHeaderControls();
    patchFetch();
    enhanceForms(document);
    wrapTables(document);
    hydrateIcons(document);
    observeMutations();
    wrapRouter();
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-ux-palette]');
      if (t) { e.preventDefault(); openPalette(); }
    }, true);
    // External error visibility for silently failing views.
    window.addEventListener('unhandledrejection', function (e) {
      if (e && e.reason && /Failed to fetch|NetworkError/i.test(String(e.reason.message || e.reason))) {
        toast('Network request failed — check your connection', 'error');
      }
    });
    var currentView = window.location.hash.replace(/^#/, '') || 'user-overview';
    markActiveNav(currentView);
    // Re-apply once async controllers / dynamic sidebars have finished rendering.
    setTimeout(function () {
      syncThemeButton();
      loadServers();
      markActiveNav(window.location.hash.replace(/^#/, '') || 'user-overview');
    }, 350);
    // First-run hint (once per browser).
    try {
      if (!localStorage.getItem('tgpanel_ux_hint_v4')) {
        localStorage.setItem('tgpanel_ux_hint_v4', '1');
        setTimeout(function () { toast('Tip: press Ctrl + K to open the command palette', 'info'); }, 2200);
      }
    } catch (e) {}
  }

  window.TGUX = {
    version: '4.0.0',
    openPalette: openPalette,
    closePalette: closePalette,
    openAppearance: toggleAppearance,
    closeAppearance: closeAppearance,
    openHelp: openHelp,
    closeHelp: closeHelp,
    setPref: setPref,
    resetPrefs: resetPrefs,
    registerCommand: registerCommand,
    toast: toast,
    get prefs() { return Object.assign({}, prefs); },
    icon: icon
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
