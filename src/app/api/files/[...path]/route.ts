import fs from "node:fs";
import { Readable } from "node:stream";
import { handle, HttpError, requireUser } from "@/lib/http";
import { absPath, contentTypeFor } from "@/lib/storage";

/** Phục vụ file ảnh/video của người dùng (chủ sở hữu hoặc admin). Hỗ trợ Range cho video trên Safari. */
export const GET = handle<RouteContext<"/api/files/[...path]">>(async (req, ctx) => {
  const user = requireUser(req);
  const { path: parts } = await ctx.params;
  if (!parts?.length || (parts[0] !== user.id && user.role !== "admin")) throw new HttpError(404, "Không tìm thấy file");
  let p: string;
  try {
    p = absPath(parts.join("/"));
  } catch {
    throw new HttpError(404, "Không tìm thấy file");
  }
  if (!fs.existsSync(p)) throw new HttpError(404, "Không tìm thấy file");

  const size = fs.statSync(p).size;
  const type = contentTypeFor(p);
  const download = req.nextUrl.searchParams.get("download");
  const headers: Record<string, string> = {
    "content-type": type,
    "accept-ranges": "bytes",
    "cache-control": "private, max-age=31536000, immutable",
  };
  if (download) headers["content-disposition"] = `attachment; filename="${download.replace(/[^\w.\-]/g, "_")}"`;

  const range = req.headers.get("range");
  const m = range?.match(/bytes=(\d*)-(\d*)/);
  if (m) {
    const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    const stream = Readable.toWeb(fs.createReadStream(p, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "content-range": `bytes ${start}-${end}/${size}`, "content-length": String(end - start + 1) },
    });
  }
  const stream = Readable.toWeb(fs.createReadStream(p)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "content-length": String(size) } });
});
