/**
 * Trang giả lập vivalarts.com để kiểm thử end-to-end mà không cần mạng.
 * Mô phỏng đúng những gì script dựa vào:
 *   - module /assets/strings-<hash>.js export { language, languagex }, và một module strings-*
 *     khác của game khác (không được đụng vào)
 *   - game tra chữ bằng languagex[id] ?? language[id] mỗi lần vẽ
 *   - nút HTML w1-aoe1btn tạo sẵn trước khi script chạy (giao diện điện thoại)
 *   - khung chiến dịch HTML div.w1-aoe1brief (điện thoại)
 *   - hàm ngắt dòng của game (bản sao của form-*.js) + vẽ tên lên canvas (máy tính)
 * Script được phục vụ từ thư mục repo qua địa chỉ giả CDN.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const { chromium } = createRequire(import.meta.url)('playwright');

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const CDN = 'https://cdn.test/aoe-vi/';

const read = (f) => JSON.parse(readFileSync(path.join(REPO, f), 'utf8'));

/** Một màn chiến dịch thật (từ file dịch), câu gốc đổi xuống dòng thành CRLF như trong game. */
const camp = read('lang/vi/campaigns/expans_4.json');
const sc = camp.scenarios[0];
const crlf = (s) => s.replace(/\n/g, '\r\n');
export const SAMPLE = {
  campaign: camp.name, name: sc.name, file: sc.file,
  description: [crlf(sc.description[0]), sc.description[1]],
  hints: [crlf(sc.hints[0]), sc.hints[1]],
};

export const LANGUAGE = {
  101: '1',
  1001: 'Age of Empires',
  1101: 'Loading game data...',
  3009: '%s paid %d gold in tribute to you.',
  4002: 'Cancel CHANGED',            // câu gốc khác file dịch -> phải bỏ qua
  4301: 'Food',
  5003: 'Discovery',
  9202: 'Single Player',
  9207: 'Exit',
  9860: 'Exit',
  9661: 'Victory: %s (%d%%)',
  9999: 'Untranslated thing',
  39586: 'Alexander - Heroes have special attributes, as shown in the status box in the lower-left corner of the game screen.',
};

const stringsModule = `var e={language:${JSON.stringify(LANGUAGE)},languagex:{"4301":"Food"}};export{e as t};`;
const otherGameStrings = `var e=JSON.parse(\`["","Attack","Move"]\`);export{e as t};`;

const app = `
import { t as S } from "./strings-AAA.js";
import "./strings-BBB.js";
window.lookup = (i) => S.languagex[i] ?? S.language[i] ?? '#' + i;
window.SAMPLE = ${JSON.stringify(SAMPLE)};

// Nút menu điện thoại, tạo trước khi script Việt hóa chạy
const col = document.createElement('div'); col.className = 'w1-mcol w1-aoe1col';
const btn = (txt) => { const b = document.createElement('button'); b.className = 'w1-btn w1-aoe1btn'; b.textContent = txt; col.appendChild(b); return b; };
btn(lookup(9202)); btn(lookup(9207));
document.body.appendChild(col);
const outside = document.createElement('span'); outside.id = 'outside'; outside.textContent = 'Exit';
document.body.appendChild(outside);

// Màn hình chiến dịch (điện thoại): danh sách + khung hướng dẫn
window.openCampaign = () => {
  const w = document.createElement('div'); w.className = 'w1-overlay w1-aoe1camp';
  for (const t of [SAMPLE.campaign[0], SAMPLE.name[0]]) {
    const l = document.createElement('button'); l.className = 'w1-aoe1line'; l.textContent = t; w.appendChild(l);
  }
  const brief = document.createElement('div'); brief.className = 'w1-aoe1brief'; brief.textContent = SAMPLE.description[0];
  w.appendChild(brief); document.body.appendChild(w);
  window.showHints = () => { brief.textContent = SAMPLE.hints[0]; };
  return w;
};

// Bản sao hàm ngắt dòng của game (form-*.js), có bộ nhớ đệm như bản gốc
const J = new Map();
function se(e, t, n) {
  let r = n + '\\n' + t + '\\n' + e, i = J.get(r); if (i) return i;
  let a = [];
  for (let r of e.replace(/\\r\\n?/g, '\\n').split('\\n')) {
    let e = '';
    for (let i of r.split(' ')) { let r = e ? e + ' ' + i : i; e && r.length * 7 > n ? (a.push(e), e = i) : e = r; }
    a.push(e);
  }
  return J.size > 32 && J.clear(), J.set(r, a), a;
}
window.wrap = (txt) => { J.clear(); return se(txt, '11px Arial', 740); };
window.textWidth = (txt) => document.createElement('canvas').getContext('2d').measureText(txt).width;
`;

/** Mở trang giả lập. which: 'src/main.js' hoặc 'dist/aoe-vi.min.js' */
export async function openSite(browser, { viewport } = {}) {
  const page = await browser.newPage(viewport ? { viewport } : undefined);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.errors = errors;
  await page.route(`${CDN}**`, (route) => {
    const rel = decodeURIComponent(new URL(route.request().url()).pathname.replace('/aoe-vi/', ''));
    const file = path.join(REPO, rel);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: 'not found' });
    route.fulfill({
      contentType: file.endsWith('.json') ? 'application/json; charset=utf-8' : 'application/javascript; charset=utf-8',
      headers: { 'access-control-allow-origin': '*' },
      body: readFileSync(file),
    });
  });
  await page.route('https://vivalarts.test/**', (route) => {
    const url = route.request().url();
    const js = (body) => route.fulfill({ contentType: 'text/javascript', body });
    if (url.endsWith('/assets/strings-AAA.js')) return js(stringsModule);
    if (url.endsWith('/assets/strings-BBB.js')) return js(otherGameStrings);
    if (url.endsWith('/assets/index-X.js')) return js(app);
    return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><script type="module" src="/assets/index-X.js"></script></head><body></body></html>' });
  });
  await page.goto('https://vivalarts.test/');
  await page.waitForFunction(() => typeof window.lookup === 'function');
  return page;
}

/** Chạy giống bấm dấu trang. */
export async function runBookmark(page, which) {
  const href = `javascript:void(window.__aoeVI?__aoeVI.toggle():import('${CDN}${which}'))`;
  await page.evaluate((h) => { const a = document.createElement('a'); a.href = h; document.body.appendChild(a); a.click(); a.remove(); }, href);
}

export async function waitLoaded(page) {
  await page.waitForFunction(() => window.lookup(9202) !== 'Single Player', null, { timeout: 5000 });
}
