/**
 * Dựng câu lệnh tiếng Anh gửi cho model ảnh/video từ lựa chọn của người dùng.
 * Thuần TypeScript (không phụ thuộc Node) → dùng được cả ở client để "Xem câu lệnh".
 *
 * Thứ tự theo công thức phổ biến của cộng đồng archviz (CN/EN):
 * chủ thể → phong cách → bối cảnh → vật liệu → ánh sáng/không khí → góc máy → kiểu diễn họa → chất lượng & điều cấm.
 * Chủ thể đặt đầu vì model chú ý mạnh nhất vào phần đầu câu lệnh.
 */
import {
  ATMOSPHERES,
  BUDGETS,
  BUILDINGS,
  CAMERA_MOVES,
  CAMERAS,
  CONTEXTS,
  FIDELITY,
  findOption,
  INPUT_KINDS,
  LIGHTING,
  MATERIALS,
  REF_STRENGTH,
  RENDER_STYLES,
  ROOMS,
  SCENES,
  STYLES,
  UPSCALE_MODES,
  VIDEO_AMBIENCE,
  VIDEO_AUDIO,
  VIDEO_SPEEDS,
  type JobParams,
  type ToolType,
} from "./catalog";

const PHOTO_TAIL =
  "Output a single high-end architectural visualization: physically accurate lighting and materials, sharp details, correct perspective with straight vertical lines, natural colours. No text, labels, logos, watermark or borders; no floating, melted or distorted objects; no warped people or cars.";
const ILLUSTRATION_TAIL = "Output a single image in that illustration style. No text, labels, logos, watermark or borders.";

function userNote(p?: string) {
  const t = (p ?? "").trim();
  return t ? `Client notes (may be in Vietnamese — follow them): "${t.slice(0, 800)}".` : "";
}

function brief(d?: string) {
  const t = (d ?? "").trim();
  return t ? `Design brief: ${t.slice(0, 1500)}` : "";
}

function materialsLine(ids: string[] | undefined) {
  const list = (ids ?? []).map((id) => MATERIALS.find((m) => m.id === id)?.prompt).filter(Boolean);
  return list.length ? `Key materials: ${list.join(", ")}.` : "";
}

const join = (lines: string[]) => lines.filter(Boolean).join("\n");

export function renderPrompt(p: JobParams["render"], hasReference: boolean, variant = 0): string {
  const scene = findOption(SCENES, p.scene);
  const kind = findOption(INPUT_KINDS, p.inputKind);
  const style = findOption(STYLES, p.style);
  const light = findOption(LIGHTING, p.lighting);
  const atmo = findOption(ATMOSPHERES, p.atmosphere);
  const ctx = findOption(CONTEXTS, p.context);
  const cam = findOption(CAMERAS, p.camera);
  const rstyle = findOption(RENDER_STYLES, p.renderStyle);
  const fidelity = findOption(FIDELITY, p.fidelity);
  const building = findOption(BUILDINGS, p.building);
  const room = findOption(ROOMS, p.room);
  const outdoor = ["exterior", "landscape", "masterplan"].includes(scene.id);
  const illustration = ["watercolor", "sketch", "clay", "model"].includes(rstyle.id);

  const lines: string[] = [];
  // 1. Chủ thể
  if (scene.id === "floorplan") {
    lines.push(
      `Turn the first image (${kind.prompt} of a 2D floor plan) into a top-down 3D cutaway floor plan render, walls cut at about 1.2 m height.`,
      "Keep the room layout, wall positions, doors and windows exactly as drawn. Furnish each room according to its function and any labels.",
    );
  } else {
    const subject =
      scene.id === "interior" ? `an interior ${room.prompt}` : building.id !== "auto" && building.prompt ? `${building.prompt} (${scene.prompt})` : scene.prompt;
    lines.push(`Architectural visualization of ${subject}. The first image is ${kind.prompt}; render it as the finished, built design.`);
    if (kind.id === "sketch")
      lines.push("Treat the drawing only as the design: paper texture, border/frame lines, pencil hatching, watercolour washes and blank paper margins must NOT appear in the output — fill the frame with the real scene.");
    if (cam.id === "keep") lines.push(`${fidelity.prompt} Keep the exact camera position, lens and framing of the input.`);
    else lines.push(`Keep the same design (massing, facade composition, openings and layout) but re-frame the view as: ${cam.prompt}.`);
  }
  // 2. Phong cách
  lines.push(`Style: ${style.prompt}.`);
  // 3. Bối cảnh
  if (outdoor && ctx.prompt) lines.push(`Setting: ${ctx.prompt}.`);
  if (p.vietnam)
    lines.push(
      outdoor
        ? "Located in Vietnam: tropical climate and local vegetation (areca palms, frangipani, bougainvillea where suitable), Vietnamese surroundings."
        : "Located in Vietnam: tropical daylight, local furniture and decor sensibilities.",
    );
  // 4. Vật liệu
  lines.push(materialsLine(p.materials));
  // 5. Ánh sáng & không khí
  if (scene.id !== "floorplan") lines.push(`Lighting: ${light.prompt}.${atmo.prompt ? ` Atmosphere: ${atmo.prompt}.` : ""}`);
  if (outdoor) lines.push(p.people ? "Add a few people and cars for scale, naturally placed and in correct proportion." : "Do not add people or cars.");
  // 6. Ảnh tham chiếu
  if (hasReference)
    lines.push(
      `The second image is a style reference: ${findOption(REF_STRENGTH, p.refStrength).prompt} its materials, colour palette, lighting mood and finishes, but never copy its geometry or composition.`,
    );
  // 7. Brief AI + ghi chú người dùng
  lines.push(brief(p.detail), userNote(p.prompt));
  if (variant > 0) lines.push(`Variation #${variant + 1}: explore a slightly different material and lighting interpretation while respecting all rules above.`);
  // 8. Kiểu diễn họa + chất lượng
  lines.push(`Rendering style: ${rstyle.prompt}.`, illustration ? ILLUSTRATION_TAIL : PHOTO_TAIL);
  return join(lines);
}

