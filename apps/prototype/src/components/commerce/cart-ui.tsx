"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Icon } from "@/components/ui/icon";
import { ImageSlot } from "@/components/ui/image-slot";
import type { ImageRef, Price as PriceT } from "@/lib/catalog/types";
import { formatMoney, formatQuantity, lineTotal, UNIT_NAME } from "@/lib/catalog/product";
import { useCart } from "@/lib/store/stores";
import { routes } from "@/lib/routes";
import { KassaOpvolging } from "./kassa-opvolging";

type Added = { title: string; image?: ImageRef; variantLabel?: string; quantity: number; price: PriceT };

const Ctx = createContext<{ announceAdded: (a: Added) => void }>({ announceAdded: () => {} });

export function useCartUi() {
  return useContext(Ctx);
}

/**
 * Bevestiging na "In winkelmand" (zijpaneel), zoals gangbaar bij de referentie.
 * Eén paneel voor de hele site.
 */
export function CartUiProvider({ children }: { children: ReactNode }) {
  const [added, setAdded] = useState<Added | null>(null);
  const cart = useCart();
  const announceAdded = useCallback((a: Added) => setAdded(a), []);
  const value = useMemo(() => ({ announceAdded }), [announceAdded]);
  const close = useCallback(() => setAdded(null), []);

  return (
    <Ctx.Provider value={value}>
      {children}
      <KassaOpvolging />
      <Drawer
        open={added !== null}
        onClose={close}
        title={
          <span className="flex items-center gap-2">
            <Icon name="checkCircle" className="text-success" /> Toegevoegd aan uw winkelmand
          </span>
        }
        footer={
          <div className="grid gap-2">
            <Link href={routes.cart()} onClick={close} className="btn btn-primary w-full">
              Naar mijn winkelmand ({cart.count})
            </Link>
            <button type="button" onClick={close} className="btn btn-outline w-full">
              Verder winkelen
            </button>
          </div>
        }
      >
        {added && (
          <div className="flex gap-4 p-5">
            <ImageSlot src={added.image?.src} alt="" className="aspect-square w-24 shrink-0 rounded-2xl" />
            <div className="min-w-0 text-sm">
              <p className="font-medium">{added.title}</p>
              {added.variantLabel && <p className="mt-1 text-ink-60">{added.variantLabel}</p>}
              <p className="mt-2">
                {formatQuantity(added.quantity)} {added.quantity === 1 ? UNIT_NAME[added.price.unit].one : UNIT_NAME[added.price.unit].many} ×{" "}
                {formatMoney(added.price.amount.amount)}
              </p>
              <p className="mt-1 font-semibold">{formatMoney(lineTotal(added.price.amount.amount, added.quantity))}</p>
            </div>
          </div>
        )}
      </Drawer>
    </Ctx.Provider>
  );
}
