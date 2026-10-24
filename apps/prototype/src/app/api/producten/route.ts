import { NextResponse } from "next/server";
import { catalog } from "@/lib/catalog/repository";
import { toCard } from "@/lib/catalog/view";
import { variantLabel } from "@/lib/catalog/product";
import type { Availability, Product } from "@/lib/catalog/types";
import { storefront } from "@/lib/shopify/storefront";

/** Gelijk aan de bovengrens van de winkelmand (lib/store/stores.ts) en de kassa. */
const MAX = 100;

const LIVE = /* GraphQL */ `
  query Beschikbaarheid($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product { id variants(first: 250) { nodes { id availableForSale } } }
    }
  }
`;
type LiveNode = { id: string; variants: { nodes: { id: string; availableForSale: boolean }[] } } | null;

const kortId = (gid: string) => gid.split("/").pop() ?? gid;

/**
 * Beschikbaarheid per variant live uit Shopify (Storefront API). Een product dat niet meer
 * op het kanaal staat, telt als uitverkocht. Is Shopify onbereikbaar, dan null: de
 * momentopname blijft gelden (de kassa controleert hoe dan ook live).
 */
async function liveBeschikbaarheid(productIds: string[]): Promise<Map<string, Availability> | null> {
  if (productIds.length === 0) return new Map();
  try {
    const { nodes } = await storefront<{ nodes: LiveNode[] }>(LIVE, { ids: productIds.map((id) => `gid://shopify/Product/${id}`) });
    const status = new Map<string, Availability>();
    nodes.forEach((n, i) => {
      if (!n) status.set(`product:${productIds[i]}`, "uitverkocht");
      else for (const v of n.variants.nodes) status.set(kortId(v.id), v.availableForSale ? "op-voorraad" : "uitverkocht");
    });
    return status;
  } catch (e) {
    console.warn("[producten] live beschikbaarheid niet bereikbaar, momentopname gebruikt:", (e as Error).message);
    return null;
  }
}

/**
 * Productgegevens voor winkelmand, verlanglijst, "recent bekeken" en het offerteformulier
 * (lokaal bewaarde ID's of een slug uit de URL → actuele gegevens uit de catalogus).
 * ?ids=a,b of ?slugs=x,y · &live=1 = beschikbaarheid live uit Shopify (winkelmand, PDP).
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const lijst = (key: string) => (params.get(key) ?? "").split(",").filter(Boolean).slice(0, MAX);
  const products: Product[] = [
    ...(await catalog.getProductsByIds(lijst("ids"))),
    ...(await Promise.all(lijst("slugs").map((s) => catalog.getProductBySlug(s)))).filter((p): p is Product => Boolean(p)),
  ];
  // Een samengevoegd ontwerp (lib/catalog/ontwerpen.ts) bestaat in Shopify uit meerdere producten.
  const bronnen = (p: Product) => [p.id, ...(p.aliases ?? []).map((a) => a.id)];
  const live = params.get("live") === "1" ? await liveBeschikbaarheid(products.flatMap(bronnen)) : null;
  // Ontbreekt een variant live, dan hoort ze bij een product dat niet meer op het kanaal staat.
  const beschikbaarheid = (p: Product, v: Product["variants"][number]): Availability =>
    !live ? v.availability : (live.get(v.id) ?? (bronnen(p).some((id) => live.has(`product:${id}`)) ? "uitverkocht" : v.availability));

  return NextResponse.json(
    {
      products: products.map((p) => ({
        card: toCard(p),
        unit: p.variants.find((v) => v.price)?.price?.unit ?? "stuk",
        quantity: p.quantity,
        pricing: p.pricing,
        variants: p.variants.map((v) => ({ id: v.id, sku: v.sku, label: variantLabel(v), price: v.price, availability: beschikbaarheid(p, v) })),
        ...(p.aliases ? { aliases: p.aliases } : {}),
      })),
    },
    // Live: kort cachen (voorraad); momentopname: wijzigt pas bij een nieuwe deploy.
    { headers: { "Cache-Control": live ? "public, max-age=0, s-maxage=60, stale-while-revalidate=120" : "public, max-age=60, s-maxage=300" } },
  );
}
