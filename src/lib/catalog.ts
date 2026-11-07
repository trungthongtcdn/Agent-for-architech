/**
 * Danh mục dùng chung client + server: công cụ, preset, giá credit, gói nạp.
 * Muốn đổi giá / thêm phong cách thì sửa file này.
 */

export type ToolType = "render" | "upscale" | "staging" | "video";

export type Option = { id: string; label: string; prompt: string };

export const TOOLS: { id: ToolType; label: string; short: string; desc: string }[] = [
  { id: "render", label: "Render AI", short: "Render", desc: "Phác thảo / ảnh SketchUp → ảnh phối cảnh chân thực" },
  { id: "staging", label: "Virtual Staging", short: "Staging", desc: "Bày nội thất ảo cho phòng trống" },
  { id: "upscale", label: "Upscale", short: "Upscale", desc: "Nâng ảnh lên 2K / 4K, làm nét chi tiết" },
  { id: "video", label: "Video AI", short: "Video", desc: "Biến ảnh render thành video chuyển động" },
];

// ---------- Render ----------
export const SCENES: Option[] = [
  { id: "exterior", label: "Ngoại thất", prompt: "the exterior of a building" },
  { id: "interior", label: "Nội thất", prompt: "an interior space" },
  { id: "landscape", label: "Cảnh quan", prompt: "a landscape / garden design" },
  { id: "masterplan", label: "Quy hoạch", prompt: "an aerial masterplan of an urban development" },
  { id: "floorplan", label: "Mặt bằng 3D", prompt: "a 2D floor plan" },
];

export const INPUT_KINDS: Option[] = [
  { id: "viewport", label: "Ảnh SketchUp/3D", prompt: "a 3D modeling viewport screenshot (SketchUp / clay or untextured model)" },
  { id: "sketch", label: "Phác thảo tay", prompt: "a hand-drawn architectural sketch" },
  { id: "photo", label: "Ảnh chụp thực tế", prompt: "a real photograph of the existing site/building" },
];

export const STYLES: Option[] = [
  { id: "modern", label: "Hiện đại", prompt: "contemporary modern architecture, clean lines, large glazing, concrete, wood and metal accents" },
  { id: "minimal", label: "Tối giản", prompt: "minimalist style, restrained palette of white, light grey and natural wood, uncluttered" },
  { id: "indochine", label: "Indochine", prompt: "Indochine style (French-colonial Vietnamese), patterned encaustic tiles, rattan, dark lacquered wood, arched details, warm ochre and green tones" },
  { id: "neoclassic", label: "Tân cổ điển", prompt: "neoclassical style, symmetrical facade, moldings, columns, cornices, cream and white stone finishes" },
  { id: "japandi", label: "Japandi", prompt: "Japandi style, warm minimal Japanese-Scandinavian blend, light oak, linen, soft neutral tones" },
  { id: "scandi", label: "Bắc Âu", prompt: "Scandinavian style, bright airy spaces, white walls, light wood, cozy textiles" },
  { id: "tropical", label: "Nhiệt đới", prompt: "tropical modern architecture, deep overhangs, lush tropical plants, natural stone, timber louvers, green facade" },
  { id: "wabisabi", label: "Wabi-sabi", prompt: "wabi-sabi style, textured lime plaster, raw natural materials, earthy muted tones, imperfect handcrafted feel" },
  { id: "luxury", label: "Sang trọng", prompt: "luxury high-end style, marble, brushed brass, rich materials, dramatic lighting" },
  { id: "industrial", label: "Industrial", prompt: "industrial style, exposed brick, black steel, concrete, Edison bulbs" },
];

export const LIGHTING: Option[] = [
  { id: "day", label: "Ban ngày", prompt: "bright sunny day, soft natural daylight, clear blue sky with a few clouds" },
  { id: "golden", label: "Hoàng hôn", prompt: "golden hour sunset, warm low sun, long soft shadows" },
  { id: "dawn", label: "Bình minh", prompt: "early morning, soft pastel sky, gentle mist" },
  { id: "night", label: "Đêm lên đèn", prompt: "blue-hour dusk / night, warm interior lights glowing, exterior lighting on" },
  { id: "overcast", label: "Trời râm", prompt: "overcast diffuse light, soft shadows, calm mood" },
  { id: "rain", label: "Sau mưa", prompt: "just after rain, wet reflective ground, moody atmosphere" },
];

export const FIDELITY: Option[] = [
  { id: "strict", label: "Giữ đúng hình khối", prompt: "Strictly preserve the exact geometry, massing, proportions, openings (doors and windows), camera angle and composition of the input. Do not add, remove or move any architectural element." },
  { id: "creative", label: "Cho AI sáng tạo", prompt: "Keep the overall massing and camera angle of the input, but you may refine details, materials and add tasteful design elements." },
];

// ---------- Staging ----------
export const ROOMS: Option[] = [
  { id: "living", label: "Phòng khách", prompt: "living room" },
  { id: "bedroom", label: "Phòng ngủ", prompt: "bedroom" },
  { id: "kitchen", label: "Bếp", prompt: "kitchen" },
  { id: "dining", label: "Phòng ăn", prompt: "dining room" },
  { id: "office", label: "Phòng làm việc", prompt: "home office" },
  { id: "kids", label: "Phòng trẻ em", prompt: "kids bedroom" },
  { id: "bathroom", label: "Phòng tắm", prompt: "bathroom" },
  { id: "balcony", label: "Ban công", prompt: "balcony / terrace" },
];

