/**
 * Danh mục dùng chung client + server: công cụ, preset, giá credit, gói nạp.
 * Muốn đổi giá / thêm phong cách thì sửa file này.
 *
 * Bộ preset tham khảo từ: mnml.ai (Exterior/Interior AI), LookX, SketchUp AI Render,
 * các công cụ Trung Quốc (云朵光影 YD, EVAI, LiblibAI, bộ prompt Gemini 6 phong cách nội thất hot),
 * công thức prompt kiến trúc 7 phần của cộng đồng CSDN/知乎 và bảng thuật ngữ máy quay video AI.
 */

export type ToolType = "render" | "upscale" | "staging" | "video";

export type Option = { id: string; label: string; prompt: string; group?: string; hint?: string };

export const TOOLS: { id: ToolType; label: string; short: string; desc: string }[] = [
  { id: "render", label: "Render AI", short: "Render", desc: "Phác thảo / ảnh SketchUp → ảnh phối cảnh chân thực" },
  { id: "staging", label: "Virtual Staging", short: "Staging", desc: "Bày nội thất ảo cho phòng trống" },
  { id: "upscale", label: "Upscale", short: "Upscale", desc: "Nâng ảnh lên 2K / 4K, làm nét chi tiết" },
  { id: "video", label: "Video AI", short: "Video", desc: "Biến ảnh render thành video chuyển động" },
];

// ======================= RENDER =======================
export const SCENES: Option[] = [
  { id: "exterior", label: "Ngoại thất", prompt: "the exterior of a building" },
  { id: "interior", label: "Nội thất", prompt: "an interior space" },
  { id: "landscape", label: "Cảnh quan", prompt: "a landscape / garden design" },
  { id: "masterplan", label: "Quy hoạch", prompt: "an aerial masterplan of a development" },
  { id: "floorplan", label: "Mặt bằng 3D", prompt: "a 2D floor plan" },
];

/** Loại công trình (cho Ngoại thất / Cảnh quan / Quy hoạch). */
export const BUILDINGS: Option[] = [
  { id: "auto", label: "Theo ảnh", prompt: "" },
  { id: "townhouse", label: "Nhà phố", prompt: "a narrow multi-storey Vietnamese townhouse (nhà phố) with a street-facing facade" },
  { id: "villa", label: "Biệt thự", prompt: "a detached villa with garden" },
  { id: "shophouse", label: "Shophouse", prompt: "a row of shophouses with retail on the ground floor and residences above" },
  { id: "apartment", label: "Chung cư", prompt: "a high-rise residential apartment tower" },
  { id: "resort", label: "Resort", prompt: "a resort with villas, pool and tropical landscaping" },
  { id: "hotel", label: "Khách sạn", prompt: "a hotel building" },
  { id: "office", label: "Văn phòng", prompt: "an office building with a glass curtain wall" },
  { id: "commercial", label: "TTTM", prompt: "a shopping mall / mixed-use commercial podium" },
  { id: "cafe", label: "Café / nhà hàng", prompt: "a café / restaurant building with outdoor seating" },
  { id: "salesgallery", label: "Nhà mẫu / Sales gallery", prompt: "a real-estate sales gallery pavilion with a premium entrance plaza" },
  { id: "public", label: "Công cộng", prompt: "a public / cultural building" },
];

export const INPUT_KINDS: Option[] = [
  { id: "viewport", label: "Ảnh SketchUp/3D", prompt: "a 3D modeling viewport screenshot (SketchUp / clay or untextured model)" },
  { id: "sketch", label: "Phác thảo tay", prompt: "a hand-drawn architectural sketch" },
  { id: "photo", label: "Ảnh chụp thực tế", prompt: "a real photograph of the existing site/building" },
  { id: "render", label: "Ảnh render cũ", prompt: "an existing low-quality render that needs to be re-rendered photorealistically" },
];

