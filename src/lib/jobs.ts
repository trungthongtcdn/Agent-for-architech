import { z } from "zod";
import { newId, type User } from "./auth";
import {
  ASPECTS,
  ATMOSPHERES,
  BUDGETS,
  BUILDINGS,
  CAMERA_MOVES,
  CAMERAS,
  CONTEXTS,
  FIDELITY,
  INPUT_KINDS,
  jobCost,
  LIGHTING,
  MATERIALS,
  MAX_MATERIALS,
  PRICES,
  REF_STRENGTH,
  RENDER_STYLES,
  ROOMS,
  SCENES,
  STAGING_LIGHTING,
  STYLES,
  UPSCALE_MODES,
  VIDEO_AMBIENCE,
  VIDEO_AUDIO,
  VIDEO_SPEEDS,
  type JobParams,
  type ToolType,
} from "./catalog";
import { config } from "./config";
import { addCredits } from "./credits";
import { db, now } from "./db";
import { HttpError } from "./http";
import { renderPrompt, stagingPrompt, upscalePrompt, videoPrompt } from "./prompts";
import { AiError, provider } from "./ai";
import { extFromMime, fileUrl, nearestAspect, readFile, saveInputImage, saveOutputImage, writeFile, type StoredFile } from "./storage";

// ---------------- Validate tham số ----------------
const ids = (list: { id: string }[]) => list.map((o) => o.id) as [string, ...string[]];
const quality = z.enum(["standard", "pro"]).default("standard");
const note = z.string().max(800).optional();
const bool = z.union([z.boolean(), z.enum(["true", "false"]).transform((v) => v === "true")]).default(false);

const detail = z.string().max(1500).optional();
const materials = z
  .array(z.enum(ids(MATERIALS)))
  .max(MAX_MATERIALS)
  .default([]);

const SCHEMAS = {
  render: z.object({
    scene: z.enum(ids(SCENES)),
    building: z.enum(ids(BUILDINGS)).default("auto"),
    room: z.enum(ids(ROOMS)).default("living"),
    inputKind: z.enum(ids(INPUT_KINDS)).default("viewport"),
    style: z.enum(ids(STYLES)),
    lighting: z.enum(ids(LIGHTING)).default("day"),
    atmosphere: z.enum(ids(ATMOSPHERES)).default("none"),
    context: z.enum(ids(CONTEXTS)).default("auto"),
    camera: z.enum(ids(CAMERAS)).default("keep"),
    renderStyle: z.enum(ids(RENDER_STYLES)).default("photo"),
    materials,
    fidelity: z.enum(ids(FIDELITY)).default("strict"),
    refStrength: z.enum(ids(REF_STRENGTH)).default("medium"),
    aspect: z.enum(ASPECTS.map((a) => a.id) as [string, ...string[]]).default("auto"),
    quality,
    count: z.coerce.number().int().min(1).max(4).default(1),
    vietnam: bool,
    people: bool,
    prompt: note,
    detail,
  }),
  staging: z.object({
    room: z.enum(ids(ROOMS)),
    style: z.enum(ids(STYLES)),
    budget: z.enum(ids(BUDGETS)).default("mid"),
    materials,
    lighting: z.enum(ids(STAGING_LIGHTING)).default("keep"),
    declutter: bool,
    quality,
    count: z.coerce.number().int().min(1).max(4).default(1),
    prompt: note,
    detail,
  }),
  upscale: z.object({ size: z.enum(["2K", "4K"]).default("4K"), mode: z.enum(ids(UPSCALE_MODES)).default("faithful"), quality }),
  video: z.object({
    move: z.enum(ids(CAMERA_MOVES)),
    speed: z.enum(ids(VIDEO_SPEEDS)).default("slow"),
    ambience: z.enum(ids(VIDEO_AMBIENCE)).default("nature"),
    audio: z.enum(ids(VIDEO_AUDIO)).default("ambient"),
    aspect: z.enum(["16:9", "9:16"]).default("16:9"),
    resolution: z.enum(["360p", "720p", "1080p"]).default("720p"),
    prompt: note,
    detail,
  }),
} satisfies Record<ToolType, z.ZodType>;

// ---------------- Kiểu dữ liệu ----------------
export type JobStatus = "queued" | "processing" | "succeeded" | "failed";

