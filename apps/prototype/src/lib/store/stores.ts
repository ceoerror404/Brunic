"use client";

import { useCallback } from "react";
import type { CartLine, WishlistItem } from "@/lib/catalog/types";
import { createLocalStore } from "./local-store";

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;

/* ---------------- Winkelmand ---------------- */

const cartStore = createLocalStore<CartLine[]>("brunic:winkelmand:v1", [], (raw) =>
  Array.isArray(raw)
    ? raw
        .filter(
          (l): l is CartLine =>
            isObj(l) && typeof l.productId === "string" && typeof l.variantId === "string" && typeof l.quantity === "number" && l.quantity > 0,
        )
        .slice(0, 100)
    : [],
);

/** Afronden op 2 decimalen — meterware (0,5 m) mag geen 2,4999999 worden. */
const round2 = (n: number) => Math.round(n * 100) / 100;

export function useCart() {
  const [lines, hydrated] = cartStore.useStore();

  /**
   * Voegt toe en begrenst op `max` (de hoeveelheidsregel van het product).
   * @returns de nieuwe regelhoeveelheid en of de bovengrens bereikt werd.
   */
  const add = useCallback((productId: string, variantId: string, quantity: number, max = Number.POSITIVE_INFINITY) => {
    const existing = cartStore.get().find((l) => l.variantId === variantId);
    const wanted = round2((existing?.quantity ?? 0) + quantity);
    const next = Math.min(max, wanted);
    cartStore.set((prev) =>
      existing ? prev.map((l) => (l.variantId === variantId ? { ...l, quantity: next } : l)) : [...prev, { productId, variantId, quantity: next }],
    );
    return { quantity: next, capped: wanted > max };
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    cartStore.set((prev) =>
      quantity <= 0 ? prev.filter((l) => l.variantId !== variantId) : prev.map((l) => (l.variantId === variantId ? { ...l, quantity: round2(quantity) } : l)),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    cartStore.set((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);

  const clear = useCallback(() => cartStore.set([]), []);

  return { lines, hydrated, add, setQuantity, remove, clear, count: lines.length };
}

/* ---------------- Lopende kassa ---------------- */

/**
 * De Shopify-cart waarmee de klant naar de kassa ging, met de regels van dat moment. Is die
 * cart afgerekend, dan halen we precies die regels uit de lokale winkelmand
 * (components/commerce/kassa-opvolging.tsx) — zo staat een betaalde bestelling niet opnieuw
 * in de winkelmand. Regels die de klant daarna nog toevoegde, blijven staan.
 */
export type LopendeKassa = { cartId: string; at: number; lines: { variantId: string; quantity: number }[] };

/** Shopify laat een niet-afgerekende cart na ±10 dagen vervallen; daarna weten we niets meer. */
export const KASSA_GELDIG_MS = 9 * 24 * 3600 * 1000;

const kassaStore = createLocalStore<LopendeKassa | null>("brunic:kassa:v1", null, (raw) =>
  isObj(raw) && typeof raw.cartId === "string" && typeof raw.at === "number" && Array.isArray(raw.lines)
    ? {
        cartId: raw.cartId,
        at: raw.at,
        lines: raw.lines.filter((l): l is { variantId: string; quantity: number } => isObj(l) && typeof l.variantId === "string" && typeof l.quantity === "number"),
      }
    : null,
);

export const lopendeKassa = {
  get: () => kassaStore.get(),
  start: (cartId: string, lines: LopendeKassa["lines"]) => kassaStore.set({ cartId, at: Date.now(), lines }),
  stop: () => kassaStore.set(null),
  /** Cart afgerekend: de afgerekende hoeveelheden uit de winkelmand halen. */
  afgerond: (k: LopendeKassa) => {
    const betaald = new Map(k.lines.map((l) => [l.variantId, l.quantity]));
    cartStore.set((prev) =>
      prev.flatMap((l) => {
        const q = betaald.get(l.variantId);
        if (q === undefined) return [l];
        const rest = round2(l.quantity - q);
        return rest > 0 ? [{ ...l, quantity: rest }] : [];
      }),
    );
    kassaStore.set(null);
  },
};

/* ---------------- Verlanglijst ---------------- */

export const MAX_WISHLIST = 50;

const wishlistStore = createLocalStore<WishlistItem[]>("brunic:verlanglijst:v1", [], (raw) =>
  Array.isArray(raw)
    ? raw.filter((i): i is WishlistItem => isObj(i) && typeof i.productId === "string").slice(0, MAX_WISHLIST)
    : [],
);

export function useWishlist() {
  const [items, hydrated] = wishlistStore.useStore();

  const has = useCallback((productId: string) => items.some((i) => i.productId === productId), [items]);

  /** @returns de nieuwe toestand (true = staat op de lijst) of null als de lijst vol is. */
  const toggle = useCallback((productId: string, variantId?: string): boolean | null => {
    const prev = wishlistStore.get();
    if (prev.some((i) => i.productId === productId)) {
      wishlistStore.set(prev.filter((i) => i.productId !== productId));
      return false;
    }
    if (prev.length >= MAX_WISHLIST) return null;
    wishlistStore.set([...prev, { productId, variantId, addedAt: new Date().toISOString() }]);
    return true;
  }, []);

  const remove = useCallback((productId: string) => wishlistStore.set((p) => p.filter((i) => i.productId !== productId)), []);
  const clear = useCallback(() => wishlistStore.set([]), []);

  return { items, hydrated, has, toggle, remove, clear, count: items.length };
}

/* ---------------- Recent bekeken ---------------- */

const recentStore = createLocalStore<string[]>("brunic:recent:v1", [], (raw) =>
  Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string").slice(0, 12) : [],
);

export function useRecentlyViewed() {
  const [ids, hydrated] = recentStore.useStore();
  const track = useCallback((productId: string) => {
    recentStore.set((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 12));
  }, []);
  return { ids, hydrated, track };
}
