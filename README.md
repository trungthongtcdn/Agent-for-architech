# ArchRender — AI render cho kiến trúc & bất động sản (MVP)

Web app mobile-first, tiếng Việt, gồm 4 công cụ AI chạy trên **Google Gemini API**, tính phí theo **credit**, admin **cộng credit thủ công** sau khi khách chuyển khoản (VietQR).

| Công cụ | Đầu vào | Model mặc định | Credit |
|---|---|---|---|
| **Render AI** | Ảnh SketchUp/3D, phác thảo tay, ảnh chụp; tuỳ chọn ảnh moodboard | `gemini-nano-banana-2.1` (Tiêu chuẩn) / `gemini-3-pro-image` (Pro), 2K | 3 / 8 mỗi ảnh, 1–4 phương án |
| **Virtual Staging** | Ảnh phòng trống/thô | như trên | 3 / 8 mỗi ảnh |
| **Upscale** | Ảnh bất kỳ | như trên, 2K hoặc 4K | 3 (2K) · 6 (4K) · 12 (4K Pro) |
| **Video AI** | 1 ảnh làm khung đầu | `gemini-omni-1.1-flash` (Interactions API), có âm thanh | 15 (360p) · 40 (720p) · 55 (1080p) |

Tính năng kèm theo:
- **Bộ preset phong phú** (tham khảo mnml.ai, LookX, SketchUp AI Render và các công cụ Trung Quốc như 云朵光影/EVAI/LiblibAI):
  22 phong cách chia nhóm Hiện đại / Á Đông / Cổ điển & Âu (gồm xu hướng 2026: Cream, Tối giản ấm, Ý tối giản, Á Đông hiện đại, Tân Trung Hoa, Thuần Việt…),
  12 loại công trình (nhà phố, shophouse, chung cư, nhà mẫu/sales gallery…), 17 loại phòng (có phòng thờ, sảnh, showroom…),
  9 góc máy, 7 kiểu diễn họa (ảnh thực, diễn họa BĐS, tạp chí, **sa bàn**, màu nước…), 14 vật liệu (chọn tối đa 4), bối cảnh, mùa/không khí (có **Tết**),
  mức đầu tư nội thất, 10 chuyển động máy quay video + tốc độ.
- **31 mẫu có sẵn** theo tình huống (nhà ở, dự án BĐS, thương mại & nghỉ dưỡng, cho thuê, nhà thô → hoàn thiện, flycam, reels…): chạm 1 lần là điền sẵn.
- **AI viết câu lệnh**: người dùng mô tả bằng tiếng Việt (có thể kèm ảnh) → Gemini (`gemini-3.8-flash`, ép trả JSON theo schema) viết câu lệnh tiếng Anh chi tiết + tự chọn preset phù hợp. Chế độ DEMO / khi AI lỗi dùng bộ nhận diện từ khoá tiếng Việt (có/không dấu). Miễn phí, giới hạn lượt/ngày.
- **Xem câu lệnh gửi AI**: hiển thị đúng câu lệnh cuối cùng sẽ gửi cho model, để người dùng nâng cao kiểm soát.
- Chuỗi thao tác: từ kết quả Render bấm **Upscale 4K / Tạo video / Staging** — không cần tải lại ảnh.
- Thư viện kết quả, xem toàn màn hình, giữ để so sánh với ảnh gốc, tải về.
- Credit dạng sổ cái (ledger): trừ khi tạo, **tự hoàn** khi AI lỗi (hoàn từng phần nếu chỉ vài phương án lỗi).
- Nạp credit: chọn gói → hiện QR VietQR có sẵn số tiền + mã nội dung → admin bấm **Đã nhận tiền · Cộng credit**.
- Trang quản trị: thống kê, duyệt nạp, tìm người dùng, cộng/trừ credit tay, cấp admin, khoá tài khoản, xem tác vụ lỗi.
- Hàng đợi xử lý trong tiến trình, giới hạn đồng thời; server restart giữa chừng vẫn tiếp tục job (kể cả video đang dựng).
- **Chế độ DEMO**: không có `GEMINI_API_KEY` thì ảnh/video được giả lập để dựng giao diện, test luồng, không tốn tiền.

## Chạy thử trên máy

```bash
npm install                     # cần Node.js 22+
cp .env.example .env.local      # điền ADMIN_EMAIL/ADMIN_PASSWORD, để trống GEMINI_API_KEY để chạy DEMO
npm run dev                     # http://localhost:3000
```
Chế độ DEMO tạo video cần `ffmpeg` trên máy (production dùng Gemini nên không cần).

## Deploy lên VPS bằng Docker

> Hướng dẫn đầy đủ từng bước (khảo sát VPS dùng chung, reverse proxy, HTTPS, kiểm thử, sao lưu, xử lý sự cố) ở **[docs/DEPLOY.md](docs/DEPLOY.md)** — viết để giao cho Claude Code thực hiện.

