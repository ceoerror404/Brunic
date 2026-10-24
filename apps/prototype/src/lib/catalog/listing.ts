/**
 * Productlijst op de server (B11): filteren, sorteren, facettellingen en paginering gebeuren
 * hier, op de volledige lijst in het geheugen. De browser krijgt enkel de getoonde producten
 * (pagina × PAGE_SIZE) en de filtergroepen met hun aantallen — niet meer de hele categorie.
 *
 * De toestand staat in de URL (?kleur=…&sorteer=…&pagina=2); een filterklik doet een
 * router.replace en de pagina rendert opnieuw op de server.
 */
import { applyFilters, facetGroups, PAGE_SIZE, parseListState, sortItems, type FacetGroup, type FacetLabelMap, type ListState } from "./filters";
import type { ListingItem } from "./view";

export type ListingData = {
  /** De getoonde producten: de eerste `state.page × PAGE_SIZE` na filter + sortering. */
  items: ListingItem[];
  /** Aantal producten na filters (vóór paginering). */
  total: number;
  groups: FacetGroup[];
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

/**
 * Kaart in de gevraagde vorm (ronde tapijten → de ronde foto) en zonder de vorm-foto's, die
 * niet naar de browser hoeven.
 */
function inVorm({ vormen, ...item }: ListingItem, vorm: string | undefined): ListingItem {
  const v = vorm ? vormen?.[vorm] : undefined;
  if (!v) return item;
  return {
    ...item,
    image: v.image ?? item.image,
    swatches: item.swatches.map((s) => (v.perKleur[s.value] ? { ...s, image: v.perKleur[s.value] } : s)),
  };
}

/** `vorm`: de lijst gaat over één vorm (categorie Rond, Speciale vormen). Anders telt een vormfilter met één waarde. */
export function buildListing(all: ListingItem[], searchParams: SearchParamsRecord, labels: FacetLabelMap = {}, vorm?: string): ListingData {
  const state = parseListState(toUrlParams(searchParams));
  const filtered = sortItems(applyFilters(all, state.selection, state.offersOnly), state.sort);
  const gekozenVorm = vorm ?? (state.selection.vorm?.length === 1 ? state.selection.vorm[0] : undefined);
  return {
    items: filtered.slice(0, state.page * PAGE_SIZE).map((i) => inVorm(i, gekozenVorm)),
    total: filtered.length,
    groups: facetGroups(all, state.selection, state.offersOnly, labels),
    state,
    hasOffers: all.some((i) => i.badges.includes("aanbieding")),
  };
}
