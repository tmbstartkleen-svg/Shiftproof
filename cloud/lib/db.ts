export type DatabaseMode = "postgres" | "demo";

export function databaseMode(): DatabaseMode {
  return process.env.DATABASE_URL ? "postgres" : "demo";
}

export function databaseStatus() {
  return {
    mode: databaseMode(),
    configured: Boolean(process.env.DATABASE_URL),
    message: process.env.DATABASE_URL
      ? "Postgres connection string configured."
      : "Demo repository active; set DATABASE_URL to enable managed Postgres."
  };
}