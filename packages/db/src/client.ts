import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema/index.ts";

export type Database = NeonHttpDatabase<typeof schema>;

export function createDb(connectionString: string): Database {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize database client.");
  }
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}
