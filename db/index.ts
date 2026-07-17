import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

type Schema = typeof schema;

let overrideDb: DrizzleD1Database<Schema> | null = null;

/** Test-only: inject a fake D1 database so route handlers can run under plain Node. */
export function __setDbForTesting(db: DrizzleD1Database<Schema> | null) {
  overrideDb = db;
}

export async function getDb(): Promise<DrizzleD1Database<Schema>> {
  if (overrideDb) return overrideDb;

  // Imported lazily so test runners (plain Node) can load modules that
  // reference getDb without resolving the `cloudflare:` protocol.
  const { env } = await import("cloudflare:workers");
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}