export function stagingPrompt(p: JobParams["staging"], variant = 0): string {
  const room = findOption(ROOMS, p.room);
  const style = findOption(STYLES, p.style);
  const budget = findOption(BUDGETS, p.budget);
  const light = p.lighting && p.lighting !== "keep" ? LIGHTING.find((l) => l.id === p.lighting) : undefined;
  return join([
    `Virtual staging of this photo of a ${room.prompt}. Furnish and decorate it as a ${room.prompt} in this style: ${style.prompt}.`,
    `Furniture level: ${budget.prompt}.`,
    p.declutter ? "First remove any clutter, boxes, construction debris and old furniture." : "Keep existing built-in fixtures.",
    "Do not change the windows, doors, walls, floor, ceiling, columns, camera position, lens or perspective.",
    "Furniture and decor must be realistically scaled, correctly placed on the floor with accurate perspective and contact shadows. Add a tasteful layer of decor: rug, lamps, plants, artwork, textiles.",
    materialsLine(p.materials),
    light ? `Lighting: ${light.prompt}.` : "Respect the existing lighting direction and time of day.",
    brief(p.detail),
    userNote(p.prompt),
    variant > 0 ? `Variation #${variant + 1}: use a different furniture layout and colour accents within the same style.` : "",
    "Output a photorealistic real-estate listing photograph. No text, logos or watermark.",
  ]);
}

export function upscalePrompt(p: JobParams["upscale"]): string {
  return findOption(UPSCALE_MODES, p.mode).prompt + " No text, no watermark.";
}

export function videoPrompt(p: JobParams["video"]): string {
  const move = findOption(CAMERA_MOVES, p.move);
  const speed = findOption(VIDEO_SPEEDS, p.speed);
  const amb = findOption(VIDEO_AMBIENCE, p.ambience);
  const audio = findOption(VIDEO_AUDIO, p.audio);
  return join([
    // Chuyển động máy quay đặt ĐẦU câu lệnh, chỉ 1 chuyển động chính.
    `Camera: ${speed.prompt} ${move.prompt}. Use only this one camera movement.`,
    "Start exactly from this image as the first frame. Cinematic real-estate / architecture film, photorealistic.",
    `Scene motion: ${amb.prompt}.`,
    "Keep motion gentle so the composition stays intact. The architecture must stay rigid and consistent: no morphing, warping, melting or changing of walls, windows, furniture or proportions.",
    brief(p.detail),
    userNote(p.prompt),
    audio.prompt,
    "No text, captions, logos or watermarks.",
  ]);
}

/** Câu lệnh cuối cùng cho một tác vụ (dùng cho xem trước ở client). */
export function buildPrompt(tool: ToolType, params: Record<string, unknown>, opts: { hasReference?: boolean; variant?: number } = {}) {
  switch (tool) {
    case "render":
      return renderPrompt(params as JobParams["render"], !!opts.hasReference, opts.variant ?? 0);
    case "staging":
      return stagingPrompt(params as JobParams["staging"], opts.variant ?? 0);
    case "upscale":
      return upscalePrompt(params as JobParams["upscale"]);
    case "video":
      return videoPrompt(params as JobParams["video"]);
  }
}
