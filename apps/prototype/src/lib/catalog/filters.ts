/**
 * Filters en sortering voor productlijsten — één systeem voor de hele winkel. Puur (geen
 * React). De server berekent per product alle filterwaarden (`derivedFacetValues`, uit de
 * normalisatielaag in ./facet-normalisatie.ts) en past de selectie toe in
 * lib/catalog/listing.ts; de browser krijgt enkel het resultaat.
 *
 * - FACETS = het register: naam, weergave, volgorde van de waarden en logica per filter.
 * - Welke filters een afdeling toont (en in welke volgorde): src/data/filterprofielen.ts.
 * - Een filter toevoegen = één regel in FACETS + de waarde in `product.facets[key]`
 *   (facet-normalisatie.ts) + de sleutel in de profielen waar hij hoort.
 *
 * In de URL staan stabiele ID's, geen labels (?kleur=grijs,wit&prijs=25-50&sorteer=prijs-op):
 * hoofdletters, accenten en leestekens tellen niet (`waardeId`), zodat ook oude links met
 * labels (?kleur=Grijs) blijven werken. Gefilterde lijsten zijn deelbaar en terug-navigeerbaar.
 *
 * Logica: OF binnen één filter, EN tussen filters (zoals Shopify Search & Discovery);
 * filters met `logica: "en"` (Eigenschappen) eisen elke gekozen waarde.
 */
import { MERK_ONDER } from "@/data/merken";
import type { Product, Variant } from "./types";

/** Een vaste klasse van een getal (prijs, maat…): `value` staat in de URL. */
export type Bucket = { value: string; label: string; min: number; max: number };

export type FacetDef = {
  /** Stabiele sleutel = de URL-parameter. Nooit hernoemen. */
  key: string;
  label: string;
  /** swatch = met kleurbolletje · list = vinkjes · bucket = vaste klassen (`buckets`) in vaste volgorde. */
  kind: "swatch" | "list" | "bucket";
  buckets?: Bucket[];
  /** Vaste volgorde van de waarden (labels); onbekende waarden komen achteraan. */
  volgorde?: string[];
  /** Overige volgorde: alfabetisch (standaard), meest voorkomend eerst (over de hele lijst, dus stabiel) of op getal. */
  sortering?: "alfabet" | "aantal" | "getal";
  /** "en": elke gekozen waarde moet kloppen (eigenschappen). Standaard "of": één gekozen waarde volstaat. */
  logica?: "of" | "en";
};

export const PRICE_BUCKETS: Bucket[] = [
  { value: "0-25", label: "Tot € 25", min: 0, max: 25 },
  { value: "25-50", label: "€ 25 – € 50", min: 25, max: 50 },
  { value: "50-100", label: "€ 50 – € 100", min: 50, max: 100 },
  { value: "100-250", label: "€ 100 – € 250", min: 100, max: 250 },
  { value: "250-plus", label: "Meer dan € 250", min: 250, max: Infinity },
  { value: "op-aanvraag", label: "Prijs op aanvraag", min: NaN, max: NaN },
];

/** Tapijtmaten op breedte (kleinste zijde of diameter): vaste handelsmaten vallen elk in één klasse (architectuur.md §Datamodel). */
export const MAAT_BUCKETS: Bucket[] = [
  { value: "tot-120", label: "Tot 120 cm breed", min: 0, max: 120 },
  { value: "120-170", label: "120 – 170 cm breed", min: 120, max: 170 },
  { value: "170-240", label: "170 – 240 cm breed", min: 170, max: 240 },
  { value: "240-plus", label: "Vanaf 240 cm breed", min: 240, max: Infinity },
];

export const POOLHOOGTE_BUCKETS: Bucket[] = [
  { value: "tot-10", label: "Tot 10 mm", min: 0, max: 10 },
  { value: "10-20", label: "10 – 20 mm", min: 10, max: 20 },
  { value: "20-plus", label: "Vanaf 20 mm", min: 20, max: Infinity },
];

