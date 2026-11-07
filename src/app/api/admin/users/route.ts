import { db } from "@/lib/db";
import { handle, ok, requireAdmin } from "@/lib/http";

export const GET = handle(async (req) => {
  requireAdmin(req);
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  const like = `%${q}%`;
  const users = db()
    .prepare(
      `SELECT u.id, u.email, u.name, u.phone, u.role, u.credits, u.disabled, u.created_at,
        (SELECT COUNT(*) FROM jobs j WHERE j.user_id = u.id) AS jobs
       FROM users u
       ${q ? "WHERE lower(u.email) LIKE ? OR lower(u.name) LIKE ? OR u.phone LIKE ?" : ""}
       ORDER BY u.created_at DESC LIMIT 50`,
    )
    .all(...(q ? [like, like, like] : []));
  return ok({ users });
});
