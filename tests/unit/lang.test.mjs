/**
 * Kiểm tra dữ liệu bản dịch trong lang/vi: định dạng, %s/%d, ID trùng, file thừa/thiếu,
 * và thống nhất thuật ngữ.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { CAMPAIGN_FIELDS } from '../../src/campaigns.js';

const dir = new URL('../../lang/vi/', import.meta.url);
const read = (f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
const index = read('index.json');
const specs = (s) => (s.match(/%%|%[0-9.]*[sdcuxif]/g) || []).join(',');

test('index.json liệt kê đúng các file có trong thư mục', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json').sort();
  assert.deepEqual([...index.files].sort(), files);
  const camps = readdirSync(new URL('campaigns/', dir)).map((f) => `campaigns/${f}`).sort();
  assert.deepEqual([...index.campaigns].sort(), camps);
});

const strings = {};
for (const f of index.files) strings[f] = read(f);

test('bảng chuỗi: mỗi dòng là ["English", "Tiếng Việt"], ID >= 1000, không trùng', () => {
  const seen = new Map();
  for (const [f, entries] of Object.entries(strings)) {
    for (const [id, pair] of Object.entries(entries)) {
      assert.ok(/^\d+$/.test(id) && +id >= 1000, `${f} ${id}: ID không hợp lệ`);
      assert.ok(Array.isArray(pair) && pair.length === 2, `${f} ${id}: sai dạng`);
      assert.ok(pair[0] && pair[1], `${f} ${id}: thiếu chữ`);
      assert.ok(!seen.has(id), `${f} ${id}: trùng với ${seen.get(id)}`);
      seen.set(id, f);
    }
  }
});

test('bảng chuỗi: giữ đúng %s, %d, %%', () => {
  for (const [f, entries] of Object.entries(strings))
    for (const [id, [en, vi]] of Object.entries(entries))
      assert.equal(specs(vi), specs(en), `${f} ${id}: "${vi}"`);
});

test('bảng chuỗi: giữ phím tắt trong ngoặc, vd "(W)"', () => {
  for (const [f, entries] of Object.entries(strings))
    for (const [id, [en, vi]] of Object.entries(entries)) {
      const keys = en.match(/\((?:[A-Z]|ESC|SHIFT\+F1|F\d+|[,.])\)$/);
      if (keys) assert.ok(vi.endsWith(keys[0]), `${f} ${id}: mất phím tắt ${keys[0]} trong "${vi}"`);
    }
});

// Thuật ngữ: tên tiếng Anh (viết hoa) -> tên tiếng Việt phải dùng
const GLOSSARY = [
  [/\bDiscover(y|ies)\b/, 'Thánh địa'],
  [/\bArtifacts?\b/, 'Cổ vật'],
  [/\bRuins?\b/, 'Phế tích'],
  [/\bTown Centers?\b/, 'Trung tâm thị trấn'],
  [/\bWonders?\b/, 'Kỳ quan'],
];

test('thuật ngữ thống nhất trong bảng chuỗi', () => {
  for (const [f, entries] of Object.entries(strings))
    for (const [id, [en, vi]] of Object.entries(entries))
      for (const [re, term] of GLOSSARY)
        if (re.test(en)) assert.ok(vi.toLowerCase().includes(term.toLowerCase()), `${f} ${id}: "${en}" -> "${vi}" thiếu "${term}"`);
});

test('không còn dịch Discovery thành "Khám phá"', () => {
  for (const [f, entries] of Object.entries(strings))
    for (const [id, [en, vi]] of Object.entries(entries))
      if (/\bDiscover(y|ies)\b/.test(en)) assert.ok(!/Khám phá/.test(vi), `${f} ${id}: "${vi}"`);
});

test('chiến dịch: đủ trường, không trống, giữ %s/%d', () => {
  for (const f of index.campaigns) {
    const c = read(f);
    assert.ok(c.file && c.name?.[0] && c.name?.[1], `${f}: thiếu tên chiến dịch`);
    assert.ok(c.scenarios?.length > 0, `${f}: không có màn nào`);
    c.scenarios.forEach((sc, i) => {
      assert.ok(sc.file && sc.name?.[0] && sc.name?.[1], `${f} màn ${i}: thiếu tên`);
      for (const k of CAMPAIGN_FIELDS) {
        if (!(k in sc)) continue;
        const [en, vi] = sc[k];
        assert.ok(en && vi, `${f} màn ${i} ${k}: trống`);
        assert.equal(specs(vi), specs(en), `${f} màn ${i} ${k}: lệch %s/%d`);
        assert.ok(!en.includes('\r'), `${f} màn ${i} ${k}: còn \\r`);
      }
    });
  }
});
