import { z } from "zod";
import { createSession, createUser, findUserByEmail, publicUser, sessionCookie } from "@/lib/auth";
import { handle, HttpError, ok } from "@/lib/http";

const Body = z.object({
  email: z.email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(100),
  name: z.string().trim().min(1, "Vui lòng nhập họ tên").max(80),
  phone: z.string().trim().max(20).optional(),
});

export const POST = handle(async (req) => {
  const body = Body.parse(await req.json());
  if (findUserByEmail(body.email)) throw new HttpError(409, "Email này đã được đăng ký");
  const user = await createUser(body);
  const { token, expires } = createSession(user.id);
  const res = ok({ user: publicUser(user) });
  res.cookies.set(sessionCookie(token, expires));
  return res;
});
