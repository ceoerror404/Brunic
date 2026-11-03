"use client";

import { useEffect } from "react";

/**
 * Een klik op een anker binnen dezelfde pagina animeert; al de rest springt meteen.
 * Niet via scroll-behavior: smooth in de CSS: dan animeert ook elke paginawissel (de nieuwe
 * pagina landt bovendien achter de header) en schuift de lijst voorbij bij de terugknop.
 * De browser verwerkt de klik zelf (adres, geschiedenis, focus); enkel de beweging komt erbij.
 */
export function VloeiendeAnkers() {
  useEffect(() => {
    const html = document.documentElement;
    let klaar: (() => void) | undefined;

    const onClick = (e: MouseEvent) => {
      klaar?.(); // Elke volgende klik (ook naar een andere pagina) begint zonder animatie.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!(e.target instanceof Element) || !e.target.closest('a[href^="#"]')) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      html.style.scrollBehavior = "smooth";
      html.getClientRects(); // Chrome neemt de stijl anders niet mee in deze klik.
      const stop = () => klaar?.();
      // Vangnet: zonder beweging (het doel staat al goed) komt er geen scrollend.
      const timer = window.setTimeout(stop, 1200);
      window.addEventListener("scrollend", stop);
      klaar = () => {
        window.clearTimeout(timer);
        window.removeEventListener("scrollend", stop);
        html.style.removeProperty("scroll-behavior");
        klaar = undefined;
      };
    };

    // Capture: vóór de browser de klik afhandelt en vóór een Next-link de navigatie start.
    document.addEventListener("click", onClick, true);
    return () => {
      klaar?.();
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
