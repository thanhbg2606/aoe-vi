/**
 * Việt hóa Age of Empires (1997) trên https://vivalarts.com
 *
 * Cách hoạt động:
 *   - Game lấy mọi dòng chữ từ một module JS của trang: /assets/strings-<hash>.js.
 *     Module này export object { language, languagex } dạng { "<ID>": "chữ tiếng Anh" }.
 *   - Script tìm module đó, rồi thay chữ tiếng Anh bằng bản dịch trong thư mục lang/vi/.
 *   - Mỗi lần vẽ chữ game đều tra lại bảng này, nên thay xong là thấy ngay.
 *   - Một số màn hình trên điện thoại vẽ nút bằng HTML: phần translateDom() lo việc này.
 *
 * Cách nạp: file này là ES module, được gọi bằng
 *   import('https://cdn.jsdelivr.net/gh/<user>/aoe-vi@master/main.js')
 * Gọi lần nữa khi đã nạp thì chỉ bật/tắt tiếng Việt (xem window.__aoeVI.toggle()).
 */

// ---------------------------------------------------------------------------
// Cấu hình
// ---------------------------------------------------------------------------

/** Thư mục chứa bản dịch, tính theo vị trí của chính file này. */
const LANG_DIR = new URL('./lang/vi/', import.meta.url);

/** Phím tắt bật/tắt: Alt + L */
const TOGGLE_KEY = 'KeyL';

/** Chỉ áp dụng cho bảng chuỗi của AoE1 (ID 1001 = "Age of Empires"). */
const isAoeTable = (obj) =>
  obj && typeof obj === 'object' &&
  obj.language && typeof obj.language === 'object' &&
  /Age of Empires/.test(obj.language['1001'] || '');

/** ID < 1000 là cấu hình font của game, không được đụng vào. */
const MIN_TEXT_ID = 1000;

/** Câu lặp lại nhiều lần với tên khác nhau: dịch theo mẫu thay vì từng ID. */
const RULES = [
  [/^(.+?) - Heroes have special attributes, as shown in the status box in the lower-left corner of the game screen\.$/,
    (_, name) => `${name.replace(/^Hero /, 'Anh hùng ')} - Anh hùng có thuộc tính đặc biệt, xem ô trạng thái ở góc dưới bên trái màn hình.`],
  [/^(Traitor|Mercenary) - .+ have special attributes, .+$/,
    (_, name) => `${name === 'Traitor' ? 'Kẻ phản bội' : 'Lính đánh thuê'} - Có thuộc tính đặc biệt, xem ô trạng thái ở góc dưới bên trái màn hình.`],
];

/** Font của nút HTML (Copperplate) hiển thị sai dấu tiếng Việt -> đổi font khi bật. */
const VI_CSS = `html.aoe-vi [class*="w1-aoe1"] {
  font-family: "Times New Roman", "Noto Serif", "Droid Serif", serif !important;
  letter-spacing: 0 !important;
}`;

// ---------------------------------------------------------------------------
// Trạng thái
// ---------------------------------------------------------------------------

const log = (...args) => console.log('%c[AoE-VI]', 'color:#c90;font-weight:bold', ...args);

let enabled = true;
const tables = [];             // [{ tbl, orig, vi }] – bảng gốc, bản sao tiếng Anh, bản tiếng Việt
const patched = new WeakSet(); // bảng chuỗi đã xử lý
const domMap = new Map();      // tiếng Anh -> tiếng Việt, dùng cho chữ HTML
const domOrig = new WeakMap(); // text node -> chữ tiếng Anh gốc

// ---------------------------------------------------------------------------
// 1. Nạp bản dịch: lang/vi/index.json liệt kê các file, mỗi file dạng
//    { "<ID>": ["English", "Tiếng Việt"], ... }
// ---------------------------------------------------------------------------

async function loadTranslations() {
  const index = await fetch(new URL('index.json', LANG_DIR)).then((r) => r.json());
  const parts = await Promise.all(
    index.files.map((f) =>
      fetch(new URL(f, LANG_DIR))
        .then((r) => r.json())
        .catch((e) => { console.warn('[AoE-VI] không tải được', f, e); return {}; })
    )
  );
  return Object.assign({}, ...parts);
}

// ---------------------------------------------------------------------------
// 2. Áp bản dịch vào bảng chuỗi của game
// ---------------------------------------------------------------------------

/** Lấy danh sách %s, %d, %% để đảm bảo bản dịch giữ đúng chỗ điền số liệu. */
const formatSpecs = (s) => (s.match(/%%|%[0-9.]*[sdcuxif]/g) || []).join(',');

/** Từ file dịch, tạo bảng tra "câu tiếng Anh -> câu tiếng Việt". */
function buildEnToVi(lang, translations) {
  const enToVi = new Map();
  for (const tbl of [lang.languagex, lang.language]) {
    if (!tbl) continue;
    for (const [id, [en, vi]] of Object.entries(translations)) {
      const current = tbl[id];
      if (typeof current !== 'string' || enToVi.has(current)) continue;
      if (current !== en) {
        console.warn(`[AoE-VI] ID ${id}: chữ gốc đã đổi, bỏ qua bản dịch`, { file: en, game: current });
        continue;
      }
      if (formatSpecs(en) !== formatSpecs(vi)) {
        console.warn(`[AoE-VI] ID ${id}: bản dịch lệch %s/%d, bỏ qua`, { en, vi });
        continue;
      }
      enToVi.set(en, vi);
    }
  }
  return enToVi;
}