type JobRow = {
  id: string;
  user_id: string;
  type: ToolType;
  status: JobStatus;
  params: string;
  inputs: string;
  outputs: string;
  cost: number;
  refunded: number;
  error: string | null;
  provider_ref: string | null;
  model: string | null;
  created_at: number;
  started_at: number | null;
  finished_at: number | null;
};

export function jobView(r: JobRow) {
  const inputs = JSON.parse(r.inputs) as StoredFile[];
  const outputs = JSON.parse(r.outputs) as StoredFile[];
  const params = JSON.parse(r.params) as Record<string, unknown>;
  return {
    id: r.id,
    type: r.type,
    status: r.status,
    params,
    expected: r.type === "render" || r.type === "staging" ? Number(params.count) || 1 : 1,
    cost: r.cost,
    refunded: r.refunded,
    error: r.error,
    model: r.model,
    createdAt: r.created_at,
    finishedAt: r.finished_at,
    inputs: inputs.map((f) => ({ url: fileUrl(f.path), width: f.width, height: f.height, mime: f.mime })),
    outputs: outputs.map((f) => ({ url: fileUrl(f.path), width: f.width, height: f.height, mime: f.mime })),
  };
}
export type JobView = ReturnType<typeof jobView>;

const getRow = (id: string) => db().prepare("SELECT * FROM jobs WHERE id = ?").get(id) as JobRow | undefined;

export function getJobForUser(id: string, user: User) {
  const r = getRow(id);
  if (!r || (r.user_id !== user.id && user.role !== "admin")) return undefined;
  return r;
}

export function listJobs(userId: string, opts: { type?: string; limit?: number; before?: number } = {}) {
  const rows = db()
    .prepare(
      `SELECT * FROM jobs WHERE user_id = ? ${opts.type ? "AND type = ?" : ""} ${opts.before ? "AND created_at < ?" : ""} ORDER BY created_at DESC LIMIT ?`,
    )
    .all(...([userId, opts.type, opts.before, opts.limit ?? 30].filter((v) => v !== undefined) as unknown[])) as JobRow[];
  return rows.map(jobView);
}

// ---------------- Tạo job ----------------
export async function createJob(input: {
  user: User;
  type: string;
  params: unknown;
  image?: Buffer;
  reference?: Buffer;
  source?: { jobId: string; index: number };
}): Promise<JobView> {
  const { user } = input;
  if (!(input.type in SCHEMAS)) throw new HttpError(400, "Loại công cụ không hợp lệ");
  const type = input.type as ToolType;
  const params = SCHEMAS[type].parse(input.params ?? {}) as Record<string, unknown>;

  const active = db().prepare("SELECT COUNT(*) n FROM jobs WHERE user_id = ? AND status IN ('queued','processing')").get(user.id) as { n: number };
  if (active.n >= config.maxActiveJobsPerUser)
    throw new HttpError(429, `Bạn đang có ${active.n} tác vụ chạy, vui lòng chờ xong rồi tạo tiếp`, "too_many_active");

  const cost = jobCost(type, params);
  if (user.credits < cost) throw new HttpError(402, `Không đủ credit: cần ${cost}, bạn còn ${user.credits}`, "insufficient_credits");

  let imageBuf = input.image;
  if (!imageBuf && input.source) {
    const src = getJobForUser(input.source.jobId, user);
    const out = src ? (JSON.parse(src.outputs) as StoredFile[])[input.source.index] : undefined;
    if (!out) throw new HttpError(404, "Không tìm thấy ảnh nguồn");
    if (!out.mime.startsWith("image/")) throw new HttpError(400, "Nguồn phải là ảnh");
    imageBuf = readFile(out.path);
  }
  if (!imageBuf) throw new HttpError(400, "Vui lòng chọn ảnh đầu vào");

  const id = newId();
  const dir = `${user.id}/${id}`;
  const inputs: StoredFile[] = [];
  try {
    inputs.push(await saveInputImage(`${dir}/input.jpg`, imageBuf));
    if (input.reference && type === "render") inputs.push(await saveInputImage(`${dir}/reference.jpg`, input.reference));
  } catch {
    throw new HttpError(400, "File ảnh không hợp lệ hoặc định dạng chưa hỗ trợ (dùng JPG/PNG/WebP)");
  }

  db().transaction(() => {
    addCredits(user.id, -cost, "job", { ref: id, note: type });
    db()
      .prepare("INSERT INTO jobs (id, user_id, type, status, params, inputs, cost, created_at) VALUES (?, ?, ?, 'queued', ?, ?, ?, ?)")
      .run(id, user.id, type, JSON.stringify(params), JSON.stringify(inputs), cost, now());
  })();

  enqueue(id, type);
  return jobView(getRow(id)!);
}