export const STOFBREEDTE_BUCKETS: Bucket[] = [
  { value: "tot-160", label: "Tot 160 cm", min: 0, max: 160 },
  { value: "160-280", label: "160 – 280 cm", min: 160, max: 280 },
  { value: "280-plus", label: "Vanaf 280 cm", min: 280, max: Infinity },
];

export function bucketVoor(buckets: Bucket[], n: number): string | undefined {
  return buckets.find((b) => n >= b.min && n < b.max)?.value;
}

/**
 * Kleurstalen per kleurfamilie, in de volgorde van de kleurfilter (licht → donker, dan meerkleurig).
 * De namen zijn die van de keuzelijst van brunic.kleurfamilie; de filter toont de Nederlandse
 * term (facet-normalisatie.ts: Multicolor → Meerkleurig).
 */
export const SWATCH_COLORS: Record<string, string> = {
  Wit: "#f6f4ef", Ivoor: "#f2ead4", Ecru: "#ece3cf", Beige: "#d8c6a6", Naturel: "#cbb796", Taupe: "#8b7d6b",
  Bruin: "#6c4a2f", Brons: "#8a6a42",
  "Goud/metallic": "linear-gradient(135deg, #8a6a2c, #e9cf7a, #8a6a2c)",
  Geel: "#e3b52b", Oranje: "#d8782c", Rood: "#b3232b", Bordeaux: "#6c1f2d", Roze: "#e5b3bf", Paars: "#6b4f8a",
  Blauw: "#3f5b7d", Turquoise: "#2f9c9a", Groen: "#55703d",
  "Zilver/metallic": "linear-gradient(135deg, #8e8e8c, #e4e4e2, #8e8e8c)",
  Zilver: "#c3c3c1", Grijs: "#9b9a97", Antraciet: "#3b3c3f", Zwart: "#1d1b1a",
  Meerkleurig: "conic-gradient(#d8782c, #3f5b7d, #55703d, #e5b3bf, #d8782c)",
  Multicolor: "conic-gradient(#d8782c, #3f5b7d, #55703d, #e5b3bf, #d8782c)",
};

/** Effen tint voor families die zelf een verloop zijn, als ze maar een deel van een bolletje vullen. */
const EFFEN_DEEL: Record<string, string> = { "Goud/metallic": "#c2a04e", "Zilver/metallic": "#c3c3c1" };

/**
 * Kleurbolletje van een variant: hoofdkleur eerst, dan de accentkleuren. Eén kleur = die kleur;
 * meer kleuren = een verdeeld bolletje (hoofdkleur de linkerhelft, de accenten delen de rechterhelft).
 * Onbekende kleuren tellen niet mee; geen enkele bekende → undefined.
 */
export function kleurStaal(kleuren: string[]): string | undefined {
  const bekend = [...new Set(kleuren)].filter((k) => SWATCH_COLORS[k]);
  if (bekend.length === 0) return undefined;
  // Multicolor is al meerkleurig: accenten erbij maken het niet duidelijker.
  if (bekend.length === 1 || bekend[0] === "Multicolor" || bekend[0] === "Meerkleurig") return SWATCH_COLORS[bekend[0]];
  const delen = bekend.map((k) => EFFEN_DEEL[k] ?? SWATCH_COLORS[k]).filter((c) => c.startsWith("#"));
  if (delen.length === 1) return delen[0];
  const [hoofd, ...accenten] = delen;
  const stap = 50 / accenten.length;
  const stops = [`${hoofd} 0 50%`, ...accenten.map((c, i) => `${c} ${50 + i * stap}% ${50 + (i + 1) * stap}%`)];
  // Vanaf 6 uur met de klok mee: de eerste helft is de linkerhelft.
  return `conic-gradient(from 180deg, ${stops.join(", ")})`;
}

/**
 * Het register. De volgorde hier doet er niet toe: die staat per afdeling in src/data/filterprofielen.ts.
 * Bewust géén filters "Beschikbaarheid" en "Verkocht per": de voorraad wordt in Shopify niet gevolgd
 * (elke variant staat op beschikbaar) en de verkoopeenheid valt bij een deel van de producten terug op
 * "Per stuk" (TODO B08) — een filter erop zou de klant iets beloven dat de data niet waarmaakt.
 */
