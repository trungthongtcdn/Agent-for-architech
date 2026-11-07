"use client";

import { useState } from "react";
import type { ToolType } from "@/lib/catalog";
import { api } from "@/lib/client";
import { IconSpark, IconX } from "./icons";
import type { PickedImage } from "./ui";

export type AssistResult = {
  mode: "ai" | "rules";
  summary: string;
  detail: string;
  suggestions: Record<string, string | string[]>;
  applied: { field: string; label: string; value: string }[];
  notice?: string;
};

const PLACEHOLDER: Partial<Record<ToolType, string>> = {
  render: "VD: biệt thự 3 tầng phong cách Indochine ở Đà Lạt, mái ngói đỏ, cửa chớp xanh rêu, hoàng hôn có sương, sân vườn nhiều hoa…",
  staging: "VD: phòng khách căn hộ 2PN cho gia đình trẻ có con nhỏ, tông kem ấm, sofa vải, nhiều chỗ cất đồ, chi phí tầm trung…",
  video: "VD: flycam bay lên chậm từ cổng dự án, có người đi bộ, nhạc nhẹ, khung dọc để đăng TikTok…",
};

/**
 * Ô mô tả mong muốn + nút "AI viết câu lệnh".
 * Mô tả (tiếng Việt) luôn được gửi kèm job; AI viết thêm câu lệnh tiếng Anh chi tiết và tự chọn preset phù hợp.
 */
export function PromptAssistant({
  tool,
  note,
  onNote,
  detail,
  onDetail,
  image,
  onSuggestions,
}: {
  tool: ToolType;
  note: string;
  onNote: (v: string) => void;
  detail: string;
  onDetail: (v: string) => void;
  image: PickedImage;
  onSuggestions: (s: Record<string, string | string[]>) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AssistResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("tool", tool);
      fd.set("text", note);
      if (image?.file) fd.set("image", image.file);
      else if (image?.source) {
        fd.set("sourceJobId", image.source.jobId);
        fd.set("sourceIndex", String(image.source.index));
      }
      const r = await api<AssistResult>("/api/prompt/assist", { method: "POST", body: fd });
      setResult(r);
      onSuggestions(r.suggestions);
      if (r.detail) onDetail(r.detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-accent/30 bg-accent-soft/40 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Mô tả mong muốn</span>
        <span className="text-xs text-muted">tiếng Việt · không bắt buộc</span>
      </div>
      <textarea
        value={note}
        onChange={(e) => onNote(e.target.value)}
        rows={3}
        maxLength={800}
        placeholder={PLACEHOLDER[tool]}
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink/50"
      />
      <button
        type="button"
        onClick={run}
        disabled={busy || (note.trim().length < 3 && !image)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent bg-white px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent-soft disabled:opacity-50"
      >
        <IconSpark className="size-4" />
        {busy ? "AI đang viết câu lệnh…" : image ? "AI đọc ảnh + mô tả, viết câu lệnh" : "AI viết câu lệnh từ mô tả"}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}

      {result && (
        <div className="space-y-2 rounded-lg bg-white p-3 text-sm">
          <div className="flex items-start gap-2">
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${result.mode === "ai" ? "bg-ink text-paper" : "bg-line text-muted"}`}>
              {result.mode === "ai" ? "AI" : "TỪ KHOÁ"}
            </span>
            <p className="flex-1">{result.summary}</p>
            <button type="button" onClick={() => setResult(null)} className="text-muted" aria-label="Đóng">
              <IconX className="size-4" />
            </button>
          </div>
          {result.applied.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.applied.map((a) => (
                <span key={a.field} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                  {a.label}: {a.value}
                </span>
              ))}
            </div>
          )}
          {result.notice && <p className="text-xs text-muted">{result.notice}</p>}
        </div>
      )}

      {detail && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Câu lệnh chi tiết (tiếng Anh, sửa được)</span>
            <button type="button" onClick={() => onDetail("")} className="underline">
              Bỏ
            </button>
          </div>
          <textarea
            value={detail}
            onChange={(e) => onDetail(e.target.value)}
            rows={5}
            maxLength={1500}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:border-ink/50"
          />
        </div>
      )}
    </div>
  );
}
