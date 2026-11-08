# Bàn giao deploy ArchRender lên VPS dùng chung

> Tài liệu này viết cho **Claude Code** (hoặc kỹ sư) thực hiện deploy. Làm tuần tự từng bước.
> Những chỗ đánh dấu **⛔ HỎI CHỦ DỰ ÁN** phải dừng lại xin xác nhận trước khi làm.
> Repo này **public**: không ghi IP, mật khẩu, API key, email cá nhân vào bất kỳ file nào được commit.

## 0. Mục tiêu

Chạy ArchRender (Next.js 16 standalone + SQLite, đóng gói Docker) trên VPS **đang chạy sẵn các dự án khác**
(app quản lý dropship Shopee, wedding planner, bản test hệ thống tài chính homestay…), truy cập qua một tên miền riêng,
**không ảnh hưởng gì tới các dự án đó**.

Kết quả cần có:
- Container `archrender` chạy ổn định (`restart: unless-stopped`), dữ liệu nằm trong volume Docker `archrender_archrender-data`.
- App chỉ nghe `127.0.0.1:<APP_PORT>`; người dùng vào qua reverse proxy bằng `https://<DOMAIN>` (hoặc `http://` nếu chưa cấp được chứng chỉ).
- Đã đăng nhập admin, tạo thử được 1 ảnh render bằng Gemini thật.
- Có lịch sao lưu dữ liệu hằng ngày.

## 1. Thông tin cần chủ dự án cung cấp ⛔ HỎI CHỦ DỰ ÁN

| Thông tin | Ghi chú |
|---|---|
| Cách vào VPS | Host/IP, user SSH (thường đã có sẵn key trên máy chủ dự án) |
| `GEMINI_API_KEY` | Lấy ở https://aistudio.google.com/apikey — **phải bật billing** (ảnh 2K/4K và video không có ở gói miễn phí) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Nếu không có mật khẩu: tự sinh bằng `openssl rand -base64 18`, báo lại riêng cho chủ dự án (không in vào log/commit) |
| Tên miền | Nếu chưa có: dùng `archrender.<IP-viết-bằng-gạch-ngang>.sslip.io` (vd. IP `1.2.3.4` → `archrender.1-2-3-4.sslip.io`), giống cách wedding planner đang dùng sslip.io |
| Thông tin nhận tiền | `BANK_ID` (mã VietQR: vcb, tcb, mb, acb, bidv…), `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME`, `SUPPORT_CONTACT` (vd. Zalo) — có thể bổ sung sau |

## 2. Kiến trúc cần biết

```
Trình duyệt ──HTTPS──> Reverse proxy có sẵn trên VPS (Nginx/Caddy/…)
                         └─> 127.0.0.1:<APP_PORT> ──> container "archrender" :3000 (node server.js)
                                                          ├─ /data (volume): app.db (SQLite WAL) + files/ (ảnh, video)
                                                          └─ gọi ra ngoài: generativelanguage.googleapis.com (Gemini)
Trình duyệt người dùng tải trực tiếp ảnh QR từ img.vietqr.io.
```

- Image build nhiều tầng (`Dockerfile`), chạy bằng user không phải root, có `HEALTHCHECK` gọi `/api/health`.
- `docker-compose.yml` đọc `.env` (cả để thay biến trong compose lẫn làm biến môi trường của container).
- Biến `GEMINI_*`, `ADMIN_*`, `BANK_*`… đọc **lúc chạy** → đổi xong chỉ cần `docker compose up -d`.
  Riêng `NEXT_PUBLIC_APP_NAME` được nhúng **lúc build** → đổi thì phải `--build`.
- Job AI chạy trong tiến trình (hàng đợi nội bộ). Restart container giữa chừng: job ảnh chạy lại, video đang dựng được theo dõi tiếp; quá 25 phút tự hoàn credit.

## 3. Quy tắc an toàn trên VPS dùng chung (bắt buộc)

1. **Chỉ đọc trước, sửa sau.** Bước 4 là khảo sát, không thay đổi gì.
2. **Không đụng** container, volume, file cấu hình, cron của dự án khác. Không chạy `docker system prune`, `docker volume prune`, `docker compose down` ngoài thư mục `/opt/archrender`.
3. Trước khi sửa cấu hình reverse proxy: **sao lưu file**, sau khi sửa phải kiểm tra cú pháp (`nginx -t` / `caddy validate`) rồi mới reload. Dùng `reload`, không `restart`.
4. Không mở thêm cổng firewall. App chỉ nghe `127.0.0.1` (mặc định trong compose).
5. ⛔ HỎI CHỦ DỰ ÁN trước khi: cài Docker, tạo swap, cài certbot/Caddy, sửa cấu hình proxy dùng chung, hoặc bất kỳ việc gì cần khởi động lại dịch vụ mà dự án khác đang dùng.
6. `.env` chứa bí mật: `chmod 600`, không commit, không `cat` ra log khi báo cáo.

