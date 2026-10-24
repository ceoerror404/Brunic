/**
 * Filters en sortering voor productlijsten. Puur (geen React). De server berekent per
 * product alle filterwaarden (`derivedFacetValues`) en past de selectie toe in
 * lib/catalog/listing.ts; de browser krijgt enkel het resultaat.
 *
 * Een filter toevoegen = één regel in FACETS + de waarde in `product.facets[key]`.
 * Staat in de URL als querystring (?kleur=Grijs,Wit&prijs=25-50&sorteer=prijs-op)
 * zodat gefilterde lijsten deelbaar en terug-navigeerbaar zijn.
 *
 * Later (Shopify): de waarden komen uit Search & Discovery-filters; de logica
 * "OF binnen één filter, EN tussen filters" blijft dezelfde.
 */
import type { Product } from "./types";
import { lowestPrice } from "./product";

export type FacetDef = { key: string; label: string; kind: "swatch" | "list" | "price" };

export const FACETS: FacetDef[] = [
  { key: "categorie", label: "Categorie", kind: "list" },
  { key: "type", label: "Type", kind: "list" },
  { key: "kleur", label: "Kleur", kind: "swatch" },
  { key: "motief", label: "Motief", kind: "list" },
  { key: "stijl", label: "Stijl", kind: "list" },
  { key: "prijs", label: "Prijs", kind: "price" },
  { key: "materiaal", label: "Materiaal", kind: "list" },
  { key: "lichtdoorlatendheid", label: "Lichtdoorlatendheid", kind: "list" },
  { key: "vorm", label: "Vorm", kind: "list" },
  { key: "eenheid", label: "Verkocht per", kind: "list" },
  { key: "merk", label: "Merk", kind: "list" },
  { key: "beschikbaarheid", label: "Beschikbaarheid", kind: "list" },
];

export const PRICE_BUCKETS = [
  { value: "0-25", label: "Tot € 25", min: 0, max: 25 },
  { value: "25-50", label: "€ 25 – € 50", min: 25, max: 50 },
  { value: "50-100", label: "€ 50 – € 100", min: 50, max: 100 },
  { value: "100-250", label: "€ 100 – € 250", min: 100, max: 250 },
  { value: "250-plus", label: "Meer dan € 250", min: 250, max: Infinity },
  { value: "op-aanvraag", label: "Prijs op aanvraag", min: NaN, max: NaN },
];

