/**
 * Hash FNV-1a 32 bit, trả về dạng base36 (vd "1k2j3h").
 * Dùng chung cho src/main.js (lúc chạy) và scripts/build.mjs (lúc build),
 * để bản build lưu hash câu tiếng Anh thay vì cả câu.
 */
export function hashText(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
