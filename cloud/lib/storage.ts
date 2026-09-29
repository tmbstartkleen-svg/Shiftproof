export function storageStatus() {
  const provider = process.env.SHIFTPROOF_STORAGE_PROVIDER || "demo";
  return {
    provider,
    configured: provider === "demo" || Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    productionReady: provider !== "demo" && Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  };
}