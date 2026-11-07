import { Agent } from "undici";
import { config } from "../config";
import { AiError, type AiProvider, type ImageRequest, type ImageResult, type VideoPoll, type VideoRequest, type VideoStart } from "./types";

/**
 * Gemini API qua REST.
 * - Ảnh: models/{model}:generateContent (Nano Banana 2.1 / Nano Banana Pro)
 * - Video: interactions (Gemini Omni Flash) — ảnh làm khung đầu, trả file URI rồi poll files/{id}
 */

// Tạo video có thể mất vài phút trước khi có header phản hồi → nới timeout mặc định 300s của undici.
const longAgent = new Agent({ headersTimeout: 15 * 60_000, bodyTimeout: 15 * 60_000, connectTimeout: 30_000 });

type Json = Record<string, unknown>;

async function call(path: string, init: { method?: string; body?: unknown; timeoutMs?: number } = {}): Promise<Json> {
  const url = `${config.gemini.baseUrl}/${path}`;
  const res = await fetch(url, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: { "x-goog-api-key": config.gemini.apiKey, "content-type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(init.timeoutMs ?? 5 * 60_000),
    // @ts-expect-error — tuỳ chọn riêng của undici cho fetch của Node
    dispatcher: longAgent,
  }).catch((e: Error) => {
    throw new AiError("Không kết nối được tới Gemini, thử lại sau", true, e.message);
  });
  const text = await res.text();
  let json: Json = {};
  try {
    json = text ? (JSON.parse(text) as Json) : {};
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  if (!res.ok) throw toAiError(res.status, json);
  return json;
}

function toAiError(status: number, body: Json): AiError {
  const err = (body.error ?? {}) as { message?: string; status?: string };
  const detail = `${status} ${err.status ?? ""} ${err.message ?? JSON.stringify(body).slice(0, 300)}`.trim();
  if (status === 429) return new AiError("Hệ thống AI đang quá tải hoặc hết hạn mức, vui lòng thử lại sau ít phút", true, detail);
  if (status >= 500) return new AiError("Dịch vụ AI đang gặp sự cố tạm thời, vui lòng thử lại", true, detail);
  if (status === 401 || status === 403) return new AiError("API key Gemini không hợp lệ hoặc chưa bật thanh toán", false, detail);
  if (status === 404) return new AiError("Model AI không tồn tại hoặc chưa được bật cho API key này", false, detail);
  return new AiError(`Yêu cầu bị từ chối: ${err.message ?? "dữ liệu không hợp lệ"}`, false, detail);
}

async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!(e instanceof AiError) || !e.retryable || i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 2000 * 2 ** i));
    }
  }
  throw last;
}

// Tài liệu REST dùng generationConfig.responseFormat.image, còn SDK dùng imageConfig → tự dò và nhớ kiểu chạy được.
let imageConfigStyle: "responseFormat" | "imageConfig" = "responseFormat";

