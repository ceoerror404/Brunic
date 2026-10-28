/**
 * Productlijst op de server (B11): filteren, sorteren, facettellingen en paginering gebeuren
 * hier, op de volledige lijst in het geheugen. De browser krijgt enkel de getoonde producten
 * (pagina × PAGE_SIZE) en de filtergroepen met hun aantallen — niet meer de hele categorie.
 *
 * De toestand staat in de URL (?kleur=…&sorteer=…&pagina=2); een filterklik navigeert
 * client-side en de pagina rendert opnieuw op de server.
 */
import { filterProfielVoorSlug } from "@/data/filterprofielen";
import { applyFilters, facetGroups, PAGE_SIZE, parseListState, sortItems, waardeId, type FacetGroup, type FacetLabelMap, type ListState, type Selection } from "./filters";
import type { CardProduct, ListingItem } from "./view";

export type ListingData = {
  /** De getoonde producten: de eerste `state.page × PAGE_SIZE` na filter + sortering. */
  items: CardProduct[];
  /** Aantal producten na filters (vóór paginering). */
  total: number;
  groups: FacetGroup[];
  /** Enkel filters van het profiel: een filter die niet getoond wordt, filtert ook niet. */
  state: ListState;
  /** Zijn er producten met een actieprijs in de (ongefilterde) lijst? */
  hasOffers: boolean;
};

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

export function toUrlParams(sp: SearchParamsRecord): URLSearchParams {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) v.forEach((x) => out.append(k, x));
    else if (v !== undefined) out.set(k, v);
  }
  return out;
}

/** Wat enkel de server nodig heeft (filteren, sorteren, vorm-foto's): niet naar de browser. */
const ENKEL_SERVER = ["vormen", "facets", "createdAt", "popularity"] as const;

/** Kaart in de gevraagde vorm (ronde tapijten → de ronde foto), zonder de velden van ENKEL_SERVER. */
function inVorm(listingItem: ListingItem, vorm: string | undefined): CardProduct {
  const kaart: Partial<ListingItem> = { ...listingItem };
  for (const k of ENKEL_SERVER) delete kaart[k];
  const card = kaart as CardProduct;
  // Vergelijken op waarde-ID: de vormfilter staat in de URL als "rond", de vorm-foto's heten "Rond".
  const v = vorm ? Object.entries(listingItem.vormen ?? {}).find(([naam]) => waardeId(naam) === waardeId(vorm))?.[1] : undefined;
  if (!v) return card;
  return {
    ...card,
    image: v.image ?? card.image,
    swatches: card.swatches.map((s) => (v.perKleur[s.value] ? { ...s, image: v.perKleur[s.value] } : s)),
  };
}

/**
 * Zonder opgegeven profiel: zit de hele lijst in één afdeling (een merk, een zoekopdracht),
 * dan het profiel van die afdeling; anders het gemengde.
 */
function profielVan(all: ListingItem[]): readonly string[] {
  const afdelingen = new Set(all.flatMap((i) => i.facets.categorie ?? []));
  return filterProfielVoorSlug(afdelingen.size === 1 ? [...afdelingen][0] : undefined);
}

/**
 * `vorm`: de lijst gaat over één vorm (categorie Rond, Speciale vormen). Anders telt een vormfilter met één waarde.
 * `profiel`: de filters en hun volgorde (src/data/filterprofielen.ts).
 */
export function buildListing(all: ListingItem[], searchParams: SearchParamsRecord, labels: FacetLabelMap = {}, vorm?: string, profiel?: readonly string[]): ListingData {
  const keys = profiel ?? profielVan(all);
  const parsed = parseListState(toUrlParams(searchParams));
  const selection: Selection = Object.fromEntries(Object.entries(parsed.selection).filter(([k]) => keys.includes(k)));
  const state: ListState = { ...parsed, selection };
  const filtered = sortItems(applyFilters(all, selection, state.offersOnly), state.sort);
  const gekozenVorm = vorm ?? (selection.vorm?.length === 1 ? selection.vorm[0] : undefined);
  return {
    items: filtered.slice(0, state.page * PAGE_SIZE).map((i) => inVorm(i, gekozenVorm)),
    total: filtered.length,
    groups: facetGroups(all, selection, state.offersOnly, labels, keys),
    state,
    hasOffers: all.some((i) => i.badges.includes("aanbieding")),
  };
}
