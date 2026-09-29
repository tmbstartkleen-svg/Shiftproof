import "server-only";

export type DatabaseMode = "postgres" | "demo";

export function databaseMode(): DatabaseMode {
  return process.env.DATABASE_URL ? "postgres" : "demo";
}

export function databaseStatus() {
  return {
    mode: databaseMode(),
    configured: Boolean(process.env.DATABASE_URL),
    message: process.env.DATABASE_URL
      ? "Managed Postgres connection configured."
      : "Seeded demo repository active; set DATABASE_URL to enable managed Postgres."
  };
}

export async function query<T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  const postgres = (await import("postgres")).default;
  const client = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });
  try {
    return (await client(strings, ...values)) as T[];
  } finally {
    await client.end({ timeout: 1 });
  }
}