## 4. Khảo sát VPS (chỉ đọc)

```bash
uname -a; cat /etc/os-release | head -3
free -h; df -h /; nproc
docker --version; docker compose version          # đã có Docker chưa?
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}'
ss -ltnp | sort                                    # cổng nào đang bận
systemctl is-active nginx caddy apache2 2>/dev/null # reverse proxy nào đang chạy
ls /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null; ls /etc/caddy 2>/dev/null
grep -Rhs "server_name\|sslip" /etc/nginx/ /etc/caddy/ 2>/dev/null | sort -u   # mẫu tên miền các dự án khác
pm2 ls 2>/dev/null                                 # dự án nào chạy bằng pm2
curl -s -o /dev/null -w "%{http_code}\n" https://generativelanguage.googleapis.com/   # ra được internet tới Gemini?
```

Ghi lại: hệ điều hành, RAM trống, đĩa trống, reverse proxy đang dùng và cách nó cấu hình các dự án khác, các cổng đã dùng.

Điều kiện tối thiểu: **RAM trống ≥ 2 GB lúc build** (bước `next build` ngốn 1–2 GB), đĩa trống ≥ 5 GB.
Nếu RAM thiếu → ⛔ HỎI CHỦ DỰ ÁN: tạo swap 2 GB (`fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`, thêm vào `/etc/fstab`) hoặc build image ở máy khác rồi đẩy lên.

Nếu chưa có Docker → ⛔ HỎI CHỦ DỰ ÁN, rồi cài: `curl -fsSL https://get.docker.com | sh`.

## 5. Chọn cổng và tên miền

- `APP_PORT` mặc định **3010**. Kiểm tra: `ss -ltn | grep -q ':3010 ' && echo BẬN || echo TRỐNG`. Bận thì thử 3011, 3012…
- Tên miền: theo mục 1. Kiểm tra DNS trỏ đúng VPS: `getent hosts <DOMAIN>`.

## 6. Lấy code và cấu hình

```bash
sudo mkdir -p /opt/archrender && sudo chown "$USER" /opt/archrender
git clone https://github.com/trungthongtcdn/Agent-for-architech.git /opt/archrender
cd /opt/archrender
cp .env.example .env && chmod 600 .env
```

Sửa `.env` (dùng `sed`/editor, không in nội dung ra màn hình khi báo cáo):

| Biến | Giá trị |
|---|---|
| `APP_URL` | `https://<DOMAIN>` (hoặc `http://<DOMAIN>` nếu chưa có HTTPS — **phải khớp**, vì cookie đăng nhập bật `Secure` khi URL là https) |
| `APP_PORT` | cổng đã chọn ở bước 5 |
| `GEMINI_API_KEY` | key thật |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | theo mục 1 |
| `BANK_ID`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME`, `SUPPORT_CONTACT` | nếu đã có |
| Giữ mặc định | `SIGNUP_BONUS_CREDITS=30`, các model `GEMINI_*` (chỉ đổi khi Google đổi tên model, xem mục 11) |

## 7. Build và chạy

```bash
cd /opt/archrender
docker compose build              # 3–8 phút lần đầu
docker compose up -d
docker compose ps                 # STATUS phải là "healthy" sau ~30 giây
docker compose logs --tail=50     # phải thấy: [archrender] AI mode: gemini · data: /data
curl -s http://127.0.0.1:$(grep ^APP_PORT .env | cut -d= -f2)/api/health   # {"ok":true,"aiMode":"gemini"}
```

Nếu log ghi `AI mode: mock` → `GEMINI_API_KEY` trống hoặc sai tên biến.

## 8. Kiểm thử tự động (container DEMO tạm, không tốn tiền)

Chạy bộ smoke test (~45 kiểm tra: đăng ký, render, upscale, staging, nạp & duyệt credit, phân quyền file, hoàn credit, AI viết câu lệnh…)
trên **một container tạm ở chế độ DEMO**, không đụng dữ liệu thật:

```bash
cd /opt/archrender
docker run -d --name archrender-smoke -e AI_MODE=mock \
  -e ADMIN_EMAIL=admin@smoke.test -e ADMIN_PASSWORD=smoke-test-123 \
  -v "$PWD/scripts:/app/scripts:ro" archrender:latest
