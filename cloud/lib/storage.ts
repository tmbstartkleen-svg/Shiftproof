export function storageStatus() {
  const provider = process.env.SHIFTPROOF_STORAGE_PROVIDER || "local-demo";
  const configured = provider === "local-demo" || Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  return { provider, configured };
}