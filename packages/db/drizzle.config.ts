import { defineConfig } from "drizzle-kit";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load environment variables from apps/api/.dev.vars, .dev.vars, or .env if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const possibleEnvFiles = [
    resolve(process.cwd(), "../../apps/api/.dev.vars"),
    resolve(process.cwd(), "../../.dev.vars"),
    resolve(process.cwd(), "../../.env"),
    resolve(process.cwd(), "apps/api/.dev.vars"),
    resolve(process.cwd(), ".dev.vars"),
    resolve(process.cwd(), ".env"),
  ];

  for (const envPath of possibleEnvFiles) {
    if (existsSync(envPath)) {
      try {
        const content = readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const [key, ...rest] = trimmed.split("=");
            const trimmedKey = key?.trim();
            const val = rest.join("=").trim().replace(/^["']|["']$/g, "");
            if (trimmedKey && !process.env[trimmedKey]) {
              process.env[trimmedKey] = val;
            }
          }
        }
      } catch {
        // Continue to fallback paths
      }
    }
  }
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