```bash
git clone https://github.com/trungthongtcdn/Agent-for-architech.git archrender && cd archrender
cp .env.example .env && nano .env   # GEMINI_API_KEY, ADMIN_*, BANK_*, APP_URL, APP_PORT
docker compose up -d --build
docker compose logs -f              # thấy "[archrender] AI mode: gemini" là đúng
```
- Dữ liệu (SQLite + ảnh/video) nằm trong volume `archrender-data` → giữ nguyên khi build lại.
- Đặt reverse proxy (Nginx/Caddy) trỏ domain về `127.0.0.1:${APP_PORT}`. Với Nginx nhớ tăng `client_max_body_size 20m;` để upload ảnh.
- Cập nhật phiên bản: `git pull && docker compose up -d --build`.
- Sao lưu: `docker run --rm -v archrender_archrender-data:/d -v $PWD:/b busybox tar czf /b/backup.tgz -C /d .`

### Biến môi trường chính
| Biến | Ý nghĩa |
|---|---|
| `GEMINI_API_KEY` | Key từ Google AI Studio (cần bật billing cho ảnh 2K/4K và video) |
| `GEMINI_IMAGE_MODEL`, `GEMINI_IMAGE_PRO_MODEL`, `GEMINI_VIDEO_MODEL` | Đổi model khi Google ra bản mới, không cần sửa code |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Tài khoản admin tạo tự động lúc khởi động |
| `BANK_ID`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME` | Thông tin nhận chuyển khoản, sinh QR qua img.vietqr.io |
| `SIGNUP_BONUS_CREDITS` | Credit tặng khi đăng ký (mặc định 30) |
| `GEMINI_TEXT_MODEL`, `PROMPT_ASSIST_DAILY_LIMIT` | Model và số lượt/ngày cho "AI viết câu lệnh" (mặc định `gemini-3.8-flash`, 50) |
| `APP_URL` | URL công khai; `https://` thì cookie tự bật Secure |

## Đổi giá, gói, preset, mẫu
- `src/lib/catalog.ts`: `PRICES` (credit mỗi tác vụ), `PACKAGES` (gói nạp & giá VNĐ), toàn bộ preset (mỗi preset có nhãn tiếng Việt + đoạn mô tả tiếng Anh gửi cho AI).
- `src/lib/templates.ts`: thư viện mẫu có sẵn.
- `src/lib/assist-fields.ts`: từ khoá tiếng Việt để nhận diện preset; `src/lib/assist.ts`: hướng dẫn hệ thống cho "AI viết câu lệnh".
- `src/lib/prompts.ts`: cách ghép câu lệnh. Thứ tự theo công thức phổ biến của cộng đồng archviz: chủ thể → phong cách → bối cảnh → vật liệu → ánh sáng/không khí → góc máy → kiểu diễn họa → chất lượng & điều cấm (chủ thể đặt đầu vì model chú ý mạnh nhất vào phần đầu). Video: đúng 1 chuyển động máy quay, đặt đầu câu, ghi rõ tốc độ và hướng.

Giá vốn tham khảo (Google, 11/2026): Nano Banana 2.1 ≈ $0.05/ảnh 2K, $0.11/ảnh 4K; Nano Banana Pro ≈ $0.13/ảnh 2K, $0.24/ảnh 4K; Omni Flash ≈ $0.10/giây video 720p. Kiểm tra lại bảng giá Gemini trước khi chốt `PRICES`.

## Cấu trúc
```
src/lib/catalog.ts      preset, bảng giá credit, gói nạp (dùng chung client/server)
src/lib/prompts.ts      dựng prompt tiếng Anh từ lựa chọn của người dùng
src/lib/ai/gemini.ts    gọi Gemini REST: generateContent (ảnh), interactions + files (video)
src/lib/ai/mock.ts      provider giả lập cho chế độ DEMO
src/lib/jobs.ts         tạo job, trừ/hoàn credit, hàng đợi, khôi phục sau restart
src/lib/credits.ts      sổ cái credit
src/lib/topups.ts       yêu cầu nạp + QR VietQR + admin duyệt
src/app/api/*           REST API (auth, jobs, files, credits, topups, admin)
src/app/(app)/*         Studio, Thư viện, Credit, Quản trị
```
Stack: Next.js 16 (App Router, output standalone) · React 19 · Tailwind 4 · SQLite (better-sqlite3) · sharp.

## Kiểm thử
```bash
# 1) Toàn luồng API (đăng ký, render, upscale, staging, video, nạp, admin, phân quyền file, hoàn credit)
BASE=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/smoke-test.mjs

# 2) Test adapter Gemini mà không tốn tiền: server giả lập đúng định dạng API của Google
PORT=3200 node scripts/fake-gemini.mjs
AI_MODE=gemini GEMINI_API_KEY=test GEMINI_BASE_URL=http://localhost:3200/v1beta npm run dev
```

## Giới hạn của MVP & bước tiếp theo
- Thanh toán đang duyệt tay. Bước sau: PayOS/Casso webhook để tự cộng credit theo mã nội dung `ARxxxxxx`.
- Chưa có quên mật khẩu / xác thực email (admin có thể đặt lại bằng cách tạo tài khoản mới hoặc khoá).
- Hàng đợi chạy trong 1 tiến trình — đủ cho 1 VPS. Khi cần nhiều máy: chuyển sang Postgres + Redis/BullMQ.
- Model video Gemini Omni chưa cho chọn độ dài (3–10 giây do model quyết định).
- Ý tưởng mở rộng: plugin SketchUp gửi ảnh viewport thẳng lên Studio, đồng bộ phong cách nhiều góc cho cả dự án, bộ ảnh + video bán hàng cho chủ đầu tư/sàn.
