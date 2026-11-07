/**
 * Các trường preset mà "AI viết prompt" được phép gợi ý cho từng công cụ,
 * kèm bộ từ khoá tiếng Việt để nhận diện nhanh không cần gọi AI (chế độ DEMO / dự phòng khi AI lỗi).
 */
import {
  ATMOSPHERES,
  BUDGETS,
  BUILDINGS,
  CAMERA_MOVES,
  CAMERAS,
  CONTEXTS,
  LIGHTING,
  MATERIALS,
  MAX_MATERIALS,
  RENDER_STYLES,
  ROOMS,
  SCENES,
  STAGING_LIGHTING,
  STYLES,
  VIDEO_AMBIENCE,
  VIDEO_AUDIO,
  VIDEO_SPEEDS,
  type Option,
  type ToolType,
} from "./catalog";

export type FieldSpec = { key: string; label: string; options: Option[]; multi?: boolean; keywords: Record<string, string[]> };

// Thứ tự trong mỗi bảng: cụ thể trước, chung chung sau (khớp cái đầu tiên).
const STYLE_KW: Record<string, string[]> = {
  warmminimal: ["tối giản ấm", "warm minimal"],
  italian: ["ý tối giản", "italian", "phong cách ý"],
  newchinese: ["tân trung hoa", "trung hoa", "new chinese", "tân trung"],
  newasian: ["á đông hiện đại", "tân á đông", "á đông", "new asian", "zen"],
  indochine: ["indochine", "đông dương"],
  japandi: ["japandi", "nhật bắc âu"],
  wabisabi: ["wabi", "mộc mạc", "đất nung thô"],
  vietnamese: ["thuần việt", "truyền thống việt", "nhà vườn", "nhà cổ", "mái ngói"],
  neoclassic: ["tân cổ điển", "cổ điển"],
  french: ["phong cách pháp", "kiểu pháp", "paris", "french"],
  mediterranean: ["địa trung hải", "santorini", "mediterranean"],
  artdeco: ["art deco", "artdeco"],
  midcentury: ["mid-century", "midcentury", "vintage", "retro"],
  cream: ["cream", "màu kem", "tông kem", "phong cách kem"],
  luxury: ["sang trọng", "luxury", "xa hoa", "hạng sang"],
  industrial: ["industrial", "công nghiệp", "loft"],
  scandi: ["bắc âu", "scandinavian", "scandi"],
  biophilic: ["biophilic", "nhiều cây xanh", "xanh mát", "sinh thái"],
  brutalist: ["bê tông thô", "brutal"],
  tropical: ["nhiệt đới", "tropical"],
  minimal: ["tối giản", "minimal"],
  modern: ["hiện đại", "modern", "đương đại"],
};

const MATERIAL_KW: Record<string, string[]> = {
  travertine: ["travertine"],
  whitemarble: ["marble", "đá trắng", "cẩm thạch", "đá vân mây"],
  stone: ["đá tự nhiên", "ốp đá", "đá ong", "đá xẻ"],
  concrete: ["bê tông"],
  walnut: ["óc chó", "walnut", "gỗ tối"],
  oak: ["sồi", "oak", "gỗ sáng"],
  louver: ["lam gỗ", "lam chắn", "lam nhôm", "louver"],
  glass: ["kính"],
  breeze: ["thông gió", "gạch hoa gió", "bông gió"],
  terracotta: ["ngói", "gạch nung", "gạch đỏ", "gạch trần"],
  microcement: ["vi xi măng", "sơn vôi", "microcement", "sơn hiệu ứng"],
  brass: ["đồng thau", "mạ đồng", "viền đồng", "brass", "mạ vàng"],
  rattan: ["đồ mây", "ghế mây", "đèn mây", "mây tre", "mây đan", "rattan", "cói", "tre"],
  greenwall: ["tường cây", "cây leo", "vườn đứng"],
};

