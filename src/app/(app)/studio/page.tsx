"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ASPECTS,
  ATMOSPHERES,
  BUDGETS,
  BUILDINGS,
  CAMERA_MOVES,
  CAMERAS,
  CONTEXTS,
  DEFAULT_PARAMS,
  FIDELITY,
  INPUT_KINDS,
  jobCost,
  LIGHTING,
  MATERIALS,
  MAX_MATERIALS,
  QUALITIES,
  REF_STRENGTH,
  RENDER_STYLES,
  ROOMS,
  SCENES,
  STAGING_LIGHTING,
  STYLES,
  TOOLS,
  UPSCALE_MODES,
  VIDEO_AMBIENCE,
  VIDEO_AUDIO,
  VIDEO_RESOLUTIONS,
  VIDEO_SPEEDS,
  type JobParams,
  type ToolType,
} from "@/lib/catalog";
import { api, ApiError, type ClientJob } from "@/lib/client";
import { buildPrompt } from "@/lib/prompts";
import { templatesFor } from "@/lib/templates";
import { IconBuilding, IconExpand, IconGrid, IconSofa, IconSpark, IconVideo } from "@/components/icons";
import { JobCard } from "@/components/job-card";
import { PromptAssistant } from "@/components/prompt-assistant";
import { useSession } from "@/components/session";
import { TemplateSheet } from "@/components/template-sheet";
import { Button, Chips, Disclosure, Field, GroupedChips, ImagePicker, MultiChips, Notice, Toggle, type PickedImage } from "@/components/ui";

const TOOL_ICON: Record<ToolType, React.ComponentType<{ className?: string }>> = {
  render: IconBuilding,
  staging: IconSofa,
  upscale: IconExpand,
  video: IconVideo,
};

const COUNTS = [1, 2, 3, 4].map((n) => ({ id: String(n), label: `${n} ảnh` }));
const OUTDOOR = ["exterior", "landscape", "masterplan"];

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="shimmer h-64 rounded-xl" />}>
      <Studio />
    </Suspense>
  );
}

