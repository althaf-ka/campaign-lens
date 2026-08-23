import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRoutes } from "./features/health/health.routes.ts";
import { sourceRoutes } from "./features/sources/source.routes.ts";
import { competitorRoutes } from "./features/competitors/competitor.routes.ts";

export const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        return origin || "http://localhost:3000";
      }
      return null;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.route("/", healthRoutes);
app.route("/", sourceRoutes);
app.route("/", competitorRoutes);

