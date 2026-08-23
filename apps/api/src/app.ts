import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRoutes } from "./features/health/health.routes.ts";
import { sourceRoutes } from "./features/sources/source.routes.ts";
import { competitorRoutes } from "./features/competitors/competitor.routes.ts";

export const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use("*", async (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => {
      if (!origin) return "*";
      const allowedOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ];
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".pages.dev") ||
        origin.endsWith(".workers.dev") ||
        (c.env && (c.env as Record<string, unknown>).ALLOWED_ORIGIN === origin)
      ) {
        return origin;
      }
      return null;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  });
  return corsMiddleware(c, next);
});

app.route("/", healthRoutes);
app.route("/", sourceRoutes);
app.route("/", competitorRoutes);