/** Phong cách: 1 chính. Mô tả theo palette + vật liệu + tâm trạng để AI bám chắc. */
export const STYLES: Option[] = [
  // Hiện đại
  { id: "modern", group: "Hiện đại", label: "Hiện đại", prompt: "contemporary modern: clean horizontal lines, large glazing with slim black frames, white render and exposed concrete with warm timber accents" },
  { id: "minimal", group: "Hiện đại", label: "Tối giản", prompt: "minimalist: restrained palette of white, warm grey and light wood, hidden storage, no clutter, crisp clean shadows" },
  { id: "warmminimal", group: "Hiện đại", label: "Tối giản ấm", prompt: "warm minimalism: soft beige, greige and walnut tones, rounded edges, textured lime plaster, linen, diffuse warm light, calm and lived-in" },
  { id: "cream", group: "Hiện đại", label: "Cream (kem)", prompt: "cream style: milky white and soft cream palette, rounded and arched forms, bouclé fabrics, light oak, gentle cozy atmosphere, low saturation" },
  { id: "italian", group: "Hiện đại", label: "Ý tối giản", prompt: "Italian minimalism: large-format sintered stone slabs, flush hidden doors, low-profile leather sofas, sophisticated taupe-grey palette, linear hidden LED lighting" },
  { id: "luxury", group: "Hiện đại", label: "Sang trọng", prompt: "modern luxury: book-matched marble, brushed brass and champagne-gold trims, smoked glass, velvet, layered cove lighting, refined not flashy" },
  { id: "industrial", group: "Hiện đại", label: "Industrial", prompt: "industrial loft: exposed brick, black steel, polished concrete floor, exposed ducts, Edison bulb pendants, aged leather" },
  { id: "scandi", group: "Hiện đại", label: "Bắc Âu", prompt: "Scandinavian: bright airy spaces, white walls, light ash/oak wood, cozy wool textiles, simple functional furniture" },
  { id: "tropical", group: "Hiện đại", label: "Nhiệt đới", prompt: "tropical modern: deep roof overhangs, timber louvers, natural stone, lush tropical plants, cross-ventilated open spaces, green facade" },
  { id: "biophilic", group: "Hiện đại", label: "Xanh (biophilic)", prompt: "biophilic design: abundant planting and green walls, indoor-outdoor connection, skylights and natural light, organic shapes, natural timber and stone" },
  { id: "brutalist", group: "Hiện đại", label: "Bê tông thô", prompt: "brutalist: raw board-formed concrete, bold monolithic volumes, deep-set openings, strong light and shadow" },
  // Á Đông
  { id: "indochine", group: "Á Đông", label: "Indochine", prompt: "Indochine (French-colonial Vietnamese): patterned encaustic cement tiles, rattan, dark lacquered wood, arched details, louvered shutters, warm ochre, mustard and deep green tones" },
  { id: "newasian", group: "Á Đông", label: "Á Đông hiện đại", prompt: "modern Asian (New Asian): dark timber screens and lattices, natural stone, still water features, symmetrical calm composition, warm hidden lighting, resort-like serenity" },
  { id: "newchinese", group: "Á Đông", label: "Tân Trung Hoa", prompt: "New Chinese: symmetrical layout, Ming-style furniture proportions in dark walnut, lattice screens, moon-gate openings, ink-wash art, rice-paper textures, celadon and lacquer-red accents" },
  { id: "japandi", group: "Á Đông", label: "Japandi", prompt: "Japandi: warm minimal Japanese-Scandinavian blend, light oak, paper and linen, low furniture, soft neutral tones, uncluttered" },
  { id: "wabisabi", group: "Á Đông", label: "Wabi-sabi", prompt: "wabi-sabi: textured lime plaster and microcement, raw aged wood, earthy muted tones, handcrafted ceramics, imperfect organic feel" },
  { id: "vietnamese", group: "Á Đông", label: "Thuần Việt", prompt: "contemporary Vietnamese vernacular: terracotta roof tiles, ironwood (gỗ lim) structure, inner courtyard, bamboo, glazed ceramic tiles, lotus pond, warm earthy palette" },
  // Cổ điển & Âu
  { id: "neoclassic", group: "Cổ điển & Âu", label: "Tân cổ điển", prompt: "neoclassical: symmetrical composition, wall moldings, columns and cornices, cream and white stone finishes, elegant chandeliers" },
  { id: "french", group: "Cổ điển & Âu", label: "Pháp", prompt: "Parisian French: wall panel moldings, herringbone oak parquet, marble fireplace, warm white and caramel palette, brass details, arched mirrors" },
  { id: "mediterranean", group: "Cổ điển & Âu", label: "Địa Trung Hải", prompt: "Mediterranean: whitewashed walls, arches, terracotta tiles, blue accents, olive trees, sun-drenched relaxed feel" },
  { id: "artdeco", group: "Cổ điển & Âu", label: "Art Deco", prompt: "Art Deco: bold geometric patterns, fluted details, emerald and black with gold accents, lacquered surfaces, glamorous lighting" },
  { id: "midcentury", group: "Cổ điển & Âu", label: "Mid-century", prompt: "mid-century modern: teak and walnut furniture with tapered legs, retro mustard and olive accents, globe pendant lights, warm nostalgic mood" },
];

