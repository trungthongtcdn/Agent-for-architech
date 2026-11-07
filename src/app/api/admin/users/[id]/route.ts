import { z } from "zod";
import { getUserById, publicUser } from "@/lib/auth";
import { addCredits } from "@/lib/credits";
import { db } from "@/lib/db";
import { handle, HttpError, ok, requireAdmin } from "@/lib/http";

const Body = z.object({
  delta: z.coerce.number().int().min(-100000).max(100000).optional(),
  note: z.string().max(300).optional(),
  role: z.enum(["user", "admin"]).optional(),
  disabled: z.boolean().optional(),
});

/** Admin cộng/trừ credit tay, đổi quyền, khoá tài khoản. */
export const POST = handle<RouteContext<"/api/admin/users/[id]">>(async (req, ctx) => {
  const admin = requireAdmin(req);
  const { id } = await ctx.params;
  const target = getUserById(id);
  if (!target) throw new HttpError(404, "Không tìm thấy người dùng");
  const body = Body.parse(await req.json());
  if (body.delta) addCredits(id, body.delta, "admin", { note: body.note || "Admin điều chỉnh", actorId: admin.id });
  if (body.role && id !== admin.id) db().prepare("UPDATE users SET role = ? WHERE id = ?").run(body.role, id);
  if (body.disabled !== undefined && id !== admin.id) {
    db().prepare("UPDATE users SET disabled = ? WHERE id = ?").run(body.disabled ? 1 : 0, id);
    if (body.disabled) db().prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  }
  return ok({ user: publicUser(getUserById(id)!) });
});
