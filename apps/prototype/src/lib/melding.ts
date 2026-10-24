import { after } from "next/server";

/**
 * Operationele meldingen (monitoring zonder extra dienst of dependency).
 *
 * - Altijd één gestructureerde logregel met het voorvoegsel `[ALERT]`: zichtbaar in de
 *   Vercel-logs en filterbaar in een Log Drain of een logalert.
 * - Staat ALERT_WEBHOOK_URL in de omgeving (Slack, Teams, Google Chat, Discord of Make),
 *   dan gaat er ook een bericht naar die webhook — na het antwoord aan de bezoeker (after()).
 *
 * Stuur NOOIT persoonsgegevens mee (naam, e-mail, telefoon, bericht): enkel technische
 * context zoals een Shopify-klant-ID, een HTTP-status of de foutmelding.
 */
type Extra = Record<string, string | number | boolean | null | undefined>;

async function naarWebhook(tekst: string) {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  try {
    // `text` (Slack, Teams, Google Chat) én `content` (Discord): elk platform neemt wat het kent.
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: tekst, content: tekst }),
      signal: AbortSignal.timeout(4000),
    });
  } catch (e) {
    console.error("[ALERT] melding naar ALERT_WEBHOOK_URL mislukt:", (e as Error).message);
  }
}

/** Dezelfde melding hoogstens één keer per kwartier per instantie naar de webhook (geen stortvloed bij een storing). */
const PAUZE = 15 * 60_000;
const laatst = new Map<string, number>();

/**
 * Meldt een probleem. Binnen een request gaat de webhook-melding na het antwoord (after());
 * daarbuiten (bv. instrumentation.ts) geeft de Promise aan wanneer ze verstuurd is.
 */
export function meld(bron: string, bericht: string, extra: Extra = {}): Promise<void> {
  const omgeving = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "onbekend";
  console.error(`[ALERT] ${JSON.stringify({ bron, bericht, omgeving, tijd: new Date().toISOString(), ...extra })}`);

  const sleutel = `${bron}|${bericht}`;
  if (Date.now() - (laatst.get(sleutel) ?? 0) < PAUZE) return Promise.resolve();
  laatst.set(sleutel, Date.now());

  const details = Object.entries(extra)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
  const tekst = `⚠️ Brunic-webshop (${omgeving}) — ${bron}: ${bericht}${details ? `\n${details}` : ""}`;
  try {
    after(() => naarWebhook(tekst));
    return Promise.resolve();
  } catch {
    // Buiten een request-context: rechtstreeks versturen.
    return naarWebhook(tekst);
  }
}
