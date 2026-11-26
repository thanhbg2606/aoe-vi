# aoe-vi – Việt hóa Age of Empires trên vivalarts.com

Việt hóa game **Age of Empires (1997)** chạy trên trình duyệt tại <https://vivalarts.com>.

## Cách dùng

### Dấu trang (máy tính và điện thoại)

Tạo một dấu trang tên `aoevi` với địa chỉ:

```
javascript:void(window.__aoeVI?__aoeVI.toggle():import('https://cdn.jsdelivr.net/gh/thanhbg2606/aoe-vi@master/dist/aoe-vi.min.js'))
```

- **Máy tính:** vào vivalarts, mở Age of Empires rồi bấm dấu trang. Bấm lần nữa hoặc nhấn `Alt+L` để chuyển Việt/Anh.
- **Chrome Android/iOS:** gõ `aoevi` vào thanh địa chỉ rồi chọn gợi ý có hình ngôi sao.
- **Safari iPhone:** mở Dấu trang rồi chạm `aoevi`.

### Tampermonkey (tự chạy, không cần bấm)

Cài file [`aoe-vi.user.js`](https://github.com/thanhbg2606/aoe-vi/raw/master/aoe-vi.user.js).

## Cấu trúc

```
src/main.js            Code chính (dễ đọc): tìm bảng chuỗi của game và thay bằng bản dịch
src/hash.js            Hàm hash dùng chung cho lúc chạy và lúc build
lang/vi/index.json     Danh sách file dịch
lang/vi/*.json         Bản dịch, chia theo nhóm
scripts/build.mjs      Build: gộp src + lang thành một file, minify
dist/aoe-vi.min.js     Bản build (dấu trang và Tampermonkey dùng file này). Đừng sửa tay.
aoe-vi.user.js         Bản Tampermonkey (chỉ gọi dist/aoe-vi.min.js)
.github/workflows/     GitHub Action tự build khi src/ hoặc lang/ thay đổi
```

| | Bản phát triển `src/main.js` | Bản build `dist/aoe-vi.min.js` |
|---|---|---|
| Số lượt tải | 10 file | 1 file |
| Dung lượng | ~130 KB (~39 KB nén) | ~83 KB (~27 KB nén) |
| Bản dịch | Đọc từ `lang/vi/*.json` | Nhúng sẵn, câu tiếng Anh thay bằng hash |
| Dùng khi | Thử thay đổi chưa build | Chơi hằng ngày |

Muốn chạy thẳng bản phát triển, dùng dấu trang trỏ tới `src/main.js` thay cho `dist/aoe-vi.min.js`.

## Sửa bản dịch

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

Bảng chuỗi gốc của game: mở vivalarts, vào Age of Empires, F12 → Console, chạy
`(await import('/assets/strings-<hash>.js')).t.language` (tên file xem trong tab Network, lọc `strings-`).

## Build

Cần Node.js 18 trở lên.

```
npm install        # lần đầu
npm run build      # tạo dist/aoe-vi.min.js
```

Build sẽ dừng và báo lỗi nếu một dòng dịch sai định dạng, lệch `%s`/`%d`, hoặc trùng ID.

Không build ở máy cũng được: push thay đổi trong `src/` hoặc `lang/` lên nhánh `master`,
GitHub Action sẽ tự build và commit `dist/aoe-vi.min.js` (xem tab **Actions** trên GitHub).
Sau đó nhớ `git pull` trước khi sửa tiếp ở máy.

## Cập nhật

jsDelivr lưu đệm nhánh `master` tới khoảng 12 tiếng. Muốn thấy thay đổi ngay, mở link sau một lần để xóa đệm:

<https://purge.jsdelivr.net/gh/thanhbg2606/aoe-vi@master/dist/aoe-vi.min.js>
