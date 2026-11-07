"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ToolType } from "@/lib/catalog";
import { templatesFor, type TEMPLATES } from "@/lib/templates";
import { IconX } from "./icons";

type T = (typeof TEMPLATES)[number];

/** Bảng chọn mẫu có sẵn (bottom sheet trên mobile, hộp thoại trên desktop). */
export function TemplateSheet({ tool, onPick, onClose }: { tool: ToolType; onPick: (t: T) => void; onClose: () => void }) {
  const list = templatesFor(tool);
  const cats = [...new Set(list.map((t) => t.category))];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", k);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 md:items-center" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl bg-paper p-4 pb-[max(16px,env(safe-area-inset-bottom))] md:max-w-2xl md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Mẫu có sẵn</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-line" aria-label="Đóng">
            <IconX className="size-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-muted">Chọn một mẫu để điền sẵn tuỳ chọn và mô tả, sau đó chỉnh lại theo ý bạn.</p>
        {cats.map((c) => (
          <section key={c} className="mb-4">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{c}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {list
                .filter((t) => t.category === c)
                .map((t) => (
                  <button key={t.id} onClick={() => onPick(t)} className="rounded-xl border border-line bg-white p-3 text-left transition hover:border-accent">
                    <div className="text-sm font-medium">{t.title}</div>
                    <div className="mt-0.5 text-xs text-muted">{t.desc}</div>
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>,
    document.body,
  );
}
