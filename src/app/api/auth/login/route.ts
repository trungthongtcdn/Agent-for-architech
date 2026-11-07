import { z } from "zod";
import {
  clearLoginFailures,
  createSession,
  findUserByEmail,
  loginThrottled,
  publicUser,
  recordLoginFailure,
  sessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { handle, HttpError, ok } from "@/lib/http";

const Body = z.object({ email: z.string().trim().min(1), password: z.string().min(1) });

export const POST = handle(async (req) => {
  const { email, password } = Body.parse(await req.json());
  const key = email.toLowerCase();
  if (loginThrottled(key)) throw new HttpError(429, "Đăng nhập sai quá nhiều lần, thử lại sau 10 phút");
  const user = findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    recordLoginFailure(key);
    throw new HttpError(401, "Email hoặc mật khẩu không đúng");
  }
  if (user.disabled) throw new HttpError(403, "Tài khoản đã bị khoá, vui lòng liên hệ hỗ trợ");
  clearLoginFailures(key);
  const { token, expires } = createSession(user.id);
  const res = ok({ user: publicUser(user) });
  res.cookies.set(sessionCookie(token, expires));
  return res;
});