function Studio() {
  const sp = useSearchParams();
  const router = useRouter();
  const { user, setCredits } = useSession();
  const [tool, setTool] = useState<ToolType>("render");
  const [params, setParams] = useState<JobParams>(DEFAULT_PARAMS);
  const [image, setImage] = useState<PickedImage>(null);
  const [reference, setReference] = useState<PickedImage>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [jobs, setJobs] = useState<ClientJob[]>([]);

  // ?tool=upscale&src=jobId:index — mở công cụ với ảnh lấy từ kết quả trước.
  useEffect(() => {
    const t = sp.get("tool") as ToolType | null;
    if (t && TOOLS.some((x) => x.id === t)) setTool(t);
    const src = sp.get("src");
    if (!src) return;
    const [jobId, idx] = src.split(":");
    api<{ job: ClientJob }>(`/api/jobs/${jobId}`)
      .then(({ job }) => {
        const out = job.outputs[Number(idx) || 0];
        if (out) setImage({ url: out.url, source: { jobId, index: Number(idx) || 0 } });
      })
      .catch(() => {});
  }, [sp]);

  useEffect(() => {
    api<{ jobs: ClientJob[] }>("/api/jobs?limit=6")
      .then((r) => setJobs(r.jobs))
      .catch(() => {});
  }, []);

  // Cuộn thẻ công cụ đang chọn vào tầm nhìn (danh sách cuộn ngang trên mobile).
  useEffect(() => {
    document.getElementById(`tool-${tool}`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [tool]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const p = params[tool] as Record<string, unknown>;
  const set = <T extends ToolType>(t: T, patch: Partial<JobParams[T]>) => setParams((s) => ({ ...s, [t]: { ...s[t], ...patch } }));
  const cost = useMemo(() => jobCost(tool, p), [tool, p]);
  const enough = (user?.credits ?? 0) >= cost;
  const finalPrompt = useMemo(() => buildPrompt(tool, p, { hasReference: tool === "render" && !!reference }), [tool, p, reference]);
  const r = params.render;
  const outdoor = OUTDOOR.includes(r.scene);

  function applySuggestions(s: Record<string, string | string[]>) {
    setParams((st) => ({ ...st, [tool]: { ...st[tool], ...s } }));
  }

  async function submit() {
    if (!image) return setError({ message: "Vui lòng chọn ảnh đầu vào" });
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("type", tool);
      fd.set("params", JSON.stringify(p));
      if (image.file) fd.set("image", image.file);
      else if (image.source) {
        fd.set("sourceJobId", image.source.jobId);
        fd.set("sourceIndex", String(image.source.index));
      }
      if (tool === "render" && reference?.file) fd.set("reference", reference.file);
      const res = await api<{ job: ClientJob }>("/api/jobs", { method: "POST", body: fd });
      setJobs((js) => [res.job, ...js]);
      if (user) setCredits(user.credits - res.job.cost);
      if (sp.get("src")) router.replace("/studio?tool=" + tool, { scroll: false });
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      setError({ message: e instanceof Error ? e.message : "Có lỗi xảy ra", code: e instanceof ApiError ? e.code : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  const pickerText: Record<ToolType, [string, string]> = {
    render: ["Tải ảnh SketchUp, phác thảo hoặc ảnh chụp", "Chụp màn hình viewport, ảnh vẽ tay… (JPG/PNG)"],
    staging: ["Tải ảnh căn phòng cần bày nội thất", "Phòng trống hoặc đang thô, chụp ngang tầm mắt"],
    upscale: ["Tải ảnh cần nâng độ phân giải", "Ảnh render, ảnh chụp công trình…"],
    video: ["Tải ảnh làm khung hình đầu video", "Nên dùng ảnh render đẹp, rõ nét"],
  };
  const templateCount = templatesFor(tool).length;
  const assistant =
    tool !== "upscale" ? (
      <PromptAssistant
        tool={tool}
        note={String(p.prompt ?? "")}
        onNote={(v) => applySuggestions({ prompt: v })}
        detail={String(p.detail ?? "")}
        onDetail={(v) => applySuggestions({ detail: v })}
        image={image}
        onSuggestions={applySuggestions}
      />
    ) : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,460px)_1fr]">
      <section className="min-w-0 space-y-5">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-2 lg:px-0">
          {TOOLS.map((t) => {
            const Icon = TOOL_ICON[t.id];
            const active = t.id === tool;
            return (
              <button
                key={t.id}
                id={`tool-${t.id}`}
                onClick={() => {
                  setTool(t.id);
                  setError(null);
                }}
                className={`min-w-[140px] shrink-0 rounded-xl border p-3 text-left transition ${active ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink/30"}`}
              >
                <Icon className={`size-5 ${active ? "text-accent-soft" : "text-accent"}`} />
                <div className="mt-2 text-sm font-semibold">{t.label}</div>
                <div className={`mt-0.5 text-xs leading-snug ${active ? "text-paper/70" : "text-muted"}`}>{t.desc}</div>
              </button>
            );
          })}
        </div>

        <div className="space-y-5 rounded-2xl border border-line bg-white/60 p-4">
          {templateCount > 0 && (
            <button
              type="button"
              onClick={() => setShowTemplates(true)}
              className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5 text-sm hover:border-accent"
            >
              <span className="flex items-center gap-2 font-medium">
                <IconGrid className="size-4 text-accent" /> Mẫu có sẵn
              </span>
              <span className="text-xs text-muted">{templateCount} mẫu · chạm để chọn ›</span>
            </button>
          )}
          {toast && <Notice tone="success">{toast}</Notice>}

          <ImagePicker value={image} onChange={setImage} title={pickerText[tool][0]} subtitle={pickerText[tool][1]} />

          {tool === "render" && (
            <>
              <Field label="Loại phối cảnh">
                <Chips options={SCENES} value={r.scene} onChange={(v) => set("render", { scene: v })} />
              </Field>
              {outdoor && (
                <Field label="Loại công trình">
                  <Chips options={BUILDINGS} value={r.building} onChange={(v) => set("render", { building: v })} />
                </Field>
              )}
              {r.scene === "interior" && (
                <Field label="Không gian">
                  <GroupedChips options={ROOMS} value={r.room} onChange={(v) => set("render", { room: v })} />
                </Field>
              )}
              <Field label="Phong cách">
                <GroupedChips options={STYLES} value={r.style} onChange={(v) => set("render", { style: v })} />
              </Field>
              {r.scene !== "floorplan" && (
                <Field label="Ánh sáng & thời điểm">
                  <Chips options={LIGHTING} value={r.lighting} onChange={(v) => set("render", { lighting: v })} />
                </Field>
              )}
              {assistant}
              <Disclosure title="Tuỳ chọn nâng cao" hint="góc máy, vật liệu, bối cảnh…">
                <Field label="Ảnh đầu vào là">
                  <Chips options={INPUT_KINDS} value={r.inputKind} onChange={(v) => set("render", { inputKind: v })} />
                </Field>
                {r.scene !== "floorplan" && (
                  <Field label="Góc máy">
                    <Chips options={CAMERAS} value={r.camera} onChange={(v) => set("render", { camera: v })} />
                  </Field>
                )}
                {r.camera === "keep" && r.scene !== "floorplan" && (
                  <Field label="Mức bám thiết kế">
                    <Chips options={FIDELITY} value={r.fidelity} onChange={(v) => set("render", { fidelity: v })} />
                  </Field>
                )}
                {outdoor && (
                  <Field label="Bối cảnh xung quanh">
                    <Chips options={CONTEXTS} value={r.context} onChange={(v) => set("render", { context: v })} />
                  </Field>
                )}
                <Field label="Không khí / mùa">
                  <Chips options={ATMOSPHERES} value={r.atmosphere} onChange={(v) => set("render", { atmosphere: v })} />
                </Field>
                <Field label="Vật liệu chủ đạo" hint={`tối đa ${MAX_MATERIALS}`}>
                  <MultiChips options={MATERIALS} value={r.materials} max={MAX_MATERIALS} onChange={(v) => set("render", { materials: v })} />
                </Field>
                <Field label="Kiểu diễn họa">
                  <Chips options={RENDER_STYLES} value={r.renderStyle} onChange={(v) => set("render", { renderStyle: v })} />
                </Field>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Toggle label="Bối cảnh Việt Nam" checked={r.vietnam} onChange={(v) => set("render", { vietnam: v })} />
                  {outdoor && <Toggle label="Thêm người, xe cho tỉ lệ" checked={r.people} onChange={(v) => set("render", { people: v })} />}
                </div>
                <Field label="Ảnh tham chiếu phong cách" hint="Không bắt buộc">
                  <ImagePicker compact value={reference} onChange={setReference} title="Moodboard / ảnh mẫu vật liệu" />
                </Field>
                {reference && (
                  <Field label="Mức bám ảnh tham chiếu">
                    <Chips options={REF_STRENGTH} value={r.refStrength} onChange={(v) => set("render", { refStrength: v })} />
                  </Field>
                )}
                <Field label="Khung hình">
                  <Chips options={ASPECTS} value={r.aspect as (typeof ASPECTS)[number]["id"]} onChange={(v) => set("render", { aspect: v })} />
                </Field>
              </Disclosure>
              <Field label="Số phương án">
                <Chips options={COUNTS} value={String(r.count)} onChange={(v) => set("render", { count: Number(v) })} />
              </Field>
              <Field label="Chất lượng">
                <Chips options={QUALITIES} value={r.quality} onChange={(v) => set("render", { quality: v })} />
              </Field>
            </>
          )}

          {tool === "staging" && (
            <>
              <Field label="Loại phòng">
                <GroupedChips options={ROOMS} value={params.staging.room} onChange={(v) => set("staging", { room: v })} />
              </Field>
              <Field label="Phong cách nội thất">
                <GroupedChips options={STYLES} value={params.staging.style} onChange={(v) => set("staging", { style: v })} />
              </Field>
              <Field label="Mức đầu tư nội thất">
                <Chips options={BUDGETS} value={params.staging.budget} onChange={(v) => set("staging", { budget: v })} />
              </Field>
              {assistant}
              <Disclosure title="Tuỳ chọn nâng cao" hint="vật liệu, ánh sáng">
                <Field label="Vật liệu chủ đạo" hint={`tối đa ${MAX_MATERIALS}`}>
                  <MultiChips options={MATERIALS} value={params.staging.materials} max={MAX_MATERIALS} onChange={(v) => set("staging", { materials: v })} />
                </Field>
                <Field label="Ánh sáng">
                  <Chips options={STAGING_LIGHTING} value={params.staging.lighting} onChange={(v) => set("staging", { lighting: v })} />
                </Field>
                <Toggle label="Dọn đồ cũ / rác trước khi bày" checked={params.staging.declutter} onChange={(v) => set("staging", { declutter: v })} />
              </Disclosure>
              <Field label="Số phương án">
                <Chips options={COUNTS} value={String(params.staging.count)} onChange={(v) => set("staging", { count: Number(v) })} />
              </Field>
              <Field label="Chất lượng">
                <Chips options={QUALITIES} value={params.staging.quality} onChange={(v) => set("staging", { quality: v })} />
              </Field>
            </>
          )}

          {tool === "upscale" && (
            <>
              <Field label="Độ phân giải">
                <Chips
                  options={[
                    { id: "2K", label: "2K (2048px)" },
                    { id: "4K", label: "4K (4096px)" },
                  ]}
                  value={params.upscale.size}
                  onChange={(v) => set("upscale", { size: v as "2K" | "4K" })}
                />
              </Field>
              <Field label="Chế độ">
                <Chips options={UPSCALE_MODES} value={params.upscale.mode} onChange={(v) => set("upscale", { mode: v })} />
              </Field>
              {params.upscale.size === "4K" && (
                <Field label="Chất lượng">
                  <Chips options={QUALITIES} value={params.upscale.quality} onChange={(v) => set("upscale", { quality: v })} />
                </Field>
              )}
            </>
          )}

          {tool === "video" && (
            <>
              <Field label="Chuyển động máy quay" hint="1 chuyển động / video">
                <Chips options={CAMERA_MOVES} value={params.video.move} onChange={(v) => set("video", { move: v })} />
              </Field>
              <Field label="Tốc độ">
                <Chips options={VIDEO_SPEEDS} value={params.video.speed} onChange={(v) => set("video", { speed: v })} />
              </Field>
              <Field label="Chuyển động trong cảnh">
                <Chips options={VIDEO_AMBIENCE} value={params.video.ambience} onChange={(v) => set("video", { ambience: v })} />
              </Field>
              {assistant}
              <Field label="Âm thanh">
                <Chips options={VIDEO_AUDIO} value={params.video.audio} onChange={(v) => set("video", { audio: v })} />
              </Field>
              <Field label="Khung hình">
                <Chips
                  options={[
                    { id: "16:9", label: "Ngang 16:9" },
                    { id: "9:16", label: "Dọc 9:16 (Reels/TikTok)" },
                  ]}
                  value={params.video.aspect}
                  onChange={(v) => set("video", { aspect: v as "16:9" | "9:16" })}
                />
              </Field>
              <Field label="Độ phân giải">
                <Chips options={VIDEO_RESOLUTIONS} value={params.video.resolution} onChange={(v) => set("video", { resolution: v })} />
              </Field>
            </>
          )}

          <Disclosure title="Xem câu lệnh gửi AI" hint="cho người dùng nâng cao">
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-ink p-3 text-[11px] leading-relaxed text-paper/90">{finalPrompt}</pre>
          </Disclosure>

          {error && (
            <Notice tone="error">
              {error.message}
              {error.code === "insufficient_credits" && (
                <Link href="/credits" className="ml-1 font-semibold underline">
                  Nạp thêm credit
                </Link>
              )}
            </Notice>
          )}

          <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] z-10 -mx-4 -mb-4 rounded-b-2xl border-t border-line bg-paper/95 p-4 backdrop-blur md:static md:mx-0 md:mb-0 md:rounded-none md:border-0 md:bg-transparent md:p-0">
            <Button onClick={submit} disabled={submitting || !image} variant="accent" className="w-full py-3 text-base">
              <IconSpark className="size-5" />
              {submitting ? "Đang gửi…" : `Tạo · ${cost} credit`}
            </Button>
            {!enough && (
              <p className="mt-2 text-center text-xs text-muted">
                Bạn còn {user?.credits ?? 0} credit ·{" "}
                <Link href="/credits" className="font-medium text-accent underline">
                  nạp thêm
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>

      <section id="results" className="min-w-0 scroll-mt-20 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Kết quả gần đây</h2>
          <Link href="/gallery" className="text-sm text-muted underline">
            Xem tất cả
          </Link>
        </div>
        {jobs.length === 0 ? (
          <div className="grid h-60 place-items-center rounded-xl border border-dashed border-line text-center text-sm text-muted">
            <div>
              <IconSpark className="mx-auto mb-2 size-6 text-accent" />
              Chọn ảnh, chọn mẫu hoặc mô tả mong muốn rồi bấm <b>Tạo</b>.<br />Kết quả sẽ hiện ở đây.
            </div>
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        )}
      </section>

      {showTemplates && (
        <TemplateSheet
          tool={tool}
          onClose={() => setShowTemplates(false)}
          onPick={(t) => {
            setParams((s) => ({ ...s, [t.tool]: { ...DEFAULT_PARAMS[t.tool], ...t.params } }));
            setShowTemplates(false);
            setToast(`Đã áp dụng mẫu "${t.title}" — bạn có thể chỉnh lại trước khi tạo.`);
          }}
        />
      )}
    </div>
  );
}
