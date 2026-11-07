import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { AiError, type AiProvider, type ImageRequest, type VideoPoll, type VideoRequest, type VideoStart } from "./types";

/**
 * Provider giả lập để phát triển/test khi chưa có GEMINI_API_KEY.
 * Ảnh: xử lý màu ảnh đầu vào + gắn nhãn MOCK. Video: ffmpeg zoom chậm từ ảnh (cần ffmpeg).
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const LONG_SIDE = { "1K": 1024, "2K": 2048, "4K": 4096 } as const;

function dims(aspect: string, long: number) {
  const [w, h] = aspect.split(":").map(Number);
  return w >= h ? { width: long, height: Math.round((long * h) / w) } : { width: Math.round((long * w) / h), height: long };
}

async function generateImage(req: ImageRequest) {
  await sleep(1200);
  if (/MOCK_FAIL/.test(req.prompt)) throw new AiError("Lỗi giả lập (MOCK_FAIL)", false);
  const { width, height } = dims(req.aspect, LONG_SIDE[req.size]);
  const hue = parseInt(crypto.createHash("md5").update(req.prompt).digest("hex").slice(0, 2), 16);
  const label = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="${height - Math.round(height * 0.09)}" width="${width}" height="${Math.round(height * 0.09)}" fill="rgba(0,0,0,0.55)"/>
      <text x="${Math.round(width * 0.03)}" y="${height - Math.round(height * 0.03)}" font-family="sans-serif" font-size="${Math.round(height * 0.045)}" fill="#fff">MOCK · ${req.model} · ${req.size} · ${req.aspect}</text>
    </svg>`,
  );
  const base = req.images[0]
    ? sharp(req.images[0].data).resize(width, height, { fit: "cover" })
    : sharp({ create: { width, height, channels: 3, background: "#8899aa" } });
  const data = await base
    .modulate({ saturation: 1.35, brightness: 1.04, hue })
    .composite([{ input: label }])
    .png()
    .toBuffer();
  return { mime: "image/png", data };
}

const RES = { "360p": 360, "720p": 720, "1080p": 1080 } as const;

async function startVideo(req: VideoRequest): Promise<VideoStart> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mockvid-"));
  const input = path.join(dir, "in.jpg");
  fs.writeFileSync(input, await sharp(req.image.data).jpeg().toBuffer());
  const short = RES[req.resolution];
  const [W, H] = req.aspect === "9:16" ? [short, Math.round((short * 16) / 9 / 2) * 2] : [Math.round((short * 16) / 9 / 2) * 2, short];
  const vf = `scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,crop=${W * 2}:${H * 2},zoompan=z='min(zoom+0.0025,1.3)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=96:s=${W}x${H}:fps=24`;
  execFile(
    "ffmpeg",
    ["-y", "-loop", "1", "-i", input, "-vf", vf, "-t", "4", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path.join(dir, "out.tmp.mp4")],
    (err) => {
      if (err) fs.writeFileSync(path.join(dir, "error.txt"), String(err.message));
      else fs.renameSync(path.join(dir, "out.tmp.mp4"), path.join(dir, "out.mp4"));
    },
  );
  return { state: "pending", ref: `mock:${dir}` };
}

async function pollVideo(ref: string): Promise<VideoPoll> {
  const dir = ref.replace(/^mock:/, "");
  if (!dir.startsWith(os.tmpdir())) return { state: "failed", error: "ref không hợp lệ" };
  if (fs.existsSync(path.join(dir, "error.txt")))
    return { state: "failed", error: "Mock video lỗi (máy chủ cần ffmpeg): " + fs.readFileSync(path.join(dir, "error.txt"), "utf8").slice(0, 200) };
  const out = path.join(dir, "out.mp4");
  if (!fs.existsSync(out)) return { state: "pending", ref };
  const data = fs.readFileSync(out);
  fs.rmSync(dir, { recursive: true, force: true });
  return { state: "done", mime: "video/mp4", data };
}

export const mockProvider: AiProvider = { name: "mock", generateImage, startVideo, pollVideo };
