import { assistPrompt } from "@/lib/assist";
import type { ToolType } from "@/lib/catalog";
import { config } from "@/lib/config";
import { handle, HttpError, ok, requireUser } from "@/lib/http";
import { getJobForUser } from "@/lib/jobs";
import { readFile, type StoredFile } from "@/lib/storage";

/** "AI viết prompt": mô tả tiếng Việt (+ ảnh tuỳ chọn) → câu lệnh tiếng Anh chi tiết + gợi ý preset. Miễn phí, giới hạn lượt/ngày. */
export const POST = handle(async (req) => {
  const user = requireUser(req);
  const form = await req.formData();
  const tool = String(form.get("tool") ?? "") as ToolType;
  const text = String(form.get("text") ?? "");

  let image: Buffer | undefined;
  const file = form.get("image");
  if (file && typeof file !== "string" && file.size > 0) {
    if (file.size > config.maxUploadMb * 1024 * 1024) throw new HttpError(413, `Ảnh quá lớn, tối đa ${config.maxUploadMb}MB`);
    image = Buffer.from(await file.arrayBuffer());
  } else if (form.get("sourceJobId")) {
    const src = getJobForUser(String(form.get("sourceJobId")), user);
    const out = src ? (JSON.parse(src.outputs) as StoredFile[])[Number(form.get("sourceIndex") ?? 0)] : undefined;
    if (out?.mime.startsWith("image/")) image = readFile(out.path);
  }

  return ok(await assistPrompt({ userId: user.id, tool, text, image }));
});
