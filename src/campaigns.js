/**
 * Bản dịch chiến dịch (lang/vi/campaigns/*.json).
 *
 * Hướng dẫn, gợi ý, lịch sử, thắng/thua của mỗi màn nằm trong file chiến dịch của game
 * (.CPN/.CPX), không có trong bảng chuỗi. Trang hiển thị chúng bằng HTML
 * (div.w1-aoe1brief, danh sách màn chơi...), nên ta dịch theo nguyên văn cả đoạn.
 *
 * Dùng chung cho src/main.js (bản phát triển) và scripts/build.mjs.
 */

/** Chuẩn hóa để so khớp: xuống dòng kiểu Windows, khoảng trắng cuối dòng, đầu/cuối đoạn. */
export const normalizeText = (s) =>
  s.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').trim();

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
