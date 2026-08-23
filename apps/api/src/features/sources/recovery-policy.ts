import { BrightDataError } from "@campaign-lens/brightdata";
import type { SourceRunResult } from "./run-source.ts";

export interface RecoveryPolicyDecision {
  shouldHeal: boolean;
  reason?: string;
}

/**
 * Deterministic policy deciding whether a source failure is an extraction/DOM drift issue
 * that is suitable for Bright Data Self-Healing, or an operational/infrastructure issue
 * that should NOT trigger AI scraper refactoring.
 *
 * ALLOWED for healing:
 * - extraction_integrity_degraded (missing key fields from DOM change)
 * - schema_validation_failed (unexpected data structure from DOM change)
 * - wait_element_timeout / selector failures (DOM element removed or renamed)
 *
 * DISALLOWED for healing:
 * - 401 / 403 Authentication or authorization failure
 * - 429 Rate limiting
 * - 503 / 502 / 500 Bright Data platform service outage or temporary disablement
 * - Network timeouts / DNS / connection drops
 * - Config errors (missing credentials or invalid URLs)
 */
export function shouldAttemptHealing(
  runResult?: SourceRunResult,
  error?: unknown,
): RecoveryPolicyDecision {
  // 1. If runResult is healthy -> no healing
  if (runResult?.status === "healthy") {
    return { shouldHeal: false, reason: "Source is healthy" };
  }

  // 2. If runResult is degraded due to extraction integrity -> HEAL
  if (runResult?.status === "degraded") {
    const missingList =
      runResult.missing && runResult.missing.length > 0
        ? runResult.missing.join(", ")
        : "required fields";
    return {
      shouldHeal: true,
      reason: `extraction_integrity_degraded (missing fields: ${missingList})`,
    };
  }

  // 3. If runResult is invalid schema (e.g. fields changed types or missing) -> HEAL
  if (runResult?.status === "invalid") {
    return {
      shouldHeal: true,
      reason: "schema_validation_failed",
    };
  }

  // 4. If error was thrown, inspect error properties and sanitized errorCode
  if (error) {
    if (error instanceof BrightDataError) {
      const statusCode = error.statusCode;
      const errorCode =
        error.errorCode ||
        (error.details as Record<string, unknown> | undefined)?.errorCode;
      const msg = error.message.toLowerCase();

      // Explicit DISALLOW: Authentication, Rate Limit, Service Outage
      if (
        statusCode === 401 ||
        statusCode === 403 ||
        msg.includes("unauthorized") ||
        msg.includes("forbidden")
      ) {
        return { shouldHeal: false, reason: "authentication_error" };
      }
      if (
        statusCode === 429 ||
        msg.includes("rate limit") ||
        msg.includes("too many requests")
      ) {
        return { shouldHeal: false, reason: "rate_limit_exceeded" };
      }
      if (
        statusCode === 503 ||
        statusCode === 502 ||
        statusCode === 500 ||
        msg.includes("temporarily disabled") ||
        msg.includes("service unavailable")
      ) {
        return { shouldHeal: false, reason: "service_unavailable" };
      }
      if (
        msg.includes("network error") ||
        msg.includes("fetch failed") ||
        msg.includes("econnrefused")
      ) {
        return { shouldHeal: false, reason: "network_error" };
      }

      // Explicit ALLOW: Selector timeout / wait element timeout / crawler selector errors
      if (
        errorCode === "wait_element_timeout" ||
        errorCode === "selector_timeout" ||
        errorCode === "element_not_found" ||
        msg.includes("wait_element_timeout") ||
        msg.includes("waiting for selector") ||
        msg.includes("element not found") ||
        msg.includes("crawler error") ||
        msg.includes("selector")
      ) {
        return { shouldHeal: true, reason: "wait_element_timeout" };
      }
    }

    const genericMsg = (
      error instanceof Error ? error.message : String(error)
    ).toLowerCase();
    if (
      genericMsg.includes("wait_element_timeout") ||
      genericMsg.includes("waiting for selector") ||
      genericMsg.includes("element not found") ||
      genericMsg.includes("crawler error")
    ) {
      return { shouldHeal: true, reason: "wait_element_timeout" };
    }
  }

  return { shouldHeal: false, reason: "unrecognized_or_non_recoverable_error" };
}
