import { publicUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { handle, ok, requireUser } from "@/lib/http";

export const GET = handle(async (req) => {
  const user = requireUser(req);
  return ok({ user: publicUser(user), aiMode: config.aiMode });
});
