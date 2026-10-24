/**
 * Ondertitel, intro en foto per categorie: metaobject `categorie_inhoud` ("Categorie | Tekst
 * en foto"), gekoppeld aan de Shopify-collectie. Een leeg veld valt terug op wat de
 * catalogus al heeft (src/data/categorie-teksten.ts, collectiebeschrijving, categoriebeeld).
 */
import { cache } from "react";
import type { CategoryNode, ImageRef } from "@/lib/catalog/types";
import { SHOPIFY_HOOFDCOLLECTIE } from "@/data/shopify-bron";
import { metaobjecten } from "./shopify";

type CategorieInhoud = { subtitle?: string; intro?: string; image?: ImageRef };

const perCollectie = cache(async (): Promise<Map<string, CategorieInhoud>> => {
  const out = new Map<string, CategorieInhoud>();
  for (const m of (await metaobjecten("categorie_inhoud")) ?? []) {
    const handle = m.collectie("collectie");
    if (handle) out.set(handle, { subtitle: m.tekst("ondertitel"), intro: m.tekst("intro"), image: m.beeld("foto", m.tekst("beheernaam") ?? "") });
  }
  return out;
});

/** De Shopify-collectie achter een categorie (zie shopify-adapter.ts: subcategorie-id = `s-<handle>`). */
function collectieHandle(node: Pick<CategoryNode, "id">): string | undefined {
  return SHOPIFY_HOOFDCOLLECTIE[node.id] ?? (node.id.startsWith("s-") ? node.id.slice(2) : undefined);
}

/** Teksten en foto van een categorie, met de admin-inhoud voorrang op de standaard. */
export async function categorieInhoud(node: Pick<CategoryNode, "id" | "subtitle" | "intro" | "image">): Promise<CategorieInhoud> {
  const handle = collectieHandle(node);
  const m = handle ? (await perCollectie()).get(handle) : undefined;
  return { subtitle: m?.subtitle ?? node.subtitle, intro: m?.intro ?? node.intro, image: m?.image ?? (node.image?.src ? node.image : undefined) };
}
