/**
 * Compacte weergavemodellen voor kaarten en lijsten. De server mapt een volledig
 * Product naar deze vorm; zo krijgen client-componenten enkel wat ze tonen/filteren.
 */
import type { Availability, ImageRef, Price, Product, ProductBadge } from "./types";
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
  /** Kleurkeuze op de kaart: staal, en wat de kaart toont als dat staal gekozen is. */
  swatches: CardSwatch[];
  /** Totaal aantal kleuren (de kaart toont er max. 4 + "+N"). */
  swatchTotal: number;
};

export type CardSwatch = {
  value: string;
  /** Een bolletje, als de kleur geen vlakke foto heeft. Anders toont de kaart `image` als staal. */
  swatch?: string;
  image?: ImageRef;
  /** De variant achter dit staal: de link opent daarop. */
  variantId?: string;
  /** De prijs bij dit staal. Enkel meegestuurd als die verschilt van de prijs op de kaart. */
  price?: Price | null;
  fromPrice?: boolean;
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
  /** Het eerste beeld op de productpagina van deze variant en het hoverbeeld daarbij. */
  beeld?: ImageRef;
  hover?: ImageRef;
  /** Hoe goed dat beeld is: 0 = bruikbaar, 1 = sfeerfoto, 2 = rolfoto, 3 = geen beeld (fotoTrede). */
  trede: number;
  /** Het beeld toont de bijzondere vorm van deze variant. */
  beeldInVorm: boolean;
};

export type ListingItem = CardProduct & {
  facets: Record<string, string[]>;
  createdAt: string;
  popularity: number;
  varianten: VariantKaart[];
  kleuren: CardSwatch[];
  standaardId?: string;
};

const AVAIL_RANK: Availability[] = ["op-voorraad", "beperkt", "op-bestelling", "uitverkocht"];

/** Liefst beschikbaar en geen staal. */
export function liefstVerkoopbaar(lijst: VariantKaart[]): VariantKaart[] {
  const beschikbaar = lijst.filter((v) => v.availability !== "uitverkocht");
  const verkoopbaar = beschikbaar.filter((v) => !v.staal);
  return verkoopbaar.length ? verkoopbaar : beschikbaar.length ? beschikbaar : lijst;
}

const bedrag = (v: VariantKaart) => v.price?.amount.amount ?? Infinity;

/** De goedkoopste variant uit een lijst, en of "vanaf" erbij hoort. Bij gelijke prijs of op aanvraag: de eerste. */
export function goedkoopste(lijst: VariantKaart[]): { variant: VariantKaart; vanaf: boolean } {
  const prijzen = new Set(lijst.map((v) => v.price?.amount.amount).filter((a) => a !== undefined));
  return { variant: lijst.reduce((a, b) => (bedrag(b) < bedrag(a) ? b : a)), vanaf: prijzen.size > 1 };
}

const zelfdePrijs = (a: Price | null, b: Price | null) => a?.amount.amount === b?.amount.amount && a?.compareAt?.amount === b?.compareAt?.amount;

/**
 * Prijs op een staal, enkel als die iets anders zegt dan de kaart: er staan 48 kaarten per pagina,
 * en bij de meeste producten kost elke kleur evenveel.
 */
export function staalPrijs(prijs: Price | null, vanaf: boolean, kaartPrijs: Price | null, kaartVanaf: boolean): Pick<CardSwatch, "price" | "fromPrice"> {
  const getoond = prijs ?? kaartPrijs;
  return zelfdePrijs(getoond, kaartPrijs) && vanaf === kaartVanaf ? {} : { price: getoond, fromPrice: vanaf };
}

