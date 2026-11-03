"use client";

import Link from "next/link";
import { useState } from "react";
import type { CardProduct } from "@/lib/catalog/view";
import { routes } from "@/lib/routes";
import { cdnWidth } from "@/lib/catalog/cdn";
import { toonHeleFoto } from "@/lib/catalog/product";
import { ImageSlot } from "@/components/ui/image-slot";
import { WishlistButton } from "@/components/commerce/wishlist-button";
import { Price } from "./price";

const BADGE_LABEL = { nieuw: "Nieuw", aanbieding: "Aanbieding", "op-maat": "Op maat" } as const;

/**
 * Productkaart volgens de referentie: afgeronde kaart (hover-rand), beeld 4:3 met
 * label linksboven en hartje rechtsboven, merkregel, titel (2 regels), prijs,
 * bestelregel, kleurstalen. Geen voorraadbelofte: Shopify volgt geen voorraad.
 */
export function ProductCard({ product, priority = false, tone = 0 }: { product: CardProduct; priority?: boolean; tone?: number }) {
  const [hover, setHover] = useState(false);
  const [color, setColor] = useState<string | null>(null);
  const chosen = product.swatches.find((s) => s.value === color);
  const badge = product.badges.includes("aanbieding") ? "aanbieding" : product.badges.includes("nieuw") ? "nieuw" : product.badges[0];
  const toontHover = !chosen?.image && hover && Boolean(product.hoverImage);
  const img = chosen?.image ?? (toontHover ? product.hoverImage : product.image);
  // De hoverfoto is een sfeerbeeld: die mag het kader vullen.
  const heel = toonHeleFoto(product.type) && !toontHover;
  const extra = product.swatchTotal - product.swatches.length;

  return (
    <article
      className="group relative flex h-full flex-col rounded-[var(--radius-pill)] border-2 border-transparent bg-white p-2 transition-colors hover:border-line"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative">
        <ImageSlot
          src={img?.src}
          alt={img?.alt || product.title}
          priority={priority}
          tone={tone}
          fit={heel ? "contain" : "cover"}
          imgClassName={heel ? "p-0!" : ""}
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
          className="aspect-[4/3] w-full rounded-[var(--radius-tile)]"
        />
        {badge && (
          <span className={`label absolute left-2 top-2 ${badge === "aanbieding" ? "text-brand" : ""}`}>{BADGE_LABEL[badge]}</span>
        )}
        <div className="absolute right-1 top-1">
          <WishlistButton productId={product.id} title={product.title} variant="card" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-1 pb-2 pt-3">
        <p className="truncate text-xs font-medium text-ink-60">
          {[product.brand ?? "Brunic", product.type].filter(Boolean).join(" · ")}
        </p>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[14px] font-medium leading-5">
          {/* De hele kaart is klikbaar via de stretched link op de titel. */}
          <Link href={routes.product(product.slug, chosen?.variantId ?? product.variantId)} className="after:absolute after:inset-0 after:rounded-[var(--radius-pill)] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ink">
            {product.title}
          </Link>
        </h3>
        <Price card={chosen?.price !== undefined ? { ...product, price: chosen.price, fromPrice: chosen.fromPrice ?? false } : product} className="mt-0.5" />
        <p className={`text-xs ${product.pricing === "fixed" && product.availability === "uitverkocht" ? "text-brand-dark" : "text-ink-60"}`}>
          {product.pricing === "on-request" ? "Advies en offerte in de winkel" : product.availability === "uitverkocht" ? "Tijdelijk uitverkocht" : "Online te bestellen"}
        </p>
        {product.swatchTotal > 1 && (
          // Boven de kaartlink (z-10): een staal kiezen wisselt het beeld en de link naar die kleur.
          <ul className="relative z-10 -my-1 ml-0 mt-0 flex items-center max-[359px]:flex-wrap" aria-label={`Kleuren van ${product.title}`} role="list">
            {product.swatches.slice(0, 4).map((s) => (
              <li key={s.value}>
                <button
                  type="button"
                  onClick={() => setColor((c) => (c === s.value ? null : s.value))}
                  aria-pressed={color === s.value}
                  aria-label={`Kleur ${s.value}`}
                  title={s.value}
                  className="-mx-1 flex size-10 items-center justify-center rounded-full"
                >
                  <span
                    className={`size-[18px] rounded-full ring-1 ${color === s.value ? "ring-2 ring-ink ring-offset-1" : "ring-line-strong/40"}`}
                    style={{ background: s.swatch ?? (s.image ? `url("${cdnWidth(s.image.src, 96)}") center / cover` : "#ddd") }}
                  />
                </button>
              </li>
            ))}
            {extra > 0 && (
              <li>
                <Link href={routes.product(product.slug, chosen?.variantId ?? product.variantId)} className="relative z-10 px-1 text-xs text-ink-80 hover:underline" aria-label={`Nog ${extra} kleuren bekijken`}>
                  +{extra}
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}
