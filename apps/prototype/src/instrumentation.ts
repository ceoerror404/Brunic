import type { Instrumentation } from "next";

/**
 * Onverwachte serverfouten (pagina's, route handlers, server actions) → lib/melding.ts:
 * een `[ALERT]`-logregel en, met ALERT_WEBHOOK_URL, een bericht naar de webhook.
 * Enkel pad, methode en routetype — geen headers of cookies (persoonsgegevens).
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const message = err instanceof Error ? err.message : String(err);
  // Na een nieuwe deploy sturen open tabbladen nog oude server-action-ID's: verwacht, geen alarm.
  if (/Failed to find Server Action/i.test(message)) return;
  const digest = typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;
  const { meld } = await import("@/lib/melding");
  await meld("serverfout", message.slice(0, 300), {
    pad: request.path.split("?")[0],
    methode: request.method,
    route: context.routePath,
    soort: context.routeType,
    digest,
  });
};
