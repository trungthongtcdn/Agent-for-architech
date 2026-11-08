# ArchRender — ghi chú cho Claude Code

@AGENTS.md

Web app AI render cho kiến trúc & bất động sản (Render AI, Virtual Staging, Upscale, Video AI), giao diện tiếng Việt, mobile-first.
Stack: Next.js 16 App Router (output standalone, `cacheComponents` bật) · React 19 · Tailwind 4 · SQLite (better-sqlite3) · sharp · Gemini API qua REST.

## Việc thường gặp
- **Deploy lên VPS**: làm theo `docs/DEPLOY.md` từng bước (có các điểm phải dừng hỏi chủ dự án).
- Chạy local: `npm install` → `cp .env.example .env.local` → `npm run dev` (không có `GEMINI_API_KEY` = chế độ DEMO).
- Kiểm tra: `npm run typecheck`, `npm run build`, smoke test `BASE=http://localhost:3000 node scripts/smoke-test.mjs` (chỉ chạy trên server DEMO).
- Test adapter Gemini không tốn tiền: `node scripts/fake-gemini.mjs` + `AI_MODE=gemini GEMINI_API_KEY=test GEMINI_BASE_URL=http://localhost:3200/v1beta`.

## Bản đồ code
- `src/lib/catalog.ts` preset, giá credit, gói nạp · `src/lib/templates.ts` mẫu có sẵn · `src/lib/prompts.ts` ghép câu lệnh
- `src/lib/assist*.ts` "AI viết câu lệnh" (Gemini JSON + từ khoá tiếng Việt dự phòng)
- `src/lib/ai/gemini.ts` gọi Gemini (ảnh: generateContent; video: interactions + files) · `src/lib/ai/mock.ts` chế độ DEMO
- `src/lib/jobs.ts` hàng đợi, trừ/hoàn credit, khôi phục sau restart · `src/lib/topups.ts` nạp credit thủ công
- `src/app/api/*` REST API · `src/app/(app)/*` Studio, Thư viện, Credit, Quản trị

## Quy ước
- Chữ hiển thị cho người dùng viết tiếng Việt; câu lệnh gửi model viết tiếng Anh.
- API dùng `handle()` trong `src/lib/http.ts` (đã gọi `connection()` + `unstable_rethrow`); trang cần dữ liệu người dùng là client component gọi `/api/*`.
- Repo **public**: không commit `.env`, API key, IP máy chủ, mật khẩu, email cá nhân.
- VPS chạy chung với dự án khác: không dọn dẹp Docker toàn cục, không sửa cấu hình của dự án khác.