// ---------------- Hàng đợi trong tiến trình ----------------
type Q = { queue: string[]; running: number };
const g = globalThis as unknown as { __archQueues?: { image: Q; video: Q }; __archPolling?: Set<string> };
const queues = () => (g.__archQueues ??= { image: { queue: [], running: 0 }, video: { queue: [], running: 0 } });
const polling = () => (g.__archPolling ??= new Set());

function enqueue(id: string, type: ToolType) {
  const lane = type === "video" ? "video" : "image";
  const q = queues()[lane];
  if (!q.queue.includes(id)) q.queue.push(id);
  pump(lane);
}

function pump(lane: "image" | "video") {
  const q = queues()[lane];
  const limit = lane === "video" ? config.videoConcurrency : config.jobConcurrency;
  while (q.running < limit && q.queue.length) {
    const id = q.queue.shift()!;
    q.running++;
    processJob(id)
      .catch((e) => console.error("[job]", id, e))
      .finally(() => {
        q.running--;
        pump(lane);
      });
  }
}

const update = (id: string, fields: Partial<JobRow>) => {
  const keys = Object.keys(fields);
  db()
    .prepare(`UPDATE jobs SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`)
    .run(...keys.map((k) => (fields as Record<string, unknown>)[k]), id);
};

function fail(row: JobRow, message: string, refund = row.cost - row.refunded) {
  if (refund > 0) addCredits(row.user_id, refund, "refund", { ref: row.id, note: "Hoàn credit do lỗi" });
  update(row.id, { status: "failed", error: message, refunded: row.refunded + Math.max(0, refund), finished_at: now() });
}

const errMsg = (e: unknown) => (e instanceof AiError ? e.message : "Lỗi không xác định khi xử lý, credit đã được hoàn");

async function processJob(id: string) {
  const row = getRow(id);
  if (!row || row.status !== "queued") return;
  update(id, { status: "processing", started_at: now(), error: null });
  try {
    if (row.type === "video") await runVideo(row);
    else await runImages(row);
  } catch (e) {
    console.error("[job]", id, e instanceof AiError ? `${e.message} | ${e.detail}` : e);
    const fresh = getRow(id)!;
    if (fresh.status === "processing") fail(fresh, errMsg(e));
  }
}

async function runImages(row: JobRow) {
  const params = JSON.parse(row.params);
  const inputs = JSON.parse(row.inputs) as StoredFile[];
  const ai = provider();
  const images = inputs.map((f) => ({ mime: f.mime, data: readFile(f.path) }));
  const src = inputs[0];
  const autoAspect = nearestAspect(src.width ?? 4, src.height ?? 3);
  const pro = params.quality === "pro";
  const model = pro ? config.gemini.imageProModel : config.gemini.imageModel;
  update(row.id, { model });

  let jobs: { prompt: string; size: "1K" | "2K" | "4K"; aspect: string }[];
  if (row.type === "render") {
    const p = params as JobParams["render"];
    const aspect = p.aspect === "auto" ? autoAspect : p.aspect;
    jobs = Array.from({ length: p.count }, (_, i) => ({ prompt: renderPrompt(p, images.length > 1, i), size: "2K", aspect }));
  } else if (row.type === "staging") {
    const p = params as JobParams["staging"];
    jobs = Array.from({ length: p.count }, (_, i) => ({ prompt: stagingPrompt(p, i), size: "2K", aspect: autoAspect }));
  } else {
    const p = params as JobParams["upscale"];
    jobs = [{ prompt: upscalePrompt(p), size: p.size, aspect: autoAspect }];
  }

  const outputs: StoredFile[] = [];
  let lastErr: unknown;
  // Chạy tối đa 2 biến thể song song.
  for (let i = 0; i < jobs.length; i += 2) {
    const batch = jobs.slice(i, i + 2);
    const results = await Promise.allSettled(
      batch.map((j) => ai.generateImage({ model, prompt: j.prompt, images: row.type === "render" ? images : images.slice(0, 1), aspect: j.aspect, size: j.size })),
    );
    for (const [k, r] of results.entries()) {
      if (r.status === "fulfilled") {
        outputs.push(await saveOutputImage(`${row.user_id}/${row.id}/out-${i + k}.${extFromMime(r.value.mime)}`, r.value.data, r.value.mime));
        update(row.id, { outputs: JSON.stringify(outputs) });
      } else {
        lastErr = r.reason;
        console.error("[job]", row.id, "variant", i + k, r.reason instanceof AiError ? `${r.reason.message} | ${r.reason.detail}` : r.reason);
      }
    }
  }

  const fresh = getRow(row.id)!;
  if (!outputs.length) return fail(fresh, errMsg(lastErr));
  const unit = row.type === "upscale" ? row.cost : PRICES[row.type as "render" | "staging"][params.quality === "pro" ? "pro" : "standard"];
  const refund = (jobs.length - outputs.length) * unit;
  if (refund > 0) addCredits(row.user_id, refund, "refund", { ref: row.id, note: `Hoàn ${jobs.length - outputs.length} ảnh lỗi` });
  update(row.id, {
    status: "succeeded",
    refunded: refund,
    error: refund > 0 ? `${jobs.length - outputs.length}/${jobs.length} ảnh lỗi, đã hoàn ${refund} credit` : null,
    finished_at: now(),
  });
}