export const LIGHTING: Option[] = [
  { id: "day", label: "Ban ngày", prompt: "bright sunny day, soft natural daylight, clear blue sky with a few clouds" },
  { id: "morning", label: "Sáng sớm", prompt: "early morning, low soft sunlight, fresh cool tones, light haze" },
  { id: "golden", label: "Hoàng hôn", prompt: "golden hour sunset, warm low sun, long soft shadows" },
  { id: "bluehour", label: "Chạng vạng", prompt: "blue hour dusk, deep blue sky, warm interior lights glowing, exterior lighting just turned on" },
  { id: "night", label: "Đêm lên đèn", prompt: "night scene, dramatic architectural lighting, warm interior glow, facade uplights and landscape lights" },
  { id: "overcast", label: "Trời râm", prompt: "overcast diffuse light, soft shadows, calm muted mood" },
];

export const STAGING_LIGHTING: Option[] = [{ id: "keep", label: "Giữ như ảnh", prompt: "" }, ...LIGHTING];

export const ATMOSPHERES: Option[] = [
  { id: "none", label: "Mặc định", prompt: "" },
  { id: "afterrain", label: "Sau mưa", prompt: "just after rain: wet reflective ground, puddle reflections, fresh air" },
  { id: "mist", label: "Sương mờ", prompt: "light morning mist adding depth" },
  { id: "tet", label: "Không khí Tết", prompt: "subtle Vietnamese Lunar New Year (Tết) atmosphere: blooming peach and yellow apricot blossom trees, a few red lanterns, festive but elegant" },
  { id: "autumn", label: "Mùa thu", prompt: "autumn mood: golden and red foliage, fallen leaves" },
  { id: "lush", label: "Cây cối sum suê", prompt: "lush mature planting, dense greenery, flowering shrubs" },
];

export const CONTEXTS: Option[] = [
  { id: "auto", label: "Theo ảnh", prompt: "" },
  { id: "urban", label: "Phố đô thị", prompt: "a busy Vietnamese urban street with sidewalks, street trees and neighbouring buildings" },
  { id: "township", label: "Khu đô thị mới", prompt: "a newly built master-planned township with wide boulevards, manicured landscaping and modern neighbouring buildings" },
  { id: "suburb", label: "Ngoại ô yên tĩnh", prompt: "a quiet green suburban neighbourhood" },
  { id: "seaside", label: "Ven biển", prompt: "a seaside site with ocean view, sand and coconut palms" },
  { id: "riverside", label: "Ven sông / hồ", prompt: "a riverside / lakeside site with water reflections" },
  { id: "hillside", label: "Đồi núi", prompt: "a hillside site with mountains and pine forest in the background" },
  { id: "countryside", label: "Làng quê", prompt: "a Vietnamese countryside setting with rice fields and bamboo groves" },
];

