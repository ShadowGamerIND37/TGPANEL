#!/usr/bin/env node
/* ==========================================================================
 * TG-PANEL UI smoke test
 * --------------------------------------------------------------------------
 * Static checks always run (no dependencies). If jsdom is available, it also
 * boots the real UX engine against preview.html and exercises the palette,
 * appearance settings and keyboard handling.
 *
 *   node test/ui-smoke.js
 *   npm i -D jsdom && node test/ui-smoke.js   # full DOM coverage
 * ========================================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
let failures = 0;

function check(name, condition, detail) {
  const ok = !!condition;
  console.log(`${ok ? '  ✅' : '  ❌'} ${name}${!ok && detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
}

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

console.log('\n🔍 Static UI checks');
const indexHtml = read('public/index.html');
const previewHtml = read('public/preview.html');
const premiumCss = read('public/css/premium.css');
const uxJs = read('public/js/ux.js');

check('premium.css is linked in index.html', /id="ux-premium-css"[^>]+premium\.css/.test(indexHtml));
check('ux.js is loaded in index.html', /<script src="\/js\/ux\.js/.test(indexHtml));
check('premium.css loads after the theme stylesheets',
  indexHtml.indexOf('ux-premium-css') > indexHtml.indexOf('/css/themes/lucent.css'));
check('header actions hook exists', /id="header-actions"/.test(indexHtml));
check('no unexpanded template literal in an HTML src attribute',
  !/src="[^"]*\$\{Date\.now\(\)\}/.test(indexHtml));
check('no-script fallback present', /<noscript>/.test(indexHtml));
check('viewport permits zoom (accessibility)', !/user-scalable=no/.test(indexHtml));

const openBraces = (premiumCss.match(/{/g) || []).length;
const closeBraces = (premiumCss.match(/}/g) || []).length;
check('premium.css braces are balanced', openBraces === closeBraces, `${openBraces} open / ${closeBraces} close`);
check('design tokens defined', /--ux-accent-rgb/.test(premiumCss) && /--ux-header-h/.test(premiumCss));
check('light mode + reduced motion supported', /html\.light/.test(premiumCss) && /prefers-reduced-motion/.test(premiumCss));
check('command palette styles present', /\.ux-palette/.test(premiumCss));
check('UX engine exposes public API', /window\.TGUX\s*=/.test(uxJs));

// Every local asset referenced by both HTML files must exist on disk.
for (const [label, html] of [['index.html', indexHtml], ['preview.html', previewHtml]]) {
  const refs = [...html.matchAll(/(?:src|href)="(\/[^"#?][^"]*)"/g)]
    .map(m => m[1].split('?')[0])
    .filter(p => !p.startsWith('/api') && !p.startsWith('/ws'));
  const missing = [...new Set(refs)].filter(p => !fs.existsSync(path.join(PUBLIC, p)));
  check(`${label} has no broken local references`, missing.length === 0, missing.join(', '));
}

// The Express bootstrap should never hang on unknown API routes.
const serverSrc = read('src/index.js');
check('unknown API routes return JSON 404', /app\.use\('\/api'[\s\S]{0,180}status\(404\)\.json/.test(serverSrc));
check('health endpoint present', /app\.get\('\/api\/health'/.test(serverSrc));
check('error handler present', /app\.use\(\(err, req, res, next\)/.test(serverSrc));

console.log('\n🧪 DOM checks (jsdom)');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('  ⏭  jsdom not installed — skipping DOM assertions.');
  console.log('     Run `npm i -D jsdom` for full coverage.\n');
} else {
  const errors = [];
  const { VirtualConsole } = require('jsdom');
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', e => errors.push(e.message));
  virtualConsole.on('error', (...args) => errors.push(args.join(' ')));

  const dom = new JSDOM(previewHtml, {
    url: 'http://localhost:4173/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      window.Element.prototype.scrollIntoView = function () {};
      window.HTMLElement.prototype.scrollTo = function () {};
      window.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      // Mirror the browser: /js/ux.js executes before the following inline script.
      window.eval(uxJs);
    }
  });

  const { window } = dom;
  const { document } = window;

  const finish = () => {
    check('UX engine initialised without runtime errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    check('TGUX API is available', !!window.TGUX && window.TGUX.version === '4.0.0');
    check('command palette trigger injected into header', !!document.getElementById('ux-search-trigger'));
    check('appearance button injected into header', !!document.getElementById('ux-appearance-btn'));
    check('status pill injected into header', !!document.getElementById('ux-status-pill'));
    check('skip link + live region injected', !!document.getElementById('ux-skip-link') && !!document.getElementById('ux-live-region'));
    check('icons rendered from the offline icon set', document.querySelectorAll('[data-icon] svg').length > 10);
    check('nav items have an accessible current-page marker', document.querySelectorAll('.nook-nav-item[aria-current]').length > 0);

    // Command palette
    window.TGUX.openPalette();
    let palette = document.getElementById('ux-command-palette');
    check('command palette opens', !!palette);
    let results = document.querySelectorAll('.ux-palette-item');
    check('command palette lists navigation commands', results.length >= 8, `found ${results.length}`);
    const input = document.getElementById('ux-palette-input');
    input.value = 'theme';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    const themeResults = document.querySelectorAll('.ux-palette-item').length;
    check('command palette filters results', themeResults > 0 && themeResults < results.length, `${themeResults} results for "theme"`);
    input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    check('Escape closes the command palette', !document.getElementById('ux-command-palette'));

    // Appearance
    window.TGUX.setPref('accent', 'violet');
    check('accent preference applies to the document', document.documentElement.getAttribute('data-ux-accent') === 'violet');
    window.TGUX.setPref('density', 'compact');
    check('density preference applies to the document', document.documentElement.getAttribute('data-ux-density') === 'compact');
    window.TGUX.setPref('motion', 'reduced');
    check('motion preference applies to the document', document.documentElement.getAttribute('data-ux-motion') === 'reduced');
    window.TGUX.resetPrefs();
    check('preferences reset to defaults', document.documentElement.getAttribute('data-ux-accent') === 'cyan');

    // Help + shortcuts
    window.TGUX.openHelp();
    check('shortcut help opens', !!document.getElementById('ux-help-overlay'));
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    check('Escape closes the shortcut help', !document.getElementById('ux-help-overlay'));
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    check('Ctrl+K opens the command palette', !!document.getElementById('ux-command-palette'));
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    check('no runtime errors after interactions', errors.length === 0, errors.slice(0, 3).join(' | '));
    dom.window.close();
    console.log('');
  };

  setTimeout(finish, 120);
}

process.on('beforeExit', () => {
  console.log(failures === 0 ? '✅ UI smoke test passed.\n' : `❌ ${failures} UI check(s) failed.\n`);
  if (failures) process.exitCode = 1;
});
