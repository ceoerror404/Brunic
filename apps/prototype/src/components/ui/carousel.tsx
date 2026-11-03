"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icon";

/**
 * Horizontale carrousel met scroll-snap (touch/trackpad) + ronde vorige/volgende-
 * knoppen zoals de referentie (grijs-transparant, op de rand). Knoppen verdwijnen aan
 * het begin/einde. Items blijven gewone links → volledig toetsenbordbedienbaar.
 */
export function Carousel({
  children,
  label,
  itemClassName = "w-[72%] xs:w-[46%] md:w-[31%] lg:w-[23.5%] xl:w-[21.6%]",
  gap = "gap-2 md:gap-3",
  focusableTrack = false,
}: {
  children: ReactNode[];
  label: string;
  itemClassName?: string;
  gap?: string;
  /** Voor carrousels zonder links/knoppen: het spoor zelf krijgt focus (pijltoetsen scrollen). */
  focusableTrack?: boolean;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: rustig ? "auto" : "smooth" });
  };

  return (
    <div className="relative" role="region" aria-roledescription="carrousel" aria-label={label}>
      <ul ref={track} tabIndex={focusableTrack ? 0 : undefined} className={`no-scrollbar flex snap-x snap-mandatory overflow-x-auto motion-safe:scroll-smooth ${gap}`}>
        {children.map((child, i) => (
          <li key={i} className={`shrink-0 snap-start ${itemClassName}`}>
            {child}
          </li>
        ))}
      </ul>
      {!atStart && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Vorige"
          className="absolute left-1 top-[38%] z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-[rgb(120_106_108/0.55)] text-white shadow-[var(--shadow-label)] backdrop-blur-sm transition hover:bg-[rgb(90_76_78/0.75)] sm:flex"
        >
          <Icon name="chevronLeft" size={20} />
        </button>
      )}
      {!atEnd && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Volgende"
          className="absolute right-1 top-[38%] z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-[rgb(120_106_108/0.55)] text-white shadow-[var(--shadow-label)] backdrop-blur-sm transition hover:bg-[rgb(90_76_78/0.75)] sm:flex"
        >
          <Icon name="chevronRight" size={20} />
        </button>
      )}
    </div>
  );
}
