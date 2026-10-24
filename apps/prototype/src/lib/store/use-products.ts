"use client";

import { useEffect, useState } from "react";
import type { Availability, Price, QuantityRule, SalesUnit } from "@/lib/catalog/types";
import type { CardProduct } from "@/lib/catalog/view";

export type LiteVariant = { id: string; sku: string; label: string; price: Price | null; availability: Availability };
export type LiteProduct = {
  card: CardProduct;
  unit: SalesUnit;
  quantity: QuantityRule;
  pricing: "fixed" | "on-request";
  variants: LiteVariant[];
  /** Shopify-producten die in dit ontwerp opgingen: oude ID's/slugs uit winkelmand of verlanglijst. */
  aliases?: { id: string; slug: string }[];
};

type Soort = "ids" | "slugs";
const nieuw = () => ({ ids: new Map<string, LiteProduct>(), slugs: new Map<string, LiteProduct>() });
/**
 * Cache per sleutelsoort (id of slug), gedeeld over alle componenten. Twee varianten:
 * `live` (beschikbaarheid live uit Shopify — winkelmand en productpagina) en de gewone
 * momentopname (verlanglijst, recent bekeken, offerteformulier).
 */
const caches = { live: nieuw(), snapshot: nieuw() };
/** Sleutels die de catalogus niet (meer) kent — bv. een product dat verdween. */
const gone = { ids: new Set<string>(), slugs: new Set<string>() };

function useLookup(kind: Soort, keys: string[], live = false) {
  const bron = live ? caches.live : caches.snapshot;
  const cache = bron[kind];
  const weg = gone[kind];
  const key = [...new Set(keys)].sort().join(",");
  const [, force] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const missing = key.split(",").filter((k) => k && !cache.has(k) && !weg.has(k));
    if (missing.length === 0) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/producten?${kind}=${encodeURIComponent(missing.join(","))}${live ? "&live=1" : ""}`)
      .then((r) => r.json())
      .then((data: { products: LiteProduct[] }) => {
        for (const p of data.products) {
          for (const a of [p.card, ...(p.aliases ?? [])]) {
            bron.ids.set(a.id, p);
            bron.slugs.set(a.slug, p);
          }
        }
        for (const k of missing) if (!cache.has(k)) weg.add(k);
        if (!cancelled) force((n) => n + 1);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [key, kind, live, bron, cache, weg]);

  const map = new Map<string, LiteProduct>();
  for (const k of keys) {
    const p = cache.get(k);
    if (p) map.set(k, p);
  }
  const complete = keys.every((k) => cache.has(k) || weg.has(k));
  return { map, loading: loading || !complete };
}

/**
 * Haalt productgegevens op voor een lijst product-ID's (met eenvoudige cache).
 * `live`: beschikbaarheid per variant live uit Shopify i.p.v. uit de momentopname.
 */
export function useProducts(ids: string[], opts: { live?: boolean } = {}) {
  return useLookup("ids", ids, opts.live);
}

/** Idem, op slug (bv. ?product=… in de URL van het offerteformulier). */
export function useProductsBySlug(slugs: string[]) {
  return useLookup("slugs", slugs);
}