// ---------- Upscale ----------
export const UPSCALE_MODES: Option[] = [
  { id: "faithful", label: "Giữ nguyên", prompt: "Upscale this image to a higher resolution. Preserve the exact composition, geometry, colors, lighting, text and every detail. Only increase sharpness and fine texture detail, remove noise, blur and compression artifacts. Do not add, remove or change anything." },
  { id: "enhance", label: "Tăng chân thực", prompt: "Upscale and enhance this architectural image. Keep the exact composition, camera and geometry, but improve photorealism: richer material textures, more realistic reflections, lighting, vegetation and people. Remove noise and artifacts." },
];

// ---------- Video ----------
export const CAMERA_MOVES: Option[] = [
  { id: "push", label: "Tiến vào", prompt: "slow smooth dolly push-in towards the subject" },
  { id: "pull", label: "Lùi ra", prompt: "slow smooth dolly pull-back revealing more of the surroundings" },
  { id: "pan", label: "Lia ngang", prompt: "slow horizontal pan from left to right" },
  { id: "orbit", label: "Quay quanh", prompt: "slow cinematic orbit around the building, keeping it centered" },
  { id: "crane", label: "Flycam bay lên", prompt: "drone shot slowly rising up and tilting down" },
  { id: "static", label: "Máy đứng yên", prompt: "locked-off static camera" },
];

export const VIDEO_AMBIENCE: Option[] = [
  { id: "nature", label: "Cây lá, mây trôi", prompt: "gentle natural motion: leaves swaying, clouds drifting, soft light changes" },
  { id: "people", label: "Có người đi lại", prompt: "a few people walking naturally, cars passing in the distance" },
  { id: "daynight", label: "Ngày → đêm", prompt: "time-lapse transition from late afternoon to night with lights turning on" },
  { id: "calm", label: "Tĩnh lặng", prompt: "very subtle motion only" },
];

export const VIDEO_AUDIO: Option[] = [
  { id: "ambient", label: "Âm thanh môi trường", prompt: "Audio: natural ambient sound only, no music, no voice." },
  { id: "music", label: "Nhạc nhẹ", prompt: "Audio: soft elegant instrumental background music, no voice." },
  { id: "silent", label: "Không tiếng", prompt: "Audio: silent, no sound." },
];

// ---------- Kích thước / chất lượng ----------
export const ASPECTS = [
  { id: "auto", label: "Theo ảnh gốc" },
  { id: "16:9", label: "16:9" },
  { id: "4:3", label: "4:3" },
  { id: "1:1", label: "1:1" },
  { id: "3:4", label: "3:4" },
  { id: "9:16", label: "9:16" },
] as const;

export const IMAGE_ASPECTS = ["1:1", "3:2", "2:3", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"] as const;

export type Quality = "standard" | "pro";
export const QUALITIES: { id: Quality; label: string; hint: string }[] = [
  { id: "standard", label: "Tiêu chuẩn", hint: "Nhanh, tiết kiệm" },
  { id: "pro", label: "Pro", hint: "Chi tiết & bám đề hơn" },
];

export type VideoResolution = "360p" | "720p" | "1080p";
export const VIDEO_RESOLUTIONS: { id: VideoResolution; label: string; hint: string }[] = [
  { id: "360p", label: "Nháp 360p", hint: "Thử ý tưởng, rẻ" },
  { id: "720p", label: "HD 720p", hint: "Đăng mạng xã hội" },
  { id: "1080p", label: "Full HD 1080p", hint: "Trình chiếu" },
];

/** Bảng giá credit cho mỗi ảnh / video. */
export const PRICES = {
  render: { standard: 3, pro: 8 },
  staging: { standard: 3, pro: 8 },
  upscale: { "2K": 3, "4K": 6, pro4K: 12 },
  video: { "360p": 15, "720p": 40, "1080p": 55 },
} as const;

export type JobParams = {
  render: {
    scene: string;
    inputKind: string;
    style: string;
    lighting: string;
    fidelity: string;
    aspect: string;
    quality: Quality;
    count: number;
    vietnam: boolean;
    people: boolean;
    prompt?: string;
  };
  staging: { room: string; style: string; declutter: boolean; quality: Quality; count: number; prompt?: string };
  upscale: { size: "2K" | "4K"; mode: string; quality: Quality };
  video: { move: string; ambience: string; audio: string; aspect: "16:9" | "9:16"; resolution: VideoResolution; prompt?: string };
};

export function jobCost(type: ToolType, p: Record<string, unknown>): number {
  switch (type) {
    case "render":
    case "staging": {
      const unit = PRICES[type][(p.quality as Quality) === "pro" ? "pro" : "standard"];
      const count = Math.min(4, Math.max(1, Number(p.count) || 1));
      return unit * count;
    }
    case "upscale":
      if (p.size === "4K") return p.quality === "pro" ? PRICES.upscale.pro4K : PRICES.upscale["4K"];
      return PRICES.upscale["2K"];
    case "video":
      return PRICES.video[(p.resolution as VideoResolution) ?? "720p"] ?? PRICES.video["720p"];
  }
}

export const PACKAGES = [
  { id: "starter", name: "Khởi động", credits: 100, priceVnd: 99_000 },
  { id: "pro", name: "Chuyên nghiệp", credits: 300, priceVnd: 249_000, popular: true },
  { id: "studio", name: "Studio", credits: 1000, priceVnd: 699_000 },
] as const;

export function findOption(list: Option[], id: string | undefined): Option {
  return list.find((o) => o.id === id) ?? list[0];
}

export function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}
