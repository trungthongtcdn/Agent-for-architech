/**
 * Thư viện mẫu có sẵn: chạm 1 lần là điền sẵn preset + mô tả.
 * Nhóm theo tình huống thực tế của KTS, nhà thiết kế, môi giới / chủ đầu tư BĐS
 * (tham khảo cách phân loại "案例" của các công cụ Trung Quốc: nhà ở, thương mại, khách sạn, sales gallery...).
 */
import type { JobParams, ToolType } from "./catalog";

export type Template<T extends ToolType = ToolType> = {
  id: string;
  tool: T;
  category: string;
  title: string;
  desc: string;
  params: Partial<JobParams[T]>;
};

type AnyTemplate = { [K in ToolType]: Template<K> }[ToolType];

export const TEMPLATES: AnyTemplate[] = [
  // ---------------- Render · Nhà ở ----------------
  {
    id: "townhouse-modern-dusk",
    tool: "render",
    category: "Nhà ở",
    title: "Nhà phố hiện đại lúc chạng vạng",
    desc: "Mặt tiền 5–6m, lam gỗ, kính khung đen, đèn hắt",
    params: {
      scene: "exterior", building: "townhouse", style: "modern", lighting: "bluehour", context: "urban", camera: "keep",
      materials: ["louver", "glass", "concrete"], renderStyle: "marketing", people: true,
      prompt: "Nhà phố mặt tiền hẹp, ban công trồng cây rủ, đèn hắt chân tường và đèn trong nhà sáng ấm, có xe máy và người đi bộ trên vỉa hè.",
    },
  },
  {
    id: "townhouse-indochine",
    tool: "render",
    category: "Nhà ở",
    title: "Nhà phố Indochine",
    desc: "Cửa chớp, vòm, gạch bông, tông vàng nghệ",
    params: {
      scene: "exterior", building: "townhouse", style: "indochine", lighting: "golden", context: "urban",
      materials: ["terracotta", "rattan"], renderStyle: "photo",
      prompt: "Cửa chớp gỗ xanh rêu, ô cửa vòm, ban công lan can sắt hoa văn, tường sơn vàng nghệ, chậu hoa giấy.",
    },
  },
  {
    id: "villa-tropical",
    tool: "render",
    category: "Nhà ở",
    title: "Biệt thự nhiệt đới có hồ bơi",
    desc: "Mái đua sâu, đá tự nhiên, sân vườn xanh",
    params: {
      scene: "exterior", building: "villa", style: "tropical", lighting: "golden", context: "suburb", camera: "keep",
      materials: ["stone", "louver", "glass"], atmosphere: "lush", renderStyle: "marketing",
      prompt: "Hồ bơi tràn trước nhà phản chiếu công trình, sân gỗ, cây cau và sứ trắng, ánh nắng chiều xuyên qua lam.",
    },
  },
  {
    id: "villa-neoclassic",
    tool: "render",
    category: "Nhà ở",
    title: "Biệt thự tân cổ điển",
    desc: "Đối xứng, phào chỉ, cột, đá kem",
    params: {
      scene: "exterior", building: "villa", style: "neoclassic", lighting: "day", context: "township", camera: "frontal",
      materials: ["travertine", "whitemarble"], renderStyle: "marketing",
      prompt: "Cổng và hàng rào sắt nghệ thuật, sân trước lát đá, cây bụi cắt tỉa, đèn chùm nhìn qua cửa kính tầng 1.",
    },
  },
  {
    id: "vn-vernacular",
    tool: "render",
    category: "Nhà ở",
    title: "Nhà vườn thuần Việt",
    desc: "Mái ngói, sân trong, ao sen, tre",
    params: {
      scene: "exterior", building: "villa", style: "vietnamese", lighting: "morning", context: "countryside",
      materials: ["terracotta", "breeze", "rattan"], atmosphere: "mist", renderStyle: "editorial",
      prompt: "Nhà mái ngói đỏ hai tầng, hiên rộng, sân gạch, ao sen phía trước, bụi tre và cau, sương sớm.",
    },
  },
  // ---------------- Render · Dự án BĐS ----------------
  {
    id: "apartment-night-aerial",
    tool: "render",
    category: "Dự án BĐS",
    title: "Phối cảnh chung cư ban đêm (flycam)",
    desc: "Tòa tháp lên đèn, khu đô thị mới, góc 45°",
    params: {
      scene: "exterior", building: "apartment", style: "modern", lighting: "night", context: "township", camera: "drone",
      materials: ["glass"], renderStyle: "marketing", people: true,
      prompt: "Các tòa tháp căn hộ lên đèn, cảnh quan nội khu có hồ cảnh quan và đường dạo, đường phố đông xe, bầu trời xanh đậm.",
    },
  },
  {
    id: "masterplan-township",
    tool: "render",
    category: "Dự án BĐS",
    title: "Phối cảnh tổng thể khu đô thị",
    desc: "Quy hoạch nhìn từ trên cao, nhiều cây xanh",
    params: {
      scene: "masterplan", building: "auto", style: "biophilic", lighting: "day", context: "township", camera: "drone",
      atmosphere: "lush", renderStyle: "marketing",
      prompt: "Phối cảnh tổng thể dự án: trục đại lộ, công viên trung tâm, hồ điều hòa, các cụm thấp tầng và cao tầng, sông phía xa.",
    },
  },
  {
    id: "masterplan-model",
    tool: "render",
    category: "Dự án BĐS",
    title: "Ảnh sa bàn dự án",
    desc: "Biến ảnh quy hoạch thành ảnh chụp sa bàn",
    params: { scene: "masterplan", style: "modern", lighting: "day", camera: "drone", renderStyle: "model", people: false, prompt: "Sa bàn tỉ lệ 1:500, đèn trong các tòa nhà, mặt nước bằng mica xanh." },
  },
  {
    id: "salesgallery",
    tool: "render",
    category: "Dự án BĐS",
    title: "Nhà mẫu / Sales gallery",
    desc: "Lối vào sang trọng, mặt nước, đèn hắt",
    params: {
      scene: "exterior", building: "salesgallery", style: "newasian", lighting: "bluehour", context: "township",
      materials: ["stone", "brass", "glass"], renderStyle: "marketing",
      prompt: "Lối vào có mặt nước tĩnh phản chiếu, cổng đá khối lớn, đèn LED hắt dưới mái đua, cây bonsai lớn làm điểm nhấn.",
    },
  },
  {
    id: "tet-campaign",
    tool: "render",
    category: "Dự án BĐS",
    title: "Ảnh truyền thông dịp Tết",
    desc: "Giữ công trình, thêm mai đào, đèn lồng",
    params: { scene: "exterior", building: "auto", style: "modern", lighting: "golden", atmosphere: "tet", renderStyle: "marketing", fidelity: "strict", prompt: "Không khí Tết sang trọng, không quá rực rỡ." },
  },
  // ---------------- Render · Thương mại & nghỉ dưỡng ----------------
  {
    id: "resort-seaside",
    tool: "render",
    category: "Thương mại & nghỉ dưỡng",
    title: "Resort ven biển",
    desc: "Villa mái dốc, hồ bơi vô cực, dừa",
    params: {
      scene: "exterior", building: "resort", style: "newasian", lighting: "golden", context: "seaside", camera: "keep",
      materials: ["louver", "stone", "rattan"], renderStyle: "editorial",
      prompt: "Hồ bơi vô cực nhìn ra biển, ghế tắm nắng, đèn lồng mây, hàng dừa nghiêng.",
    },
  },
  {
    id: "cafe-street",
    tool: "render",
    category: "Thương mại & nghỉ dưỡng",
    title: "Quán café mặt phố",
    desc: "Gạch thông gió, cây xanh, chỗ ngồi ngoài trời",
    params: {
      scene: "exterior", building: "cafe", style: "tropical", lighting: "golden", context: "urban",
      materials: ["breeze", "terracotta", "greenwall"], renderStyle: "photo", people: true,
      prompt: "Quán café 2 tầng mặt tiền gạch thông gió, cây leo rủ, bàn ghế ngoài vỉa hè có khách ngồi.",
    },
  },
  {
    id: "office-tower",
    tool: "render",
    category: "Thương mại & nghỉ dưỡng",
    title: "Tòa văn phòng kính",
    desc: "Từ thấp nhìn lên, trời xanh, phản chiếu",
    params: { scene: "exterior", building: "office", style: "modern", lighting: "day", context: "urban", camera: "low", materials: ["glass"], renderStyle: "photo" },
  },
  // ---------------- Render · Nội thất ----------------
  {
    id: "living-cream",
    tool: "render",
    category: "Nội thất",
    title: "Phòng khách Cream",
    desc: "Trắng sữa, bo cong, vải bouclé",
    params: {
      scene: "interior", room: "living", style: "cream", lighting: "day", camera: "keep", materials: ["oak", "microcement"],
      prompt: "Sofa cong vải bouclé màu kem, bàn trà tròn, rèm voan, đèn hắt trần, không đèn chùm.",
    },
  },
  {
    id: "living-luxury",
    tool: "render",
    category: "Nội thất",
    title: "Phòng khách sang trọng",
    desc: "Marble, đồng, ánh sáng nhiều lớp",
    params: {
      scene: "interior", room: "living", style: "luxury", lighting: "night", camera: "keep", materials: ["whitemarble", "brass", "walnut"],
      prompt: "Vách tivi ốp đá vân mây, sofa da xám, đèn hắt khe trần và đèn rọi tranh, view thành phố về đêm qua kính.",
    },
  },
  {
    id: "bedroom-japandi",
    tool: "render",
    category: "Nội thất",
    title: "Phòng ngủ Japandi",
    desc: "Gỗ sồi, giường thấp, tông trung tính",
    params: { scene: "interior", room: "bedroom", style: "japandi", lighting: "morning", camera: "keep", materials: ["oak", "microcement"], prompt: "Giường bệt gỗ sồi, chăn ga linen màu be, đèn giấy, cây xanh trong chậu gốm." },
  },
  {
    id: "kitchen-italian",
    tool: "render",
    category: "Nội thất",
    title: "Bếp Ý tối giản",
    desc: "Đá sintered, tủ không tay nắm, LED",
    params: { scene: "interior", room: "kitchen", style: "italian", lighting: "day", camera: "keep", materials: ["whitemarble", "walnut"], prompt: "Đảo bếp đá nguyên khối, tủ cánh phẳng không tay nắm, đèn LED âm tủ." },
  },
  {
    id: "lobby-hotel",
    tool: "render",
    category: "Nội thất",
    title: "Sảnh khách sạn 5 sao",
    desc: "Trần cao, đá, đồng, cây lớn",
    params: { scene: "interior", room: "lobby", style: "newasian", lighting: "night", camera: "wide", materials: ["stone", "brass", "walnut"], prompt: "Quầy lễ tân đá khối, trần cao 2 tầng, đèn thả nghệ thuật, cây lớn trong chậu đá." },
  },
  // ---------------- Staging ----------------
  {
    id: "stage-rental-studio",
    tool: "staging",
    category: "Cho thuê / bán",
    title: "Căn studio cho thuê",
    desc: "Gọn, đủ công năng, chi phí vừa phải",
    params: { room: "bedroom", style: "scandi", budget: "economy", declutter: true, count: 2, prompt: "Studio 30m²: giường đôi, bàn làm việc nhỏ, tủ quần áo, kệ bếp gọn gàng, nhiều ánh sáng." },
  },
  {
    id: "stage-showflat",
    tool: "staging",
    category: "Cho thuê / bán",
    title: "Căn hộ mẫu cao cấp",
    desc: "Bày như nhà mẫu chủ đầu tư",
    params: { room: "living", style: "luxury", budget: "premium", materials: ["whitemarble", "brass"], declutter: true, count: 2, prompt: "Bày như căn hộ mẫu của chủ đầu tư: sofa góc, bàn ăn 6 ghế, hoa tươi, đèn thả." },
  },
  {
    id: "stage-homestay",
    tool: "staging",
    category: "Cho thuê / bán",
    title: "Phòng homestay / Airbnb",
    desc: "Ấm cúng, chụp ảnh đẹp, chi phí hợp lý",
    params: { room: "bedroom", style: "wabisabi", budget: "mid", materials: ["rattan", "oak"], lighting: "golden", declutter: true, count: 2, prompt: "Đèn mây, gối tựa tông đất, tranh treo tường, cây xanh, góc ngồi đọc sách cạnh cửa sổ." },
  },
  {
    id: "stage-raw-to-indochine",
    tool: "staging",
    category: "Nhà thô → hoàn thiện",
    title: "Nhà thô → phòng khách Indochine",
    desc: "Từ ảnh nhà thô ra phương án hoàn thiện",
    params: { room: "living", style: "indochine", budget: "premium", materials: ["rattan", "walnut"], declutter: true, count: 3, prompt: "Hoàn thiện sàn gạch bông, trần thạch cao, quạt trần cánh gỗ, sofa mây." },
  },
  {
    id: "stage-cafe",
    tool: "staging",
    category: "Kinh doanh",
    title: "Mặt bằng → quán café",
    desc: "Hình dung mặt bằng trống thành quán",
    params: { room: "cafe", style: "industrial", budget: "mid", materials: ["concrete", "oak"], declutter: true, count: 2, prompt: "Quầy bar gỗ, bàn ghế đa dạng chỗ ngồi, đèn thả, cây xanh, có khách ngồi." },
  },
  // ---------------- Upscale ----------------
  { id: "up-print", tool: "upscale", category: "In ấn", title: "In pano / bảng quảng cáo", desc: "4K Pro, giữ nguyên chi tiết", params: { size: "4K", mode: "faithful", quality: "pro" } },
  { id: "up-lumion", tool: "upscale", category: "Hậu kỳ", title: "Nâng ảnh Lumion/Enscape", desc: "Tăng chân thực vật liệu, cây, người", params: { size: "4K", mode: "enhance", quality: "standard" } },
  { id: "up-people", tool: "upscale", category: "Hậu kỳ", title: "Sửa người & cây bị méo", desc: "Làm nét người, cây, xe", params: { size: "2K", mode: "people", quality: "standard" } },
  // ---------------- Video ----------------
  { id: "vid-flycam", tool: "video", category: "Dự án BĐS", title: "Flycam giới thiệu dự án", desc: "Bay lên chậm, có người, xe", params: { move: "crane", speed: "slow", ambience: "people", audio: "music", aspect: "16:9", resolution: "720p" } },
  { id: "vid-reels-facade", tool: "video", category: "Mạng xã hội", title: "Reels dọc mặt tiền", desc: "9:16, ngước lên, nhạc nhẹ", params: { move: "tilt", speed: "slow", ambience: "nature", audio: "music", aspect: "9:16", resolution: "720p" } },
  { id: "vid-walkthrough", tool: "video", category: "Nội thất", title: "Đi xuyên căn hộ mẫu", desc: "Máy trượt ngang tầm mắt", params: { move: "walkthrough", speed: "slow", ambience: "calm", audio: "ambient", aspect: "16:9", resolution: "720p" } },
  { id: "vid-daynight", tool: "video", category: "Dự án BĐS", title: "Ngày chuyển đêm", desc: "Máy đứng yên, đèn bật dần", params: { move: "static", speed: "slow", ambience: "daynight", audio: "ambient", aspect: "16:9", resolution: "720p" } },
  { id: "vid-resort", tool: "video", category: "Nghỉ dưỡng", title: "Resort thư giãn", desc: "Trượt ngang, mặt nước lăn tăn", params: { move: "truck", speed: "slow", ambience: "water", audio: "ambient", aspect: "16:9", resolution: "720p" } },
];

export function templatesFor(tool: ToolType) {
  return TEMPLATES.filter((t) => t.tool === tool);
}