export const FACETS: FacetDef[] = [
  { key: "categorie", label: "Categorie", kind: "list" },
  { key: "type", label: "Type", kind: "list" },
  { key: "kleur", label: "Kleur", kind: "swatch", volgorde: Object.keys(SWATCH_COLORS) },
  { key: "motief", label: "Motief", kind: "list", sortering: "aantal" },
  { key: "stijl", label: "Stijl", kind: "list", sortering: "aantal" },
  { key: "prijs", label: "Prijs", kind: "bucket", buckets: PRICE_BUCKETS },
  { key: "merk", label: "Merk", kind: "list" },
  { key: "materiaal", label: "Materiaal", kind: "list", sortering: "aantal" },
  {
    key: "lichtdoorlatendheid",
    label: "Lichtdoorlatendheid",
    kind: "list",
    volgorde: ["Transparant", "Semi-transparant", "Gesloten", "Lichtdempend (dim-out)", "Verduisterend (black-out)"],
  },
  { key: "maat", label: "Maat", kind: "bucket", buckets: MAAT_BUCKETS },
  { key: "vorm", label: "Vorm", kind: "list", volgorde: ["Rechthoekig", "Vierkant", "Rond", "Organisch", "Loper"] },
  { key: "look", label: "Look", kind: "list", volgorde: ["Planken", "Tegels", "Steen / beton", "Effen / gespikkeld", "Structuur / dessin"] },
  { key: "rolbreedte", label: "Rolbreedte", kind: "list", sortering: "getal" },
  { key: "stofbreedte", label: "Stofbreedte", kind: "bucket", buckets: STOFBREEDTE_BUCKETS },
  { key: "slijtlaag", label: "Slijtlaag", kind: "list", sortering: "getal" },
  { key: "gebruiksklasse", label: "Gebruiksklasse", kind: "list", sortering: "getal" },
  { key: "poolhoogte", label: "Poolhoogte", kind: "bucket", buckets: POOLHOOGTE_BUCKETS },
  { key: "plaatsing", label: "Plaatsing", kind: "list" },
  { key: "ruimte", label: "Ruimte", kind: "list", sortering: "aantal" },
  { key: "eigenschappen", label: "Eigenschappen", kind: "list", sortering: "aantal", logica: "en" },
];

export const FACET_BY_KEY = new Map(FACETS.map((f) => [f.key, f]));

/** Parameters van vroegere filters: uit de URL halen in plaats van ze eindeloos mee te dragen. */
const VERVALLEN_PARAMS = ["beschikbaarheid", "eenheid"];

const ID_CACHE = new Map<string, string>();

/**
 * Stabiele, URL-veilige sleutel van een filterwaarde: "Goud/metallic" → "goud-metallic",
 * "Boråstapeter" → "borastapeter". Hoofdletters en schrijfwijze tellen dus niet mee.
 */
export function waardeId(s: string): string {
  let id = ID_CACHE.get(s);
  if (id === undefined) {
    id = s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    ID_CACHE.set(s, id);
  }
  return id;
}

const idsVan = (waarden: string[] | undefined) => (waarden ?? []).map(waardeId);

/** Oude links naar een submerk: ?merk=desso toont Tarkett (src/data/merken.ts). */
const MERK_ALIAS: Record<string, string> = Object.fromEntries(Object.entries(MERK_ONDER).map(([van, naar]) => [waardeId(van), waardeId(naar)]));

/**
 * Filters die per variant gelden: een product verschijnt als één variant aan al deze filters samen
 * voldoet. "Grijs + 170–240 cm + € 100–250" vindt dus geen tapijt dat enkel in een andere maat grijs is.
 */
export const VARIANT_FACETS = ["kleur", "maat", "vorm", "prijs"] as const;
export type VariantFacetKey = (typeof VARIANT_FACETS)[number];
/** Waarde-ID's van een variant per variantfilter. */
export type VariantWaarden = Partial<Record<VariantFacetKey, string[]>>;

const isVariantFacet = (key: string): key is VariantFacetKey => (VARIANT_FACETS as readonly string[]).includes(key);

