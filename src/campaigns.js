/**
 * Bản dịch chiến dịch (lang/vi/campaigns/*.json).
 *
 * Hướng dẫn, gợi ý, lịch sử, thắng/thua của mỗi màn nằm trong file chiến dịch của game
 * (.CPN/.CPX), không có trong bảng chuỗi. Trang hiển thị chúng theo hai cách:
 *   - Giao diện điện thoại: HTML (div.w1-aoe1brief, danh sách màn...) -> dịch text node.
 *   - Giao diện máy tính: vẽ lên canvas -> chặn lúc game ngắt dòng và lúc vẽ chữ
 *     (xem installCanvasHooks trong main.js).
 * Cả hai đều so khớp theo nguyên văn cả đoạn.
 *
 * Dùng chung cho src/main.js (bản phát triển) và scripts/build.mjs.
 */

// Giữ bản gốc của String.prototype.replace: main.js sẽ chặn replace(/\r\n?/g) để dịch chữ
// vẽ trên canvas, nên normalizeText không được đi qua lớp chặn đó (nếu không sẽ nhận
// về bản tiếng Việt thay vì chữ gốc và tra bản dịch sai).
const nativeReplace = String.prototype.replace;

/** Chuẩn hóa để so khớp: xuống dòng kiểu Windows, khoảng trắng cuối dòng, đầu/cuối đoạn. */
export const normalizeText = (s) =>
  nativeReplace.call(nativeReplace.call(s, /\r\n?/g, '\n'), /[ \t]+\n/g, '\n').trim();

export const CAMPAIGN_FIELDS = ['description', 'hints', 'win', 'loss', 'history'];

/** Từ một file chiến dịch, trả về danh sách cặp [tiếng Anh, tiếng Việt]. */
export function campaignPairs(campaign) {
  const pairs = [];
  const add = (en, vi) => { if (en && vi) pairs.push([en, vi]); };
  add(...(campaign.name || []));
  for (const sc of campaign.scenarios || []) {
    const [enName, viName] = sc.name || [];
    add(enName, viName);
    add(sc.file, viName);                              // tiêu đề màn: "Crossing the Alps.scx"
    for (const f of CAMPAIGN_FIELDS) if (sc[f]) add(...sc[f]);
  }
  return pairs;
}

/** Tên chiến dịch / màn chơi (câu ngắn, so khớp nguyên văn): [tiếng Anh, tiếng Việt]. */
export function campaignNames(campaign) {
  const pairs = [];
  const add = (en, vi) => { if (en && vi && en !== vi) pairs.push([en, vi]); };
  add(...(campaign.name || []));
  for (const sc of campaign.scenarios || []) {
    const [enName, viName] = sc.name || [];
    add(enName, viName);
    add(sc.file, viName);
  }
  return pairs;
}

