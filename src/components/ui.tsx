"use client";

import { useEffect, useRef, useState } from "react";
import { IconUpload, IconX } from "./icons";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { id: T; label: string; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full border px-3 py-1.5 text-sm transition ${
            value === o.id ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink hover:border-ink/40"
          }`}
          title={o.hint}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Chips theo nhóm (vd. phong cách Hiện đại / Á Đông / Cổ điển). */
export function GroupedChips({
  options,
  value,
  onChange,
}: {
  options: readonly { id: string; label: string; group?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const groups = [...new Set(options.map((o) => o.group ?? ""))];
  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <div key={g}>
          {g && <div className="mb-1 text-[11px] uppercase tracking-wide text-muted">{g}</div>}
          <Chips options={options.filter((o) => (o.group ?? "") === g)} value={value} onChange={onChange} />
        </div>
      ))}
    </div>
  );
}

/** Chọn nhiều (vd. vật liệu, tối đa max). */
export function MultiChips({
  options,
  value,
  onChange,
  max,
}: {
  options: readonly { id: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  max: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.id);
        const disabled = !on && value.length >= max;
        return (
          <button
            type="button"
            key={o.id}
            disabled={disabled}
            onClick={() => onChange(on ? value.filter((v) => v !== o.id) : [...value, o.id])}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              on ? "border-accent bg-accent-soft text-accent" : "border-line bg-white text-ink hover:border-ink/40"
            } ${disabled ? "opacity-40" : ""}`}
          >
            {on ? "✓ " : ""}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Disclosure({ title, hint, children, defaultOpen = false }: { title: string; hint?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-line bg-white/70">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium">
        <span>
          {title}
          {hint && <span className="ml-2 text-xs font-normal text-muted">{hint}</span>}
        </span>
        <span className={`text-muted transition ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>
      {open && <div className="space-y-5 border-t border-line px-3 py-4">{children}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2.5 text-sm">
      <span>{label}</span>
      <span className={`relative h-6 w-10 rounded-full transition ${checked ? "bg-ink" : "bg-line"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export type PickedImage = { file?: File; url: string; source?: { jobId: string; index: number } } | null;

export function ImagePicker({
  value,
  onChange,
  title,
  subtitle,
  compact,
}: {
  value: PickedImage;
  onChange: (v: PickedImage) => void;
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    return () => {
      if (value?.file) URL.revokeObjectURL(value.url);
    };
  }, [value]);

  const pick = (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return alert("Vui lòng chọn file ảnh (JPG, PNG, WebP)");
    onChange({ file: f, url: URL.createObjectURL(f) });
  };

  if (value)
    return (
      <div className={`relative overflow-hidden rounded-xl border border-line bg-white ${compact ? "h-28" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value.url} alt="" className={`w-full ${compact ? "h-full object-cover" : "max-h-[360px] object-contain"} checker`} />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-2 top-2 rounded-full bg-ink/80 p-1.5 text-paper"
          aria-label="Bỏ ảnh"
        >
          <IconX className="size-4" />
        </button>
      </div>
    );

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        pick(e.dataTransfer.files?.[0]);
      }}
      className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition ${
        compact ? "h-28 px-3" : "h-48 px-6"
      } ${drag ? "border-accent bg-accent-soft" : "border-line bg-white hover:border-ink/30"}`}
    >
      <IconUpload className="size-6 text-muted" />
      <span className="text-sm font-medium">{title}</span>
      {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </button>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "accent" }) {
  const styles = {
    primary: "bg-ink text-paper hover:bg-ink/90 disabled:bg-ink/40",
    accent: "bg-accent text-white hover:bg-accent/90 disabled:bg-accent/40",
    ghost: "border border-line bg-white text-ink hover:border-ink/40 disabled:opacity-50",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50",
  }[variant];
  return (
    <button {...rest} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: React.ReactNode }) {
  const c = { info: "border-line bg-white", error: "border-red-200 bg-red-50 text-red-800", success: "border-emerald-200 bg-emerald-50 text-emerald-800" }[tone];
  return <div className={`rounded-lg border px-3 py-2.5 text-sm ${c}`}>{children}</div>;
}
