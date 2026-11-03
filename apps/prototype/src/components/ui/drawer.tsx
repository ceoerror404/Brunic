"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { vergrendelPagina } from "@/lib/site/scroll";
import { Icon } from "./icon";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/**
 * Zijpaneel (filters, varianten, mobiel menu, winkelmandbevestiging).
 * Toegankelijk: role=dialog + aria-modal, benoemd via de titel, focus gaat naar het
 * paneel en terug naar de opener, Escape en klik op de achtergrond sluiten, de pagina
 * scrolt niet mee, Tab en Shift+Tab blijven binnen het paneel.
 */
export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  footer,
  width = "w-[min(100vw,440px)]",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  side?: "left" | "right";
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const ontgrendel = vergrendelPagina();
    const t = window.setTimeout(() => panel.current?.focus(), 10);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === "Tab" && panel.current) {
        const focusables = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        // Focus op het paneel zelf (net geopend) of erbuiten: terug naar begin/einde.
        const inside = active instanceof HTMLElement && active !== panel.current && panel.current.contains(active);
        if (e.shiftKey && (!inside || active === first)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (!inside || active === last)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      ontgrendel();
      document.removeEventListener("keydown", onKey);
      if (opener.current instanceof HTMLElement) opener.current.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title !== undefined ? titleId : undefined}
        tabIndex={-1}
        className={`absolute top-0 flex h-full max-h-dvh flex-col bg-white outline-none ${width} ${
          side === "right" ? "right-0 shadow-[var(--shadow-drawer)]" : "left-0 shadow-[12px_0_40px_-12px_rgb(19_12_12/0.25)]"
        }`}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <button type="button" onClick={onClose} className="-mr-2 flex size-11 items-center justify-center rounded-full hover:bg-mist" aria-label="Sluiten">
              <Icon name="close" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-line bg-white px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
