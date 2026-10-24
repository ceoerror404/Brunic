/**
 * Centrale routegeneratie. Componenten bouwen nooit zelf een URL-string: ze vragen
 * hem hier op. Wijzigt de URL-structuur (bv. bij een keuze voor native Shopify-
 * paden als /collections/… en /products/…), dan verandert enkel dit bestand
 * (+ de mappen onder src/app).
 *
 * Let op: /catalogus/… zijn de URL's van deze site (headless), géén Shopify-URL's.
 */
import type { CategoryNode } from "./catalog/types";

/** Querystring voor een lijstpagina, gefilterd op hoofdcategorie (slug). */
const withCategory = (path: string, categorySlug?: string) =>
  categorySlug ? `${path}?categorie=${encodeURIComponent(categorySlug)}` : path;

export const routes = {
  home: () => "/",
  catalog: () => "/catalogus",
  /** Categorie op elke diepte: /catalogus/behang/effen */
  category: (node: Pick<CategoryNode, "path">) => `/catalogus/${node.path.map(encodeURIComponent).join("/")}`,
  product: (slug: string, variantId?: string) =>
    variantId ? `/product/${encodeURIComponent(slug)}?variant=${encodeURIComponent(variantId)}` : `/product/${encodeURIComponent(slug)}`,
  search: (q?: string) => (q ? `/zoeken?q=${encodeURIComponent(q)}` : "/zoeken"),
  offers: (categorySlug?: string) => withCategory("/aanbiedingen", categorySlug),
  newArrivals: (categorySlug?: string) => withCategory("/nieuw-binnen", categorySlug),
  brands: () => "/merken",
  brand: (slug: string) => `/merken/${encodeURIComponent(slug)}`,
  services: () => "/op-maat-en-plaatsing",
  service: (slug: string) => `/op-maat-en-plaatsing/${encodeURIComponent(slug)}`,
  /** De primaire conversie: opmeting aan huis aanvragen. */
  measurement: () => "/op-maat-en-plaatsing/opmeting-aan-huis#aanvraag",
  /**
   * Offerte voor een product (of de hele verlanglijst): het aanvraagformulier, voorgevuld.
   * Maatwerk (stoffen, tapijt, vasttapijt) gaat naar de opmetingspagina; anders (behang …)
   * naar het contactformulier, want daar hoort geen opmeting aan huis bij.
   */
  quote: (o: { product?: string; variant?: string; wishlist?: boolean; naarWinkel?: boolean }) => {
    const q = new URLSearchParams();
    if (o.product) q.set("product", o.product);
    if (o.variant) q.set("variant", o.variant);
    if (o.wishlist) q.set("verlanglijst", "1");
    return o.naarWinkel ? `/winkel-en-contact?${q.toString()}#formulier` : `/op-maat-en-plaatsing/opmeting-aan-huis?${q.toString()}#aanvraag`;
  },
  inspiration: (topic?: string) => (topic ? `/inspiratie-en-advies?thema=${encodeURIComponent(topic)}` : "/inspiratie-en-advies"),
  article: (slug: string) => `/inspiratie-en-advies/${encodeURIComponent(slug)}`,
  /** Winkel & contact; `section` springt naar "hulp" (FAQ) of "formulier". */
  store: (section?: "hulp" | "formulier") => (section ? `/winkel-en-contact#${section}` : "/winkel-en-contact"),
  wishlist: () => "/verlanglijst",
  cart: () => "/winkelmand",
  info: (slug: string) => `/info/${encodeURIComponent(slug)}`,
} as const;