const prijsKlasse = (v: Variant) => (v.price ? (bucketVoor(PRICE_BUCKETS, v.price.amount.amount) ?? "250-plus") : undefined);

/** Alle filterwaarden van een product. Een product zit in elke prijsklasse waarin een van zijn varianten valt. */
export function derivedFacetValues(p: Product): Record<string, string[]> {
  const klassen = p.pricing === "fixed" ? [...new Set(p.variants.map(prijsKlasse).filter((k): k is string => Boolean(k)))] : [];
  return { ...p.facets, prijs: klassen.length ? klassen : ["op-aanvraag"] };
}

/**
 * Filterwaarden per variant, in de volgorde van `p.variants`. Een waarde die enkel op het product staat
 * (bv. een kleurfamilie zonder kleurvariant) geldt voor elke variant: zo blijft de som van de varianten
 * gelijk aan de filterwaarden van het product.
 */
export function variantWaarden(p: Product): VariantWaarden[] {
  const uit: Required<VariantWaarden>[] = p.variants.map((v) => {
    const klasse = p.pricing === "fixed" ? prijsKlasse(v) : undefined;
    return {
      kleur: idsVan(v.kleurfamilies),
      maat: v.maatKlasse ? [v.maatKlasse] : [],
      vorm: v.vorm ? [waardeId(v.vorm)] : [],
      prijs: klasse ? [klasse] : [],
    };
  });
  const product = derivedFacetValues(p);
  for (const key of VARIANT_FACETS) {
    const opVariant = new Set(uit.flatMap((w) => w[key]));
    const erfbaar = idsVan(product[key]).filter((id) => !opVariant.has(id));
    if (erfbaar.length) for (const w of uit) w[key] = [...w[key], ...erfbaar];
  }
  return uit;
}

type ActieveVariantFilter = { key: VariantFacetKey; values: string[] };

/** Voldoet deze variant aan al deze filters? OF binnen een filter, EN tussen de filters. */
export function variantVoldoet(w: VariantWaarden, actief: ActieveVariantFilter[]): boolean {
  return actief.every((f) => f.values.some((id) => w[f.key]?.includes(id)));
}

/** De gekozen variantfilters uit een selectie, eventueel zonder één sleutel. */
export function actieveVariantFilters(selection: Selection, behalve?: string): ActieveVariantFilter[] {
  return VARIANT_FACETS.filter((key) => key !== behalve && (selection[key]?.length ?? 0) > 0).map((key) => ({ key, values: selection[key] }));
}

/** Wat de lijstfuncties van een item nodig hebben. */
export type Filterable = {
  title: string;
  facets: Record<string, string[]>;
  badges: string[];
  createdAt: string;
  popularity: number;
  price: { amount: { amount: number } } | null;
  pricing: "fixed" | "on-request";
  /** Per variant de waarden van de variantfilters. Ontbreekt dit, dan telt het product als geheel. */
  varianten?: { waarden: VariantWaarden }[];
};

/** Gekozen waarde-ID's per filtersleutel. */
export type Selection = Record<string, string[]>;

export const SORTS = [
  { value: "aanbevolen", label: "Aanbevolen" },
  { value: "nieuwste", label: "Nieuwste eerst" },
  { value: "prijs-op", label: "Prijs oplopend" },
  { value: "prijs-af", label: "Prijs aflopend" },
  { value: "naam", label: "Naam (A–Z)" },
] as const;
export type SortKey = (typeof SORTS)[number]["value"];

export type ListState = { selection: Selection; sort: SortKey; offersOnly: boolean; page: number };

/** Producten per "pagina" (meer laden). */
export const PAGE_SIZE = 48;

export function applyFilters<T extends Filterable>(items: T[], selection: Selection, offersOnly: boolean, exceptKey?: string): T[] {
  const actief = Object.entries(selection)
    .filter(([key, values]) => key !== exceptKey && values.length > 0)
    .map(([key, values]) => ({ key, values, en: FACET_BY_KEY.get(key)?.logica === "en" }));
  const opVariant = actieveVariantFilters(selection, exceptKey);
  return items.filter((p) => {
    if (offersOnly && !p.badges.includes("aanbieding")) return false;
    const perVariant = opVariant.length > 0 && Boolean(p.varianten?.length);
    for (const f of actief) {
      if (perVariant && isVariantFacet(f.key)) continue;
      const pv = idsVan(p.facets[f.key]);
      if (f.en ? !f.values.every((v) => pv.includes(v)) : !f.values.some((v) => pv.includes(v))) return false;
    }
    return !perVariant || p.varianten!.some((v) => variantVoldoet(v.waarden, opVariant));
  });
}

