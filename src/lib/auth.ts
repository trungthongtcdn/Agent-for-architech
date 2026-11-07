import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { config, isAdminEmail } from "./config";
import { db, now } from "./db";
import { addCredits } from "./credits";

export const SESSION_COOKIE = "ar_session";

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: "user" | "admin";
  credits: number;
  disabled: number;
  created_at: number;
};

export type PublicUser = Pick<User, "id" | "email" | "name" | "phone" | "role" | "credits" | "created_at">;

export function publicUser(u: User): PublicUser {
  return { id: u.id, email: u.email, name: u.name, phone: u.phone, role: u.role, credits: u.credits, created_at: u.created_at };
}

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
export const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 20);

export function findUserByEmail(email: string): (User & { password_hash: string }) | undefined {
  return db().prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase()) as never;
}

export function getUserById(id: string): User | undefined {
  return db().prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export async function createUser(input: { email: string; password: string; name: string; phone?: string }): Promise<User> {
  const email = input.email.trim().toLowerCase();
  const hash = await bcrypt.hash(input.password, 10);
  const id = newId();
  const role = isAdminEmail(email) ? "admin" : "user";
  db()
    .prepare("INSERT INTO users (id, email, name, phone, password_hash, role, credits, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)")
    .run(id, email, input.name.trim(), (input.phone ?? "").trim(), hash, role, now());
  if (config.signupBonus > 0) addCredits(id, config.signupBonus, "signup", { note: "Tặng khi đăng ký" });
  return getUserById(id)!;
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSession(userId: string): { token: string; expires: Date } {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = now() + config.sessionDays * 86400_000;
  db().prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(sha256(token), userId, now(), expiresAt);
  return { token, expires: new Date(expiresAt) };
}

export function deleteSession(token: string) {
  db().prepare("DELETE FROM sessions WHERE id = ?").run(sha256(token));
}

export function userFromRequest(req: NextRequest): User | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db()
    .prepare("SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ?")
    .get(sha256(token), now()) as User | undefined;
  if (!row || row.disabled) return null;
  return row;
}

export function sessionCookie(token: string, expires: Date) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: config.cookieSecure,
    path: "/",
    expires,
  };
}

/** Tạo / cập nhật tài khoản admin từ ADMIN_EMAIL + ADMIN_PASSWORD khi server khởi động. */
export async function ensureAdmin() {
  if (!config.adminEmail || !config.adminPassword) return;
  const existing = findUserByEmail(config.adminEmail);
  if (existing) {
    if (existing.role !== "admin") db().prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id);
    return;
  }
  await createUser({ email: config.adminEmail, password: config.adminPassword, name: "Admin" });
}

// --- chống dò mật khẩu đơn giản (trong bộ nhớ) ---
const attempts = new Map<string, { n: number; until: number }>();
export function loginThrottled(key: string): boolean {
  const a = attempts.get(key);
  return !!a && a.n >= 5 && a.until > now();
}
export function recordLoginFailure(key: string) {
  const a = attempts.get(key);
  if (!a || a.until < now()) attempts.set(key, { n: 1, until: now() + 10 * 60_000 });
  else a.n++;
}
export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