const VIDEO_TIMEOUT_MS = 25 * 60_000;

async function runVideo(row: JobRow) {
  const p = JSON.parse(row.params) as JobParams["video"];
  const input = (JSON.parse(row.inputs) as StoredFile[])[0];
  const model = config.gemini.videoModel;
  update(row.id, { model });
  const res = await provider().startVideo({
    model,
    prompt: videoPrompt(p),
    image: { mime: input.mime, data: readFile(input.path) },
    aspect: p.aspect,
    resolution: p.resolution,
  });
  if (res.state === "done") return finishVideo(row.id, res.data, res.mime);
  update(row.id, { provider_ref: res.ref });
  await pollUntilDone(row.id);
}

async function pollUntilDone(id: string) {
  if (polling().has(id)) return;
  polling().add(id);
  try {
    for (;;) {
      const row = getRow(id);
      if (!row || row.status !== "processing" || !row.provider_ref) return;
      if (now() - (row.started_at ?? row.created_at) > VIDEO_TIMEOUT_MS) return fail(row, "Quá thời gian tạo video, credit đã được hoàn");
      await new Promise((r) => setTimeout(r, 5000));
      let res;
      try {
        res = await provider().pollVideo(row.provider_ref);
      } catch (e) {
        if (e instanceof AiError && e.retryable) continue;
        throw e;
      }
      if (res.state === "done") return finishVideo(id, res.data, res.mime);
      if (res.state === "failed") return fail(getRow(id)!, res.error);
      if (res.ref !== row.provider_ref) update(id, { provider_ref: res.ref });
    }
  } finally {
    polling().delete(id);
  }
}

async function finishVideo(id: string, data: Buffer, mime: string) {
  const row = getRow(id)!;
  const rel = `${row.user_id}/${row.id}/video.mp4`;
  writeFile(rel, data);
  const input = (JSON.parse(row.inputs) as StoredFile[])[0];
  const out: StoredFile = { path: rel, mime: mime.startsWith("video/") ? mime : "video/mp4", bytes: data.length, width: input.width, height: input.height };
  update(id, { status: "succeeded", outputs: JSON.stringify([out]), finished_at: now(), error: null });
}

/** Gọi khi server khởi động: chạy lại job dở dang do restart. */
export function recoverJobs() {
  const rows = db().prepare("SELECT * FROM jobs WHERE status IN ('queued','processing') ORDER BY created_at").all() as JobRow[];
  for (const r of rows) {
    if (r.status === "processing" && r.type === "video" && r.provider_ref) {
      pollUntilDone(r.id).catch((e) => {
        console.error("[recover]", r.id, e);
        const fresh = getRow(r.id);
        if (fresh?.status === "processing") fail(fresh, errMsg(e));
      });
    } else {
      update(r.id, { status: "queued", outputs: "[]" });
      enqueue(r.id, r.type);
    }
  }
  if (rows.length) console.log(`[recover] tiếp tục ${rows.length} job`);
}
