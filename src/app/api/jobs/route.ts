import { config } from "@/lib/config";
import { handle, HttpError, ok, requireUser } from "@/lib/http";
import { createJob, listJobs } from "@/lib/jobs";

export const GET = handle(async (req) => {
  const user = requireUser(req);
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") || undefined;
  const before = sp.get("before") ? Number(sp.get("before")) : undefined;
  const limit = Math.min(60, Number(sp.get("limit")) || 24);
  return ok({ jobs: listJobs(user.id, { type, before, limit }) });
});

async function fileBuffer(v: FormDataEntryValue | null): Promise<Buffer | undefined> {
  if (!v || typeof v === "string" || v.size === 0) return undefined;
  if (v.size > config.maxUploadMb * 1024 * 1024) throw new HttpError(413, `Ảnh quá lớn, tối đa ${config.maxUploadMb}MB`);
  return Buffer.from(await v.arrayBuffer());
}

export const POST = handle(async (req) => {
  const user = requireUser(req);
  const form = await req.formData();
  let params: unknown;
  try {
    params = JSON.parse(String(form.get("params") ?? "{}"));
  } catch {
    throw new HttpError(400, "Tham số không hợp lệ");
  }
  const sourceJobId = form.get("sourceJobId");
  const job = await createJob({
    user,
    type: String(form.get("type") ?? ""),
    params,
    image: await fileBuffer(form.get("image")),
    reference: await fileBuffer(form.get("reference")),
    source: typeof sourceJobId === "string" && sourceJobId ? { jobId: sourceJobId, index: Number(form.get("sourceIndex") ?? 0) } : undefined,
  });
  return ok({ job }, { status: 201 });
});
