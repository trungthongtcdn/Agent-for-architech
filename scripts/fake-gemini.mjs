// Server giả lập Gemini API để test adapter mà không tốn tiền.
// Chạy: PORT=3200 node scripts/fake-gemini.mjs  rồi đặt GEMINI_BASE_URL=http://localhost:3200/v1beta AI_MODE=gemini GEMINI_API_KEY=test
// FAKE_REJECT_RESPONSE_FORMAT=1 → giả lập API chỉ nhận imageConfig (kiểm tra cơ chế tự chuyển).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const PORT = Number(process.env.PORT ?? 3200);
const READY_AFTER = Number(process.env.FILE_READY_AFTER_MS ?? 6000);
const files = new Map(); // id -> createdAt
let videoBytes;
{
  const f = path.join(os.tmpdir(), "fake-gemini.mp4");
  execFileSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "testsrc=size=640x360:rate=24", "-t", "2", "-pix_fmt", "yuv420p", f], { stdio: "ignore" });
  videoBytes = fs.readFileSync(f);
}

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

http
  .createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString();
    const url = new URL(req.url, "http://x");
    const key = req.headers["x-goog-api-key"];
    const log = (m) => console.log(`[fake] ${req.method} ${url.pathname} ${m}`);
    if (key !== "test") return json(res, 403, { error: { status: "PERMISSION_DENIED", message: "API key not valid" } });

    let m = url.pathname.match(/^\/v1beta\/models\/([^/:]+):generateContent$/);
    if (m && req.method === "POST") {
      const body = JSON.parse(raw);
      const parts = body.contents?.[0]?.parts ?? [];
      const text = parts.find((p) => p.text)?.text ?? "";
      const imgs = parts.filter((p) => p.inline_data?.data);
      const gc = body.generationConfig ?? {};
      const sizing = gc.responseFormat?.image ?? gc.imageConfig;
      if (process.env.FAKE_REJECT_RESPONSE_FORMAT && gc.responseFormat)
        return log("reject responseFormat"), json(res, 400, { error: { status: "INVALID_ARGUMENT", message: 'Invalid JSON payload received. Unknown name "responseFormat" at \'generation_config\'' } });
      if (!sizing?.aspectRatio || !/^(1K|2K|4K)$/.test(sizing.imageSize ?? "") || !gc.responseModalities?.includes("IMAGE"))
        return log("bad config " + JSON.stringify(gc)), json(res, 400, { error: { message: "bad generationConfig" } });
      log(`model=${m[1]} images=${imgs.length} size=${sizing.imageSize} aspect=${sizing.aspectRatio} via=${gc.responseFormat ? "responseFormat" : "imageConfig"} prompt=${text.length}ch`);
      if (text.includes("MOCK_FAIL")) return json(res, 200, { promptFeedback: { blockReason: "SAFETY" } });
      const [w, h] = sizing.aspectRatio.split(":").map(Number);
      const long = { "1K": 1024, "2K": 2048, "4K": 4096 }[sizing.imageSize];
      const W = w >= h ? long : Math.round((long * w) / h);
      const H = w >= h ? Math.round((long * h) / w) : long;
      const out = await sharp(Buffer.from(imgs[0].inline_data.data, "base64")).resize(W, H, { fit: "cover" }).negate().png().toBuffer();
      return json(res, 200, {
        candidates: [{ content: { role: "model", parts: [{ text: "thinking...", thought: true }, { inlineData: { mimeType: "image/png", data: out.toString("base64") } }] }, finishReason: "STOP" }],
      });
    }

    if (url.pathname === "/v1beta/interactions" && req.method === "POST") {
      const body = JSON.parse(raw);
      const img = body.input?.find((i) => i.type === "image");
      const txt = body.input?.find((i) => i.type === "text");
      const rf = body.response_format ?? {};
      log(`model=${body.model} image=${!!img?.data} mime=${img?.mime_type} text=${txt?.text?.length}ch format=${JSON.stringify(rf)}`);
      if (!img?.data || !txt?.text || rf.type !== "video") return json(res, 400, { error: { message: "bad interaction input" } });
      await new Promise((r) => setTimeout(r, 1500));
      const id = "vid" + Date.now();
      files.set(id, Date.now());
      return json(res, 200, { id: "int_" + id, status: "completed", model: body.model, output_video: { uri: `https://generativelanguage.googleapis.com/v1beta/files/${id}`, mime_type: "video/mp4" } });
    }

    m = url.pathname.match(/^\/v1beta\/files\/([^/:]+)(:download)?$/);
    if (m && req.method === "GET") {
      const t = files.get(m[1]);
      if (!t) return json(res, 404, { error: { message: "file not found" } });
      if (m[2]) {
        log("download");
        res.writeHead(200, { "content-type": "video/mp4" });
        return res.end(videoBytes);
      }
      const state = Date.now() - t > READY_AFTER ? "ACTIVE" : "PROCESSING";
      log(state);
      return json(res, 200, { name: `files/${m[1]}`, mimeType: "video/mp4", state });
    }
    json(res, 404, { error: { message: "unknown route " + url.pathname } });
  })
  .listen(PORT, () => console.log(`[fake] Gemini giả lập tại http://localhost:${PORT}/v1beta`));
