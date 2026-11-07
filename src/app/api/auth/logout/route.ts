import { deleteSession, SESSION_COOKIE } from "@/lib/auth";
import { handle, ok } from "@/lib/http";

export const POST = handle(async (req) => {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(token);
  const res = ok({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
});
