/**
 * Compacte weergavemodellen voor kaarten en lijsten. De server mapt een volledig
 * Product naar deze vorm; zo krijgen client-componenten enkel wat ze tonen/filteren.
 */
import type { Availability, ImageRef, Price, Product, ProductBadge, Variant } from "./types";
import { fotoTrede, hasPriceRange, hoverVoor, imagesForVariant, isStaal, kleurOptie, lowestPrice, standaardVariant } from "./product";
import { derivedFacetValues, variantWaarden, type VariantWaarden } from "./filters";
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
  /** De toonvariant als een filter die bepaalt: de link opent dan op die variant. Zonder: de standaardvariant. */
  variantId?: string;
  image?: ImageRef;
  /** Enkel een foto in dezelfde kleur als `image`. */
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

/** Eén variant in een lijst (enkel op de server): waaruit de kaart haar toonvariant kiest. */
export type VariantKaart = {
  id: string;
  kleur?: string;
  vorm?: string;
  waarden: VariantWaarden;
  price: Price | null;
  availability: Availability;
  staal: boolean;
};

/** Wat een kaart toont in één kleur (enkel op de server). */
export type KleurKaart = {
  staal: CardProduct["swatches"][number];
  beeld?: ImageRef;
  hover?: ImageRef;
  /** Hoe goed het eerste beeld is: 0 = bruikbaar, 1 = sfeerfoto, 2 = rolfoto (fotoTrede). */
  trede: number;
};

export type ListingItem = CardProduct & {
  facets: Record<string, string[]>;
  createdAt: string;
  popularity: number;
  varianten: VariantKaart[];
  kleuren: KleurKaart[];
  standaardId?: string;
};

const AVAIL_RANK: Availability[] = ["op-voorraad", "beperkt", "op-bestelling", "uitverkocht"];

/** De variant die een kleur vertegenwoordigt: beschikbaar en geen staal, als dat kan. */
function variantVanKleur(varianten: Variant[]): Variant | undefined {
  return varianten.find((v) => v.availability !== "uitverkocht" && !isStaal(v)) ?? varianten.find((v) => v.availability !== "uitverkocht") ?? varianten[0];
}

/** Per kleur van het product: staal, kaartbeeld en hoverbeeld. */
function kleurKaarten(p: Product): KleurKaart[] {
  const ko = kleurOptie(p);
  if (!ko) return [];
  return ko.values.map((waarde) => {
    const variant = variantVanKleur(p.variants.filter((x) => x.options[ko.name] === waarde.value));
    // Geen eigen en geen gedeeld beeld: niet terugvallen op een foto van een andere kleur.
    const heeftBeeld = p.images.some((i) => !i.optionValue || i.optionValue === waarde.value);
    const eerste = variant && heeftBeeld ? imagesForVariant(p, variant)[0] : undefined;
    // Staal = kleurcode of (meestal) het kleurbeeld zelf: dan niet dubbel meesturen, de kaart leidt het af.
    const swatch = waarde.swatch?.startsWith("url(") && eerste ? undefined : waarde.swatch;
    return {
      staal: { value: waarde.value, ...(swatch ? { swatch } : {}), image: img(eerste, false), variantId: variant?.id },
      beeld: img(eerste),
      hover: img(hoverVoor(p, waarde.value, eerste), false),
      trede: eerste ? fotoTrede(eerste) : 3,
    };
  });
}

export function toCard(p: Product): CardProduct {
  const best = [...p.variants].sort((a, b) => AVAIL_RANK.indexOf(a.availability) - AVAIL_RANK.indexOf(b.availability))[0];
  const color = p.options.find((o) => o.name === "Kleur");
  const standaard = standaardVariant(p);
  const kaart = imagesForVariant(p, standaard)[0];
  const ko = kleurOptie(p);
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
    // Hetzelfde beeld als het eerste op de productpagina: allebei van de standaardvariant.
    image: img(kaart),
    hoverImage: img(hoverVoor(p, ko && standaard ? standaard.options[ko.name] : undefined, kaart), false),
    badges: p.badges,
    pricing: p.pricing,
    price: lowestPrice(p),
    fromPrice: hasPriceRange(p),
    availability: best?.availability ?? "op-bestelling",
    swatchTotal: color?.values.length ?? 0,
    // De kleur van de kaart altijd vooraan: de kaart toont maar vier stalen.
    swatches: color
      ? kleurKaarten(p)
          .sort((a, b) => Number(b.staal.value === standaard?.options[color.name]) - Number(a.staal.value === standaard?.options[color.name]))
          .slice(0, 4)
          .map((k) => k.staal)
      : [],
  };
}

/** Variant- en kleurgegevens per product één keer berekenen: de lijsten vragen ze bij elke aanvraag. */
const LIJST_GEGEVENS = new WeakMap<Product, Pick<ListingItem, "varianten" | "kleuren" | "standaardId"> & { kaart: CardProduct }>();

function lijstGegevens(p: Product) {
  let g = LIJST_GEGEVENS.get(p);
  if (!g) {
    const ko = kleurOptie(p);
    const waarden = variantWaarden(p);
    g = {
      kaart: toCard(p),
      varianten: p.variants.map((v, i) => ({
        id: v.id,
        ...(ko ? { kleur: v.options[ko.name] } : {}),
        ...(v.vorm ? { vorm: v.vorm } : {}),
        waarden: waarden[i],
        price: v.price,
        availability: v.availability,
        staal: isStaal(v),
      })),
      kleuren: kleurKaarten(p),
      standaardId: standaardVariant(p)?.id,
    };
    LIJST_GEGEVENS.set(p, g);
  }
  return g;
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
  const { kaart, varianten, kleuren, standaardId } = lijstGegevens(p);
  return {
    ...kaart,
    facets,
    createdAt: p.createdAt,
    popularity: p.popularity,
    varianten,
    kleuren,
    standaardId,
  };
}

/** Leesbare labels voor filterwaarden die geen tekst zijn (hoofdcategorie-slug → naam). */
export type FacetLabels = Record<string, Record<string, string>>;

export function facetLabelsFor(tree: CategoryTree): FacetLabels {
  return { categorie: Object.fromEntries(tree.roots.map((r) => [r.slug, r.name])) };
}
