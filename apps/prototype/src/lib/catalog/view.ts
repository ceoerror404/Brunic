/**
 * Compacte weergavemodellen voor kaarten en lijsten. De server mapt een volledig
 * Product naar deze vorm; zo krijgen client-componenten enkel wat ze tonen/filteren.
 */
import type { Availability, ImageRef, Price, Product, ProductBadge } from "./types";
import { lowestPrice, hasPriceRange } from "./product";
import { derivedFacetValues } from "./filters";
import { ancestry, type CategoryTree } from "./tree";
import { compactSrc } from "./cdn";

const img = (i: ImageRef | undefined, alt = true): ImageRef | undefined => (i ? { src: compactSrc(i.src), alt: alt ? i.alt : "" } : undefined);

export type CardProduct = {
  id: string;
  slug: string;
  title: string;
  brand?: string;
  /** Producttype (Gordijnstof, Behang, Vasttapijt …) — titels zijn vaak enkel een modelnaam. */
  type?: string;
  image?: ImageRef;
  hoverImage?: ImageRef;
  badges: ProductBadge[];
  pricing: Product["pricing"];
  price: Price | null;
  fromPrice: boolean;
  availability: Availability;
  /** Kleurkeuze op de kaart: staal, bijhorend beeld en variant (voor de link naar de PDP). */
  swatches: { value: string; swatch?: string; image?: ImageRef; variantId?: string }[];
  /** Totaal aantal kleuren (de kaart toont er max. 4 + "+N"). */
  swatchTotal: number;
  /**
   * Foto's per bijzondere vorm (Rond, Organisch, Loper): in een lijst van ronde tapijten toont de
   * kaart het ronde tapijt. Enkel op de server; buildListing haalt het weg voor de browser.
   */
  vormen?: Record<string, { image?: ImageRef; perKleur: Record<string, ImageRef> }>;
};

/** Subcategorieën waar de kaart de foto in die vorm toont (id = "s-" + Shopify-handle). */
export const VORM_VAN_CATEGORIE: Record<string, string> = {
  "s-tapijten-rond": "Rond",
  "s-tapijten-speciale-vormen": "Organisch",
};

export type ListingItem = CardProduct & {
  facets: Record<string, string[]>;
  createdAt: string;
  popularity: number;
};

const AVAIL_RANK: Availability[] = ["op-voorraad", "beperkt", "op-bestelling", "uitverkocht"];

export function toCard(p: Product): CardProduct {
  const best = [...p.variants].sort((a, b) => AVAIL_RANK.indexOf(a.availability) - AVAIL_RANK.indexOf(b.availability))[0];
  const color = p.options.find((o) => o.name === "Kleur");
  const vormen: NonNullable<CardProduct["vormen"]> = {};
  for (const v of new Set(p.images.map((i) => i.vorm).filter((x): x is string => Boolean(x)))) {
    const metVorm = p.images.filter((i) => i.vorm === v);
    const perKleur: Record<string, ImageRef> = {};
    for (const i of metVorm) if (i.optionValue && !perKleur[i.optionValue]) perKleur[i.optionValue] = img(i, false)!;
    vormen[v] = { image: img(metVorm[0]), perKleur };
  }
  return {
    ...(Object.keys(vormen).length ? { vormen } : {}),
    id: p.id,
    slug: p.slug,
    title: p.title,
    brand: p.brand,
    type: p.facets.type?.[0],
    image: img(p.images[0]),
    // Hover: de sfeerfoto (kamerbeeld), anders een tweede neutrale foto.
    hoverImage: img(p.images.find((i, n) => n > 0 && /\s[–-]\s*sfeerfoto/i.test(i.alt)) ?? (p.images[1] && !p.images[1].optionValue ? p.images[1] : undefined), false),
    badges: p.badges,
    pricing: p.pricing,
    price: lowestPrice(p),
    fromPrice: hasPriceRange(p),
    availability: best?.availability ?? "op-bestelling",
    swatchTotal: color?.values.length ?? 0,
    swatches: color
      ? color.values.slice(0, 4).map((v) => {
          const variants = p.variants.filter((x) => x.options[color.name] === v.value);
          const variant = variants.find((x) => x.availability !== "uitverkocht") ?? variants[0];
          const beeld = p.images.find((x) => x.optionValue === v.value);
          // Staal = kleurcode of (meestal) het kleurbeeld zelf: dan niet dubbel meesturen, de kaart leidt het af.
          const swatch = v.swatch?.startsWith("url(") && beeld ? undefined : v.swatch;
          return { value: v.value, ...(swatch ? { swatch } : {}), image: img(beeld, false), variantId: variant?.id };
        })
      : [],
  };
}

/**
 * `tree` erbij → ook de hoofdcategorie als filterwaarde (voor gemengde lijsten zoals
 * Aanbiedingen). Waarde = slug (stabiel in de URL); het label komt uit `facetLabelsFor`.
 */
export function toListingItem(p: Product, tree?: CategoryTree): ListingItem {
  const facets = derivedFacetValues(p);
  if (tree) {
    facets.categorie = [...new Set(p.categoryIds.map((id) => ancestry(tree, id)[0]?.slug).filter((n): n is string => Boolean(n)))];
  }
  // Lege filterwaarden niet meesturen (lange lijsten: elke byte telt × duizenden producten).
  for (const k of Object.keys(facets)) if (facets[k].length === 0) delete facets[k];
  return {
    ...toCard(p),
    facets,
    createdAt: p.createdAt,
    popularity: p.popularity,
  };
}

/** Leesbare labels voor filterwaarden die geen tekst zijn (hoofdcategorie-slug → naam). */
export type FacetLabels = Record<string, Record<string, string>>;

export function facetLabelsFor(tree: CategoryTree): FacetLabels {
  return { categorie: Object.fromEntries(tree.roots.map((r) => [r.slug, r.name])) };
}
