"use client";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export async function api<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: json !== undefined ? { "content-type": "application/json", ...(rest.headers ?? {}) } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? "Có lỗi xảy ra", data.code);
  return data as T;
}

export const timeAgo = (ts: number) => {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "vừa xong";
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  return new Date(ts).toLocaleDateString("vi-VN");
};

export const formatDateTime = (ts: number) =>
  new Date(ts).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });

export type ClientJob = {
  id: string;
  type: "render" | "upscale" | "staging" | "video";
  status: "queued" | "processing" | "succeeded" | "failed";
  params: Record<string, unknown>;
  expected: number;
  cost: number;
  refunded: number;
  error: string | null;
  model: string | null;
  createdAt: number;
  finishedAt: number | null;
  inputs: { url: string; width?: number; height?: number; mime: string }[];
  outputs: { url: string; width?: number; height?: number; mime: string }[];
};
