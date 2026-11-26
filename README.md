# aoe-vi – Việt hóa Age of Empires trên vivalarts.com

Việt hóa game **Age of Empires (1997)** chạy trên trình duyệt tại <https://vivalarts.com>:
menu, tên đơn vị, công trình, công nghệ, nút lệnh, thông báo trong trận và mô tả khi rê chuột (khoảng 1.400 câu),
cùng toàn bộ 8 chiến dịch (55 màn): hướng dẫn, gợi ý, lịch sử, thông báo thắng/thua và tên màn chơi.

---

## Hướng dẫn sử dụng

Có hai cách, chọn một:

| | Dấu trang | Tampermonkey |
|---|---|---|
| Cần cài gì | Không | Extension Tampermonkey (hoặc Violentmonkey, app Userscripts trên iPhone) |
| Khi mở game | Bấm dấu trang mỗi lần tải lại trang | Tự chạy |
| Máy tính | ✔ | ✔ |
| Android | ✔ Chrome, Edge, Firefox | ✔ Edge, Firefox (Chrome Android không có extension) |
| iPhone / iPad | ✔ Safari, Chrome | ✔ Safari + app Userscripts |

### Cách 1: Dấu trang

**Mã dấu trang:**

```
javascript:void(window.__aoeVI?__aoeVI.toggle():import('https://thanhbg2606.github.io/aoe-vi/aoe-vi.min.js'))
```

**Tạo dấu trang**

1. Lưu một dấu trang bất kỳ (máy tính: `Ctrl+D`; điện thoại: menu → ☆).
2. Sửa dấu trang đó:
   - **Tên:** `aoevi` (ngắn, dễ gõ, để tìm trên điện thoại)
   - **URL / Địa chỉ:** xóa hết, dán mã ở trên
3. Lưu.

Dùng Chrome và bật đồng bộ Dấu trang thì chỉ cần tạo trên máy tính, điện thoại sẽ tự có.

**Dùng khi chơi**

1. Vào <https://vivalarts.com>, mở **Age of Empires**.
2. Chạy dấu trang:
   - **Máy tính:** bấm `aoevi` trên thanh dấu trang.
   - **Chrome / Edge trên điện thoại:** chạm thanh địa chỉ, gõ `aoevi`, chọn gợi ý có **hình ngôi sao ☆**.
     (Mở từ danh sách Dấu trang trong menu sẽ không chạy.)
   - **Safari iPhone:** mở Dấu trang → chạm `aoevi`.
3. Chữ trong game chuyển sang tiếng Việt ngay, có thông báo *"Tiếng Việt: BẬT"*.
4. Chạy dấu trang lần nữa, hoặc nhấn `Alt+L` trên máy tính, để chuyển qua lại Việt / Anh.

Mỗi lần tải lại trang (F5) thì chạy dấu trang lại một lần.

### Cách 2: Tampermonkey (tự chạy)

1. Cài extension **Tampermonkey** cho trình duyệt.
   - Chrome máy tính: sau khi cài, vào chi tiết extension và bật **Allow user scripts**.
   - iPhone: cài app **Userscripts** (miễn phí) và bật nó trong cài đặt Safari.
2. Mở <https://github.com/thanhbg2606/aoe-vi/raw/master/aoe-vi.user.js> → bấm **Install**.
3. Vào vivalarts, mở Age of Empires: tiếng Việt tự bật. `Alt+L` để chuyển Việt / Anh.

### Lưu ý

- Phải chơi trong **trình duyệt**. Nếu mở vivalarts như app từ màn hình chính (không có thanh địa chỉ) thì cả hai cách đều không chạy được.
- Lần đầu chạy cần có mạng để tải bản dịch (khoảng 270 KB, ~80 KB khi nén).
- Không thấy gì thay đổi: mở F12 → Console, tìm dòng `[AoE-VI]` để xem lỗi.

---

## Phát triển

### Cấu trúc

```
src/main.js                  Code chính: tìm bảng chuỗi của game và thay bằng bản dịch
src/hash.js                  Hàm hash dùng chung cho lúc chạy và lúc build
src/campaigns.js             Đọc bản dịch chiến dịch, dùng chung cho lúc chạy và lúc build
lang/vi/index.json           Danh sách file dịch
lang/vi/*.json               Bản dịch bảng chuỗi của game, chia theo nhóm
lang/vi/campaigns/*.json     Bản dịch chiến dịch, mỗi chiến dịch một file
scripts/build.mjs            Build: gộp src + lang thành một file, minify (esbuild)
aoe-vi.user.js               Bản Tampermonkey (chỉ tải file build)
.github/workflows/pages.yml  Tự build và đưa lên GitHub Pages khi push vào master
```

`dist/` không có trong repo: GitHub Actions build và đưa thẳng lên
<https://thanhbg2606.github.io/aoe-vi/aoe-vi.min.js>.

### Sửa bản dịch

Mỗi dòng có dạng `"ID": ["tiếng Anh gốc", "tiếng Việt"]`:

```json
"4301": ["Food", "Thức ăn"],
```

