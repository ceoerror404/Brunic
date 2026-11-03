import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

/**
 * Vergrendelt het scrollen van de pagina (lade, lightbox). De verdwijnende scrollbalk wordt
 * opgevangen met padding: anders wordt de pagina breder en verspringen de kaarten erachter.
 * Geeft de functie terug die alles herstelt.
 */
export function vergrendelPagina(): () => void {
  const { body, documentElement: html } = document;
  const overflow = body.style.overflow;
  const paddingRight = body.style.paddingRight;
  const scrollbalk = window.innerWidth - html.clientWidth;
  body.style.overflow = "hidden";
  if (scrollbalk > 0) body.style.paddingRight = `${scrollbalk}px`;
  return () => {
    body.style.overflow = overflow;
    body.style.paddingRight = paddingRight;
  };
}

/**
 * Houdt een knop op dezelfde plek in beeld wanneer inhoud erboven inklapt ("Minder lezen"):
 * de pagina krimpt, maar de klant blijft waar hij was. Roep `onthoud()` aan vlak vóór het inklappen.
 */
export function useHoudInBeeld<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const vorige = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (vorige.current === null || !ref.current) return;
    const verschil = ref.current.getBoundingClientRect().top - vorige.current;
    vorige.current = null;
    if (Math.abs(verschil) > 1) window.scrollBy({ top: verschil, behavior: "instant" });
  });
  const onthoud = () => {
    vorige.current = ref.current?.getBoundingClientRect().top ?? null;
  };
  return { ref, onthoud };
}

/**
 * Het muiswiel boven een open paneel scrolt de pagina erachter niet mee: de klant zou zijn plek
 * in de lijst verliezen zonder het te zien. Een lijst in het paneel die nog kan scrollen, scrolt gewoon.
 */
export function useWielBinnen(ref: RefObject<HTMLElement | null>, actief = true) {
  useEffect(() => {
    const paneel = ref.current;
    if (!actief || !paneel) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // zoomen, horizontaal
      for (let el = e.target instanceof Element ? e.target : null; el; el = el === paneel ? null : el.parentElement) {
        const { overflowY } = getComputedStyle(el);
        if (overflowY !== "auto" && overflowY !== "scroll") continue;
        const kanVerder = e.deltaY > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0;
        if (kanVerder) return;
      }
      e.preventDefault();
    };
    paneel.addEventListener("wheel", onWheel, { passive: false });
    return () => paneel.removeEventListener("wheel", onWheel);
  }, [ref, actief]);
}
