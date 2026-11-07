import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { config } from "./config";
import { IMAGE_ASPECTS } from "./catalog";

export type StoredFile = { path: string; mime: string; width?: number; height?: number; bytes: number };

const filesRoot = () => path.join(config.dataDir, "files");

/** Đường dẫn tương đối (lưu DB) → tuyệt đối, chặn path traversal. */
export function absPath(rel: string): string {
  const root = filesRoot();
  const p = path.resolve(root, rel);
  if (!p.startsWith(root + path.sep)) throw new Error("Đường dẫn không hợp lệ");
  return p;
}

export function writeFile(rel: string, buf: Buffer) {
  const p = absPath(rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, buf);
}

export function readFile(rel: string): Buffer {
  return fs.readFileSync(absPath(rel));
}

export function fileUrl(rel: string) {
  return `/api/files/${rel}`;
}

const MAX_INPUT_SIDE = 2048;

/** Chuẩn hoá ảnh upload: xoay theo EXIF, giới hạn 2048px, chuyển JPEG. */
export async function saveInputImage(rel: string, buf: Buffer): Promise<StoredFile> {
  let img = sharp(buf, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  if (!meta.width || !meta.height) throw new Error("Không đọc được ảnh");
  img = img.resize({ width: MAX_INPUT_SIDE, height: MAX_INPUT_SIDE, fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" });
  const out = await img.jpeg({ quality: 92, mozjpeg: true }).toBuffer({ resolveWithObject: true });
  writeFile(rel, out.data);
  return { path: rel, mime: "image/jpeg", width: out.info.width, height: out.info.height, bytes: out.data.length };
}

export async function saveOutputImage(rel: string, buf: Buffer, mime: string): Promise<StoredFile> {
  const meta = await sharp(buf).metadata().catch(() => ({ width: undefined, height: undefined }));
  writeFile(rel, buf);
  return { path: rel, mime, width: meta.width, height: meta.height, bytes: buf.length };
}

/** Chọn tỉ lệ khung hình được model hỗ trợ gần nhất với ảnh đầu vào. */
export function nearestAspect(width: number, height: number, allowed: readonly string[] = IMAGE_ASPECTS): string {
  const r = width / height;
  let best = allowed[0];
  let bestDiff = Infinity;
  for (const a of allowed) {
    const [w, h] = a.split(":").map(Number);
    const diff = Math.abs(Math.log(r / (w / h)));
    if (diff < bestDiff) {
      bestDiff = diff;
      best = a;
    }
  }
  return best;
}

export function extFromMime(mime: string) {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("mp4")) return "mp4";
  return "jpg";
}

export function contentTypeFor(file: string) {
  const ext = path.extname(file).toLowerCase();
  return (
    { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".mp4": "video/mp4" } as Record<string, string>
  )[ext] ?? "application/octet-stream";
}
