import {
  CAMERA_MOVES,
  FIDELITY,
  findOption,
  INPUT_KINDS,
  LIGHTING,
  ROOMS,
  SCENES,
  STYLES,
  UPSCALE_MODES,
  VIDEO_AMBIENCE,
  VIDEO_AUDIO,
  type JobParams,
} from "./catalog";

const QUALITY_TAIL =
  "Output a single photorealistic, high-end architectural visualization image (V-Ray / Corona quality), physically accurate lighting and materials, sharp details, natural colors. No text, no labels, no watermark, no borders.";

function userNote(p?: string) {
  const t = (p ?? "").trim();
  return t ? `Additional client requirements (may be written in Vietnamese, follow them): "${t.slice(0, 800)}".` : "";
}

export function renderPrompt(p: JobParams["render"], hasReference: boolean, variant = 0): string {
  const scene = findOption(SCENES, p.scene);
  const kind = findOption(INPUT_KINDS, p.inputKind);
  const style = findOption(STYLES, p.style);
  const light = findOption(LIGHTING, p.lighting);
  const fidelity = findOption(FIDELITY, p.fidelity);

  const lines: string[] = [];
  if (scene.id === "floorplan") {
    lines.push(
      `The first image is ${kind.prompt} showing a 2D floor plan. Convert it into a photorealistic top-down 3D rendered floor plan (3D cutaway, walls cut at about 1.2m height).`,
      "Keep the room layout, wall positions, doors and windows exactly as drawn. Furnish each room according to its function and any labels.",
    );
  } else {
    lines.push(`The first image is ${kind.prompt} of ${scene.prompt}. Turn it into a photorealistic render of the same design.`);
    lines.push(fidelity.prompt);
  }
  lines.push(`Design style: ${style.prompt}.`);
  if (scene.id !== "floorplan") lines.push(`Lighting and atmosphere: ${light.prompt}.`);
  if (p.vietnam) lines.push("Context: located in Vietnam — tropical climate, local vegetation (areca palms, frangipani, bougainvillea where suitable), Vietnamese urban/suburban surroundings.");
  if (scene.id === "exterior" || scene.id === "landscape" || scene.id === "masterplan")
    lines.push(p.people ? "Add a few people for scale, naturally placed and in proportion." : "Do not add people.");
  if (hasReference)
    lines.push("The second image is a mood/style reference only: borrow its materials, color palette, lighting mood and finishes, but do NOT copy its geometry or composition.");
  lines.push(userNote(p.prompt));
  if (variant > 0) lines.push(`Variation #${variant + 1}: explore a slightly different material and lighting interpretation while respecting all rules above.`);
  lines.push(QUALITY_TAIL);
  return lines.filter(Boolean).join("\n");
}

export function stagingPrompt(p: JobParams["staging"], variant = 0): string {
  const room = findOption(ROOMS, p.room);
  const style = findOption(STYLES, p.style);
  return [
    `This is a photo of a ${room.prompt}. Virtually stage it as a beautifully furnished ${room.prompt} in this style: ${style.prompt}.`,
    p.declutter ? "First remove any existing clutter, boxes and old furniture." : "Keep any existing built-in fixtures.",
    "Keep the room architecture exactly as it is: walls, windows, doors, floor, ceiling, columns, camera position, lens and perspective must not change. Respect the existing lighting direction.",
    "Furniture and decor must be realistically scaled, correctly placed on the floor with accurate perspective and contact shadows. Add tasteful decor: rug, lighting, plants, art.",
    userNote(p.prompt),
    variant > 0 ? `Variation #${variant + 1}: use a different furniture layout and color accents within the same style.` : "",
    "Output a photorealistic real-estate listing photo. No text, no watermark.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function upscalePrompt(p: JobParams["upscale"]): string {
  return findOption(UPSCALE_MODES, p.mode).prompt + " No text, no watermark.";
}

export function videoPrompt(p: JobParams["video"]): string {
  const move = findOption(CAMERA_MOVES, p.move);
  const amb = findOption(VIDEO_AMBIENCE, p.ambience);
  const audio = findOption(VIDEO_AUDIO, p.audio);
  return [
    "Create a smooth, cinematic real-estate / architecture video that starts exactly from this image as the first frame.",
    `Camera: ${move.prompt}.`,
    `Scene motion: ${amb.prompt}.`,
    "The architecture must stay rigid and consistent: no morphing, warping, melting or changing of walls, windows, furniture or proportions. Photorealistic, stable, high quality.",
    audio.prompt,
    userNote(p.prompt),
    "Do not add any text, captions, logos or watermarks.",
  ]
    .filter(Boolean)
    .join("\n");
}
