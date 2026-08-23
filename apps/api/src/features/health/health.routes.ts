import { Hono } from "hono";

export const healthRoutes = new Hono<{ Bindings: CloudflareBindings }>();

healthRoutes.get("/health", (c) => {
  return c.json({
    status: "ok",
  });
});
