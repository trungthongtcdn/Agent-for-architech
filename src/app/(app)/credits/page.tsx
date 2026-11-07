"use client";

import { useCallback, useEffect, useState } from "react";
import { formatVnd, PACKAGES, PRICES } from "@/lib/catalog";
import { api, formatDateTime } from "@/lib/client";
import { useSession } from "@/components/session";
import { Button, Notice } from "@/components/ui";

type Topup = { id: string; packageId: string; credits: number; amountVnd: number; code: string; status: string; note: string | null; createdAt: number; qr: string | null };
type Tx = { id: number; delta: number; balance_after: number; reason: string; note: string | null; created_at: number };
type Bank = { bankId: string; accountNo: string; accountName: string; contact: string; configured: boolean };
type Data = { credits: number; history: Tx[]; topups: Topup[]; bank: Bank };

const REASON: Record<string, string> = { signup: "Quà đăng ký", topup: "Nạp credit", job: "Sử dụng", refund: "Hoàn credit", admin: "Điều chỉnh" };
const TOPUP_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Chờ xác nhận", cls: "bg-accent-soft text-accent" },
  approved: { label: "Đã cộng", cls: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Từ chối", cls: "bg-red-50 text-red-700" },
  cancelled: { label: "Đã huỷ", cls: "bg-line text-muted" },
};

export default function CreditsPage() {
  const { user, setCredits } = useSession();
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const d = await api<Data>("/api/credits");
    setData(d);
    setCredits(d.credits);
  }, [setCredits]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  async function buy(packageId: string) {
    setBusy(packageId);
    setError(null);
    try {
      await api("/api/topups", { method: "POST", json: { packageId } });
      await load();
      document.getElementById("pending")?.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra");
    } finally {
      setBusy(null);
    }
  }

  async function cancel(id: string) {
    await api("/api/topups", { method: "POST", json: { cancelId: id } }).catch(() => {});
    await load();
  }

  const pending = data?.topups.filter((t) => t.status === "pending") ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-ink p-5 text-paper">
        <div className="text-sm text-paper/70">Số dư hiện tại</div>
        <div className="mt-1 text-4xl font-semibold">
          {(data?.credits ?? user?.credits ?? 0).toLocaleString("vi-VN")} <span className="text-lg font-normal text-paper/70">credit</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-paper/70 sm:grid-cols-4">
          <span>Render: {PRICES.render.standard}–{PRICES.render.pro} credit/ảnh</span>
          <span>Staging: {PRICES.staging.standard}–{PRICES.staging.pro} credit/ảnh</span>
          <span>Upscale: {PRICES.upscale["2K"]}–{PRICES.upscale.pro4K} credit</span>
          <span>Video: {PRICES.video["360p"]}–{PRICES.video["1080p"]} credit</span>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Nạp credit</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {PACKAGES.map((p) => (
            <div key={p.id} className={`relative rounded-xl border bg-white p-4 ${"popular" in p && p.popular ? "border-accent" : "border-line"}`}>
              {"popular" in p && p.popular && <span className="absolute -top-2.5 right-3 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-white">Phổ biến</span>}
              <div className="text-sm text-muted">{p.name}</div>
              <div className="mt-1 text-2xl font-semibold">{p.credits.toLocaleString("vi-VN")} credit</div>
              <div className="text-sm">
                {formatVnd(p.priceVnd)} <span className="text-xs text-muted">· {Math.round(p.priceVnd / p.credits).toLocaleString("vi-VN")}đ/credit</span>
              </div>
              <Button className="mt-3 w-full" variant={"popular" in p && p.popular ? "accent" : "ghost"} disabled={busy !== null} onClick={() => buy(p.id)}>
                {busy === p.id ? "Đang tạo…" : "Chọn gói"}
              </Button>
            </div>
          ))}
        </div>
        {error && <Notice tone="error">{error}</Notice>}
      </section>

      {pending.length > 0 && (
        <section id="pending" className="space-y-3">
          <h2 className="font-semibold">Chờ chuyển khoản</h2>
          {pending.map((t) => (
            <div key={t.id} className="grid gap-4 rounded-xl border border-accent/40 bg-white p-4 sm:grid-cols-[200px_1fr]">
              {t.qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.qr} alt="Mã QR chuyển khoản" className="mx-auto w-full max-w-[220px] rounded-lg border border-line" />
              ) : (
                <div className="grid h-40 place-items-center rounded-lg bg-paper text-center text-xs text-muted">Admin chưa cấu hình tài khoản ngân hàng</div>
              )}
              <div className="space-y-2 text-sm">
                <p>Quét QR hoặc chuyển khoản đúng nội dung để admin xác nhận và cộng credit.</p>
                <dl className="grid grid-cols-[110px_1fr] gap-y-1">
                  {data?.bank.configured && (
                    <>
                      <dt className="text-muted">Ngân hàng</dt>
                      <dd className="font-medium uppercase">{data.bank.bankId}</dd>
                      <dt className="text-muted">Số tài khoản</dt>
                      <dd className="font-medium">{data.bank.accountNo}</dd>
                      <dt className="text-muted">Chủ tài khoản</dt>
                      <dd className="font-medium">{data.bank.accountName}</dd>
                    </>
                  )}
                  <dt className="text-muted">Số tiền</dt>
                  <dd className="font-medium">{formatVnd(t.amountVnd)}</dd>
                  <dt className="text-muted">Nội dung</dt>
                  <dd>
                    <span className="rounded bg-accent-soft px-2 py-0.5 font-mono font-semibold text-accent">{t.code}</span>
                  </dd>
                  <dt className="text-muted">Nhận được</dt>
                  <dd className="font-medium">{t.credits} credit</dd>
                </dl>
                {data?.bank.contact && <p className="text-xs text-muted">Cần hỗ trợ: {data.bank.contact}</p>}
                <button onClick={() => cancel(t.id)} className="text-xs text-muted underline">
                  Huỷ yêu cầu
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <h2 className="font-semibold">Lịch sử nạp</h2>
          <div className="divide-y divide-line rounded-xl border border-line bg-white">
            {(data?.topups ?? []).length === 0 && <p className="p-4 text-sm text-muted">Chưa có giao dịch nạp.</p>}
            {data?.topups.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="font-mono text-xs">{t.code}</span>
                <span>{t.credits} credit</span>
                <span className="text-muted">{formatVnd(t.amountVnd)}</span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] ${TOPUP_STATUS[t.status]?.cls}`}>{TOPUP_STATUS[t.status]?.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold">Biến động credit</h2>
          <div className="divide-y divide-line rounded-xl border border-line bg-white">
            {data?.history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <div>
                  <div>{REASON[h.reason] ?? h.reason}</div>
                  <div className="text-xs text-muted">
                    {formatDateTime(h.created_at)}
                    {h.note ? ` · ${h.note}` : ""}
                  </div>
                </div>
                <span className={`ml-auto font-medium ${h.delta > 0 ? "text-emerald-700" : ""}`}>
                  {h.delta > 0 ? "+" : ""}
                  {h.delta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
