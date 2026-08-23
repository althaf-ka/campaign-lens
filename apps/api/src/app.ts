import { Hono } from "hono";
import { healthRoutes } from "./features/health/health.routes.ts";
import { sourceRoutes } from "./features/sources/source.routes.ts";
import { competitorRoutes } from "./features/competitors/competitor.routes.ts";

export const app = new Hono<{ Bindings: CloudflareBindings }>();

app.route("/", healthRoutes);
app.route("/", sourceRoutes);
app.route("/", competitorRoutes);
