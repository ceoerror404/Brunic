/**
 * Productlijst op de server (B11): filteren, sorteren, facettellingen en paginering gebeuren
 * hier, op de volledige lijst in het geheugen. De browser krijgt enkel de getoonde producten
 * (pagina × PAGE_SIZE) en de filtergroepen met hun aantallen — niet meer de hele categorie.
 *
 * De toestand staat in de URL (?kleur=…&sorteer=…&pagina=2); een filterklik navigeert
 * client-side en de pagina rendert opnieuw op de server.
 */
import { filterProfielVoorSlug } from "@/data/filterprofielen";
import {
  actieveVariantFilters,
  applyFilters,
  facetGroups,
  PAGE_SIZE,
  parseListState,
  sortItems,
  variantVoldoet,
  waardeId,
  type FacetGroup,
  type FacetLabelMap,
  type ListState,
  type Selection,
} from "./filters";
import type { CardProduct, ListingItem, VariantKaart } from "./view";

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

/** Wat enkel de server nodig heeft (filteren, sorteren, toonvariant kiezen): niet naar de browser. */
const ENKEL_SERVER = ["vormen", "facets", "createdAt", "popularity", "varianten", "kleuren", "standaardId"] as const;

function voorBrowser(item: ListingItem): CardProduct {
  const kaart: Partial<ListingItem> = { ...item };
  for (const k of ENKEL_SERVER) delete kaart[k];
  return kaart as CardProduct;
}

const bedrag = (v: VariantKaart) => v.price?.amount.amount ?? Infinity;

/**
 * De toonvariant van een kaart in een gefilterde lijst: beeld, hoverbeeld, prijs, stalen en link komen
 * allemaal uit de variant die aan de gekozen filters voldoet. Zo tonen ze nooit iets anders dan wat de
 * klant koos. Zonder variantfilter blijft de kaart zoals ze is (de standaardvariant).
 *
 * `vormLijst`: de lijst gaat over één vorm (categorie Rond, Speciale vormen), ook zonder vormfilter.
 */
function metToonvariant(item: ListingItem, selection: Selection, vormLijst: string | undefined): ListingItem {
  const actief = actieveVariantFilters(selection);
  const vormId = vormLijst ? waardeId(vormLijst) : undefined;
  if (actief.length === 0 && !vormId) return item;

  const voldoet = item.varianten.filter((v) => variantVoldoet(v.waarden, actief));
  const inVorm = vormId ? voldoet.filter((v) => v.waarden.vorm?.includes(vormId)) : voldoet;
  const kandidaten = inVorm.length ? inVorm : voldoet;
  if (kandidaten.length === 0) return item;

  // Liefst beschikbaar en geen staal.
  const beschikbaar = kandidaten.filter((v) => v.availability !== "uitverkocht");
  const verkoopbaar = beschikbaar.filter((v) => !v.staal);
  const keuze = verkoopbaar.length ? verkoopbaar : beschikbaar.length ? beschikbaar : kandidaten;

  const kleurKaart = new Map(item.kleuren.map((k) => [k.staal.value, k]));
  const vormActief = Boolean(vormId || selection.vorm?.length);
  const vormBeelden = (v: VariantKaart) => (vormActief ? Object.entries(item.vormen ?? {}).find(([naam]) => naam === v.vorm || (vormId && waardeId(naam) === vormId))?.[1] : undefined);
  const standaardKleur = item.varianten.find((v) => v.id === item.standaardId)?.kleur;
  // De beste kleur: eerst een foto in de gekozen vorm, dan het beste eerste beeld, dan de kleur van de standaardvariant.
  const score = (v: VariantKaart) => {
    const metVormFoto = v.kleur !== undefined && vormBeelden(v)?.perKleur[v.kleur];
    return (metVormFoto ? 0 : 100) + (v.kleur === undefined ? 0 : (kleurKaart.get(v.kleur)?.trede ?? 3) * 10) + (v.kleur === standaardKleur ? 0 : 1);
  };
  const beste = keuze.reduce((a, b) => (score(b) < score(a) ? b : a));
  const zelfdeKleur = keuze.filter((v) => v.kleur === beste.kleur);
  const toon = zelfdeKleur.reduce((a, b) => (bedrag(b) < bedrag(a) ? b : a));
  const prijzen = new Set(zelfdeKleur.map((v) => v.price?.amount.amount).filter((a) => a !== undefined));

  const k = toon.kleur !== undefined ? kleurKaart.get(toon.kleur) : undefined;
  const vorm = vormBeelden(toon);
  // In een kleurfilter nooit de vormfoto van een andere kleur.
  const vormFoto = (toon.kleur !== undefined ? vorm?.perKleur[toon.kleur] : undefined) ?? (selection.kleur?.length ? undefined : vorm?.image);
  // De gekozen kleuren vooraan: de kaart toont er maar vier.
  const gekozen = new Set(kandidaten.map((v) => v.kleur));
  const stalen = [...item.kleuren.filter((x) => gekozen.has(x.staal.value)), ...item.kleuren.filter((x) => !gekozen.has(x.staal.value))];
  const eerste = (waarde: string) => keuze.find((v) => v.kleur === waarde) ?? kandidaten.find((v) => v.kleur === waarde);

  return {
    ...item,
    ...(toon.id !== item.standaardId ? { variantId: toon.id } : {}),
    image: vormFoto ?? k?.beeld ?? item.image,
    hoverImage: k ? k.hover : item.hoverImage,
    price: toon.price ?? item.price,
    fromPrice: prijzen.size > 1,
    availability: toon.availability,
    swatches: item.swatches.length
      ? stalen.slice(0, 4).map((x) => {
          const fotoInVorm = vorm?.perKleur[x.staal.value];
          return { ...x.staal, ...(fotoInVorm ? { image: fotoInVorm } : {}), variantId: eerste(x.staal.value)?.id ?? x.staal.variantId };
        })
      : [],
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
  // Eerst de toonvariant, dan sorteren: "prijs oplopend" volgt de prijs die op de kaart staat.
  const filtered = sortItems(applyFilters(all, selection, state.offersOnly).map((i) => metToonvariant(i, selection, vorm)), state.sort);
  return {
    items: filtered.slice(0, state.page * PAGE_SIZE).map(voorBrowser),
    total: filtered.length,
    groups: facetGroups(all, selection, state.offersOnly, labels, keys),
    state,
    hasOffers: all.some((i) => i.badges.includes("aanbieding")),
  };
}
