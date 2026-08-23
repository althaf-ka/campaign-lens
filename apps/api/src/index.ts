import { createDb } from "@campaign-lens/db";
import { app } from "./app.ts";
import { runDueSources } from "./features/sources/run-due-sources.ts";

export default {
  fetch: app.fetch,

  /**
   * Cloudflare Workers Scheduled Cron Handler:
   * Periodically wakes up to process and monitor due competitor sources.
   */
  async scheduled(
    event: ScheduledEvent,
    env: CloudflareBindings,
    ctx: ExecutionContext,
  ): Promise<void> {
    if (!env.DATABASE_URL || !env.BRIGHT_DATA_API_TOKEN) {
      console.error(
        "[Scheduled Worker] Missing DATABASE_URL or BRIGHT_DATA_API_TOKEN in environment.",
      );
      return;
    }

    ctx.waitUntil(
      (async () => {
        try {
          const db = createDb(env.DATABASE_URL);
          const summary = await runDueSources({
            db,
            apiToken: env.BRIGHT_DATA_API_TOKEN,
            now: new Date(event.scheduledTime),
          });
          console.log(
            `[Scheduled Worker] Processed ${summary.processed} due sources: ${summary.succeeded} healthy, ${summary.recovered} recovered, ${summary.degraded} degraded, ${summary.failed} failed.`,
          );
        } catch (err) {
          console.error("[Scheduled Worker] Fatal execution error:", err);
        }
      })(),
    );
  },
};
