import Link from "next/link";
import { formatVnd, PACKAGES, PRICES, TOOLS } from "@/lib/catalog";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "ArchRender";

const FEATURES: Record<string, string[]> = {
  render: ["Ngoại thất, nội thất, cảnh quan, quy hoạch, mặt bằng 3D", "10 phong cách: Hiện đại, Indochine, Tân cổ điển, Japandi…", "Giữ đúng hình khối, thêm ảnh moodboard tham chiếu"],
  staging: ["Phòng khách, ngủ, bếp, ăn, làm việc, ban công…", "Tự dọn đồ cũ trước khi bày", "Nhiều phương án bố trí cho một căn phòng"],
  upscale: ["Nâng lên 2K hoặc 4K", "Giữ nguyên chi tiết hoặc tăng độ chân thực", "Dùng cho in ấn, bảng quảng cáo"],
  video: ["Tiến vào, lùi ra, lia, quay quanh, flycam", "Có âm thanh môi trường hoặc nhạc nền", "Khung ngang hoặc dọc cho Reels/TikTok"],
};

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4">
        <span className="grid size-8 place-items-center rounded-md bg-ink text-xs font-bold text-paper">AR</span>
        <span className="font-semibold">{APP_NAME}</span>
        <div className="ml-auto flex gap-2 text-sm">
          <Link href="/login" className="rounded-lg px-3 py-2 hover:bg-line/60">
            Đăng nhập
          </Link>
          <Link href="/register" className="rounded-lg bg-ink px-3 py-2 font-medium text-paper">
            Dùng thử
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4">
        <section className="py-12 md:py-20">
          <p className="text-sm font-medium text-accent">AI cho kiến trúc sư, nhà thiết kế & môi giới bất động sản</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Từ ảnh SketchUp tới phối cảnh & video bán hàng trong vài phút
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Render phối cảnh chân thực, bày nội thất ảo, upscale 4K và dựng video bất động sản — ngay trên điện thoại, không cần máy cấu hình cao.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-lg bg-accent px-5 py-3 font-medium text-white">
              Tạo tài khoản miễn phí
            </Link>
            <Link href="/studio" className="rounded-lg border border-line bg-white px-5 py-3 font-medium">
              Vào Studio
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-12 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t) => (
            <div key={t.id} className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-semibold">{t.label}</h2>
              <p className="mt-1 text-sm text-muted">{t.desc}</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {FEATURES[t.id].map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="grid gap-8 rounded-3xl bg-ink p-6 text-paper md:grid-cols-2 md:p-10">
          <div>
            <h2 className="text-2xl font-semibold">Trả theo lượt dùng</h2>
            <p className="mt-2 text-paper/70">Không thu phí tháng. Nạp credit bằng chuyển khoản, dùng đến đâu trừ đến đó. Lỗi do AI tự động hoàn credit.</p>
            <ul className="mt-5 space-y-1 text-sm text-paper/80">
              <li>Render / Staging: từ {PRICES.render.standard} credit mỗi ảnh</li>
              <li>Upscale 4K: {PRICES.upscale["4K"]} credit</li>
              <li>Video HD: {PRICES.video["720p"]} credit</li>
            </ul>
          </div>
          <div className="grid gap-3">
            {PACKAGES.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-paper/10 px-4 py-3">
                <span>
                  {p.name} · <b>{p.credits} credit</b>
                </span>
                <span className="font-semibold">{formatVnd(p.priceVnd)}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted">© {APP_NAME} · AI render kiến trúc & bất động sản</footer>
    </div>
  );
}
