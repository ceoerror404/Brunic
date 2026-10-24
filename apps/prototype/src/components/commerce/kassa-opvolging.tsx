"use client";

import { useEffect } from "react";
import { KASSA_GELDIG_MS, lopendeKassa } from "@/lib/store/stores";

/**
 * Na de Shopify-kassa: was de cart afgerekend, dan de betaalde regels uit de lokale
 * winkelmand halen. Controleert bij het laden van elke pagina en wanneer de klant terugkeert
 * naar het tabblad of met "terug" uit de kassa komt (bfcache), zolang er een kassa loopt.
 */
export function KassaOpvolging() {
  useEffect(() => {
    let bezig = false;
    const controleer = async () => {
      const k = lopendeKassa.get();
      if (!k || bezig) return;
      if (Date.now() - k.at > KASSA_GELDIG_MS) {
        lopendeKassa.stop();
        return;
      }
      bezig = true;
      try {
        const res = await fetch(`/api/kassa?cart=${encodeURIComponent(k.cartId)}`, { cache: "no-store" });
        const { status } = (await res.json()) as { status?: "open" | "afgerond" | "onbekend" };
        // Enkel bij een zeker "afgerond" iets weghalen; bij twijfel blijft de winkelmand staan.
        if (status === "afgerond" && lopendeKassa.get()?.cartId === k.cartId) lopendeKassa.afgerond(k);
      } catch {
        /* offline of kassa-API onbereikbaar: volgende keer opnieuw */
      } finally {
        bezig = false;
      }
    };
    const zichtbaar = () => document.visibilityState === "visible" && void controleer();
    void controleer();
    window.addEventListener("pageshow", controleer);
    document.addEventListener("visibilitychange", zichtbaar);
    return () => {
      window.removeEventListener("pageshow", controleer);
      document.removeEventListener("visibilitychange", zichtbaar);
    };
  }, []);
  return null;
}
