import sharp from "sharp";
import { ASSIST_FIELDS, matchKeywords, sanitizeSuggestions } from "./assist-fields";
import { labelOf, type ToolType } from "./catalog";
import { config } from "./config";
import { HttpError } from "./http";
import { AiError } from "./ai";
import { generateJson } from "./ai/gemini";

export type AssistResult = {
  mode: "ai" | "rules";
  summary: string;
  detail: string;
  suggestions: Record<string, string | string[]>;
  applied: { field: string; label: string; value: string }[];
  notice?: string;
};

const TOOL_BRIEF: Record<string, string> = {
  render:
    "an image model that turns an architectural input image (SketchUp screenshot, sketch, photo or old render) into a photorealistic architectural visualization. The geometry of the input must be preserved.",
  staging: "an image model that virtually furnishes a photo of an empty or unfinished room. Walls, windows, doors and camera must not change.",
  video: "an image-to-video model that animates one architectural image (first frame) into a 3–10 second clip with one camera movement.",
};

function systemPrompt(tool: ToolType) {
  const fields = ASSIST_FIELDS[tool] ?? [];
  const catalog = fields
    .map((f) => `- ${f.key}${f.multi ? " (array, max 4)" : ""}: ${f.options.map((o) => `${o.id} = ${o.label}${o.prompt ? ` (${o.prompt.slice(0, 70)})` : ""}`).join("; ")}`)
    .join("\n");
  return `You are a senior architectural-visualization art director working for Vietnamese architects, interior designers and real-estate developers.
The user describes (usually in Vietnamese) what they want. You prepare instructions for ${TOOL_BRIEF[tool]}

Return JSON with:
- "summary_vi": 1–2 short Vietnamese sentences telling the user what you understood and decided (friendly, concrete).
- "detail_en": an English design brief of 60–160 words to append to the generation prompt. Order: subject → style → setting/context → 3–5 concrete materials with colours → lighting and atmosphere → camera/composition → mood. Use concrete visual nouns, never vague words like "beautiful" or "high-end feel" without specifics. One primary style (at most one secondary accent). Never ask to change the geometry, openings or camera of the input image unless the user explicitly asks. No text, logos or brand names in the image.${tool === "video" ? " For video: describe ONE main camera movement first with speed and direction, keep motion subtle so the architecture does not warp, then scene motion and sound." : ""}
- Preset fields (optional): set a field ONLY when the description clearly implies it (or the attached image clearly shows it, e.g. building type or room). Use exactly one of the listed ids:
${catalog}

If an image is attached, look at it to identify the building/room type, number of floors, openings and existing materials, and keep the brief consistent with it.`;
}

function responseSchema(tool: ToolType) {
  const properties: Record<string, unknown> = {
    summary_vi: { type: "STRING" },
    detail_en: { type: "STRING" },
  };
  for (const f of ASSIST_FIELDS[tool] ?? []) {
    const e = { type: "STRING", enum: f.options.map((o) => o.id) };
    properties[f.key] = f.multi ? { type: "ARRAY", items: e } : e;
  }
  return { type: "OBJECT", properties, required: ["summary_vi", "detail_en"] };
}

function describeApplied(tool: ToolType, s: Record<string, string | string[]>) {
  const fields = ASSIST_FIELDS[tool] ?? [];
  return Object.entries(s).map(([k, v]) => {
    const f = fields.find((x) => x.key === k)!;
    return { field: k, label: f.label, value: (Array.isArray(v) ? v : [v]).map((id) => labelOf(f.options, id)).join(", ") };
  });
}

// Giới hạn số lần dùng mỗi ngày (trong bộ nhớ; đủ cho 1 tiến trình).
const g = globalThis as unknown as { __assistUsage?: Map<string, { day: string; n: number }> };
function takeQuota(userId: string) {
  const usage = (g.__assistUsage ??= new Map());
  const day = new Date().toISOString().slice(0, 10);
  const u = usage.get(userId);
  const n = u && u.day === day ? u.n : 0;
  if (n >= config.promptAssistDailyLimit) throw new HttpError(429, `Bạn đã dùng hết ${config.promptAssistDailyLimit} lượt "AI viết prompt" hôm nay`);
  usage.set(userId, { day, n: n + 1 });
}

export async function assistPrompt(input: { userId: string; tool: ToolType; text: string; image?: Buffer }): Promise<AssistResult> {
  if (!ASSIST_FIELDS[input.tool]) throw new HttpError(400, "Công cụ này không cần viết prompt");
  const text = input.text.trim().slice(0, 1500);
  if (text.length < 3 && !input.image) throw new HttpError(400, "Hãy mô tả mong muốn của bạn (vài từ trở lên)");
  takeQuota(input.userId);

  const rules = (notice?: string): AssistResult => {
    const suggestions = matchKeywords(input.tool, text);
    const applied = describeApplied(input.tool, suggestions);
    return {
      mode: "rules",
      summary: applied.length
        ? `Đã tự chọn ${applied.length} tuỳ chọn khớp với mô tả. Mô tả gốc vẫn được gửi kèm cho AI.`
        : "Chưa nhận diện được tuỳ chọn nào từ mô tả; mô tả của bạn vẫn được gửi kèm cho AI.",
      detail: "",
      suggestions,
      applied,
      notice,
    };
  };

  if (config.aiMode !== "gemini") return rules("Chế độ DEMO: nhận diện bằng từ khoá. Cấu hình GEMINI_API_KEY để AI viết câu lệnh chi tiết.");

  try {
    const images = input.image
      ? [{ mime: "image/jpeg", data: await sharp(input.image).rotate().resize(1024, 1024, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer() }]
      : [];
    const out = (await generateJson({
      model: config.gemini.textModel,
      system: systemPrompt(input.tool),
      text: `Công cụ: ${input.tool}. Mô tả của người dùng:\n"""${text || "(không có mô tả — hãy dựa vào ảnh)"}"""`,
      images,
      schema: responseSchema(input.tool),
    })) as Record<string, unknown>;
    const suggestions = sanitizeSuggestions(input.tool, out);
    return {
      mode: "ai",
      summary: String(out.summary_vi ?? "").slice(0, 400),
      detail: String(out.detail_en ?? "").slice(0, 1500),
      suggestions,
      applied: describeApplied(input.tool, suggestions),
    };
  } catch (e) {
    console.error("[assist]", e instanceof AiError ? `${e.message} | ${e.detail}` : e);
    return rules("AI tạm thời không phản hồi, đã dùng nhận diện từ khoá thay thế.");
  }
}
