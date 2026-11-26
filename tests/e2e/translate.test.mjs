/**
 * Kiểm thử end-to-end trên trang giả lập (tests/e2e/mock-site.mjs), chạy cho cả
 * bản phát triển (src/main.js) và bản build (dist/aoe-vi.min.js).
 * Cần chạy `npm run build` trước (npm test đã làm sẵn).
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, openSite, runBookmark, waitLoaded, SAMPLE } from './mock-site.mjs';

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

for (const which of ['src/main.js', 'dist/aoe-vi.min.js']) {
  describe(which, () => {
    let page;
    before(async () => {
      page = await openSite(browser);
      await runBookmark(page, which);
      await waitLoaded(page);
      await page.waitForTimeout(200);
    });
    after(async () => { assert.deepEqual(page.errors, []); await page.close(); });

    test('dịch bảng chuỗi của game', async () => {
      const r = await page.evaluate(() => [9202, 1101, 4301, 5003].map(window.lookup));
      assert.deepEqual(r, ['Chơi đơn', 'Đang tải dữ liệu game...', 'Thức ăn', 'Thánh địa']);
    });

    test('giữ %s, %d, %% và không đụng ID < 1000', async () => {
      const r = await page.evaluate(() => [3009, 9661, 101].map(window.lookup));
      assert.deepEqual(r, ['%s đã cống nạp %d vàng cho bạn.', 'Chiến thắng: %s (%d%%)', '1']);
    });

    test('câu dùng chung được dịch ở mọi ID; câu chưa dịch giữ nguyên', async () => {
      const r = await page.evaluate(() => [9207, 9860, 9999].map(window.lookup));
      assert.deepEqual(r, ['Thoát', 'Thoát', 'Untranslated thing']);
    });

    test('bỏ qua bản dịch khi câu gốc của game đã đổi', async () => {
      assert.equal(await page.evaluate(() => window.lookup(4002)), 'Cancel CHANGED');
    });

    test('dịch theo mẫu (anh hùng)', async () => {
      assert.match(await page.evaluate(() => window.lookup(39586)), /^Alexander - Anh hùng có thuộc tính đặc biệt/);
    });

    test('không đụng bảng chuỗi của game khác', async () => {
      const r = await page.evaluate(async () => (await import('/assets/strings-BBB.js')).t);
      assert.deepEqual(r, ['', 'Attack', 'Move']);
    });

    test('nút HTML tạo trước khi script chạy cũng được dịch; ngoài game thì không', async () => {
      const r = await page.evaluate(() => ({
        btns: [...document.querySelectorAll('.w1-aoe1btn')].map((b) => b.textContent),
        outside: document.getElementById('outside').textContent,
        font: getComputedStyle(document.querySelector('.w1-aoe1btn')).fontFamily,
      }));
      assert.deepEqual(r.btns, ['Chơi đơn', 'Thoát']);
      assert.equal(r.outside, 'Exit');
      assert.match(r.font, /Times New Roman/);
    });

    test('chiến dịch giao diện điện thoại (HTML): tên và khung hướng dẫn', async () => {
      const r = await page.evaluate(async () => {
        const w = window.openCampaign();
        await new Promise((res) => setTimeout(res, 50));
        const out = { lines: [...w.querySelectorAll('.w1-aoe1line')].map((x) => x.textContent), brief: w.querySelector('.w1-aoe1brief').textContent };
        window.showHints();
        await new Promise((res) => setTimeout(res, 50));
        out.hints = w.querySelector('.w1-aoe1brief').textContent;
        w.remove();
        return out;
      });
      assert.deepEqual(r.lines, [SAMPLE.campaign[1], SAMPLE.name[1]]);
      assert.equal(r.brief, SAMPLE.description[1]);
      assert.equal(r.hints, SAMPLE.hints[1]);
    });

    test('chiến dịch giao diện máy tính (canvas): ngắt dòng bản tiếng Việt', async () => {
      const lines = await page.evaluate(() => window.wrap(window.SAMPLE.description[0]));
      assert.equal(lines[0], SAMPLE.description[1].split('\n')[0]);
    });

    test('chiến dịch giao diện máy tính (canvas): tên màn khi đo/vẽ chữ', async () => {
      const [a, b] = await page.evaluate(() => [window.textWidth(window.SAMPLE.file), window.textWidth(window.SAMPLE.name[1])]);
      assert.equal(a, b);
    });

    test('String.prototype.replace vẫn chạy đúng với chuỗi khác', async () => {
      const r = await page.evaluate(() => [
        'abc'.replace(/b/, 'X'),
        'line one is long enough\r\nline two'.replace(/\r\n?/g, '|'),
        'a-b-c'.replace(/-/g, () => '+'),
      ]);
      assert.deepEqual(r, ['aXc', 'line one is long enough|line two', 'a+b+c']);
    });

    test('bấm lại dấu trang / Alt+L để tắt và bật', async () => {
      await runBookmark(page, which);
      await page.waitForTimeout(200);
      const off = await page.evaluate(() => ({ s: window.lookup(9202), b: document.querySelector('.w1-aoe1btn').textContent, w: window.wrap(window.SAMPLE.hints[0])[0] }));
      assert.equal(off.s, 'Single Player');
      assert.equal(off.b, 'Single Player');
      assert.match(off.w, /^- +The Romans/);
      await page.keyboard.press('Alt+KeyL');
      await page.waitForTimeout(100);
      assert.equal(await page.evaluate(() => window.lookup(9202)), 'Chơi đơn');
    });
  });
}