const RENDER_FIELDS: FieldSpec[] = [
  {
    key: "scene",
    label: "Loại phối cảnh",
    options: SCENES,
    keywords: {
      floorplan: ["mặt bằng", "floor plan", "floorplan"],
      masterplan: ["quy hoạch", "tổng thể", "masterplan", "sa bàn"],
      landscape: ["cảnh quan", "sân vườn", "landscape"],
      interior: ["nội thất", "phòng khách", "phòng ngủ", "bếp", "sảnh", "interior"],
      exterior: ["ngoại thất", "mặt tiền", "mặt đứng", "facade", "exterior"],
    },
  },
  {
    key: "building",
    label: "Loại công trình",
    options: BUILDINGS,
    keywords: {
      shophouse: ["shophouse", "nhà phố thương mại", "liền kề thương mại"],
      salesgallery: ["nhà mẫu", "sales gallery", "nhà điều hành", "trung tâm bán hàng"],
      townhouse: ["nhà phố", "nhà ống", "liền kề"],
      villa: ["biệt thự", "villa"],
      apartment: ["chung cư", "căn hộ", "tòa tháp", "cao tầng"],
      resort: ["resort", "nghỉ dưỡng"],
      hotel: ["khách sạn", "hotel"],
      office: ["văn phòng", "office"],
      commercial: ["tttm", "trung tâm thương mại", "mall"],
      cafe: ["café", "cafe", "cà phê", "nhà hàng", "quán"],
      public: ["trường học", "bảo tàng", "nhà văn hóa", "công cộng"],
    },
  },
  {
    key: "room",
    label: "Không gian",
    options: ROOMS,
    keywords: {
      hotelroom: ["phòng khách sạn"],
      living: ["phòng khách"],
      bedroom: ["phòng ngủ"],
      kitchen: ["bếp"],
      dining: ["phòng ăn"],
      office: ["phòng làm việc", "góc làm việc"],
      kids: ["trẻ em", "phòng bé", "phòng con"],
      bathroom: ["phòng tắm", "vệ sinh", "wc"],
      walkin: ["thay đồ"],
      altar: ["phòng thờ", "bàn thờ"],
      balcony: ["ban công", "sân thượng"],
      lobby: ["sảnh", "lễ tân"],
      restaurant: ["nhà hàng"],
      cafe: ["quán café", "quán cà phê"],
      showroom: ["showroom", "nhà mẫu"],
      openoffice: ["văn phòng"],
      spa: ["spa"],
    },
  },
  { key: "style", label: "Phong cách", options: STYLES, keywords: STYLE_KW },
  {
    key: "lighting",
    label: "Ánh sáng",
    options: LIGHTING,
    keywords: {
      bluehour: ["chạng vạng", "blue hour", "nhá nhem", "sẩm tối"],
      night: ["ban đêm", "lên đèn", "buổi tối", "night", "đêm"],
      golden: ["hoàng hôn", "chiều tà", "golden", "sunset", "nắng chiều"],
      morning: ["sáng sớm", "bình minh", "ban mai"],
      overcast: ["trời râm", "âm u", "nhiều mây"],
      day: ["ban ngày", "trưa", "nắng đẹp"],
    },
  },
  {
    key: "atmosphere",
    label: "Không khí",
    options: ATMOSPHERES,
    keywords: {
      tet: ["tết", "mai đào", "hoa đào", "hoa mai", "đèn lồng"],
      afterrain: ["sau mưa", "trời mưa", "mặt đường ướt"],
      mist: ["sương"],
      autumn: ["mùa thu", "lá vàng"],
      lush: ["um tùm", "sum suê", "rợp bóng"],
    },
  },
  {
    key: "context",
    label: "Bối cảnh",
    options: CONTEXTS,
    keywords: {
      seaside: ["biển", "bãi cát"],
      riverside: ["ven sông", "bờ sông", "ven hồ", "bờ hồ"],
      hillside: ["đồi", "núi", "đà lạt", "sapa"],
      countryside: ["làng quê", "nông thôn", "ruộng", "miền quê"],
      township: ["khu đô thị", "vinhomes", "ecopark", "compound", "nội khu"],
      suburb: ["ngoại ô", "yên tĩnh"],
      urban: ["mặt phố", "đường phố", "trung tâm thành phố", "phố"],
    },
  },
  {
    key: "camera",
    label: "Góc máy",
    options: CAMERAS,
    keywords: {
      drone: ["flycam", "drone", "từ trên cao", "trên cao"],
      top: ["từ trên xuống", "top view"],
      low: ["nhìn lên", "từ dưới", "hất lên"],
      frontal: ["chính diện", "đối xứng"],
      corner: ["góc 45", "góc chéo"],
      wide: ["góc rộng", "toàn cảnh"],
      detail: ["cận cảnh", "chi tiết vật liệu"],
      eyelevel: ["tầm mắt", "người đi bộ"],
    },
  },
  {
    key: "renderStyle",
    label: "Kiểu diễn họa",
    options: RENDER_STYLES,
    keywords: {
      model: ["sa bàn", "mô hình"],
      watercolor: ["màu nước", "watercolor"],
      sketch: ["phác thảo mực", "bút mực", "nét vẽ tay"],
      clay: ["mô hình trắng", "clay"],
      marketing: ["quảng cáo", "marketing", "bán hàng", "brochure"],
      editorial: ["tạp chí", "editorial"],
      photo: ["như ảnh chụp", "ảnh thật", "chân thực"],
    },
  },
  { key: "materials", label: "Vật liệu", options: MATERIALS, multi: true, keywords: MATERIAL_KW },
];

