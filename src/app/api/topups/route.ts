import { z } from "zod";
import { handle, ok, requireUser } from "@/lib/http";
import { cancelTopup, createTopup, topupView } from "@/lib/topups";

const Body = z.union([z.object({ packageId: z.string() }), z.object({ cancelId: z.string() })]);

export const POST = handle(async (req) => {
  const user = requireUser(req);
  const body = Body.parse(await req.json());
  if ("cancelId" in body) {
    cancelTopup(user.id, body.cancelId);
    return ok({ ok: true });
  }
  return ok({ topup: topupView(createTopup(user.id, body.packageId)) }, { status: 201 });
});
