"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TOOLS } from "@/lib/catalog";
import { api, timeAgo, type ClientJob } from "@/lib/client";
import { IconDownload, IconExpand, IconSofa, IconVideo, IconX } from "./icons";
import { useSession } from "./session";

const STATUS: Record<ClientJob["status"], { label: string; cls: string }> = {
  queued: { label: "Đang chờ", cls: "bg-line text-muted" },
  processing: { label: "Đang xử lý", cls: "bg-accent-soft text-accent" },
  succeeded: { label: "Hoàn thành", cls: "bg-emerald-50 text-emerald-700" },
  failed: { label: "Lỗi", cls: "bg-red-50 text-red-700" },
};

const isActive = (j: ClientJob) => j.status === "queued" || j.status === "processing";

/** Theo dõi job đang chạy: poll mỗi 2.5s (video: 5s) cho tới khi xong. */
export function useJobPolling(initial: ClientJob) {
  const [job, setJob] = useState(initial);
  const { setCredits } = useSession();
  useEffect(() => setJob(initial), [initial]);
  useEffect(() => {
    if (!isActive(job)) return;
    const t = setTimeout(
      async () => {
        try {
          const r = await api<{ job: ClientJob; credits: number }>(`/api/jobs/${job.id}`);
          setJob(r.job);
          if (!isActive(r.job)) setCredits(r.credits);
        } catch {
          setJob((j) => ({ ...j })); // thử lại lượt sau
        }
      },
      job.type === "video" ? 5000 : 2500,
    );
    return () => clearTimeout(t);
  }, [job, setCredits]);
  return job;
}

function elapsed(from: number) {
  const s = Math.max(0, Math.round((Date.now() - from) / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${String(s % 60).padStart(2, "0")}s`;
}

export function JobCard({ job: initial }: { job: ClientJob }) {
  const job = useJobPolling(initial);
  const [open, setOpen] = useState<number | null>(null);
  const [, tick] = useState(0);
  const tool = TOOLS.find((t) => t.id === job.type)!;
  const st = STATUS[job.status];

  useEffect(() => {
    if (!isActive(job)) return;
    const i = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, [job]);

  const placeholders = isActive(job) ? Math.max(0, job.expected - job.outputs.length) : 0;
  const aspect = job.inputs[0]?.width && job.inputs[0]?.height ? `${job.inputs[0].width} / ${job.inputs[0].height}` : "4 / 3";

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-white">
      <header className="flex items-center gap-2 px-3 py-2.5 text-sm">
        <span className="font-medium">{tool.label}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${st.cls}`}>
          {st.label}
          {isActive(job) && ` · ${elapsed(job.createdAt)}`}
        </span>
        <span className="ml-auto text-xs text-muted">
          {job.cost - job.refunded} credit · {timeAgo(job.createdAt)}
        </span>
      </header>

      <div className={`grid gap-1 px-1 pb-1 ${job.expected > 1 || job.outputs.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {job.outputs.map((o, i) =>
          o.mime.startsWith("video/") ? (
            <video key={o.url} src={o.url} controls playsInline loop className="w-full rounded-lg bg-black" style={{ aspectRatio: aspect }} />
          ) : (
            <button key={o.url} onClick={() => setOpen(i)} className="group relative overflow-hidden rounded-lg" style={{ aspectRatio: `${o.width ?? 4} / ${o.height ?? 3}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.url} alt="" loading="lazy" className="size-full object-cover transition group-hover:scale-[1.02]" />
              <span className="absolute right-2 top-2 rounded-full bg-ink/60 p-1 text-paper opacity-0 transition group-hover:opacity-100">
                <IconExpand className="size-4" />
              </span>
            </button>
          ),
        )}
        {Array.from({ length: placeholders }).map((_, i) => (
          <div key={i} className="shimmer relative grid place-items-center rounded-lg" style={{ aspectRatio: aspect }}>
            {job.inputs[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={job.inputs[0].url} alt="" className="absolute inset-0 size-full rounded-lg object-cover opacity-25 blur-[2px]" />
            )}
            <span className="relative text-xs text-muted">{job.type === "video" ? "Đang dựng video (1–3 phút)…" : "AI đang vẽ…"}</span>
          </div>
        ))}
        {job.status === "failed" && (
          <div className="m-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {job.error ?? "Xử lý thất bại"}
            {job.refunded > 0 && <span className="block text-xs text-red-700/80">Đã hoàn {job.refunded} credit.</span>}
          </div>
        )}
      </div>
      {job.status === "succeeded" && job.error && <p className="px-3 pb-2 text-xs text-muted">{job.error}</p>}

      {open !== null && createPortal(<Lightbox job={job} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />, document.body)}
    </article>
  );
}