function imageBody(req: ImageRequest, style: typeof imageConfigStyle) {
  const sizing = { aspectRatio: req.aspect, imageSize: req.size };
  return {
    contents: [
      {
        role: "user",
        parts: [
          { text: req.prompt },
          ...req.images.map((img) => ({ inline_data: { mime_type: img.mime, data: img.data.toString("base64") } })),
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      ...(style === "responseFormat" ? { responseFormat: { image: sizing } } : { imageConfig: sizing }),
    },
  };
}

type Part = { text?: string; thought?: boolean; inlineData?: { mimeType?: string; data?: string }; inline_data?: { mime_type?: string; data?: string } };

function extractImage(json: Json): ImageResult {
  const candidates = (json.candidates ?? []) as { content?: { parts?: Part[] }; finishReason?: string }[];
  const parts = candidates[0]?.content?.parts ?? [];
  const imgs = parts
    .filter((p) => !p.thought)
    .map((p) => (p.inlineData ? { mime: p.inlineData.mimeType, data: p.inlineData.data } : p.inline_data ? { mime: p.inline_data.mime_type, data: p.inline_data.data } : null))
    .filter((x): x is { mime: string | undefined; data: string } => !!x?.data);
  if (imgs.length) {
    const last = imgs[imgs.length - 1];
    return { mime: last.mime ?? "image/png", data: Buffer.from(last.data, "base64") };
  }
  const block = (json.promptFeedback as { blockReason?: string } | undefined)?.blockReason;
  const finish = candidates[0]?.finishReason;
  const text = parts.map((p) => p.text).filter(Boolean).join(" ").slice(0, 200);
  if (block || (finish && /SAFETY|PROHIBITED|BLOCK|RECITATION/i.test(finish)))
    throw new AiError("Ảnh bị bộ lọc an toàn của AI từ chối, hãy thử ảnh hoặc mô tả khác", false, `${block ?? finish}`);
  throw new AiError("AI không trả về ảnh, vui lòng thử lại", true, `finish=${finish} text=${text}`);
}

async function generateImage(req: ImageRequest): Promise<ImageResult> {
  return withRetry(async () => {
    const path = `models/${encodeURIComponent(req.model)}:generateContent`;
    try {
      return extractImage(await call(path, { body: imageBody(req, imageConfigStyle), timeoutMs: 4 * 60_000 }));
    } catch (e) {
      // Nếu API không nhận trường cấu hình kích thước → đổi kiểu và thử lại 1 lần.
      if (e instanceof AiError && /responseFormat|imageConfig|Unknown name|Invalid JSON payload/i.test(e.detail ?? "")) {
        imageConfigStyle = imageConfigStyle === "responseFormat" ? "imageConfig" : "responseFormat";
        return extractImage(await call(path, { body: imageBody(req, imageConfigStyle), timeoutMs: 4 * 60_000 }));
      }
      throw e;
    }
  });
}

// ---------------- Video (Gemini Omni Flash qua Interactions API) ----------------

type VideoRef = { uri?: string; data?: string; mime?: string };

/** Tìm đối tượng video trong phản hồi (output_video, outputs[]...) — cấu trúc có thể thay đổi giữa các bản API. */
function findVideo(node: unknown, depth = 0): VideoRef | null {
  if (!node || typeof node !== "object" || depth > 6) return null;
  const o = node as Json;
  const mime = (o.mime_type ?? o.mimeType) as string | undefined;
  const isVideo = o.type === "video" || (mime ?? "").startsWith("video/");
  if (isVideo && (typeof o.uri === "string" || typeof o.data === "string"))
    return { uri: o.uri as string | undefined, data: o.data as string | undefined, mime };
  if (o.output_video) return findVideo({ type: "video", ...(o.output_video as Json) }, depth + 1);
  for (const v of Object.values(o)) {
    const found = Array.isArray(v) ? v.map((x) => findVideo(x, depth + 1)).find(Boolean) : findVideo(v, depth + 1);
    if (found) return found;
  }
  return null;
}

function fileIdFromUri(uri: string): string | null {
  const m = uri.match(/files\/([^/:?]+)/);
  return m ? m[1] : null;
}

async function downloadFile(fileId: string): Promise<Buffer> {
  const res = await fetch(`${config.gemini.baseUrl}/files/${fileId}:download?alt=media`, {
    headers: { "x-goog-api-key": config.gemini.apiKey },
    redirect: "follow",
    signal: AbortSignal.timeout(5 * 60_000),
  });
  if (!res.ok) throw new AiError("Không tải được video từ Gemini", true, `${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function interpretInteraction(json: Json): VideoPoll {
  const video = findVideo(json);
  if (video?.data) return { state: "done", mime: video.mime ?? "video/mp4", data: Buffer.from(video.data, "base64") };
  if (video?.uri) {
    const id = fileIdFromUri(video.uri);
    if (id) return { state: "pending", ref: `file:${id}` };
  }
  const status = String(json.status ?? "").toLowerCase();
  if (/fail|cancel|error/.test(status)) {
    const msg = ((json.error as Json | undefined)?.message as string | undefined) ?? status;
    return { state: "failed", error: `Tạo video thất bại: ${msg}` };
  }
  if (json.id && (status === "" || /progress|queued|running|pending/.test(status))) return { state: "pending", ref: `interaction:${json.id}` };
  return { state: "failed", error: "AI không trả về video (có thể bị bộ lọc an toàn từ chối)" };
}

async function startVideo(req: VideoRequest): Promise<VideoStart> {
  const json = await withRetry(
    () =>
      call("interactions", {
        body: {
          model: req.model,
          input: [
            { type: "image", data: req.image.data.toString("base64"), mime_type: req.image.mime },
            { type: "text", text: req.prompt },
          ],
          response_format: { type: "video", aspect_ratio: req.aspect, resolution: req.resolution, delivery: "uri" },
        },
        timeoutMs: 15 * 60_000,
      }),
    2,
  );
  const r = interpretInteraction(json);
  if (r.state === "failed") throw new AiError(r.error, false, JSON.stringify(json).slice(0, 400));
  return r;
}

async function pollVideo(ref: string): Promise<VideoPoll> {
  const [kind, id] = ref.split(":", 2);
  if (kind === "file") {
    const meta = await call(`files/${id}`, { timeoutMs: 60_000 });
    const state = String(meta.state ?? "").toUpperCase();
    if (state === "ACTIVE") {
      const mime = (meta.mimeType ?? meta.mime_type ?? "video/mp4") as string;
      return { state: "done", mime, data: await downloadFile(id) };
    }
    if (state === "FAILED") return { state: "failed", error: "Gemini báo tạo video thất bại" };
    return { state: "pending", ref };
  }
  if (kind === "interaction") return interpretInteraction(await call(`interactions/${id}`, { timeoutMs: 120_000 }));
  return { state: "failed", error: "Tham chiếu video không hợp lệ" };
}

export const geminiProvider: AiProvider = { name: "gemini", generateImage, startVideo, pollVideo };