export const CAMERAS: Option[] = [
  { id: "keep", label: "Giữ góc ảnh gốc", prompt: "" },
  { id: "eyelevel", label: "Ngang tầm mắt", prompt: "eye-level human perspective at 1.6 m height, vertical lines kept straight" },
  { id: "wide", label: "Góc rộng 24mm", prompt: "wide-angle 24mm lens, two-point perspective, vertical lines corrected" },
  { id: "frontal", label: "Chính diện", prompt: "frontal one-point perspective, symmetrical composition" },
  { id: "corner", label: "Góc 45°", prompt: "three-quarter 45-degree corner view showing two facades" },
  { id: "low", label: "Từ thấp nhìn lên", prompt: "low-angle worm's-eye view emphasising height" },
  { id: "drone", label: "Flycam 45°", prompt: "drone aerial view at about 45 degrees showing the building and surroundings" },
  { id: "top", label: "Nhìn từ trên xuống", prompt: "top-down bird's-eye view" },
  { id: "detail", label: "Cận chi tiết", prompt: "close-up detail shot focusing on materials and junctions, shallow depth of field" },
];

export const RENDER_STYLES: Option[] = [
  { id: "photo", label: "Ảnh chụp thực", prompt: "indistinguishable from a real architectural photograph, natural colours, realistic imperfections" },
  { id: "marketing", label: "Diễn họa BĐS", prompt: "premium real-estate marketing CGI: bright, clean, slightly idealised, inviting atmosphere, vivid but natural colours" },
  { id: "editorial", label: "Tạp chí kiến trúc", prompt: "architecture magazine editorial photography: muted natural palette, soft contrast, considered composition" },
  { id: "model", label: "Sa bàn", prompt: "photograph of a physical scale model (sa bàn) on a presentation table: white and wood model materials, tiny model trees and people, studio lighting, tilt-shift depth of field" },
  { id: "watercolor", label: "Màu nước", prompt: "architectural watercolor illustration with loose washes and fine ink lines" },
  { id: "sketch", label: "Phác thảo mực", prompt: "black ink architectural sketch with light marker shading" },
  { id: "clay", label: "Mô hình trắng", prompt: "white clay model render with soft ambient occlusion, no textures" },
];

/** Vật liệu chủ đạo — chọn tối đa 4. */
export const MATERIALS: Option[] = [
  { id: "concrete", label: "Bê tông trần", prompt: "exposed fair-faced concrete" },
  { id: "whitemarble", label: "Đá marble trắng", prompt: "white marble" },
  { id: "travertine", label: "Đá travertine", prompt: "travertine stone" },
  { id: "stone", label: "Đá ốp tự nhiên", prompt: "natural stone cladding" },
  { id: "walnut", label: "Gỗ óc chó", prompt: "dark walnut wood" },
  { id: "oak", label: "Gỗ sồi sáng", prompt: "light oak wood" },
  { id: "louver", label: "Lam gỗ", prompt: "vertical timber louvers" },
  { id: "glass", label: "Kính khung đen", prompt: "floor-to-ceiling glass with slim black frames" },
  { id: "breeze", label: "Gạch thông gió", prompt: "terracotta breeze-block screen wall" },
  { id: "terracotta", label: "Ngói / gạch nung", prompt: "terracotta roof tiles and brick" },
  { id: "microcement", label: "Vi xi măng / sơn vôi", prompt: "microcement and lime plaster walls" },
  { id: "brass", label: "Đồng / brass", prompt: "brushed brass accents" },
  { id: "rattan", label: "Mây tre đan", prompt: "rattan and bamboo weaving" },
  { id: "greenwall", label: "Tường cây xanh", prompt: "living green walls and planters" },
];
export const MAX_MATERIALS = 4;

export const FIDELITY: Option[] = [
  { id: "strict", label: "Giữ đúng hình khối", prompt: "Strictly preserve the exact geometry, massing, proportions, number and position of openings (doors and windows), roof shape and composition of the input. Do not add, remove or move any architectural element." },
  { id: "creative", label: "Cho AI sáng tạo", prompt: "Keep the overall massing and layout of the input, but you may refine details, materials and add tasteful design elements." },
];

export const REF_STRENGTH: Option[] = [
  { id: "light", label: "Tham khảo nhẹ", prompt: "loosely reference" },
  { id: "medium", label: "Bám vừa", prompt: "closely follow" },
  { id: "strong", label: "Bám sát", prompt: "very closely match" },
];