export function OutputActions({ job, index, onDone }: { job: ClientJob; index: number; onDone?: () => void }) {
  const o = job.outputs[index];
  const src = `${job.id}:${index}`;
  const ext = o.mime.includes("png") ? "png" : o.mime.includes("mp4") ? "mp4" : "jpg";
  return (
    <div className="flex flex-wrap gap-2">
      <a href={`${o.url}?download=${job.type}-${job.id}-${index + 1}.${ext}`} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-ink">
        <IconDownload className="size-4" /> Tải về
      </a>
      {o.mime.startsWith("image/") && (
        <>
          {job.type !== "upscale" && (
            <Link onClick={onDone} href={`/studio?tool=upscale&src=${src}`} className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm text-white">
              <IconExpand className="size-4" /> Upscale 4K
            </Link>
          )}
          <Link onClick={onDone} href={`/studio?tool=video&src=${src}`} className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm text-white">
            <IconVideo className="size-4" /> Tạo video
          </Link>
          {job.type === "render" && job.params.scene === "interior" && (
            <Link onClick={onDone} href={`/studio?tool=staging&src=${src}`} className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm text-white">
              <IconSofa className="size-4" /> Staging
            </Link>
          )}
        </>
      )}
    </div>
  );
}

function Lightbox({ job, index, onClose, onIndex }: { job: ClientJob; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const [compare, setCompare] = useState(false);
  const o = job.outputs[index];
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < job.outputs.length - 1) onIndex(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
    };
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = prev;
    };
  }, [index, job.outputs.length, onClose, onIndex]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0c0b09] text-white" role="dialog" aria-modal="true">
      <div className="flex items-center gap-2 p-3 text-sm">
        <span>
          {index + 1}/{job.outputs.length}
          {o.width && <span className="ml-2 text-white/60">{o.width}×{o.height}px</span>}
        </span>
        {job.inputs[0] && (
          <button
            onPointerDown={() => setCompare(true)}
            onPointerUp={() => setCompare(false)}
            onPointerLeave={() => setCompare(false)}
            className="ml-auto select-none rounded-lg bg-white/15 px-3 py-1.5"
          >
            Giữ để xem ảnh gốc
          </button>
        )}
        <button onClick={onClose} className={`${job.inputs[0] ? "" : "ml-auto"} rounded-full bg-white/15 p-2`} aria-label="Đóng">
          <IconX className="size-5" />
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={compare ? job.inputs[0].url : o.url} alt="" className="max-h-full max-w-full object-contain" />
        {job.outputs.length > 1 && (
          <>
            {index > 0 && (
              <button onClick={() => onIndex(index - 1)} className="absolute left-2 rounded-full bg-white/15 px-3 py-2 text-xl">
                ‹
              </button>
            )}
            {index < job.outputs.length - 1 && (
              <button onClick={() => onIndex(index + 1)} className="absolute right-2 rounded-full bg-white/15 px-3 py-2 text-xl">
                ›
              </button>
            )}
          </>
        )}
      </div>
      <div className="p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <OutputActions job={job} index={index} onDone={onClose} />
      </div>
    </div>
  );
}
