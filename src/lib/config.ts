import path from "node:path";

/** Cấu hình đọc từ biến môi trường. Chỉ dùng phía server. */
function env(name: string, fallback = ""): string {
  const v = process.env[name];
  return v === undefined || v === "" ? fallback : v;
}

function envInt(name: string, fallback: number): number {
  const n = Number.parseInt(env(name, ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

const appUrl = env("APP_URL", "http://localhost:3000");

export const config = {
  appName: env("NEXT_PUBLIC_APP_NAME", "ArchRender"),
  appUrl,
  dataDir: path.resolve(env("DATA_DIR", path.join(process.cwd(), "data"))),
  cookieSecure: env("COOKIE_SECURE", appUrl.startsWith("https://") ? "true" : "false") === "true",
  sessionDays: envInt("SESSION_DAYS", 30),

  /** "gemini" khi có GEMINI_API_KEY, ngược lại "mock" (ảnh/video giả lập để phát triển). */
  aiMode: (env("AI_MODE", process.env.GEMINI_API_KEY ? "gemini" : "mock") as "gemini" | "mock"),
  gemini: {
    apiKey: env("GEMINI_API_KEY"),
    baseUrl: env("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, ""),
    imageModel: env("GEMINI_IMAGE_MODEL", "gemini-nano-banana-2.1"),
    imageProModel: env("GEMINI_IMAGE_PRO_MODEL", "gemini-3-pro-image"),
    videoModel: env("GEMINI_VIDEO_MODEL", "gemini-omni-1.1-flash"),
  },

  jobConcurrency: envInt("JOB_CONCURRENCY", 3),
  videoConcurrency: envInt("VIDEO_CONCURRENCY", 2),
  maxActiveJobsPerUser: envInt("MAX_ACTIVE_JOBS_PER_USER", 3),
  maxUploadMb: envInt("MAX_UPLOAD_MB", 15),

  // Đủ để thử 1 render 2 phương án + 1 video nháp.
  signupBonus: envInt("SIGNUP_BONUS_CREDITS", 30),
  adminEmail: env("ADMIN_EMAIL").toLowerCase(),
  adminPassword: env("ADMIN_PASSWORD"),
  adminEmails: env("ADMIN_EMAILS")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),

  bank: {
    /** Mã ngân hàng theo VietQR, ví dụ: vcb, tcb, mb, acb, bidv, vpb... */
    bankId: env("BANK_ID"),
    accountNo: env("BANK_ACCOUNT_NO"),
    accountName: env("BANK_ACCOUNT_NAME"),
    contact: env("SUPPORT_CONTACT", ""),
  },
};

export function isAdminEmail(email: string) {
  const e = email.toLowerCase();
  return e === config.adminEmail || config.adminEmails.includes(e);
}