// ======================= STAGING =======================
export const ROOMS: Option[] = [
  { id: "living", group: "Nhà ở", label: "Phòng khách", prompt: "living room" },
  { id: "bedroom", group: "Nhà ở", label: "Phòng ngủ", prompt: "bedroom" },
  { id: "kitchen", group: "Nhà ở", label: "Bếp", prompt: "kitchen" },
  { id: "dining", group: "Nhà ở", label: "Phòng ăn", prompt: "dining room" },
  { id: "office", group: "Nhà ở", label: "Phòng làm việc", prompt: "home office / study" },
  { id: "kids", group: "Nhà ở", label: "Phòng trẻ em", prompt: "kids bedroom" },
  { id: "bathroom", group: "Nhà ở", label: "Phòng tắm", prompt: "bathroom" },
  { id: "walkin", group: "Nhà ở", label: "Phòng thay đồ", prompt: "walk-in closet / dressing room" },
  { id: "altar", group: "Nhà ở", label: "Phòng thờ", prompt: "Vietnamese ancestral worship room with an elegant wooden altar cabinet, calm, symmetrical and respectful" },
  { id: "balcony", group: "Nhà ở", label: "Ban công / sân thượng", prompt: "balcony / rooftop terrace" },
  { id: "lobby", group: "Thương mại", label: "Sảnh / lễ tân", prompt: "lobby and reception area" },
  { id: "hotelroom", group: "Thương mại", label: "Phòng khách sạn", prompt: "hotel guest room" },
  { id: "cafe", group: "Thương mại", label: "Quán café", prompt: "café" },
  { id: "restaurant", group: "Thương mại", label: "Nhà hàng", prompt: "restaurant dining hall" },
  { id: "showroom", group: "Thương mại", label: "Showroom / nhà mẫu", prompt: "showroom / real-estate sales gallery interior" },
  { id: "openoffice", group: "Thương mại", label: "Văn phòng mở", prompt: "open-plan office" },
  { id: "spa", group: "Thương mại", label: "Spa", prompt: "spa / wellness room" },
];

export const BUDGETS: Option[] = [
  { id: "economy", label: "Tiết kiệm", prompt: "affordable, practical mass-market furniture" },
  { id: "mid", label: "Tầm trung", prompt: "mid-range quality furniture and decor" },
  { id: "premium", label: "Cao cấp", prompt: "premium designer furniture and high-quality finishes" },
  { id: "luxury", label: "Hạng sang", prompt: "luxury bespoke furniture, statement lighting and art pieces" },
];

// ======================= UPSCALE =======================
export const UPSCALE_MODES: Option[] = [
  { id: "faithful", label: "Giữ nguyên", prompt: "Upscale this image to a higher resolution. Preserve the exact composition, geometry, colors, lighting, text and every detail. Only increase sharpness and fine texture detail, remove noise, blur and compression artifacts. Do not add, remove or change anything." },
  { id: "enhance", label: "Tăng chân thực", prompt: "Upscale and enhance this architectural image. Keep the exact composition, camera and geometry, but improve photorealism: richer material textures, more realistic reflections, lighting, vegetation and people. Remove noise and artifacts." },
  { id: "people", label: "Làm nét người & cây", prompt: "Upscale this image. Keep composition and architecture identical. Specifically fix and refine people (natural faces, hands, proportions), vegetation and cars so they look photographic. Remove noise and artifacts." },
];

// ======================= VIDEO =======================
/** Mỗi video chỉ 1 chuyển động chính; đặt ở đầu câu lệnh, ghi rõ tốc độ + hướng. */
export const CAMERA_MOVES: Option[] = [
  { id: "push", label: "Tiến vào", prompt: "dolly in: the camera moves forward towards the main subject" },
  { id: "pull", label: "Lùi ra", prompt: "dolly out: the camera moves backward, gradually revealing more of the surroundings" },
  { id: "truck", label: "Trượt ngang", prompt: "truck right: the camera slides sideways from left to right, parallel to the facade" },
  { id: "pan", label: "Lia ngang", prompt: "pan right: the camera stays in place and rotates horizontally from left to right" },
  { id: "tilt", label: "Ngước lên", prompt: "tilt up: from the base of the building the camera tilts upward to reveal its full height" },
  { id: "orbit", label: "Quay quanh", prompt: "arc shot: the camera orbits around the building by about 90 degrees, keeping it centered" },
  { id: "crane", label: "Flycam bay lên", prompt: "crane / drone rise: the camera rises vertically and tilts down to reveal the site" },
  { id: "flyforward", label: "Flycam tiến tới", prompt: "aerial drone shot flying forward towards the building" },
  { id: "walkthrough", label: "Đi xuyên không gian", prompt: "steady walk-through: the camera glides forward at eye level through the interior like a gimbal shot" },
  { id: "static", label: "Máy đứng yên", prompt: "locked-off static camera, only the scene moves" },
];