/** De waarden van een filter om te tellen: bij een variantfilter enkel die van de varianten die aan de andere variantfilters voldoen. */
function waardenVoorTelling(p: Filterable, key: string, selection: Selection): string[] {
  const andere = isVariantFacet(key) && p.varianten?.length ? actieveVariantFilters(selection, key) : [];
  if (!andere.length) return idsVan(p.facets[key]);
  return p.varianten!.filter((v) => variantVoldoet(v.waarden, andere)).flatMap((v) => v.waarden[key as VariantFacetKey] ?? []);
}

const priceOf = (p: Filterable) => (p.pricing === "fixed" && p.price ? p.price.amount.amount : null);

export function sortItems<T extends Filterable>(items: T[], sort: SortKey): T[] {
  const list = [...items];
  // Producten zonder prijs (op aanvraag) altijd achteraan bij prijssortering.
  const byPrice = (dir: 1 | -1) => (a: T, b: T) => {
    const pa = priceOf(a);
    const pb = priceOf(b);
    if (pa === null && pb === null) return 0;
    if (pa === null) return 1;
    if (pb === null) return -1;
    return (pa - pb) * dir;
  };
  switch (sort) {
    case "nieuwste":
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "prijs-op":
      return list.sort(byPrice(1));
    case "prijs-af":
      return list.sort(byPrice(-1));
    case "naam":
      return list.sort((a, b) => a.title.localeCompare(b.title, "nl"));
    default:
      return list.sort((a, b) => b.popularity - a.popularity);
  }
}

/** `value` = waarde-ID (in de URL), `label` = wat de klant leest. */
export type FacetOption = { value: string; label: string; count: number; swatch?: string };
export type FacetGroup = { def: FacetDef; options: FacetOption[] };

const getal = (s: string) => Number(s.match(/\d+(?:[.,]\d+)?/)?.[0].replace(",", ".") ?? NaN);

function sorteerOpties(def: FacetDef, options: FacetOption[], universum: Map<string, { n: number }>): FacetOption[] {
  const alfabet = (a: FacetOption, b: FacetOption) => a.label.localeCompare(b.label, "nl");
  if (def.buckets) {
    const order = def.buckets.map((b) => b.value);
    return options.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
  }
  if (def.volgorde) {
    const plaats = (o: FacetOption) => {
      const i = def.volgorde!.indexOf(o.label);
      return i === -1 ? Infinity : i;
    };
    return options.sort((a, b) => plaats(a) - plaats(b) || alfabet(a, b));
  }
  if (def.sortering === "aantal") return options.sort((a, b) => (universum.get(b.value)?.n ?? 0) - (universum.get(a.value)?.n ?? 0) || alfabet(a, b));
  if (def.sortering === "getal") return options.sort((a, b) => getal(a.label) - getal(b.label) || alfabet(a, b));
  return options.sort(alfabet);
}

/**
 * Beschikbare waarden per filter met aantallen, in de volgorde van `keys` (het filterprofiel).
 * De telling van een OF-filter houdt rekening met de ándere actieve filters (zo ziet u wat een
 * extra keuze oplevert); bij een EN-filter ook met de eigen keuzes. Waarden zonder resultaat
 * verdwijnen, gekozen waarden blijven altijd staan. Een filter verschijnt enkel als hij de lijst
 * kan verkleinen — één waarde die elk product heeft, helpt niemand.
 */
