import crypto from "node:crypto";
import { newId } from "./auth";
import { PACKAGES } from "./catalog";
import { config } from "./config";
import { addCredits } from "./credits";
import { db, now } from "./db";
import { HttpError } from "./http";

export type TopupRow = {
  id: string;
  user_id: string;
  package_id: string;
  credits: number;
  amount_vnd: number;
  code: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  note: string | null;
  created_at: number;
  handled_by: string | null;
  handled_at: number | null;
};

/** Ảnh QR VietQR (img.vietqr.io) có sẵn số tiền + nội dung chuyển khoản. */
export function qrUrl(t: Pick<TopupRow, "amount_vnd" | "code">): string | null {
  const b = config.bank;
  if (!b.bankId || !b.accountNo) return null;
  const qs = new URLSearchParams({ amount: String(t.amount_vnd), addInfo: t.code, accountName: b.accountName });
  return `https://img.vietqr.io/image/${encodeURIComponent(b.bankId)}-${encodeURIComponent(b.accountNo)}-compact2.png?${qs}`;
}

export function topupView(t: TopupRow) {
  return {
    id: t.id,
    packageId: t.package_id,
    credits: t.credits,
    amountVnd: t.amount_vnd,
    code: t.code,
    status: t.status,
    note: t.note,
    createdAt: t.created_at,
    handledAt: t.handled_at,
    qr: t.status === "pending" ? qrUrl(t) : null,
  };
}

export function bankInfo() {
  const b = config.bank;
  return { bankId: b.bankId, accountNo: b.accountNo, accountName: b.accountName, contact: b.contact, configured: !!(b.bankId && b.accountNo) };
}

export function createTopup(userId: string, packageId: string) {
  const pkg = PACKAGES.find((p) => p.id === packageId);
  if (!pkg) throw new HttpError(400, "Gói không tồn tại");
  const pending = db().prepare("SELECT COUNT(*) n FROM topups WHERE user_id = ? AND status = 'pending'").get(userId) as { n: number };
  if (pending.n >= 3) throw new HttpError(429, "Bạn đang có 3 yêu cầu nạp chờ duyệt, vui lòng chờ admin xử lý");
  const id = newId();
  const code = "AR" + crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  db()
    .prepare("INSERT INTO topups (id, user_id, package_id, credits, amount_vnd, code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, userId, pkg.id, pkg.credits, pkg.priceVnd, code, now());
  return getTopup(id)!;
}

export const getTopup = (id: string) => db().prepare("SELECT * FROM topups WHERE id = ?").get(id) as TopupRow | undefined;

export function userTopups(userId: string) {
  return (db().prepare("SELECT * FROM topups WHERE user_id = ? ORDER BY created_at DESC LIMIT 20").all(userId) as TopupRow[]).map(topupView);
}

export function cancelTopup(userId: string, id: string) {
  const t = getTopup(id);
  if (!t || t.user_id !== userId) throw new HttpError(404, "Không tìm thấy yêu cầu");
  if (t.status !== "pending") throw new HttpError(400, "Yêu cầu đã được xử lý");
  db().prepare("UPDATE topups SET status = 'cancelled', handled_at = ? WHERE id = ?").run(now(), id);
}

/** Admin duyệt / từ chối. Duyệt = cộng credit trong cùng transaction. */
export function handleTopup(id: string, action: "approve" | "reject", adminId: string, note?: string) {
  const d = db();
  d.transaction(() => {
    const t = getTopup(id);
    if (!t) throw new HttpError(404, "Không tìm thấy yêu cầu");
    if (t.status !== "pending") throw new HttpError(400, "Yêu cầu đã được xử lý trước đó");
    if (action === "approve") addCredits(t.user_id, t.credits, "topup", { ref: t.id, note: `Nạp ${t.code}`, actorId: adminId });
    d.prepare("UPDATE topups SET status = ?, note = ?, handled_by = ?, handled_at = ? WHERE id = ?").run(
      action === "approve" ? "approved" : "rejected",
      note ?? null,
      adminId,
      now(),
      id,
    );
  })();
  return getTopup(id)!;
}
