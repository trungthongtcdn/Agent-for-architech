import { z } from "zod";
import { handle, ok, requireAdmin } from "@/lib/http";
import { handleTopup, topupView } from "@/lib/topups";

const Body = z.object({ action: z.enum(["approve", "reject"]), note: z.string().max(300).optional() });

export const POST = handle<RouteContext<"/api/admin/topups/[id]">>(async (req, ctx) => {
  const admin = requireAdmin(req);
  const { id } = await ctx.params;
  const { action, note } = Body.parse(await req.json());
  return ok({ topup: topupView(handleTopup(id, action, admin.id, note)) });
});
