import { unstable_rethrow } from "next/navigation";
import { connection, NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { userFromRequest, type User } from "./auth";
import { InsufficientCreditsError } from "./credits";

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export const ok = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);

export function requireUser(req: NextRequest): User {
  const u = userFromRequest(req);
  if (!u) throw new HttpError(401, "Vui lòng đăng nhập", "unauthorized");
  return u;
}

export function requireAdmin(req: NextRequest): User {
  const u = requireUser(req);
  if (u.role !== "admin") throw new HttpError(403, "Bạn không có quyền quản trị", "forbidden");
  return u;
}

/** Bọc route handler: chuyển lỗi thành JSON {error} với status phù hợp. */
export function handle<C = unknown>(fn: (req: NextRequest, ctx: C) => Promise<Response> | Response) {
  return async (req: NextRequest, ctx: C) => {
    // Mọi API đều chạy theo request (không prerender lúc build).
    await connection();
    try {
      return await fn(req, ctx);
    } catch (e) {
      unstable_rethrow(e);
      if (e instanceof HttpError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
      if (e instanceof InsufficientCreditsError)
        return NextResponse.json({ error: e.message, code: "insufficient_credits", needed: e.needed, balance: e.balance }, { status: 402 });
      if (e instanceof ZodError)
        return NextResponse.json({ error: e.issues[0]?.message ?? "Dữ liệu không hợp lệ", code: "invalid" }, { status: 400 });
      console.error("[api]", e);
      return NextResponse.json({ error: "Lỗi máy chủ, vui lòng thử lại" }, { status: 500 });
    }
  };
}
