import { db, now } from "./db";

export type CreditReason = "signup" | "topup" | "job" | "refund" | "admin";

export class InsufficientCreditsError extends Error {
  constructor(public needed: number, public balance: number) {
    super(`Không đủ credit: cần ${needed}, còn ${balance}`);
  }
}

/**
 * Cộng (delta > 0) hoặc trừ (delta < 0) credit, ghi sổ cái trong cùng transaction.
 * Trừ quá số dư sẽ ném InsufficientCreditsError (trừ khi allowNegative).
 */
export function addCredits(
  userId: string,
  delta: number,
  reason: CreditReason,
  opts: { ref?: string; note?: string; actorId?: string; allowNegative?: boolean } = {},
): number {
  const d = db();
  return d.transaction(() => {
    const row = d.prepare("SELECT credits FROM users WHERE id = ?").get(userId) as { credits: number } | undefined;
    if (!row) throw new Error("User không tồn tại");
    const next = row.credits + delta;
    if (next < 0 && !opts.allowNegative) throw new InsufficientCreditsError(-delta, row.credits);
    d.prepare("UPDATE users SET credits = ? WHERE id = ?").run(next, userId);
    d.prepare(
      "INSERT INTO credit_tx (user_id, delta, balance_after, reason, ref, note, actor_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(userId, delta, next, reason, opts.ref ?? null, opts.note ?? null, opts.actorId ?? null, now());
    return next;
  })();
}

export function creditHistory(userId: string, limit = 50) {
  return db()
    .prepare("SELECT id, delta, balance_after, reason, ref, note, created_at FROM credit_tx WHERE user_id = ? ORDER BY id DESC LIMIT ?")
    .all(userId, limit);
}