const STAGING_FIELDS: FieldSpec[] = [
  RENDER_FIELDS.find((f) => f.key === "room")!,
  { key: "style", label: "Phong cách", options: STYLES, keywords: STYLE_KW },
  {
    key: "budget",
    label: "Mức đầu tư",
    options: BUDGETS,
    keywords: {
      luxury: ["hạng sang", "xa xỉ", "siêu sang"],
      premium: ["cao cấp", "sang trọng"],
      economy: ["tiết kiệm", "giá rẻ", "bình dân", "chi phí thấp"],
      mid: ["tầm trung", "vừa phải"],
    },
  },
  { key: "lighting", label: "Ánh sáng", options: STAGING_LIGHTING, keywords: RENDER_FIELDS.find((f) => f.key === "lighting")!.keywords },
  { key: "materials", label: "Vật liệu", options: MATERIALS, multi: true, keywords: MATERIAL_KW },
];

const VIDEO_FIELDS: FieldSpec[] = [
  {
    key: "move",
    label: "Chuyển động máy",
    options: CAMERA_MOVES,
    keywords: {
      walkthrough: ["đi xuyên", "đi bộ", "tham quan bên trong", "walkthrough"],
      flyforward: ["bay tới", "bay về phía", "tiến tới"],
      crane: ["bay lên", "flycam", "từ trên cao"],
      orbit: ["quay quanh", "vòng quanh", "xoay quanh"],
      tilt: ["ngước", "từ dưới lên", "từ chân"],
      pull: ["lùi ra", "kéo ra", "lùi lại"],
      push: ["tiến vào", "zoom vào", "đẩy vào", "lại gần"],
      truck: ["trượt ngang", "trượt"],
      pan: ["lia"],
      static: ["đứng yên", "cố định"],
    },
  },
  { key: "speed", label: "Tốc độ", options: VIDEO_SPEEDS, keywords: { slow: ["chậm", "từ từ", "sang trọng"], medium: ["nhanh", "năng động"] } },
  {
    key: "ambience",
    label: "Chuyển động trong cảnh",
    options: VIDEO_AMBIENCE,
    keywords: {
      daynight: ["ngày sang đêm", "chuyển đêm", "đèn bật", "lên đèn"],
      water: ["mặt nước", "hồ bơi", "đài phun"],
      people: ["người đi", "xe chạy", "nhộn nhịp", "đông người"],
      calm: ["tĩnh lặng", "yên tĩnh"],
      nature: ["cây lá", "mây trôi", "gió"],
    },
  },
  { key: "audio", label: "Âm thanh", options: VIDEO_AUDIO, keywords: { silent: ["không tiếng", "im lặng", "tắt tiếng"], music: ["nhạc"], ambient: ["âm thanh môi trường", "tiếng chim"] } },
  {
    key: "aspect",
    label: "Khung hình",
    options: [
      { id: "16:9", label: "Ngang 16:9", prompt: "" },
      { id: "9:16", label: "Dọc 9:16", prompt: "" },
    ],
    keywords: { "9:16": ["dọc", "tiktok", "reels", "short", "9:16"], "16:9": ["ngang", "youtube", "16:9"] },
  },
];

export const ASSIST_FIELDS: Partial<Record<ToolType, FieldSpec[]>> = {
  render: RENDER_FIELDS,
  staging: STAGING_FIELDS,
  video: VIDEO_FIELDS,
};

const VI_MARKS = /[\u0300-\u036f]|đ/i;

export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");

/** Nhận diện preset từ mô tả bằng từ khoá (không cần AI). */
export function matchKeywords(tool: ToolType, text: string): Record<string, string | string[]> {
  const fields = ASSIST_FIELDS[tool] ?? [];
  // Có dấu → so khớp nguyên dấu (tránh "đồng"/"đông", "làm"/"lam"). Gõ không dấu → bỏ dấu cả hai phía.
  const accented = VI_MARKS.test(text.normalize("NFD"));
  const hay = ` ${accented ? text.toLowerCase() : fold(text)} `;
  const has = (kw: string) => hay.includes(accented ? kw.toLowerCase() : fold(kw));
  const out: Record<string, string | string[]> = {};
  for (const f of fields) {
    if (f.multi) {
      const hits = Object.entries(f.keywords)
        .filter(([, kws]) => kws.some(has))
        .map(([id]) => id)
        .slice(0, MAX_MATERIALS);
      if (hits.length) out[f.key] = hits;
    } else {
      const hit = Object.entries(f.keywords).find(([, kws]) => kws.some(has));
      if (hit) out[f.key] = hit[0];
    }
  }
  return out;
}

/** Giữ lại các gợi ý hợp lệ (id có trong danh sách). */
export function sanitizeSuggestions(tool: ToolType, input: Record<string, unknown>): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const f of ASSIST_FIELDS[tool] ?? []) {
    const v = input[f.key];
    const ok = (id: unknown) => typeof id === "string" && f.options.some((o) => o.id === id);
    if (f.multi && Array.isArray(v)) {
      const list = [...new Set(v.filter(ok) as string[])].slice(0, MAX_MATERIALS);
      if (list.length) out[f.key] = list;
    } else if (!f.multi && ok(v)) out[f.key] = v as string;
  }
  return out;
}
