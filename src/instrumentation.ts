export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { ensureAdmin } = await import("./lib/auth");
  const { recoverJobs } = await import("./lib/jobs");
  const { config } = await import("./lib/config");
  await ensureAdmin();
  recoverJobs();
  console.log(`[archrender] AI mode: ${config.aiMode} · data: ${config.dataDir}`);
}
