import { db } from "@/lib/db";
import { handle, ok, requireAdmin } from "@/lib/http";
import { jobView } from "@/lib/jobs";
import { topupView, type TopupRow } from "@/lib/topups";

export const GET = handle(async (req) => {
  requireAdmin(req);
  const d = db();
  const dayAgo = Date.now() - 86400_000;
  const stats = {
    users: (d.prepare("SELECT COUNT(*) n FROM users").get() as { n: number }).n,
    jobs24h: (d.prepare("SELECT COUNT(*) n FROM jobs WHERE created_at > ?").get(dayAgo) as { n: number }).n,
    failed24h: (d.prepare("SELECT COUNT(*) n FROM jobs WHERE created_at > ? AND status = 'failed'").get(dayAgo) as { n: number }).n,
    active: (d.prepare("SELECT COUNT(*) n FROM jobs WHERE status IN ('queued','processing')").get() as { n: number }).n,
    creditsSpent24h: -((d.prepare("SELECT COALESCE(SUM(delta),0) s FROM credit_tx WHERE created_at > ? AND reason IN ('job','refund')").get(dayAgo) as { s: number }).s),
    revenueVnd30d: (d.prepare("SELECT COALESCE(SUM(amount_vnd),0) s FROM topups WHERE status = 'approved' AND handled_at > ?").get(Date.now() - 30 * 86400_000) as { s: number }).s,
  };
  const topups = (
    d
      .prepare(
        "SELECT t.*, u.email, u.name, u.phone FROM topups t JOIN users u ON u.id = t.user_id ORDER BY CASE t.status WHEN 'pending' THEN 0 ELSE 1 END, t.created_at DESC LIMIT 50",
      )
      .all() as (TopupRow & { email: string; name: string; phone: string })[]
  ).map((t) => ({ ...topupView(t), qr: null, user: { id: t.user_id, email: t.email, name: t.name, phone: t.phone } }));
  const jobs = (d.prepare("SELECT j.*, u.email FROM jobs j JOIN users u ON u.id = j.user_id ORDER BY j.created_at DESC LIMIT 30").all() as (Parameters<typeof jobView>[0] & { email: string })[]).map(
    (j) => ({ ...jobView(j), email: j.email }),
  );
  return ok({ stats, topups, jobs });
});
