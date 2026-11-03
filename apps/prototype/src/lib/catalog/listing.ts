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
import { BIJZONDERE_VORM } from "./product";
import { goedkoopste, liefstVerkoopbaar, staalPrijs, type CardProduct, type ListingItem, type VariantKaart } from "./view";

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
const ENKEL_SERVER = ["facets", "createdAt", "popularity", "varianten", "kleuren", "standaardId"] as const;

function voorBrowser(item: ListingItem): CardProduct {
  const kaart: Partial<ListingItem> = { ...item };
  for (const k of ENKEL_SERVER) delete kaart[k];
  return kaart as CardProduct;
}

/**
 * De toonvariant van een kaart in een gefilterde lijst: beeld, hoverbeeld, prijs, stalen en link komen
 * allemaal uit de variant die aan de gekozen filters voldoet. Het beeld is altijd het eerste beeld op
 * de productpagina van die variant. Elk staal werkt op dezelfde manier, met zijn eigen variant.
 * Zonder variantfilter blijft de kaart zoals ze is (de standaardvariant).
 *
 * `vormLijst`: de lijst gaat over één vorm (categorie Rond, Speciale vormen), ook zonder vormfilter.
 */
function metToonvariant(item: ListingItem, selection: Selection, vormLijst: string | undefined): ListingItem {
  const actief = actieveVariantFilters(selection);
  const vormId = vormLijst ? waardeId(vormLijst) : undefined;
  if (actief.length === 0 && !vormId) return item;

  const voldoet = item.varianten.filter((v) => variantVoldoet(v.waarden, actief));
  const inLijstVorm = (v: VariantKaart) => !vormId || Boolean(v.waarden.vorm?.includes(vormId));
  const inVorm = voldoet.filter(inLijstVorm);
  const kandidaten = inVorm.length ? inVorm : voldoet;
  if (kandidaten.length === 0) return item;

  // Wie geen vorm koos, krijgt liefst een gewone maat, ook als een ronde goedkoper is of eerst staat.
  const vormGekozen = Boolean(vormId || selection.vorm?.length);
  const bijzonder = (v: VariantKaart) => !vormGekozen && BIJZONDERE_VORM.has(v.vorm ?? "");
  /** De variant binnen één kleur: een gewone maat als dat kan, daarvan de goedkoopste. */
  const kies = (lijst: VariantKaart[]) => {
    const keuze = liefstVerkoopbaar(lijst);
    const gewoon = keuze.filter((v) => !bijzonder(v));
    return goedkoopste(gewoon.length ? gewoon : keuze);
  };

  const perKleur = new Map<string | undefined, VariantKaart[]>();
  for (const v of liefstVerkoopbaar(kandidaten)) perKleur.set(v.kleur, [...(perKleur.get(v.kleur) ?? []), v]);
  const standaardKleur = item.varianten.find((v) => v.id === item.standaardId)?.kleur;
  // De beste kleur: eerst een foto in de gekozen vorm, dan het beste eerste beeld, dan een gewone maat, dan de kleur van de standaardvariant.
  const score = (v: VariantKaart) => (vormGekozen && !v.beeldInVorm ? 100 : 0) + v.trede * 10 + (bijzonder(v) ? 5 : 0) + (v.kleur === standaardKleur ? 0 : 1);
  const { variant: toon, vanaf } = [...perKleur.values()].map(kies).reduce((a, b) => (score(b.variant) < score(a.variant) ? b : a));
  const prijs = toon.price ?? item.price;

  // De kleur van de kaart en de gekozen kleuren vooraan: de kaart toont er maar vier.
  const gekozen = new Set(kandidaten.map((v) => v.kleur));
  const plaats = (waarde: string) => (waarde === toon.kleur ? 0 : gekozen.has(waarde) ? 1 : 2);
  const stalen = [...item.kleuren].sort((a, b) => plaats(a.value) - plaats(b.value));

  // Een staal in een andere kleur blijft zo dicht mogelijk bij de keuze: eerst de kleurfilter loslaten, dan de andere filters.
  const zonderKleur = actieveVariantFilters(selection, "kleur");
  const voorKleur = (waarde: string) => {
    const vanKleur = item.varianten.filter((v) => v.kleur === waarde);
    const inFilter = vanKleur.filter((v) => variantVoldoet(v.waarden, actief));
    const andereFilters = vanKleur.filter((v) => variantVoldoet(v.waarden, zonderKleur));
    const lijst = [inFilter.filter(inLijstVorm), inFilter, andereFilters.filter(inLijstVorm), andereFilters, vanKleur.filter(inLijstVorm), vanKleur].find((l) => l.length);
    return lijst ? kies(lijst) : undefined;
  };

  return {
    ...item,
    ...(toon.id !== item.standaardId ? { variantId: toon.id } : {}),
    image: toon.beeld ?? item.image,
    hoverImage: toon.hover,
    price: prijs,
    fromPrice: vanaf,
    availability: toon.availability,
    swatches: item.swatches.length
      ? stalen.slice(0, 4).map(({ value, swatch, image, variantId }) => {
          const staal = voorKleur(value);
          return {
            value,
            ...(swatch ? { swatch } : {}),
            image: staal?.variant.beeld ? { src: staal.variant.beeld.src, alt: "" } : image,
            variantId: staal?.variant.id ?? variantId,
            ...(staal ? staalPrijs(staal.variant.price, staal.vanaf, prijs, vanaf) : {}),
          };
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
