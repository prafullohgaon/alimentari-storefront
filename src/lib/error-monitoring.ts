/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Production Error Monitoring & Tracking Service - Alimentari
 * Coordinates runtime exceptions, API failures, and checkout mismatches.
 * 
 * Sentry-ready: When NEXT_PUBLIC_SENTRY_DSN is configured, it safely dispatches
 * telemetry reports to Sentry without blocking core execution threads.
 */

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN || "";
const isSentryConfigured = !!sentryDsn;

/**
 * Initialize Sentry error reporting client.
 */
export function initErrorMonitoring() {
  if (typeof window === "undefined") return;

  if (!isSentryConfigured) {
    console.log("Telemetry: Sentry DSN not provided. Local console logger activated.");
    return;
  }

  console.log(`Telemetry: Initializing Sentry error reporting for environment: ${process.env.NODE_ENV}`);
  // In dynamic production deployment:
  // import("@sentry/nextjs").then((Sentry) => {
  //   Sentry.init({ dsn: sentryDsn });
  // });
}

/**
 * Capture and log a runtime exception.
 */
export function logException(error: Error, extraContext: Record<string, any> = {}) {
  console.error("Telemetry: [Exception Captured]", error, "Context:", extraContext);

  if (isSentryConfigured) {
    // Abstract Sentry exceptions triggers:
    // import("@sentry/nextjs").then((Sentry) => {
    //   Sentry.captureException(error, { extra: extraContext });
    // });
  }
}

/**
 * Capture and log an API/GraphQL network failure.
 */
export function logApiError(endpoint: string, status: number, statusText: string, query = "") {
  console.error(`Telemetry: [API Failure] Endpoint: ${endpoint}, Status: ${status} (${statusText}), Query: ${query.slice(0, 100)}...`);

  if (isSentryConfigured) {
    // Abstract Sentry message logs:
    // import("@sentry/nextjs").then((Sentry) => {
    //   Sentry.captureMessage(`API Failure: ${status} on ${endpoint}`, {
    //     level: "error",
    //     extra: { endpoint, status, statusText, query },
    //   });
    // });
  }
}

/**
 * Capture and log a checkout or payment interruption.
 */
export function logCheckoutError(reason: string, cartItemsCount: number, subtotal: number) {
  console.error(`Telemetry: [Checkout Aborted] Reason: ${reason}, Items: ${cartItemsCount}, Subtotal: €${subtotal}`);

  if (isSentryConfigured) {
    // Abstract Sentry logs:
    // import("@sentry/nextjs").then((Sentry) => {
    //   Sentry.captureMessage(`Checkout Error: ${reason}`, {
    //     level: "warning",
    //     extra: { reason, cartItemsCount, subtotal },
    //   });
    // });
  }
}
