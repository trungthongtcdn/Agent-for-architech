"use client";

import { useCallback, useEffect, useState } from "react";
import { formatVnd, TOOLS } from "@/lib/catalog";
import { api, formatDateTime, timeAgo, type ClientJob } from "@/lib/client";
import { useSession } from "@/components/session";
import { Button, Chips, Notice } from "@/components/ui";

type Stats = { users: number; jobs24h: number; failed24h: number; active: number; creditsSpent24h: number; revenueVnd30d: number };
type AdminTopup = { id: string; credits: number; amountVnd: number; code: string; status: string; createdAt: number; user: { id: string; email: string; name: string; phone: string } };
type AdminUser = { id: string; email: string; name: string; phone: string; role: string; credits: number; disabled: number; created_at: number; jobs: number };
type Overview = { stats: Stats; topups: AdminTopup[]; jobs: (ClientJob & { email: string })[] };

const TABS = [
  { id: "topups", label: "Yêu cầu nạp" },
  { id: "users", label: "Người dùng" },
  { id: "jobs", label: "Tác vụ" },
];

export default function AdminPage() {
  const { user, refresh } = useSession();
  const [tab, setTab] = useState("topups");
  const [data, setData] = useState<Overview | null>(null);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const load = useCallback(() => api<Overview>("/api/admin/overview").then(setData), []);
  useEffect(() => {
    if (user?.role === "admin") load().catch((e) => setMsg({ tone: "error", text: e.message }));
  }, [user, load]);

  if (user?.role !== "admin") return <Notice tone="error">Bạn không có quyền truy cập trang này.</Notice>;

  async function act(t: AdminTopup, action: "approve" | "reject") {
    if (action === "approve" && !confirm(`Xác nhận đã nhận ${formatVnd(t.amountVnd)} (nội dung ${t.code}) và cộng ${t.credits} credit cho ${t.user.email}?`)) return;
    try {
      await api(`/api/admin/topups/${t.id}`, { method: "POST", json: { action } });
      setMsg({ tone: "success", text: action === "approve" ? `Đã cộng ${t.credits} credit cho ${t.user.email}` : `Đã từ chối ${t.code}` });
      await load();
      if (t.user.id === user?.id) refresh();
    } catch (e) {
      setMsg({ tone: "error", text: e instanceof Error ? e.message : "Lỗi" });
    }
  }

  const s = data?.stats;
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Quản trị</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Người dùng", s?.users],
          ["Tác vụ 24h", s?.jobs24h],
          ["Lỗi 24h", s?.failed24h],
          ["Đang chạy", s?.active],
          ["Credit dùng 24h", s?.creditsSpent24h],
          ["Doanh thu 30 ngày", s ? formatVnd(s.revenueVnd30d) : undefined],
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded-xl border border-line bg-white p-3">
            <div className="text-xs text-muted">{k}</div>
            <div className="mt-1 text-lg font-semibold">{v ?? "…"}</div>
          </div>
        ))}
      </div>

      <Chips options={TABS} value={tab} onChange={setTab} />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      {tab === "topups" && (
        <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {data?.topups.length === 0 && <p className="p-4 text-sm text-muted">Chưa có yêu cầu nạp.</p>}
          {data?.topups.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm">
              <span className="rounded bg-accent-soft px-2 py-0.5 font-mono font-semibold text-accent">{t.code}</span>
              <div className="min-w-0">
                <div className="truncate font-medium">{t.user.name || t.user.email}</div>
                <div className="truncate text-xs text-muted">
                  {t.user.email}
                  {t.user.phone && ` · ${t.user.phone}`} · {timeAgo(t.createdAt)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatVnd(t.amountVnd)}</div>
                <div className="text-xs text-muted">{t.credits} credit</div>
              </div>
              <div className="ml-auto flex gap-2">
                {t.status === "pending" ? (
                  <>
                    <Button variant="danger" className="px-3 py-1.5" onClick={() => act(t, "reject")}>
                      Từ chối
                    </Button>
                    <Button className="px-3 py-1.5" onClick={() => act(t, "approve")}>
                      Đã nhận tiền · Cộng credit
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-muted">{{ approved: "Đã cộng", rejected: "Đã từ chối", cancelled: "Khách huỷ" }[t.status] ?? t.status}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && <UsersTab onChanged={(m) => setMsg(m)} selfId={user.id} refreshSelf={refresh} />}

      {tab === "jobs" && (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                <th className="px-3 py-2">Thời gian</th>
                <th className="px-3 py-2">Người dùng</th>
                <th className="px-3 py-2">Công cụ</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Credit</th>
                <th className="px-3 py-2">Model / lỗi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data?.jobs.map((j) => (
                <tr key={j.id}>
                  <td className="whitespace-nowrap px-3 py-2">{formatDateTime(j.createdAt)}</td>
                  <td className="px-3 py-2">{j.email}</td>
                  <td className="px-3 py-2">{TOOLS.find((t) => t.id === j.type)?.short}</td>
                  <td className="px-3 py-2">{j.status}</td>
                  <td className="px-3 py-2">
                    {j.cost}
                    {j.refunded > 0 && <span className="text-xs text-muted"> (hoàn {j.refunded})</span>}
                  </td>
                  <td className="max-w-[280px] truncate px-3 py-2 text-xs text-muted" title={j.error ?? ""}>
                    {j.error ?? j.model}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UsersTab({ onChanged, selfId, refreshSelf }: { onChanged: (m: { tone: "success" | "error"; text: string }) => void; selfId: string; refreshSelf: () => void }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [edit, setEdit] = useState<{ id: string; delta: string; note: string } | null>(null);

  const search = useCallback(() => api<{ users: AdminUser[] }>(`/api/admin/users?q=${encodeURIComponent(q)}`).then((r) => setUsers(r.users)), [q]);
  useEffect(() => {
    const t = setTimeout(() => search().catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [search]);

  async function save(u: AdminUser, body: Record<string, unknown>, text: string) {
    try {
      await api(`/api/admin/users/${u.id}`, { method: "POST", json: body });
      onChanged({ tone: "success", text });
      setEdit(null);
      await search();
      if (u.id === selfId) refreshSelf();
    } catch (e) {
      onChanged({ tone: "error", text: e instanceof Error ? e.message : "Lỗi" });
    }
  }

  return (
    <div className="space-y-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm theo email, tên, số điện thoại…"
        className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ink/50"
      />
      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
        {users.map((u) => (
          <div key={u.id} className="space-y-2 px-4 py-3 text-sm">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {u.name || "—"} {u.role === "admin" && <span className="ml-1 rounded bg-ink px-1.5 py-0.5 text-[10px] text-paper">ADMIN</span>}
                  {u.disabled ? <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700">KHOÁ</span> : null}
                </div>
                <div className="truncate text-xs text-muted">
                  {u.email}
                  {u.phone && ` · ${u.phone}`} · {u.jobs} tác vụ · tham gia {formatDateTime(u.created_at)}
                </div>
              </div>
              <span className="ml-auto font-semibold">{u.credits.toLocaleString("vi-VN")} credit</span>
              <Button variant="ghost" className="px-3 py-1.5" onClick={() => setEdit(edit?.id === u.id ? null : { id: u.id, delta: "", note: "" })}>
                Điều chỉnh
              </Button>
            </div>
            {edit?.id === u.id && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-paper p-2">
                <input
                  type="number"
                  value={edit.delta}
                  onChange={(e) => setEdit({ ...edit, delta: e.target.value })}
                  placeholder="+100 hoặc -20"
                  className="w-32 rounded-md border border-line bg-white px-2 py-1.5"
                />
                <input
                  value={edit.note}
                  onChange={(e) => setEdit({ ...edit, note: e.target.value })}
                  placeholder="Ghi chú (VD: nạp tiền mặt, khuyến mãi)"
                  className="min-w-0 flex-1 rounded-md border border-line bg-white px-2 py-1.5"
                />
                <Button
                  className="px-3 py-1.5"
                  disabled={!Number(edit.delta)}
                  onClick={() => save(u, { delta: Number(edit.delta), note: edit.note }, `Đã ${Number(edit.delta) > 0 ? "cộng" : "trừ"} ${Math.abs(Number(edit.delta))} credit cho ${u.email}`)}
                >
                  Lưu credit
                </Button>
                {u.id !== selfId && (
                  <>
                    <Button variant="ghost" className="px-3 py-1.5" onClick={() => save(u, { role: u.role === "admin" ? "user" : "admin" }, `Đã đổi quyền ${u.email}`)}>
                      {u.role === "admin" ? "Bỏ admin" : "Cấp admin"}
                    </Button>
                    <Button variant="danger" className="px-3 py-1.5" onClick={() => save(u, { disabled: !u.disabled }, `${u.disabled ? "Đã mở khoá" : "Đã khoá"} ${u.email}`)}>
                      {u.disabled ? "Mở khoá" : "Khoá"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