sleep 8
docker exec -e SKIP_VIDEO=1 -e BASE=http://127.0.0.1:3000 \
  -e ADMIN_EMAIL=admin@smoke.test -e ADMIN_PASSWORD=smoke-test-123 \
  archrender-smoke node scripts/smoke-test.mjs
docker rm -fv archrender-smoke    # xoá luôn dữ liệu tạm
```

Kết quả mong đợi: dòng cuối `Tất cả kiểm tra đều đạt`. (`SKIP_VIDEO=1` vì image production không có ffmpeg để giả lập video.)

**Không** chạy smoke test vào container thật: script sẽ tự dừng khi thấy server dùng Gemini thật.

## 9. Reverse proxy + HTTPS

Làm theo đúng kiểu cấu hình mà các dự án khác trên VPS đang dùng (đã ghi nhận ở bước 4). ⛔ HỎI CHỦ DỰ ÁN trước khi reload proxy dùng chung.

**Nginx** — tạo file mới `/etc/nginx/sites-available/archrender` (hoặc `conf.d/archrender.conf` tuỳ cách VPS đang tổ chức):

```nginx
server {
    listen 80;
    server_name <DOMAIN>;

    client_max_body_size 20m;          # ảnh upload tối đa 15MB

    location / {
        proxy_pass http://127.0.0.1:<APP_PORT>;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;        # tạo ảnh/AI có thể mất 1–2 phút
        proxy_send_timeout 300s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/archrender /etc/nginx/sites-enabled/   # nếu dùng sites-enabled
sudo nginx -t && sudo systemctl reload nginx
# HTTPS (nếu VPS đã dùng certbot cho dự án khác):
sudo certbot --nginx -d <DOMAIN>
```

**Caddy** — thêm khối vào Caddyfile (Caddy tự cấp HTTPS):

```
<DOMAIN> {
    request_body {
        max_size 20MB
    }
    reverse_proxy 127.0.0.1:<APP_PORT>
}
```
```bash
sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy
```

Sau khi có HTTPS: đảm bảo `APP_URL=https://<DOMAIN>` trong `.env`, rồi `docker compose up -d` (không cần build lại).
Nếu không cấp được chứng chỉ: tạm dùng HTTP, đặt `APP_URL=http://<DOMAIN>`, báo lại chủ dự án.

## 10. Kiểm tra với Gemini thật (tốn rất ít tiền)

Qua trình duyệt tại `https://<DOMAIN>`:

1. Đăng nhập bằng `ADMIN_EMAIL` → thấy tab **Quản trị**, số credit ở góc phải.
2. Vào **Quản trị → Người dùng** → cộng cho chính mình 100 credit (ghi chú "test deploy").
3. **Studio → Render AI**: tải 1 ảnh SketchUp hoặc phác thảo, gõ mô tả, bấm **AI viết câu lệnh** → phải hiện nhãn `AI` và câu lệnh tiếng Anh.
4. Bấm **Tạo** (1 ảnh, Tiêu chuẩn) → sau 15–60 giây có ảnh. Thử **Upscale 2K** trên ảnh vừa tạo.
5. (Tuỳ chọn) **Video 360p** từ ảnh vừa tạo → 1–3 phút có video phát được trên điện thoại.
6. `docker compose logs --tail=100 | grep -iE "error|\[job\]|\[assist\]"` → không có lỗi lặp lại.

Chi phí Gemini ước tính cho cả bước này: dưới 1 USD.

## 11. Xử lý sự cố

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Build bị `Killed` / exit 137 | Thiếu RAM | Tạo swap (⛔ hỏi), build lại |
| `port is already allocated` | Trùng cổng | Đổi `APP_PORT` trong `.env`, `docker compose up -d`, sửa proxy |
| Đăng nhập xong vẫn bị đá ra | `APP_URL` là https nhưng đang vào bằng http (hoặc ngược lại) | Cho `APP_URL` khớp với cách truy cập, `docker compose up -d` |
| Upload báo lỗi 413 | Proxy giới hạn body | `client_max_body_size 20m;` (Nginx) / `max_size 20MB` (Caddy) |
| Tạo ảnh lỗi 504 ở proxy | Timeout proxy ngắn | `proxy_read_timeout 300s;` |
| Job lỗi "API key Gemini không hợp lệ hoặc chưa bật thanh toán" | Key sai / chưa bật billing | Kiểm tra key trong AI Studio, bật billing |
| Job lỗi "Model AI không tồn tại…" (404) | Google đã đổi/ngừng model | Xem tên mới tại https://ai.google.dev/gemini-api/docs/models, đặt `GEMINI_IMAGE_MODEL` / `GEMINI_IMAGE_PRO_MODEL` / `GEMINI_VIDEO_MODEL` / `GEMINI_TEXT_MODEL` trong `.env`, `docker compose up -d` |
| "Hệ thống AI đang quá tải…" (429) | Hết hạn mức của key | Đợi, hoặc nâng hạn mức trong Google Cloud |
| Video lâu không xong | Gemini xử lý chậm | Tự hoàn credit sau 25 phút; xem log `[job]` |
| AI viết câu lệnh hiện nhãn "TỪ KHOÁ" thay vì "AI" | Gọi model văn bản lỗi → đã dùng bộ từ khoá dự phòng | Xem log `[assist]`, kiểm tra `GEMINI_TEXT_MODEL` |
| Container `unhealthy` | App không khởi động được | `docker compose logs --tail=200` |

## 12. Vận hành hằng ngày

```bash
cd /opt/archrender
docker compose logs -f --tail=100           # xem log
docker compose restart                      # khởi động lại app (job dở dang tự chạy tiếp)
git pull && docker compose up -d --build    # cập nhật phiên bản mới
```

**Quay về bản trước** nếu bản mới lỗi: `git log --oneline -5`, `git checkout <commit-cũ>`, `docker compose up -d --build`. (Schema DB chỉ thêm, không xoá — quay về an toàn.)

**Sao lưu hằng ngày** — tạo `/opt/archrender-backup.sh` (ngoài thư mục repo):

```bash
#!/bin/bash
set -euo pipefail
DEST=/opt/backups/archrender; mkdir -p "$DEST"
# Sao lưu SQLite an toàn khi đang chạy (gồm cả dữ liệu trong WAL)
docker exec archrender node -e "const D=require('better-sqlite3');new D('/data/app.db',{readonly:true}).backup('/data/app-backup.db').then(()=>console.log('ok'))"
docker run --rm -v archrender_archrender-data:/d:ro -v "$DEST":/b alpine \
  tar czf "/b/archrender-$(date +%F).tgz" -C /d app-backup.db files
find "$DEST" -name 'archrender-*.tgz' -mtime +7 -delete    # giữ 7 ngày
```

```bash
chmod +x /opt/archrender-backup.sh && /opt/archrender-backup.sh && ls -lh /opt/backups/archrender
( crontab -l 2>/dev/null; echo "30 2 * * * /opt/archrender-backup.sh >> /var/log/archrender-backup.log 2>&1" ) | crontab -
```

**Khôi phục**: `docker compose down` (chỉ trong `/opt/archrender`), giải nén bản sao lưu vào volume
(`docker run --rm -v archrender_archrender-data:/d -v /opt/backups/archrender:/b alpine sh -c "cd /d && rm -rf files app.db* && tar xzf /b/<file>.tgz && mv app-backup.db app.db && chown -R 999:999 /d"`
— kiểm tra UID thật bằng `docker run --rm archrender:latest id app`), rồi `docker compose up -d`.

## 13. Hoàn thành khi

- [ ] `docker compose ps` → `archrender` **healthy**; log có `AI mode: gemini`
- [ ] Smoke test trên container DEMO tạm: **Tất cả kiểm tra đều đạt**; container tạm đã xoá
- [ ] `https://<DOMAIN>` mở được trên điện thoại; đăng nhập admin được
- [ ] Đã tạo thử 1 ảnh render + 1 lần AI viết câu lệnh bằng Gemini thật
- [ ] Các dự án khác trên VPS vẫn chạy bình thường (`docker ps` / `pm2 ls` như trước khi deploy, mở thử trang của chúng)
- [ ] Đã cài cron sao lưu và chạy thử 1 lần
- [ ] `.env` có quyền `600`, không nằm trong git (`git status` sạch)

## 14. Báo cáo lại cho chủ dự án

Gửi một tin ngắn gồm: URL truy cập · cổng nội bộ đã dùng · reverse proxy đã sửa file nào (và đường dẫn bản sao lưu) ·
kết quả smoke test · kết quả thử Gemini thật (thời gian tạo ảnh) · lệnh cập nhật/sao lưu · việc còn treo (vd. chưa có HTTPS, chưa có thông tin ngân hàng).
**Mật khẩu admin gửi riêng**, không để trong báo cáo chung.
