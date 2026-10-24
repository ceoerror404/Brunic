"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Product, ProductOption, Variant } from "@/lib/catalog/types";
import {
  AVAILABILITY_LABEL,
  findVariant,
  formatMoney,
  formatQuantity,
  imagesForVariant,
  isPurchasable,
  lineTotal,
  UNIT_NAME,
  variantById,
  variantLabel,
} from "@/lib/catalog/product";
import { useCart, useRecentlyViewed } from "@/lib/store/stores";
import { useProducts } from "@/lib/store/use-products";
import { SITE } from "@/lib/site/config";
import { isOpMaat, type Maatwerk } from "@/lib/site/maatwerk";
import { routes } from "@/lib/routes";
import { useCartUi } from "@/components/commerce/cart-ui";
import { WishlistButton } from "@/components/commerce/wishlist-button";
import { Price } from "@/components/catalog/price";
import { Drawer } from "@/components/ui/drawer";
import { Icon } from "@/components/ui/icon";
import { ImageSlot } from "@/components/ui/image-slot";
import { Gallery } from "./gallery";
import { clampQuantity, QuantityInput } from "./quantity-input";

const AVAIL_DOT: Record<Variant["availability"], string> = {
  "op-voorraad": "bg-success",
  beperkt: "bg-warning",
  "op-bestelling": "bg-warning",
  uitverkocht: "bg-brand",
};
const AVAIL_TEXT: Record<Variant["availability"], string> = {
  "op-voorraad": "text-success",
  beperkt: "text-warning",
  "op-bestelling": "text-warning",
  uitverkocht: "text-brand-dark",
};

/**
 * PDP-kern: galerij (links) + bestelblok (rechts, kleeft bij scrollen) + infosecties
 * onder de galerij. De gekozen variant staat in de URL (?variant=…) zodat een link
 * naar een specifieke kleur/maat werkt.
 *
 * De server rendert de standaardvariant (geen useSearchParams: dat zou de hele PDP uit de
 * server-HTML halen, B02); ?variant= wordt na het laden in de browser toegepast. De
 * beschikbaarheid komt live uit Shopify (/api/producten?live=1), de rest uit de momentopname.
 */
