"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { Button, Notice } from "./ui";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "ArchRender";

function nextUrl() {
  const n = new URLSearchParams(window.location.search).get("next");
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/studio";
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(`/api/auth/${mode}`, { method: "POST", json: mode === "login" ? { email: form.email, password: form.password } : form });
      router.replace(nextUrl());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setBusy(false);
    }
  }

  const input = "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ink/50";
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold">
          <span className="grid size-8 place-items-center rounded-md bg-ink text-xs font-bold text-paper">AR</span>
          {APP_NAME}
        </Link>
        <h1 className="text-center text-xl font-semibold">{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h1>
        {mode === "register" && (
          <>
            <input className={input} placeholder="Họ tên" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="name" />
            <input className={input} placeholder="Số điện thoại (để hỗ trợ nạp credit)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" inputMode="tel" />
          </>
        )}
        <input className={input} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
        <input
          className={input}
          type="password"
          placeholder={mode === "register" ? "Mật khẩu (tối thiểu 8 ký tự)" : "Mật khẩu"}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={mode === "register" ? 8 : 1}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" disabled={busy} className="w-full py-3">
          {busy ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Đăng ký & nhận credit dùng thử"}
        </Button>
        <p className="text-center text-sm text-muted">
          {mode === "login" ? (
            <>
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-medium text-ink underline">
                Đăng ký
              </Link>
            </>
          ) : (
            <>
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-medium text-ink underline">
                Đăng nhập
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
