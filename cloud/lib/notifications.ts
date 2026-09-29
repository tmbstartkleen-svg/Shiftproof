export function notificationStatus() {
  return {
    email: process.env.EMAIL_PROVIDER || "none",
    push: process.env.PUSH_PROVIDER || "none",
    ready: Boolean(process.env.EMAIL_API_KEY || process.env.PUSH_API_KEY)
  };
}