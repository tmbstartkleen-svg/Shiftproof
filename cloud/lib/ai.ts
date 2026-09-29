export function aiStatus() {
  const provider = process.env.SHIFTPROOF_AI_PROVIDER || "none";
  return {
    provider,
    model: process.env.SHIFTPROOF_AI_MODEL || "grounded-fallback",
    cloudReady: provider !== "none" && Boolean(process.env.SHIFTPROOF_AI_API_KEY),
    fallback: "deterministic plant intelligence"
  };
}