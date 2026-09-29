export function notificationStatus() {
  const email = process.env.EMAIL_PROVIDER || "none";
  const push = process.env.PUSH_PROVIDER || "none";
  return {
    email,
    push,
    ready: Boolean(process.env.EMAIL_API_KEY || process.env.PUSH_API_KEY),
    channels: [email !== "none" ? "email" : null, push !== "none" ? "push" : null].filter(Boolean)
  };
}