export function facetGroups<T extends Filterable>(
  items: T[],
  selection: Selection,
  offersOnly: boolean,
  labels: FacetLabelMap = {},
  keys: readonly string[] = FACETS.map((f) => f.key),
): FacetGroup[] {
  const out: FacetGroup[] = [];
  for (const key of keys) {
    const def = FACET_BY_KEY.get(key);
    if (!def) continue;
    const chosen = selection[key] ?? [];

    // Over de hele (ongefilterde) lijst: schrijfwijze per ID en hoe vaak de waarde voorkomt.
    const universum = new Map<string, { label: string; n: number }>();
    for (const p of items) {
      for (const v of new Set(p.facets[key] ?? [])) {
        const id = waardeId(v);
        const u = universum.get(id);
        if (u) u.n++;
        else universum.set(id, { label: v, n: 1 });
      }
    }
    const nuttig = [...universum.values()].some((u) => u.n < items.length);
    if (!nuttig && chosen.length === 0) continue;

    const base = applyFilters(items, selection, offersOnly, def.logica === "en" ? undefined : key);
    const counts = new Map<string, number>();
    for (const p of base) for (const id of new Set(waardenVoorTelling(p, key, selection))) counts.set(id, (counts.get(id) ?? 0) + 1);
    for (const v of chosen) if (!counts.has(v)) counts.set(v, 0);
    // Na een keuze kan een filter geen enkele waarde meer hebben: dan geen lege knop tonen.
    if (counts.size === 0) continue;

    const options: FacetOption[] = [...counts.entries()].map(([value, count]) => {
      const label = labelFor(key, value, labels, universum.get(value)?.label);
      return { value, count, label, swatch: def.kind === "swatch" ? SWATCH_COLORS[label] : undefined };
    });
    out.push({ def, options: sorteerOpties(def, options, universum) });
  }
  return out;
}

/** Optionele labels per filter (bv. categorie-slug → naam). */
export type FacetLabelMap = Record<string, Record<string, string>>;

/** Label van een waarde-ID: opgegeven label, klasse (prijs, maat…), de schrijfwijze uit de data, anders het ID. */
export function labelFor(key: string, value: string, labels: FacetLabelMap = {}, uitData?: string): string {
  return labels[key]?.[value] ?? FACET_BY_KEY.get(key)?.buckets?.find((b) => b.value === value)?.label ?? uitData ?? value;
}

/* ---------------- URL ⇄ toestand ---------------- */

const LIST_PARAMS = new Set(["sorteer", "pagina", "aanbieding", ...VERVALLEN_PARAMS, ...FACETS.map((f) => f.key)]);

export function parseListState(params: URLSearchParams): ListState {
  const selection: Selection = {};
  for (const def of FACETS) {
    const raw = params.get(def.key);
    if (raw) {
      // ID's, maar ook labels (oude links, ?categorie=Behang): waardeId maakt er hetzelfde van.
      const vals = [...new Set(raw.split(",").map(waardeId).filter(Boolean).map((v) => (def.key === "merk" ? (MERK_ALIAS[v] ?? v) : v)))];
      if (vals.length) selection[def.key] = vals;
    }
  }
  const sortRaw = params.get("sorteer");
  const sort = (SORTS.find((s) => s.value === sortRaw)?.value ?? "aanbevolen") as SortKey;
  const page = Math.max(1, Number.parseInt(params.get("pagina") ?? "1", 10) || 1);
  return { selection, sort, offersOnly: params.get("aanbieding") === "1", page };
}

/** Bouwt de querystring; parameters die niet van de lijst zijn (bv. ?q=) blijven staan. */
export function serializeListState(state: ListState, current?: URLSearchParams): string {
  const params = new URLSearchParams();
  if (current) for (const [k, v] of current.entries()) if (!LIST_PARAMS.has(k)) params.set(k, v);
  for (const def of FACETS) {
    const vals = state.selection[def.key];
    if (vals && vals.length) params.set(def.key, vals.join(","));
  }
  if (state.offersOnly) params.set("aanbieding", "1");
  if (state.sort !== "aanbevolen") params.set("sorteer", state.sort);
  if (state.page > 1) params.set("pagina", String(state.page));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function activeFilterCount(state: ListState): number {
  return Object.values(state.selection).reduce((n, v) => n + v.length, 0) + (state.offersOnly ? 1 : 0);
}
