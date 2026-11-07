"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/client";

export type Me = { id: string; email: string; name: string; phone: string; role: "user" | "admin"; credits: number; created_at: number };

type Ctx = {
  user: Me | null;
  aiMode: "gemini" | "mock" | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setCredits: (n: number) => void;
  logout: () => Promise<void>;
};

const SessionCtx = createContext<Ctx | null>(null);

export function SessionProvider({ children, required = true }: { children: React.ReactNode; required?: boolean }) {
  const [user, setUser] = useState<Me | null>(null);
  const [aiMode, setAiMode] = useState<Ctx["aiMode"]>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    try {
      const r = await api<{ user: Me; aiMode: Ctx["aiMode"] }>("/api/me");
      setUser(r.user);
      setAiMode(r.aiMode);
    } catch (e) {
      setUser(null);
      if (required && e instanceof ApiError && e.status === 401) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } finally {
      setLoading(false);
    }
  }, [required, router, pathname]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setCredits = useCallback((n: number) => setUser((u) => (u ? { ...u, credits: n } : u)), []);
  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    router.replace("/login");
  }, [router]);

  return <SessionCtx.Provider value={{ user, aiMode, loading, refresh, setCredits, logout }}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  const c = useContext(SessionCtx);
  if (!c) throw new Error("useSession phải nằm trong SessionProvider");
  return c;
}
