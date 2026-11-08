// Kiểm thử nhanh toàn luồng API. Chạy: BASE=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/smoke-test.mjs
import sharp from "sharp";

const BASE = process.env.BASE ?? "http://localhost:3000";
const ADMIN = { email: process.env.ADMIN_EMAIL ?? "admin@test.vn", password: process.env.ADMIN_PASSWORD ?? "admin12345" };
let failures = 0;

function check(cond, msg) {
  console.log(`${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) failures++;
}

function client() {
  let cookie = "";
  return async function req(path, { method = "GET", json, form } = {}) {
    const res = await fetch(BASE + path, {
      method,
      headers: { ...(cookie ? { cookie } : {}), ...(json ? { "content-type": "application/json" } : {}) },
      body: json ? JSON.stringify(json) : form,
      redirect: "manual",
    });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const type = res.headers.get("content-type") ?? "";
    const body = type.includes("json") ? await res.json() : Buffer.from(await res.arrayBuffer());
    return { status: res.status, body, headers: res.headers };
  };
}

async function testImage() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="100%" height="100%" fill="#eee"/>
    <rect x="300" y="250" width="600" height="400" fill="#ccc" stroke="#333" stroke-width="6"/>
    <polygon points="270,250 600,80 930,250" fill="#bbb" stroke="#333" stroke-width="6"/>
    <rect x="550" y="450" width="100" height="200" fill="#999"/><rect x="380" y="330" width="120" height="90" fill="#9cf"/><rect x="700" y="330" width="120" height="90" fill="#9cf"/></svg>`;
  return sharp(Buffer.from(svg)).jpeg().toBuffer();
}

async function waitJob(req, id, timeoutMs = 120_000) {
  const t0 = Date.now();
  for (;;) {
    const r = await req(`/api/jobs/${id}`);
    if (["succeeded", "failed"].includes(r.body.job.status)) return r.body;
    if (Date.now() - t0 > timeoutMs) throw new Error("timeout " + id);
    await new Promise((r) => setTimeout(r, 1500));
  }
}

function jobForm(type, params, file, extra = {}) {
  const fd = new FormData();
  fd.set("type", type);
  fd.set("params", JSON.stringify(params));
  if (file) fd.set("image", new Blob([file], { type: "image/jpeg" }), "in.jpg");
  for (const [k, v] of Object.entries(extra)) fd.set(k, v);
  return fd;
}

const SKIP_VIDEO = !!process.env.SKIP_VIDEO; // máy không có ffmpeg (vd. trong Docker image) → bỏ qua bước video ở chế độ DEMO

// An toàn: script tạo nhiều tác vụ AI → không chạy trên server đang dùng Gemini thật (tốn tiền, và bước "lỗi giả lập" sẽ sai).
{
  const h = await fetch(BASE + "/api/health").then((r) => r.json()).catch(() => null);
  if (!h) { console.error(`Không kết nối được ${BASE}/api/health`); process.exit(1); }
  if (h.aiMode === "gemini" && !process.env.ALLOW_REAL_AI) {
    console.error("Server đang chạy Gemini thật. Hãy chạy smoke test trên một container DEMO riêng (xem docs/DEPLOY.md), hoặc đặt ALLOW_REAL_AI=1 nếu chắc chắn.");
    process.exit(2);
  }
}

const img = await testImage();
const user = client();
const admin = client();
const stranger = client();
const email = `user${Date.now()}@test.vn`;

// --- Đăng ký / đăng nhập ---
let r = await user("/api/me");
check(r.status === 401, "chưa đăng nhập → 401");
r = await user("/api/auth/register", { method: "POST", json: { email, password: "123", name: "A" } });
check(r.status === 400, "mật khẩu ngắn bị từ chối: " + r.body.error);
r = await user("/api/auth/register", { method: "POST", json: { email, password: "matkhau123", name: "Khách Test", phone: "0900" } });
check(r.status === 200 && r.body.user.credits > 0, `đăng ký thành công, credit tặng = ${r.body.user?.credits}`);
const startCredits = r.body.user.credits;
r = await user("/api/auth/register", { method: "POST", json: { email, password: "matkhau123", name: "X" } });
check(r.status === 409, "email trùng → 409");
r = await admin("/api/auth/login", { method: "POST", json: { ...ADMIN, password: "sai" } });
check(r.status === 401, "sai mật khẩu → 401");
r = await admin("/api/auth/login", { method: "POST", json: ADMIN });
check(r.status === 200 && r.body.user.role === "admin", "admin đăng nhập");

// --- Render 2 phương án ---
r = await user("/api/jobs", {
  method: "POST",
  form: jobForm("render", { scene: "exterior", inputKind: "sketch", style: "indochine", lighting: "golden", fidelity: "strict", aspect: "auto", quality: "standard", count: 2, vietnam: true, people: true, prompt: "mái ngói đỏ" }, img),
});
check(r.status === 201 && r.body.job.cost === 6, `tạo job render (cost ${r.body.job?.cost})`);
const render = await waitJob(user, r.body.job.id);
check(render.job.status === "succeeded" && render.job.outputs.length === 2, `render xong: ${render.job.outputs.length} ảnh, aspect từ ảnh 1200x800 → ${render.job.outputs[0]?.width}x${render.job.outputs[0]?.height}`);
check(render.credits === startCredits - 6, `credit còn ${render.credits}`);

// --- Quyền truy cập file ---
const outUrl = render.job.outputs[0].url;
r = await user(outUrl);
check(r.status === 200 && r.headers.get("content-type") === "image/png", "chủ sở hữu tải được ảnh");
r = await stranger(outUrl);
check(r.status === 401, "người lạ không xem được ảnh");
r = await admin(outUrl);
check(r.status === 200, "admin xem được ảnh");
r = await user("/api/files/../../etc/passwd");
check(r.status === 404 || r.status === 401, "chặn path traversal");

// --- Thiếu credit ---
r = await user("/api/jobs", { method: "POST", form: jobForm("video", { move: "orbit", resolution: "1080p" }, img) });
check(r.status === 402 && r.body.code === "insufficient_credits", "video 1080p khi thiếu credit → 402: " + r.body.error);

// --- Nạp credit + admin duyệt ---
r = await user("/api/topups", { method: "POST", json: { packageId: "pro" } });
check(
  r.status === 201 && (r.body.topup.qr === null || (r.body.topup.qr.includes("img.vietqr.io") && r.body.topup.qr.includes(r.body.topup.code))),
  `tạo yêu cầu nạp ${r.body.topup?.code}, ${r.body.topup?.qr ? "có QR" : "chưa cấu hình ngân hàng nên không có QR"}`,
);
const topup = r.body.topup;
r = await user(`/api/admin/topups/${topup.id}`, { method: "POST", json: { action: "approve" } });
check(r.status === 403, "user thường không duyệt được");
r = await admin(`/api/admin/topups/${topup.id}`, { method: "POST", json: { action: "approve" } });
check(r.status === 200 && r.body.topup.status === "approved", "admin duyệt nạp");
r = await admin(`/api/admin/topups/${topup.id}`, { method: "POST", json: { action: "approve" } });
check(r.status === 400, "duyệt lần 2 bị chặn (không cộng trùng)");
r = await user("/api/credits");
check(r.body.credits === startCredits - 6 + 300, `số dư sau nạp = ${r.body.credits}`);

// --- Upscale từ kết quả render (không upload lại) ---
r = await user("/api/jobs", { method: "POST", form: jobForm("upscale", { size: "4K", mode: "faithful", quality: "standard" }, null, { sourceJobId: render.job.id, sourceIndex: "1" }) });
check(r.status === 201, "tạo upscale từ ảnh render");
const up = await waitJob(user, r.body.job.id);
check(up.job.status === "succeeded" && Math.max(up.job.outputs[0].width, up.job.outputs[0].height) === 4096, `upscale 4K → ${up.job.outputs[0]?.width}x${up.job.outputs[0]?.height}`);

// --- Staging ---
r = await user("/api/jobs", { method: "POST", form: jobForm("staging", { room: "bedroom", style: "japandi", declutter: true, quality: "pro", count: 1 }, img) });
check(r.status === 201 && r.body.job.cost === 8, "tạo staging Pro (8 credit)");
const st = await waitJob(user, r.body.job.id);
check(st.job.status === "succeeded" && st.job.model === "gemini-3-pro-image", `staging xong, model ${st.job.model}`);

// --- Lỗi AI → hoàn credit ---
const before = (await user("/api/credits")).body.credits;
r = await user("/api/jobs", { method: "POST", form: jobForm("render", { scene: "interior", style: "modern", count: 1, prompt: "MOCK_FAIL" }, img) });
const bad = await waitJob(user, r.body.job.id);
const after = (await user("/api/credits")).body.credits;
check(bad.job.status === "failed" && bad.job.refunded === 3 && after === before, `job lỗi được hoàn credit (${before} → ${after}): ${bad.job.error}`);

// --- Video ---
if (!SKIP_VIDEO) {
r = await user("/api/jobs", { method: "POST", form: jobForm("video", { move: "push", ambience: "nature", audio: "ambient", aspect: "16:9", resolution: "360p" }, null, { sourceJobId: render.job.id, sourceIndex: "0" }) });
check(r.status === 201 && r.body.job.cost === 15, "tạo video 360p");
const vid = await waitJob(user, r.body.job.id, 180_000);
check(vid.job.status === "succeeded" && vid.job.outputs[0]?.mime === "video/mp4", `video xong: ${vid.job.error ?? vid.job.outputs[0]?.url}`);
if (vid.job.outputs[0]) {
  const res = await fetch(BASE + vid.job.outputs[0].url, { headers: { cookie: "" } });
  check(res.status === 401, "video cũng được bảo vệ");
  r = await user(vid.job.outputs[0].url);
  check(r.status === 200 && r.body.length > 1000, `tải video ${r.body.length} bytes`);
}
} else console.log("· bỏ qua kiểm tra video (SKIP_VIDEO)");

// --- Validate tham số ---
r = await user("/api/jobs", { method: "POST", form: jobForm("render", { scene: "spaceship", style: "modern" }, img) });
check(r.status === 400, "tham số sai bị từ chối: " + r.body.error);
r = await user("/api/jobs", { method: "POST", form: jobForm("render", { scene: "exterior", style: "modern" }, Buffer.from("not an image")) });
check(r.status === 400, "file không phải ảnh bị từ chối: " + r.body.error);

// --- Preset mới + AI viết prompt ---
const aiMode = (await user("/api/me")).body.aiMode;
r = await user("/api/jobs", {
  method: "POST",
  form: jobForm("render", { scene: "exterior", building: "villa", style: "newasian", lighting: "bluehour", atmosphere: "tet", context: "seaside", camera: "drone", renderStyle: "model", materials: ["stone", "louver", "glass"], count: 1, detail: "A calm resort villa." }, img),
});
check(r.status === 201, "render với preset mới (công trình, góc máy, sa bàn, vật liệu)");
if (r.status === 201) {
  const j = await waitJob(user, r.body.job.id);
  check(j.job.status === "succeeded", "render preset mới xong");
}
r = await user("/api/jobs", { method: "POST", form: jobForm("render", { scene: "exterior", style: "modern", materials: ["vang-ròng"] }, img) });
check(r.status === 400, "vật liệu không hợp lệ bị từ chối");
r = await user("/api/jobs", { method: "POST", form: jobForm("render", { scene: "exterior", style: "modern", materials: ["stone", "glass", "oak", "brass", "rattan"] }, img) });
check(r.status === 400, "quá 4 vật liệu bị từ chối");
if (!SKIP_VIDEO) {
  r = await user("/api/jobs", { method: "POST", form: jobForm("video", { move: "walkthrough", speed: "slow", ambience: "water", resolution: "360p" }, img) });
  check(r.status === 201, "video chuyển động mới (đi xuyên không gian)");
  if (r.status === 201) await waitJob(user, r.body.job.id, 180_000);
}

const assist = (fields) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return user("/api/prompt/assist", { method: "POST", form: fd });
};
r = await assist({ tool: "render", text: "Biệt thự Indochine ven biển lúc hoàng hôn, ốp đá tự nhiên và lam gỗ, góc flycam" });
if (aiMode === "mock") {
  const s = r.body.suggestions ?? {};
  check(
    r.status === 200 && r.body.mode === "rules" && s.style === "indochine" && s.building === "villa" && s.lighting === "golden" && s.context === "seaside" && s.camera === "drone" && s.materials?.includes("stone") && s.materials?.includes("louver"),
    `AI viết prompt (từ khoá): ${JSON.stringify(s)}`,
  );
} else {
  check(r.status === 200 && r.body.mode === "ai" && r.body.detail.length > 0, `AI viết prompt (Gemini): ${r.body.summary} | ${JSON.stringify(r.body.suggestions)}`);
}
r = await assist({ tool: "render", text: "nha pho phong cach dong duong, ban dem" });
check(r.status === 200 && (aiMode !== "mock" || (r.body.suggestions.style === "indochine" && r.body.suggestions.lighting === "night")), `nhận diện tiếng Việt không dấu: ${JSON.stringify(r.body.suggestions)}`);
r = await assist({ tool: "render", text: "Nhà phố Đông Dương, cửa sổ làm bằng kính" });
check(r.status === 200 && !(r.body.suggestions.materials ?? []).includes("brass") && !(r.body.suggestions.materials ?? []).includes("louver"), "không nhận nhầm 'Đông' thành đồng, 'làm' thành lam");
r = await assist({ tool: "render", text: "Style hiện đại, vật liệu tối giản" });
check(r.status === 200 && (aiMode !== "mock" || r.body.suggestions.style === "modern"), `ý chính đứng trước được ưu tiên ("hiện đại" thắng "tối giản"): ${JSON.stringify(r.body.suggestions)}`);
r = await assist({ tool: "staging", text: "phòng ngủ cho thuê giá rẻ phong cách bắc âu" });
check(r.status === 200 && (aiMode !== "mock" || (r.body.suggestions.room === "bedroom" && r.body.suggestions.budget === "economy" && r.body.suggestions.style === "scandi")), `staging: ${JSON.stringify(r.body.suggestions)}`);
r = await assist({ tool: "video", text: "flycam bay lên chậm, khung dọc đăng tiktok, có nhạc" });
check(r.status === 200 && (aiMode !== "mock" || (r.body.suggestions.move === "crane" && r.body.suggestions.aspect === "9:16" && r.body.suggestions.audio === "music")), `video: ${JSON.stringify(r.body.suggestions)}`);
r = await assist({ tool: "upscale", text: "nâng nét" });
check(r.status === 400, "upscale không dùng AI viết prompt");
r = await assist({ tool: "render", text: "a" });
check(r.status === 400, "mô tả quá ngắn bị từ chối");
r = await assist({ tool: "render", text: "chung cư hiện đại", sourceJobId: render.job.id, sourceIndex: "0" });
check(r.status === 200, "AI viết prompt kèm ảnh từ kết quả trước");

// --- Admin ---
r = await admin("/api/admin/overview");
check(r.status === 200 && r.body.stats.users >= 2, `admin overview: ${JSON.stringify(r.body.stats)}`);
r = await admin(`/api/admin/users?q=${encodeURIComponent(email)}`);
const uid = r.body.users[0]?.id;
check(!!uid, "admin tìm được user");
r = await admin(`/api/admin/users/${uid}`, { method: "POST", json: { delta: -10000 } });
check(r.status === 402, "không trừ quá số dư");
r = await admin(`/api/admin/users/${uid}`, { method: "POST", json: { delta: 50, note: "khuyến mãi" } });
check(r.status === 200, `admin cộng tay 50 → ${r.body.user?.credits}`);
r = await user("/api/jobs?limit=50");
check(r.body.jobs.length >= 5, `thư viện có ${r.body.jobs.length} job`);

console.log(failures ? `\n${failures} kiểm tra THẤT BẠI` : "\nTất cả kiểm tra đều đạt");
process.exit(failures ? 1 : 0);