export const VIDEO_SPEEDS: Option[] = [
  { id: "slow", label: "Chậm, sang", prompt: "very slow and smooth" },
  { id: "medium", label: "Vừa", prompt: "smooth, moderate speed" },
];

export const VIDEO_AMBIENCE: Option[] = [
  { id: "nature", label: "Cây lá, mây trôi", prompt: "gentle natural motion: leaves swaying, clouds drifting, soft light changes" },
  { id: "people", label: "Có người đi lại", prompt: "a few people walking naturally, cars passing in the distance" },
  { id: "daynight", label: "Ngày → đêm", prompt: "time-lapse transition from late afternoon to night with lights turning on" },
  { id: "water", label: "Mặt nước lăn tăn", prompt: "rippling water surfaces and gentle reflections" },
  { id: "calm", label: "Tĩnh lặng", prompt: "very subtle motion only" },
];

export const VIDEO_AUDIO: Option[] = [
  { id: "ambient", label: "Âm thanh môi trường", prompt: "Audio: natural ambient sound only, no music, no voice." },
  { id: "music", label: "Nhạc nhẹ", prompt: "Audio: soft elegant instrumental background music, no voice." },
  { id: "silent", label: "Không tiếng", prompt: "Audio: silent, no sound." },
];

// ======================= Kích thước / chất lượng =======================
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
    building: string;
    room: string;
    inputKind: string;
    style: string;
    lighting: string;
    atmosphere: string;
    context: string;
    camera: string;
    renderStyle: string;
    materials: string[];
    fidelity: string;
    refStrength: string;
    aspect: string;
    quality: Quality;
    count: number;
    vietnam: boolean;
    people: boolean;
    prompt?: string;
    /** Câu lệnh chi tiết tiếng Anh do "AI viết prompt" tạo (người dùng sửa được). */
    detail?: string;
  };
  staging: {
    room: string;
    style: string;
    budget: string;
    materials: string[];
    lighting: string;
    declutter: boolean;
    quality: Quality;
    count: number;
    prompt?: string;
    detail?: string;
  };
  upscale: { size: "2K" | "4K"; mode: string; quality: Quality };
  video: {
    move: string;
    speed: string;
    ambience: string;
    audio: string;
    aspect: "16:9" | "9:16";
    resolution: VideoResolution;
    prompt?: string;
    detail?: string;
  };
};

export const DEFAULT_PARAMS: JobParams = {
  render: {
    scene: "exterior",
    building: "auto",
    room: "living",
    inputKind: "viewport",
    style: "modern",
    lighting: "day",
    atmosphere: "none",
    context: "auto",
    camera: "keep",
    renderStyle: "photo",
    materials: [],
    fidelity: "strict",
    refStrength: "medium",
    aspect: "auto",
    quality: "standard",
    count: 1,
    vietnam: true,
    people: true,
    prompt: "",
    detail: "",
  },
  staging: { room: "living", style: "modern", budget: "mid", materials: [], lighting: "keep", declutter: true, quality: "standard", count: 2, prompt: "", detail: "" },
  upscale: { size: "4K", mode: "faithful", quality: "standard" },
  video: { move: "push", speed: "slow", ambience: "nature", audio: "ambient", aspect: "16:9", resolution: "720p", prompt: "", detail: "" },
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

export function labelOf(list: Option[], id: string | undefined) {
  return list.find((o) => o.id === id)?.label ?? id ?? "";
}

export function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}
