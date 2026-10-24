import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { after, NextResponse } from "next/server";
import { INHOUD_TAG } from "@/lib/inhoud/shopify";
import { vraagHerbouw } from "@/lib/catalog/herbouw";

// Webhooks altijd live verwerken, nooit gecachet of statisch.
export const dynamic = "force-dynamic";

/**
 * Shopify-webhook → teksten en foto's uit de admin (metaobjects) meteen verversen. Zonder
 * deze webhook verschijnt een wijziging na hoogstens 5 minuten (src/lib/inhoud/shopify.ts).
 * Product- en collectiewijzigingen starten een nieuwe build (VERCEL_DEPLOY_HOOK_URL).
 * Aanmelden bij Shopify: packages/catalog/register-webhooks.mjs [--producten].
 *
 * Shopify tekent met het client secret van de app die de webhook aanmaakte. Welke app dat
 * is, verschilt per omgeving (Dev Dashboard-app of custom app), dus elk ingesteld secret telt.
 */
function geldigeHandtekening(rawBody: string, hmacHeader: string | null): boolean {
  if (!hmacHeader) return false;
  const b = Buffer.from(hmacHeader);
  return [process.env.SHOPIFY_WEBHOOK_SECRET, process.env.SHOPIFY_CLIENT_SECRET, process.env.SHOPIFY_API_SECRET].some((secret) => {
    if (!secret) return false;
    const a = Buffer.from(createHmac("sha256", secret).update(rawBody, "utf8").digest("base64"));
    // Lengtes moeten gelijk zijn vóór timingSafeEqual, anders gooit het.
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!geldigeHandtekening(rawBody, request.headers.get("x-shopify-hmac-sha256"))) {
    // 401 → Shopify markeert de levering als mislukt en probeert opnieuw.
    return new NextResponse("ongeldige handtekening", { status: 401 });
  }

  const topic = request.headers.get("x-shopify-topic") ?? "";
  // Metaobjects, maar ook collecties: "Categorie | Tekst en foto" hangt aan een collectie.
  if (topic.startsWith("metaobjects/") || topic.startsWith("collections/")) {
    revalidateTag(INHOUD_TAG, { expire: 0 });
  }
  // Producten en collecties zitten in de momentopname van de build: nieuwe build vragen
  // (afgeremd, zie lib/catalog/herbouw.ts) — na het antwoord, Shopify wacht max. 5 s.
  if (topic.startsWith("products/") || topic.startsWith("collections/")) {
    after(() => vraagHerbouw(`webhook ${topic}`));
  }

  // Altijd 2xx bij een geldige webhook, anders blijft Shopify herproberen.
  return NextResponse.json({ ok: true, topic });
}
