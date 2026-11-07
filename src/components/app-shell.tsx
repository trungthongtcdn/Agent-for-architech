"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCoin, IconGrid, IconLogout, IconShield, IconSpark } from "./icons";
import { useSession } from "./session";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "ArchRender";

const NAV = [
  { href: "/studio", label: "Studio", icon: IconSpark },
  { href: "/gallery", label: "Thư viện", icon: IconGrid },
  { href: "/credits", label: "Credit", icon: IconCoin },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, aiMode } = useSession();
  const pathname = usePathname();
  const nav = user?.role === "admin" ? [...NAV, { href: "/admin", label: "Quản trị", icon: IconShield }] : NAV;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/studio" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-7 place-items-center rounded-md bg-ink text-xs font-bold text-paper">AR</span>
            <span>{APP_NAME}</span>
          </Link>
          {aiMode === "mock" && (
            <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-800" title="Chưa cấu hình GEMINI_API_KEY">
              DEMO
            </span>
          )}
          <nav className="ml-6 hidden gap-1 md:flex">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-md px-3 py-1.5 text-sm ${pathname.startsWith(n.href) ? "bg-ink text-paper" : "text-muted hover:bg-line/60"}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/credits" className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-sm font-medium">
              <IconCoin className="size-4 text-accent" />
              {loading ? "…" : (user?.credits ?? 0).toLocaleString("vi-VN")}
            </Link>
            <button onClick={logout} className="rounded-md p-2 text-muted hover:bg-line/60" aria-label="Đăng xuất" title="Đăng xuất">
              <IconLogout className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-4 md:pb-10">
        {loading || !user ? <div className="shimmer mt-4 h-64 rounded-xl" /> : children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0,1fr))` }}>
          {nav.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "text-ink" : "text-muted"}`}>
                <n.icon className={`size-5 ${active ? "text-accent" : ""}`} />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
