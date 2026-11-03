"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useHoudInBeeld } from "@/lib/site/scroll";
import { Icon } from "./icon";

/**
 * Blok dat ingekort start met een vervaging en "Meer lezen" (referentie: Descriptif,
 * Caractéristiques). Is de inhoud kort genoeg, dan verschijnt er geen knop.
 */
export function Collapsible({ children, collapsedHeight = 260 }: { children: ReactNode; collapsedHeight?: number }) {
  const [open, setOpen] = useState(false);
  const [needed, setNeeded] = useState(true);
  const inner = useRef<HTMLDivElement>(null);
  const id = useId();
  const { ref: knop, onthoud } = useHoudInBeeld<HTMLButtonElement>();

  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const check = () => setNeeded(el.scrollHeight > collapsedHeight + 40);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [collapsedHeight]);

  const clipped = needed && !open;
  return (
    <div>
      <div id={id} className="relative overflow-hidden" style={clipped ? { maxHeight: collapsedHeight } : undefined}>
        <div ref={inner}>{children}</div>
        {clipped && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-white/0 to-white" aria-hidden="true" />}
      </div>
      {needed && (
        <button
          ref={knop}
          type="button"
          onClick={() => {
            if (open) onthoud();
            setOpen(!open);
          }}
          aria-expanded={open}
          aria-controls={id}
          className="mt-2 inline-flex items-center gap-2 border-b-2 border-ink py-2 text-[14px] font-medium"
        >
          {open ? "Minder lezen" : "Meer lezen"}
          <Icon name="chevronDown" size={18} className={open ? "rotate-180" : ""} />
        </button>
      )}
    </div>
  );
}
