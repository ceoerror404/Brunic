import { NextResponse } from "next/server";
import { catalog } from "@/lib/catalog/repository";
import { storefront } from "@/lib/shopify/storefront";

export const dynamic = "force-dynamic";

/**
 * Gezondheidscontrole voor een uptime-monitor (bv. Better Stack, UptimeRobot, Vercel):
 * 200 = catalogus geladen én de Shopify Storefront API (kassa) bereikbaar; anders 503.
 * Geeft geen gevoelige gegevens prijs.
 */
export async function GET() {
  const t0 = Date.now();
  let shopify = false;
  try {
    await storefront<{ shop: { name: string } }>(`{ shop { name } }`);
    shopify = true;
  } catch {
    /* hieronder gerapporteerd */
  }
  const producten = (await catalog.getAllProducts()).length;
  const ok = shopify && producten > 0;
  return NextResponse.json(
    { ok, shopify, producten, catalogus: catalog.source.info, ms: Date.now() - t0 },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
