"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ProductImage } from "@/lib/catalog/types";
import { ImageSlot } from "@/components/ui/image-slot";
import { Icon } from "@/components/ui/icon";

/**
 * Productgalerij zoals de referentie: desktop = groot beeld + raster van 2 kolommen
 * (met "Meer foto's tonen"), mobiel = swipebare strook met stippen. Klik opent een
 * lightbox (pijltjestoetsen + Escape). `heleFoto`: elke foto past heel in haar kader, ook de eerste.
 */
export function Gallery({ images, title, heleFoto = false }: { images: ProductImage[]; title: string; heleFoto?: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const strip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(0);
    strip.current?.scrollTo({ left: 0 });
  }, [images]);

  if (images.length === 0) {
    return <ImageSlot alt="" className="aspect-[4/3] w-full rounded-[var(--radius-tile)] border border-line" />;
  }

  const desktop = showAll ? images : images.slice(0, 5);

  return (
    <div>
      {/* Mobiel: swipebaar, stippen in een doorschijnend pilletje over het beeld */}
      <div className="relative lg:hidden">
        <div
          ref={strip}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto md:-mx-6"
          onScroll={(e) => {
            const el = e.currentTarget;
            setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
          aria-label="Productfoto's"
        >
          {images.map((img, i) => (
            <button key={`${img.src}-${i}`} type="button" onClick={() => setLightbox(i)} className="w-full shrink-0 snap-center" aria-label={`Foto ${i + 1} van ${images.length} vergroten`}>
              <ImageSlot src={img.src} alt={img.alt || title} priority={i === 0} fit={heleFoto ? "contain" : "cover"} className="aspect-[4/3] w-full bg-white" />
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-ink/35 px-2.5 py-1.5 backdrop-blur-sm" aria-hidden="true">
            {images.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === active ? "w-4 bg-white" : "w-1.5 bg-white/60"}`} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: gestapeld */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-2 gap-2">
          {desktop.map((img, i) => {
            const big = i === 0 || (i - 1) % 3 === 2;
            return (
              <button
                key={`${img.src}-${i}`}
                type="button"
                onClick={() => setLightbox(i)}
                className={`overflow-hidden rounded-[var(--radius-tile)] border border-line bg-white ${big ? "col-span-2" : ""}`}
                aria-label={`Foto ${i + 1} van ${images.length} vergroten`}
              >
                <ImageSlot src={img.src} alt={img.alt || title} priority={i === 0} fit={i === 0 && !heleFoto ? "cover" : "contain"} className={big ? "aspect-[4/3] w-full" : "aspect-square w-full"} />
              </button>
            );
          })}
        </div>
        {images.length > 5 && (
          <div className="mt-4 flex justify-center">
            <button type="button" onClick={() => setShowAll((s) => !s)} className="btn btn-outline btn-sm">
              {showAll ? "Minder foto's tonen" : `Meer foto's tonen (${images.length - 5})`}
            </button>
          </div>
        )}
      </div>

      {lightbox !== null && <Lightbox images={images} start={lightbox} title={title} onClose={() => setLightbox(null)} />}
    </div>
  );
}

function Lightbox({ images, start, title, onClose }: { images: ProductImage[]; start: number; title: string; onClose: () => void }) {
  const [i, setI] = useState(start);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const opener = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "ArrowRight") setI((n) => (n + 1) % images.length);
      if (e.key === "ArrowLeft") setI((n) => (n - 1 + images.length) % images.length);
      // Tab blijft binnen de lightbox.
      if (e.key === "Tab" && dialog.current) {
        const f = dialog.current.querySelectorAll<HTMLElement>("button");
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [images.length]);

  return createPortal(
    <div ref={dialog} role="dialog" aria-modal="true" aria-label={`Foto's van ${title}`} className="fixed inset-0 z-[90] flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm text-ink-80">
          {i + 1} / {images.length}
        </p>
        <button ref={closeBtn} type="button" onClick={onClose} className="flex size-11 items-center justify-center rounded-full hover:bg-mist" aria-label="Sluiten">
          <Icon name="close" />
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <ImageSlot src={images[i].src} alt={images[i].alt || title} fit="contain" className="absolute inset-0" />
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => setI((n) => (n - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[var(--shadow-pop)]" aria-label="Vorige foto">
              <Icon name="chevronLeft" />
            </button>
            <button type="button" onClick={() => setI((n) => (n + 1) % images.length)} className="absolute right-3 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[var(--shadow-pop)]" aria-label="Volgende foto">
              <Icon name="chevronRight" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