function translateText(en, enToVi) {
  if (enToVi.has(en)) return enToVi.get(en);
  for (const [pattern, replace] of RULES) {
    if (pattern.test(en)) return en.replace(pattern, replace);
  }
  return null;
}

function applyToTable(lang, translations) {
  if (patched.has(lang)) return;
  patched.add(lang);

  const enToVi = buildEnToVi(lang, translations);
  let count = 0;

  for (const tbl of [lang.language, lang.languagex]) {
    if (!tbl) continue;
    const orig = { ...tbl };
    const vi = {};
    for (const [id, en] of Object.entries(orig)) {
      if (+id < MIN_TEXT_ID || typeof en !== 'string') continue;
      const text = translateText(en, enToVi);
      if (text != null) { vi[id] = text; count++; }
    }
    tables.push({ tbl, orig, vi });
    for (const id in vi) domMap.set(orig[id], vi[id]);
  }

  setEnabled(true);
  startDomObserver();
  log(`Đã nạp ${count} chuỗi tiếng Việt. Bấm lại dấu trang hoặc Alt+L để bật/tắt.`);
}

// ---------------------------------------------------------------------------
// 3. Bật / tắt
// ---------------------------------------------------------------------------

function setEnabled(on, toast = true) {
  enabled = on;
  for (const { tbl, orig, vi } of tables) Object.assign(tbl, on ? vi : orig);
  if (document.body) translateDom(document.body);
  ensureStyle();
  document.documentElement.classList.toggle('aoe-vi', on);
  if (toast) showToast(on ? 'Tiếng Việt: BẬT' : 'Tiếng Việt: TẮT (English)');
}

function ensureStyle() {
  if (document.getElementById('aoe-vi-style')) return;
  const style = document.createElement('style');
  style.id = 'aoe-vi-style';
  style.textContent = VI_CSS;
  (document.head || document.documentElement).appendChild(style);
}

function showToast(message) {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = [
    'position:fixed', 'top:12px', 'left:50%', 'transform:translateX(-50%)', 'z-index:2147483647',
    'background:rgba(0,0,0,.8)', 'color:#ffd36b', 'padding:8px 16px', 'border:1px solid #ffd36b',
    'border-radius:6px', 'font:bold 14px Arial,sans-serif', 'pointer-events:none',
  ].join(';');
  (document.body || document.documentElement).appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// ---------------------------------------------------------------------------
// 4. Chữ HTML (giao diện điện thoại/tablet): dịch text node trong khối w1-aoe1*
// ---------------------------------------------------------------------------

const insideAoe = (el) => el?.closest?.('[class*="w1-aoe1"],[class*="w1-aoload"]');

function translateNode(node) {
  if (!insideAoe(node.parentElement)) return;
  const current = node.nodeValue;
  const trimmed = current.trim();

  let en = domOrig.get(node);
  // Game đổi sang chữ khác -> coi chữ mới là gốc
  if (en === undefined || (trimmed !== en && trimmed !== domMap.get(en))) en = trimmed;
  if (!domMap.has(en)) { domOrig.delete(node); return; }
  domOrig.set(node, en);

  const wanted = enabled ? domMap.get(en) : en;
  if (trimmed !== wanted) node.nodeValue = current.replace(trimmed, wanted);
}

function translateDom(root) {
  if (!domMap.size) return;
  if (root.nodeType === Node.TEXT_NODE) return translateNode(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) translateNode(n);
}

let observing = false;
function startDomObserver() {
  if (observing) return;
  observing = true;
  translateDom(document.body);
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData') translateNode(m.target);
      else m.addedNodes.forEach((n) => (n.nodeType === 1 || n.nodeType === 3) && translateDom(n));
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}

// ---------------------------------------------------------------------------
// 5. Tìm module bảng chuỗi của trang
// ---------------------------------------------------------------------------

const isStringsUrl = (url) => /\/assets\/strings-[\w-]+\.js(\?|$)/.test(url);

function findStringModules(onFound) {
  const tried = new Set();
  const tryUrl = async (url) => {
    if (tried.has(url)) return;
    tried.add(url);
    try {
      const mod = await import(url); // cùng URL -> cùng instance module với game
      for (const value of Object.values(mod)) if (isAoeTable(value)) onFound(value);
    } catch { /* không phải module chuỗi */ }
  };

  // a) Các file strings-*.js trang đã hoặc sẽ tải
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) if (isStringsUrl(e.name)) tryUrl(e.name);
  }).observe({ type: 'resource', buffered: true });

  // b) Dự phòng: dò tên file trong bundle chính
  for (const script of document.querySelectorAll('script[src*="/assets/"]')) {
    fetch(script.src)
      .then((r) => r.text())
      .then((code) => {
        for (const m of code.matchAll(/assets\/strings-[\w-]+\.js/g)) tryUrl(new URL('/' + m[0], location.origin).href);
      })
      .catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Khởi động
// ---------------------------------------------------------------------------

if (window.__aoeVI) {
  window.__aoeVI.toggle(); // đã nạp rồi: chỉ bật/tắt
} else {
  window.__aoeVI = {
    toggle: () => setEnabled(!enabled),
    get enabled() { return enabled; },
  };

  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.code === TOGGLE_KEY || e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      e.stopPropagation();
      setEnabled(!enabled);
    }
  }, true);

  const start = async () => {
    const translations = await loadTranslations();
    log(`Đã tải ${Object.keys(translations).length} bản dịch.`);
    findStringModules((lang) => applyToTable(lang, translations));
  };

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
}