export function ProductView({
  product: basis,
  info,
  lineHref,
  lineCount,
  maatwerk,
}: {
  product: Product;
  info: ReactNode;
  lineHref?: string;
  lineCount: number;
  /** Afdeling: wel of geen op-maatverhaal (lib/site/maatwerk.ts). */
  maatwerk: Maatwerk;
}) {
  const cart = useCart();
  const { announceAdded } = useCartUi();
  const { track } = useRecentlyViewed();

  // Live beschikbaarheid over de momentopname leggen (valt stil terug op de momentopname).
  const { map: live } = useProducts([basis.id], { live: true });
  const liveVarianten = live.get(basis.id)?.variants;
  const product = useMemo<Product>(() => {
    if (!liveVarianten) return basis;
    const status = new Map(liveVarianten.map((v) => [v.id, v.availability]));
    return { ...basis, variants: basis.variants.map((v) => ({ ...v, availability: status.get(v.id) ?? v.availability })) };
  }, [basis, liveVarianten]);

  const [variantId, setVariantId] = useState(() => (basis.variants.find((v) => v.availability !== "uitverkocht") ?? basis.variants[0]).id);
  const variant: Variant = variantById(product, variantId) ?? product.variants[0];
  const [qty, setQty] = useState(product.quantity.min);
  const [drawer, setDrawer] = useState<ProductOption | null>(null);
  const [error, setError] = useState("");
  /** Melding wanneer een keuze een andere optie mee moest wijzigen (combinatie bestaat niet, B09). */
  const [wissel, setWissel] = useState("");
  const buyRef = useRef<HTMLDivElement>(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => track(basis.id), [basis.id, track]);

  // ?variant=… uit een gedeelde link toepassen (enkel in de browser, zie boven).
  useEffect(() => {
    const gevraagd = new URLSearchParams(window.location.search).get("variant");
    if (gevraagd && variantById(basis, gevraagd)) setVariantId(gevraagd);
  }, [basis]);

  // Ruimte onderaan de pagina zodat de kleverige bestelbalk (mobiel) de footer niet bedekt.
  useEffect(() => {
    document.body.classList.add("has-sticky-buybar");
    return () => document.body.classList.remove("has-sticky-buybar");
  }, []);

  // Kleverige bestelbalk tonen zodra de hoofdknop uit beeld is.
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    // Bovenmarge = kleverige header: een knop die onder de header schuift telt als "uit beeld".
    const headerH = Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h"), 10) || 110;
    const io = new IntersectionObserver(([e]) => setStickyVisible(!e.isIntersecting && e.boundingClientRect.top < headerH), {
      threshold: 0,
      rootMargin: `-${headerH}px 0px 0px 0px`,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const images = useMemo(() => imagesForVariant(product, variant), [product, variant]);
  const unit = variant.price?.unit ?? "stuk";
  const purchasable = isPurchasable(product, variant);

  const choose = (optionName: string, value: string) => {
    const selection = { ...variant.options, [optionName]: value };
    const exact = findVariant(product, selection);
    const next =
      exact ??
      product.variants.find((v) => v.options[optionName] === value && v.availability !== "uitverkocht") ??
      product.variants.find((v) => v.options[optionName] === value);
    if (!next) return;
    setVariantId(next.id);
    setError("");
    // Bestaat de combinatie niet, dan wisselt een andere optie mee: dat zeggen we (B09).
    const gewijzigd = exact ? [] : Object.entries(next.options).filter(([k, v]) => k !== optionName && variant.options[k] !== v);
    setWissel(gewijzigd.length ? `${value} bestaat niet in ${gewijzigd.map(([k]) => `${k.toLowerCase()} ${variant.options[k]}`).join(" en ")}. We kozen ${gewijzigd.map(([k, v]) => `${k.toLowerCase()} ${v}`).join(" en ")}.` : "");
    // Native history: Next houdt de router in sync, zonder nieuwe serveraanvraag.
    const q = new URLSearchParams(window.location.search);
    q.set("variant", next.id);
    window.history.replaceState(null, "", `${window.location.pathname}?${q.toString()}`);
  };

  const add = () => {
    if (!purchasable || !variant.price) {
      setError(variant.availability === "uitverkocht" ? "Deze variant is tijdelijk uitverkocht. Kies een andere maat of kleur." : "Dit product is niet online te koop.");
      return;
    }
    const q = clampQuantity(qty, product.quantity);
    const res = cart.add(product.id, variant.id, q, product.quantity.max);
    if (res.capped) {
      setError(
        `U kunt maximaal ${formatQuantity(product.quantity.max ?? res.quantity)} ${UNIT_NAME[unit].many} van dit product online bestellen. Uw winkelmand bevat er nu ${formatQuantity(res.quantity)}.`,
      );
      return;
    }
    announceAdded({
      title: product.title,
      image: images[0],
      variantLabel: product.options.length ? variantLabel(variant) : undefined,
      quantity: q,
      price: variant.price,
    });
  };

  const buyRow = (compact = false) =>
    product.pricing === "on-request" ? (
      <div className={`flex items-center gap-2 ${compact ? "" : "w-full"}`}>
        <Link href={routes.quote({ product: product.slug, variant: variant.id, naarWinkel: !isOpMaat(maatwerk) })} className={`btn btn-primary ${compact ? "" : "flex-1"}`}>
          Offerte aanvragen
        </Link>
        <WishlistButton productId={product.id} variantId={variant.id} title={product.title} variant="inline" />
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <QuantityInput unit={unit} rule={product.quantity} value={qty} onChange={setQty} compact={compact} />
        <button type="button" onClick={add} disabled={!purchasable} className={`btn btn-primary min-w-0 ${compact ? "px-4 sm:px-6" : "flex-1 px-3"}`}>
          {variant.availability === "uitverkocht" ? "Tijdelijk uitverkocht" : "In winkelmand"}
        </button>
        <WishlistButton productId={product.id} variantId={variant.id} title={product.title} variant="inline" />
      </div>
    );

  return (
    <>
      <div className="grid grid-cols-1 gap-x-10 gap-y-6 [grid-template-areas:'gallery'_'buy'_'info'] lg:grid-cols-[minmax(0,1fr)_400px] lg:[grid-template-areas:'gallery_buy'_'info_buy'] xl:grid-cols-[minmax(0,1fr)_432px] xl:gap-x-12">
        <div className="[grid-area:gallery]">
          <Gallery images={images} title={product.title} />
        </div>

        <aside className="[grid-area:buy]" aria-label="Bestellen">
          <div className="transition-transform duration-200 motion-reduce:transition-none lg:sticky lg:top-[calc(var(--header-h,106px)+16px)] lg:-translate-y-[var(--header-inklap,0px)]">
            {/* Bovenregel: merk · type · collectie; de productnaam is de hoofdtitel (B15). */}
            <p className="text-[13px] font-medium uppercase tracking-wide text-ink-60">
              {[product.brand ?? "Brunic", product.facets.type?.[0]].filter(Boolean).join(" · ")}
            </p>
            <h1 className="mt-1.5 font-display text-[30px] leading-tight lg:text-[36px]">{product.title}</h1>
            {product.line && !product.title.includes(product.line) && <p className="mt-1 text-[15px] text-ink-80">Collectie {product.line}</p>}

            <Price price={variant.price} pricing={product.pricing} size="lg" className="mt-3" />
            {product.pricing === "fixed" && unit !== "stuk" && variant.price && (
              <p className="mt-1 text-[13px] text-ink-60">Prijs per {UNIT_NAME[unit].one} · u kiest hieronder de hoeveelheid in {UNIT_NAME[unit].many}.</p>
            )}

            <p className="mt-5 flex gap-4 text-[15px] font-medium">
              <a href="#beschrijving" className="underline underline-offset-4 hover:no-underline">
                Beschrijving
              </a>
              <a href="#kenmerken" className="underline underline-offset-4 hover:no-underline">
                Kenmerken & afmetingen
              </a>
            </p>

            {product.options.length > 0 && (
              <div className="mt-5 space-y-3">
                {product.options.map((o) => {
                  const current = variant.options[o.name];
                  const sw = o.values.find((v) => v.value === current)?.swatch;
                  return (
                    <button
                      key={o.name}
                      type="button"
                      onClick={() => setDrawer(o)}
                      aria-haspopup="dialog"
                      className="flex min-h-[50px] w-full items-center gap-2 rounded-[var(--radius-pill)] border border-line-strong/60 px-4 text-left text-[15px] transition-colors hover:border-ink"
                    >
                      <span className="font-medium">{o.name}</span>
                      <span aria-hidden="true">:</span>
                      {sw && <span className="size-4 rounded-full ring-1 ring-line-strong/40" style={{ background: sw }} aria-hidden="true" />}
                      <span className="flex-1 truncate text-ink-60">{current}</span>
                      <span className="flex size-6 items-center justify-center rounded-full bg-mist text-xs text-ink-60">{o.values.length}</span>
                      <Icon name="chevronRight" size={20} />
                    </button>
                  );
                })}
                {wissel && (
                  <p role="status" className="flex items-start gap-2 text-[13px] text-ink-80">
                    <Icon name="info" size={18} className="shrink-0" /> {wissel}
                  </p>
                )}
              </div>
            )}

            {product.pricing === "fixed" ? (
              <p className="mt-5 flex flex-wrap items-center gap-2 text-[14px]">
                <span className={`flex items-center gap-2 ${AVAIL_TEXT[variant.availability]}`}>
                  <span className={`size-2 rounded-full ${AVAIL_DOT[variant.availability]}`} aria-hidden="true" />
                  {AVAILABILITY_LABEL[variant.availability]}
                </span>
              </p>
            ) : (
              <p className="mt-5 text-[14px] text-ink-80">
                {isOpMaat(maatwerk)
                  ? "Prijs op aanvraag: de prijs hangt af van uw maten en afwerking. Vraag vrijblijvend een offerte aan — of kom de stalen bekijken in onze winkel."
                  : "Prijs op aanvraag: vraag vrijblijvend een offerte aan — of kom de stalenboeken bekijken in onze winkel."}
              </p>
            )}

            <div ref={buyRef} className="mt-3">
              {buyRow()}
            </div>
            {error && (
              <p role="alert" className="mt-2 text-[13px] text-brand-dark">
                {error}
              </p>
            )}
            {product.pricing === "fixed" && unit !== "stuk" && variant.price && (
              <p className="mt-2 text-[14px]">
                Totaal voor {formatQuantity(clampQuantity(qty, product.quantity))} {UNIT_NAME[unit].many}:{" "}
                <strong>{formatMoney(lineTotal(variant.price.amount.amount, clampQuantity(qty, product.quantity)))}</strong>
                <span className="block text-[12px] text-ink-60">
                  Min. {formatQuantity(product.quantity.min)} {UNIT_NAME[unit].short}, per {formatQuantity(product.quantity.step)} {UNIT_NAME[unit].short}
                </span>
              </p>
            )}

            <div className="mt-4 rounded-[var(--radius-tile)] border border-line p-4">
              <p className="font-medium">Hulp nodig bij uw keuze?</p>
              <p className="mt-1 text-[14px] text-ink-80">
                Bel{" "}
                <a href={SITE.phone.href} className="font-medium underline underline-offset-2">
                  {SITE.phone.display}
                </a>{" "}
                of kom langs in onze winkel in Ninove ({SITE.hoursShort}).
              </p>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-[var(--radius-tile)] bg-mist px-4 py-3 text-[14px]">
              <Icon name={isOpMaat(maatwerk) ? "ruler" : "grid"} size={22} />
              <span>
                {maatwerk === "tapijten" ? (
                  <>
                    Liever een andere afmeting?{" "}
                    <Link href={routes.service("tapijt-op-maat")} className="font-medium underline underline-offset-2">
                      Bekijk tapijt op maat
                    </Link>
                  </>
                ) : isOpMaat(maatwerk) ? (
                  <>
                    {maatwerk === "vloer" ? "Gelegd door onze eigen mensen?" : "Op maat gemaakt en geplaatst?"}{" "}
                    <Link href={routes.measurement()} className="font-medium underline underline-offset-2">
                      Vraag een gratis opmeting aan huis aan
                    </Link>
                  </>
                ) : (
                  <>
                    Liever eerst in het echt zien?{" "}
                    <Link href={routes.store()} className="font-medium underline underline-offset-2">
                      Bekijk de stalenboeken in onze winkel
                    </Link>
                  </>
                )}
              </span>
            </div>

            <p className="mt-5 text-[14px] text-ink-60">Art.nr. {variant.sku}</p>

            {lineHref && lineCount > 1 && (
              <div className="mt-6 flex items-center justify-between gap-4">
                <p className="text-xl font-medium">Collectie {product.line}</p>
                <Link href={lineHref} className="btn btn-outline btn-sm">
                  Alles bekijken <Icon name="chevronRight" size={16} />
                </Link>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 [grid-area:info]">{info}</div>
      </div>

      {/* Kleverige bestelbalk (referentie: onderaan gecentreerd) */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 backdrop-blur transition-transform duration-200 lg:inset-x-auto lg:bottom-4 lg:left-1/2 lg:-translate-x-1/2 lg:rounded-[var(--radius-pill)] lg:border lg:px-3 lg:py-2 lg:shadow-[var(--shadow-pop)] ${
          stickyVisible ? "translate-y-0" : "pointer-events-none translate-y-[150%]"
        }`}
        aria-hidden={!stickyVisible}
        inert={!stickyVisible}
      >
        <div className="flex items-center justify-center">{buyRow(true)}</div>
      </div>

      <Drawer open={drawer !== null} onClose={() => setDrawer(null)} title={drawer ? `Kies: ${drawer.name}` : ""}>
        {drawer && (
          <ul role="list" className="space-y-2 p-4">
            {drawer.values.map((val) => {
              const sel = { ...variant.options, [drawer.name]: val.value };
              const exact = findVariant(product, sel);
              const v = exact ?? product.variants.find((x) => x.options[drawer.name] === val.value);
              const andere = product.options.filter((o) => o.name !== drawer.name).map((o) => o.name.toLowerCase());
              const img = product.images.find((im) => im.optionValue === val.value);
              const selected = variant.options[drawer.name] === val.value;
              return (
                <li key={val.value}>
                  <button
                    type="button"
                    onClick={() => {
                      choose(drawer.name, val.value);
                      setDrawer(null);
                    }}
                    aria-pressed={selected}
                    className={`flex w-full items-center gap-4 rounded-[var(--radius-tile)] border-2 p-3 text-left transition-colors ${
                      selected ? "border-ink bg-mist" : "border-line hover:border-line-strong"
                    }`}
                  >
                    {img ? (
                      <ImageSlot src={img.src} alt="" className="size-16 shrink-0 rounded-xl" />
                    ) : val.swatch ? (
                      <span className="size-10 shrink-0 rounded-full ring-1 ring-line-strong/40" style={{ background: val.swatch }} aria-hidden="true" />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{val.value}</span>
                      {v && !exact ? (
                        <span className="mt-0.5 block text-[13px] text-ink-60">Enkel met een andere {andere.join(" of ")}</span>
                      ) : (
                        v && (
                          <span className={`mt-0.5 block text-[13px] ${AVAIL_TEXT[v.availability]}`}>
                            {product.pricing === "on-request" ? "Op maat" : AVAILABILITY_LABEL[v.availability]}
                          </span>
                        )
                      )}
                    </span>
                    {v?.price && <Price price={v.price} size="sm" />}
                    {selected && <Icon name="check" size={20} />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Drawer>
    </>
  );
}