/** Per variant wat de kaart toont: eerste beeld en hoverbeeld, zoals de productpagina. Veel varianten delen ze. */
function variantKaarten(p: Product): VariantKaart[] {
  const ko = kleurOptie(p);
  const waarden = variantWaarden(p);
  const gedeeld = new Map<string, Pick<VariantKaart, "beeld" | "hover" | "trede">>();
  return p.variants.map((v, i) => {
    const kleur = ko ? v.options[ko.name] : undefined;
    // Geen eigen en geen gedeeld beeld: niet terugvallen op een foto van een andere kleur.
    const heeftBeeld = !ko || p.images.some((x) => !x.optionValue || x.optionValue === kleur);
    const eerste = heeftBeeld ? imagesForVariant(p, v)[0] : undefined;
    const sleutel = `${kleur ?? ""}|${eerste?.src ?? ""}`;
    let beelden = gedeeld.get(sleutel);
    if (!beelden) {
      beelden = { beeld: img(eerste), hover: img(hoverVoor(p, kleur, eerste), false), trede: eerste ? fotoTrede(eerste) : 3 };
      gedeeld.set(sleutel, beelden);
    }
    return {
      id: v.id,
      ...(kleur !== undefined ? { kleur } : {}),
      ...(v.vorm ? { vorm: v.vorm } : {}),
      waarden: waarden[i],
      price: v.price,
      availability: v.availability,
      staal: isStaal(v),
      ...beelden,
      beeldInVorm: Boolean(eerste?.vorm && eerste.vorm === v.vorm),
    };
  });
}

/** Per kleur van het product: het staal en wat de kaart toont als dat staal gekozen is. */
function kleurStalen(p: Product, varianten: VariantKaart[]): CardSwatch[] {
  const ko = kleurOptie(p);
  if (!ko) return [];
  const standaard = standaardVariant(p);
  const kaartPrijs = lowestPrice(p);
  const kaartVanaf = hasPriceRange(p);
  return ko.values.map((waarde) => {
    const keuze = liefstVerkoopbaar(varianten.filter((v) => v.kleur === waarde.value));
    // De kleur van de kaart opent op dezelfde variant als de kaart.
    const variant = keuze.find((v) => v.id === standaard?.id) ?? keuze[0];
    const beeld = variant?.beeld;
    // Staal = kleurcode of (meestal) het kleurbeeld zelf: dan niet dubbel meesturen, de kaart leidt het af.
    const swatch = waarde.swatch?.startsWith("url(") && beeld ? undefined : waarde.swatch;
    const { variant: laagste, vanaf } = keuze.length ? goedkoopste(keuze) : { variant: undefined, vanaf: false };
    return {
      value: waarde.value,
      ...(swatch ? { swatch } : {}),
      image: beeld ? { src: beeld.src, alt: "" } : undefined,
      variantId: variant?.id,
      ...(laagste ? staalPrijs(laagste.price, vanaf, kaartPrijs, kaartVanaf) : {}),
    };
  });
}

export function toCard(p: Product): CardProduct {
  const best = [...p.variants].sort((a, b) => AVAIL_RANK.indexOf(a.availability) - AVAIL_RANK.indexOf(b.availability))[0];
  const color = p.options.find((o) => o.name === "Kleur");
  const standaard = standaardVariant(p);
  const kaart = imagesForVariant(p, standaard)[0];
  const ko = kleurOptie(p);
  return {
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
      ? [...lijstGegevens(p).kleuren].sort((a, b) => Number(b.value === standaard?.options[color.name]) - Number(a.value === standaard?.options[color.name])).slice(0, 4)
      : [],
  };
}

/** Variant- en kleurgegevens per product één keer berekenen: de lijsten vragen ze bij elke aanvraag. */
const LIJST_GEGEVENS = new WeakMap<Product, Pick<ListingItem, "varianten" | "kleuren" | "standaardId">>();
const KAARTEN = new WeakMap<Product, CardProduct>();

function lijstGegevens(p: Product) {
  let g = LIJST_GEGEVENS.get(p);
  if (!g) {
    const varianten = variantKaarten(p);
    g = { varianten, kleuren: kleurStalen(p, varianten), standaardId: standaardVariant(p)?.id };
    LIJST_GEGEVENS.set(p, g);
  }
  return g;
}

function kaartVan(p: Product): CardProduct {
  let k = KAARTEN.get(p);
  if (!k) {
    k = toCard(p);
    KAARTEN.set(p, k);
  }
  return k;
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
  const { varianten, kleuren, standaardId } = lijstGegevens(p);
  return {
    ...kaartVan(p),
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