export const SWATCH_COLORS: Record<string, string> = {
  Grijs: "#9b9a97", Blauw: "#3f5b7d", Wit: "#f6f4ef", Antraciet: "#3b3c3f", Beige: "#d8c6a6", Ecru: "#ece3cf",
  Naturel: "#cbb796", Zwart: "#1d1b1a", Brons: "#8a6a42", Taupe: "#8b7d6b", Zilver: "#c3c3c1", Groen: "#55703d",
  Bruin: "#6c4a2f", Ivoor: "#f2ead4", Oranje: "#d8782c", Bordeaux: "#6c1f2d", Rood: "#b3232b", Roze: "#e5b3bf",
  Meerkleurig: "conic-gradient(#d8782c, #3f5b7d, #55703d, #e5b3bf, #d8782c)",
  // De kleurfamilies zoals ze in Shopify heten (keuzelijst van brunic.kleurfamilie).
  Multicolor: "conic-gradient(#d8782c, #3f5b7d, #55703d, #e5b3bf, #d8782c)",
  Turquoise: "#2f9c9a", Geel: "#e3b52b", Paars: "#6b4f8a",
  "Goud/metallic": "linear-gradient(135deg, #8a6a2c, #e9cf7a, #8a6a2c)",
  "Zilver/metallic": "linear-gradient(135deg, #8e8e8c, #e4e4e2, #8e8e8c)",
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

/** Alle filterwaarden van een product, inclusief de afgeleide (prijs, beschikbaarheid). */
export function derivedFacetValues(p: Product): Record<string, string[]> {
  const lp = lowestPrice(p);
  let prijs = "op-aanvraag";
  if (lp && p.pricing === "fixed") {
    const a = lp.amount.amount;
    prijs = PRICE_BUCKETS.find((b) => a >= b.min && a < b.max)?.value ?? "250-plus";
  }
  let beschikbaarheid = "Tijdelijk uitverkocht";
  if (p.pricing === "on-request") beschikbaarheid = "Op maat";
  else if (p.variants.some((v) => v.availability === "op-voorraad" || v.availability === "beperkt")) beschikbaarheid = "Op voorraad";
  else if (p.variants.some((v) => v.availability === "op-bestelling")) beschikbaarheid = "Op bestelling";
  return { ...p.facets, prijs: [prijs], beschikbaarheid: [beschikbaarheid] };
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
};

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
  return items.filter((p) => {
    if (offersOnly && !p.badges.includes("aanbieding")) return false;
    for (const [key, values] of Object.entries(selection)) {
      if (key === exceptKey || values.length === 0) continue;
      const pv = p.facets[key] ?? [];
      if (!values.some((v) => pv.includes(v))) return false;
    }
    return true;
  });
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

export type FacetOption = { value: string; label: string; count: number; swatch?: string };
export type FacetGroup = { def: FacetDef; options: FacetOption[] };

/**
 * Beschikbare waarden per filter met aantallen. De telling van een filter houdt
 * rekening met de ándere actieve filters (zo ziet u wat een extra keuze oplevert).
 */
export function facetGroups<T extends Filterable>(items: T[], selection: Selection, offersOnly: boolean, labels: FacetLabelMap = {}): FacetGroup[] {
  const out: FacetGroup[] = [];
  for (const def of FACETS) {
    const chosen = selection[def.key] ?? [];
    const base = applyFilters(items, selection, offersOnly, def.key);
    const counts = new Map<string, number>();
    for (const p of base) for (const v of p.facets[def.key] ?? []) counts.set(v, (counts.get(v) ?? 0) + 1);
    for (const v of chosen) if (!counts.has(v)) counts.set(v, 0);

    // Filters met maar één mogelijke waarde over de hele lijst helpen niet.
    const universe = new Set(items.flatMap((p) => p.facets[def.key] ?? []));
    if (universe.size < 2 && chosen.length === 0) continue;

    const options: FacetOption[] = [...counts.entries()].map(([value, count]) => ({
      value,
      count,
      label: labelFor(def.key, value, labels),
      swatch: def.kind === "swatch" ? SWATCH_COLORS[value] : undefined,
    }));
    if (def.kind === "price") {
      const order = PRICE_BUCKETS.map((b) => b.value);
      options.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
    } else {
      options.sort((a, b) => a.label.localeCompare(b.label, "nl"));
    }
    out.push({ def, options });
  }
  return out;
}

/** Optionele labels per filter (bv. categorie-slug → naam). */
export type FacetLabelMap = Record<string, Record<string, string>>;

export function labelFor(key: string, value: string, labels: FacetLabelMap = {}): string {
  if (key === "prijs") return PRICE_BUCKETS.find((b) => b.value === value)?.label ?? value;
  return labels[key]?.[value] ?? value;
}

/* ---------------- URL ⇄ toestand ---------------- */

const LIST_PARAMS = new Set(["sorteer", "pagina", "aanbieding", ...FACETS.map((f) => f.key)]);

export function parseListState(params: URLSearchParams): ListState {
  const selection: Selection = {};
  for (const def of FACETS) {
    const raw = params.get(def.key);
    if (raw) {
      const vals = raw.split(",").map((s) => s.trim()).filter(Boolean);
      // Categoriefilter = slug (altijd kleine letters); ?categorie=Behang werkt dus ook.
      selection[def.key] = def.key === "categorie" ? vals.map((v) => v.toLowerCase()) : vals;
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
