import { headers } from "next/headers";

/**
 * Eenvoudige rate limiting voor de formulieren: max. `aantal` inzendingen per IP-adres per
 * `venster`. Bewaard in het geheugen van de serverfunctie — een vangnet tegen scripts en
 * dubbel versturen, geen waterdichte bescherming: op Vercel draait elke functie-instantie
 * met een eigen teller. Voor harde limieten over alle instanties heen: Vercel Firewall
 * (rate limiting op /op-maat-en-plaatsing, /winkel-en-contact) of een gedeelde store.
 */
const tellers = new Map<string, number[]>();

export async function bezoekerIp(): Promise<string> {
  const h = await headers();
  // Op Vercel zet het platform zelf x-forwarded-for (eerste adres = de bezoeker).
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "onbekend";
}

/** @returns true als deze inzending nog mag; registreert ze meteen. */
export async function binnenLimiet(soort: string, aantal: number, vensterMs: number): Promise<boolean> {
  const sleutel = `${soort}:${await bezoekerIp()}`;
  const nu = Date.now();
  const recent = (tellers.get(sleutel) ?? []).filter((t) => nu - t < vensterMs);
  if (recent.length >= aantal) {
    tellers.set(sleutel, recent);
    return false;
  }
  recent.push(nu);
  tellers.set(sleutel, recent);
  // Geheugen begrenzen: oude sleutels opruimen zodra de map groot wordt.
  if (tellers.size > 5000) for (const [k, v] of tellers) if (!v.some((t) => nu - t < vensterMs)) tellers.delete(k);
  return true;
}
