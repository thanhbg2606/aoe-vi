import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashText } from '../../src/hash.js';

test('hashText: ổn định, base36, khác nhau với chuỗi khác nhau', () => {
  assert.equal(hashText('Food'), hashText('Food'));
  assert.match(hashText('Food'), /^[0-9a-z]+$/);
  assert.notEqual(hashText('Food'), hashText('Wood'));
  assert.notEqual(hashText(''), hashText(' '));
});

test('hashText: giá trị cố định (đổi thuật toán sẽ làm hỏng bản build cũ)', () => {
  assert.equal(hashText('Ascent of Egypt Learning Campaign'), '1x2kowf');
  assert.equal(hashText('Glory of Greece'), '14sjipi');
});
