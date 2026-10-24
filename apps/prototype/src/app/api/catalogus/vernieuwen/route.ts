import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { heeftVerschil, vergelijkMetShopify, vraagHerbouw } from "@/lib/catalog/herbouw";
import { meld } from "@/lib/melding";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vangnet voor de catalogus (zie lib/catalog/herbouw.ts): vergelijkt de momentopname van
 * deze deploy met Shopify en start enkel bij een verschil een nieuwe build.
 *
 * Aanroepen met `Authorization: Bearer <CRON_SECRET>`:
 * - Vercel Cron (vercel.json) stuurt die header zelf mee zodra CRON_SECRET gezet is;
 * - Shopify Flow ("Scheduled time" → "Send HTTP request") of de beheerder kan hetzelfde doen.
 * `?controle=1` = enkel rapporteren, geen build starten.
 */
function toegestaan(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  if (!secret) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function vernieuw(req: Request) {
  if (!toegestaan(req)) return new NextResponse("niet toegestaan", { status: 401 });
  const enkelControle = new URL(req.url).searchParams.get("controle") === "1";
  try {
    const verschil = await vergelijkMetShopify();
    const herbouw = heeftVerschil(verschil) && !enkelControle ? await vraagHerbouw("dagelijkse controle") : "niet-nodig";
    return NextResponse.json({ ...verschil, herbouw }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    meld("catalogus", "Vergelijking met Shopify mislukt", { fout: (e as Error).message });
    return NextResponse.json({ error: "Shopify niet bereikbaar" }, { status: 502 });
  }
}

export const GET = vernieuw;
export const POST = vernieuw;
