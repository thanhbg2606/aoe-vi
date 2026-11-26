import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, campaignPairs, campaignNames } from '../../src/campaigns.js';

test('normalizeText: CRLF, khoảng trắng cuối dòng, đầu/cuối đoạn', () => {
  assert.equal(normalizeText('  a \r\nb\t\r\n\r\nc\r '), 'a\nb\n\nc');
  assert.equal(normalizeText('x\ry'), 'x\ny');
});

test('normalizeText: không bị ảnh hưởng khi String.prototype.replace bị thay', () => {
  // main.js chặn replace(/\r\n?/g) để dịch chữ canvas; normalizeText phải dùng bản gốc.
  const orig = String.prototype.replace;
  String.prototype.replace = function () { return 'BỊ CHẶN'; };
  try {
    assert.equal(normalizeText('Hello\r\nWorld'), 'Hello\nWorld');
  } finally {
    String.prototype.replace = orig;
  }
});

const sample = {
  file: 'X.CPX',
  name: ['Camp', 'Chiến dịch'],
  scenarios: [
    { file: 'A.scx', name: ['A', 'Màn A'], description: ['Desc', 'Mô tả'], hints: ['Hint', 'Gợi ý'] },
    { file: 'Zama.scx', name: ['Zama', 'Zama'] },
  ],
};

test('campaignPairs: gồm tên chiến dịch, tên màn, tên file và các mục', () => {
  const pairs = campaignPairs(sample);
  assert.deepEqual(pairs, [
    ['Camp', 'Chiến dịch'],
    ['A', 'Màn A'], ['A.scx', 'Màn A'], ['Desc', 'Mô tả'], ['Hint', 'Gợi ý'],
    ['Zama', 'Zama'], ['Zama.scx', 'Zama'],
  ]);
});

test('campaignNames: chỉ tên, bỏ tên giữ nguyên', () => {
  assert.deepEqual(campaignNames(sample), [
    ['Camp', 'Chiến dịch'], ['A', 'Màn A'], ['A.scx', 'Màn A'], ['Zama.scx', 'Zama'],
  ]);
});
