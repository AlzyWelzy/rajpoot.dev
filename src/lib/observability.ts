/**
 * Structured, single-line JSON logs for server paths whose failures are
 * invisible to the user by design — the contact form returns a friendly
 * message whether Resend delivered or not, so a silent outage would otherwise
 * look exactly like a quiet week.
 *
 * Cloudflare Workers Logs (enabled via `observability` in wrangler.jsonc)
 * indexes these lines, so `event` is queryable and alertable; free-text
 * `console.error` gives nothing stable to key off. Deliberately dependency
 * free: adding an APM SDK to a static portfolio costs more than it returns.
 *
 * Never pass message bodies or sender addresses in here — the whole point is
 * that these lines are safe to ship to a third-party log sink.
 */
export type ServerEvent =
  | "contact.send_failed"
  | "contact.turnstile_failed"
  | "contact.turnstile_unconfigured"
  | "contact.honeypot_tripped";

export type LogLevel = "warn" | "error";

export type LogFields = Record<string, string | number | boolean>;

export function logServerEvent(
  event: ServerEvent,
  level: LogLevel,
  fields: LogFields = {},
): void {
  const line = JSON.stringify({ event, level, ...fields });
  if (level === "error") {
    console.error(line);
  } else {
    console.warn(line);
  }
}