- Chỉ sửa phần **tiếng Việt**. Phần tiếng Anh dùng để đối chiếu: nếu game đổi câu gốc, dòng đó tự bị bỏ qua thay vì hiện sai.
- Giữ nguyên `%s`, `%d`, `%%` (chỗ game điền tên, số). Build sẽ báo lỗi nếu thiếu hoặc thừa.
- Phím tắt trong ngoặc như `(W)`, `(ESC)` nên giữ nguyên.
- Câu tiếng Anh trùng nhau chỉ cần dịch một lần, mọi ID cùng câu đều được áp dụng.
- Thêm file mới: tạo `lang/vi/<ten>.json` rồi thêm tên vào `lang/vi/index.json`.

| File | Nội dung | ID |
|---|---|---|
| `system.json` | Đang tải, lỗi hệ thống | 1000–2299 |
| `messages.json` | Tin nhắn trong trận, gợi ý khi bấm chuột | 2300–3999 |
| `interface.json` | Nút lệnh, thời kỳ, tài nguyên, chỉ số | 4000–4999, 20000–20999 |
| `objects.json` | Tên đơn vị, công trình, động vật | 5000–5999 |
| `actions.json` | Lệnh xây dựng / huấn luyện | 6000–6999 |
| `technologies.json` | Công nghệ, nâng cấp | 7000–8999 |
| `menus.json` | Menu, cài đặt trận, bảng điểm, nền văn minh, trình tạo màn chơi | 9000–19999 |
| `tooltips.json` | Mô tả, gợi ý khi rê chuột | 30000–59999 |

### Sửa bản dịch chiến dịch

Hướng dẫn, gợi ý, lịch sử của từng màn không nằm trong bảng chuỗi mà trong file chiến dịch của game,
nên được dịch theo nguyên văn cả đoạn. Mỗi file trong `lang/vi/campaigns/` có dạng:

```json
{
  "file": "EXPANS_4.CPX",
  "name": ["Expansion Enemies of Rome", "Mở rộng 4: Kẻ thù của La Mã"],
  "scenarios": [
    {
      "file": "Crossing the Alps.scx",
      "name": ["Crossing the Alps", "Vượt dãy Alps"],
      "description": ["<hướng dẫn tiếng Anh>", "<tiếng Việt>"],
      "hints":       ["...", "..."],
      "win":         ["...", "..."],
      "loss":        ["...", "..."],
      "history":     ["...", "..."]
    }
  ]
}
```

- Chỉ sửa phần **tiếng Việt** (phần tử thứ hai). Xuống dòng viết là `\n`.
- Phần tiếng Anh phải giữ nguyên văn như trong game, vì bản dịch được tìm theo đúng đoạn đó.
- Mục nào màn chơi không có (vd. nhiều màn không có `loss`) thì không cần.

| File | Chiến dịch |
|---|---|
| `ascent_1.json` | Ascent of Egypt (học chơi, 12 màn) |
| `gloryo_1.json` | Glory of Greece (8 màn) |
| `voices_1.json` | Voices of Babylon (8 màn) |
| `yamato_1.json` | Yamato, Empire of the Rising Sun (8 màn) |
| `expans_1.json` | Rise of Rome (6 màn) |
| `expans_2.json` | Ave Caesar (4 màn) |
| `expans_3.json` | Pax Romana (5 màn) |
| `expans_4.json` | Enemies of Rome (4 màn) |

### Bảng chuỗi gốc

Bảng chuỗi gốc của game: mở vivalarts, vào Age of Empires, F12 → Console, chạy
`(await import('/assets/strings-<hash>.js')).t.language` (tên file xem trong tab Network, lọc `strings-`).

### Đưa bản mới lên

1. Sửa file trong `src/` hoặc `lang/` (ở máy rồi push, hoặc sửa thẳng trên web GitHub).
2. GitHub Actions tự chạy **Build & deploy** (tab **Actions**), khoảng 1–2 phút.
3. Bản mới có ở GitHub Pages; trình duyệt có thể giữ bản cũ thêm khoảng 10 phút.

Nếu bản dịch có lỗi (sai định dạng, lệch `%s`/`%d`, trùng ID), bước build sẽ đỏ và bản cũ vẫn được giữ nguyên.

### Kiểm thử

```
npx playwright install chromium   # lần đầu, tải trình duyệt dùng cho kiểm thử
npm test                          # build + unit test + kiểm thử end-to-end
```

- `tests/unit/`: hàm dùng chung (hash, chuẩn hóa chữ) và **dữ liệu bản dịch**: đúng dạng,
  giữ `%s`/`%d`, giữ phím tắt `(W)`, không trùng ID, `index.json` khớp thư mục,
  thuật ngữ thống nhất (Discovery → Thánh địa, Artifact → Cổ vật, ...).
- `tests/e2e/`: mở một trang giả lập vivalarts (`tests/e2e/mock-site.mjs`) trong Chromium,
  chạy dấu trang với cả `src/main.js` và `dist/aoe-vi.min.js`, kiểm tra: bảng chuỗi,
  nút HTML (điện thoại), chiến dịch HTML (điện thoại) và canvas (máy tính), bật/tắt.

Workflow GitHub Actions chạy `npm test` trước khi deploy: test đỏ thì bản cũ được giữ nguyên.

### Build ở máy (để thử)

Cần Node.js 18 trở lên.

```
npm install        # lần đầu
npm run build      # tạo dist/aoe-vi.min.js (không commit thư mục này)
```

Thử bản phát triển chưa build: dùng dấu trang trỏ tới
`https://cdn.jsdelivr.net/gh/thanhbg2606/aoe-vi@master/src/main.js` (đọc thẳng `lang/vi/*.json`).
