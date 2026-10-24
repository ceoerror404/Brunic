/**
 * Datamodellen van de catalogus. Dit is het contract tussen de datalaag en de
 * componenten: componenten kennen enkel deze types, nooit de bron (de Shopify-adapter
 * in ./shopify-adapter.ts).
 *
 * Bewust Shopify-neutraal gehouden: een Shopify-collectie, -product of -variant laat
 * zich hierop mappen, maar niets hier veronderstelt dat de front een Shopify-thema is.
 */

/* ------------------------------------------------------------------ */
/* Categorieën                                                          */
/* ------------------------------------------------------------------ */

/** Stabiele sleutel. Verandert nooit — ook niet bij hernoemen of verplaatsen. */
export type CategoryId = string;

/**
 * Hoe een categoriepagina zich toont. `auto` kiest zelf:
 * - hoofdcategorie met kinderen → `overview` (tegels + uitgelichte producten)
 * - diepere categorie met kinderen → `mixed` (subcategoriestrook + productlijst)
 * - eindcategorie → `products` (productlijst met filters)
 */
export type CategoryDisplay = "auto" | "overview" | "mixed" | "products";

export type Category = {
  id: CategoryId;
  /** null = hoofdcategorie */
  parentId: CategoryId | null;
  /** Weergavenaam in menu, tegels, kruimelpad en H1. */
  name: string;
  /** Eén URL-segment. Uniek onder dezelfde ouder. */
  slug: string;
  /** Volgorde onder dezelfde ouder (oplopend). */
  order: number;
  /** Eén regel onder de titel op de landingspagina. */
  subtitle?: string;
  /** Korte intro bovenaan de categoriepagina. */
  intro?: string;
  /** Tegelbeeld (categorietegels, megamenu). Ontbreekt → sfeerfoto van een product erin. */
  image?: ImageRef;
  display?: CategoryDisplay;
  /** Niet tonen in menu's, wel bereikbaar via URL. */
  hidden?: boolean;
};

/** Een categorie met haar afgeleide positie in de boom. */
export type CategoryNode = Category & {
  children: CategoryNode[];
  /** 1 = hoofdcategorie */
  depth: number;
  /** Slugs van hoofdcategorie tot en met deze categorie. */
  path: string[];
};

/* ------------------------------------------------------------------ */
/* Beelden                                                              */
/* ------------------------------------------------------------------ */

export type ImageRef = {
  src: string;
  alt: string;
};

/* ------------------------------------------------------------------ */
/* Producten                                                            */
/* ------------------------------------------------------------------ */

/**
 * De eenheid waarin een prijs geldt en waarin de klant een hoeveelheid kiest.
 * Er worden géén omrekeningen tussen eenheden gemaakt (bv. m² uit breedte × lengte):
 * de klant kiest rechtstreeks een aantal in deze eenheid.
 */
export type SalesUnit = "stuk" | "meter" | "m2" | "rol" | "set";

export type Money = {
  /** Bedrag incl. btw, in euro. */
  amount: number;
  currency: "EUR";
};

export type Price = {
  amount: Money;
  /** Doorstreepte vergelijkingsprijs (aanbieding). */
  compareAt?: Money;
  unit: SalesUnit;
};

/**
 * - `fixed`: prijs + winkelmand
 * - `on-request`: maatwerk/etalage — geen prijs, CTA naar advies/opmeting
 */
export type PricingMode = "fixed" | "on-request";

export type QuantityRule = {
  /** Minimale afname in de verkoopeenheid. */
  min: number;
  /** Stapgrootte in de verkoopeenheid. */
  step: number;
  max?: number;
};

export type Availability = "op-voorraad" | "beperkt" | "op-bestelling" | "uitverkocht";

export type ProductImage = ImageRef & {
  /** Hoort dit beeld bij één optiewaarde (bv. Kleur = Grijs)? */
  optionValue?: string;
  /** Vorm van het tapijt op de foto als die niet rechthoekig is ("Rond", "Organisch", "Loper"). */
  vorm?: string;
};

export type OptionValue = {
  value: string;
  /** Kleurstaal voor kleuropties. */
  swatch?: string;
};

export type ProductOption = {
  /** "Kleur", "Maat", "Breedte", … */
  name: string;
  values: OptionValue[];
};

export type Variant = {
  id: string;
  /** Artikelnummer (Shopify SKU = ERP-artikelnummer). */
  sku: string;
  /** Gekozen waarde per optienaam, bv. { Kleur: "Grijs", Maat: "60 × 180 cm" } */
  options: Record<string, string>;
  price: Price | null;
  availability: Availability;
};

export type Spec = { label: string; value: string };

export type ProductBadge = "nieuw" | "aanbieding" | "op-maat";

export type Product = {
  id: string;
  slug: string;
  /**
   * Shopify-producten die in dit product opgingen (zelfde ontwerp, zie lib/catalog/ontwerpen.ts).
   * Hun ID en URL leiden naar dit product.
   */
  aliases?: { id: string; slug: string }[];
  title: string;
  /** Merk / leverancier (Shopify vendor). */
  brand?: string;
  /** Collectie-/lijnnaam, groot getoond op de PDP (zoals de modelnaam bij de referentie). */
  line?: string;
  /** Alle categorieën waarin het product verschijnt (stabiele ID's). */
  categoryIds: CategoryId[];
  /** De categorie die het kruimelpad op de PDP bepaalt. */
  primaryCategoryId: CategoryId;
  pricing: PricingMode;
  quantity: QuantityRule;
  images: ProductImage[];
  options: ProductOption[];
  variants: Variant[];
  /** Korte opsomming "Wat maakt dit product bijzonder". */
  highlights: string[];
  description: string;
  specs: Spec[];
  dimensions: Spec[];
  /** Filterwaarden per facetsleutel (zie lib/catalog/filters.ts). */
  facets: Record<string, string[]>;
  badges: ProductBadge[];
  /** ISO-datum; bepaalt "Nieuw binnen" en sortering op nieuwste. */
  createdAt: string;
  /** ISO-datum van de laatste wijziging in Shopify (lastmod in de sitemap). */
  updatedAt?: string;
  /** Hogere waarde = relevanter bij sorteren op "Aanbevolen". */
  popularity: number;
};

/* ------------------------------------------------------------------ */
/* Winkelmand & verlanglijst                                            */
/* ------------------------------------------------------------------ */

/** Wat lokaal bewaard wordt. Prijzen worden altijd opnieuw uit de catalogus gelezen. */
export type CartLine = {
  productId: string;
  variantId: string;
  /** In de verkoopeenheid van het product (kan decimaal zijn, bv. 2,5 meter). */
  quantity: number;
};

export type WishlistItem = {
  productId: string;
  variantId?: string;
  addedAt: string;
};
