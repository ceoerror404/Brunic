import type { CategoryId } from "@/lib/catalog/types";
import { FACET_BY_KEY } from "@/lib/catalog/filters";
import { CATEGORIES } from "./categories";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  DE FILTERS PER AFDELING — welke filters en in welke volgorde.       ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Eén filtersysteem voor de hele winkel (src/lib/catalog/filters.ts): zelfde componenten,
 * gedrag en namen overal. Hier staat enkel welke filters een afdeling toont. Subcategorieën
 * volgen het profiel van hun hoofdcategorie.
 *
 * Volgorde (overal dezelfde regel):
 *   1. Type en Kleur
 *   2. de twee filters waarmee klanten van die afdeling het vaakst beginnen
 *   3. Prijs en Merk
 *   4. de technische filters van de afdeling
 *   5. Eigenschappen als laatste
 * De eerste zes zichtbare staan op desktop als knop in de filterbalk; alle filters staan in
 * "Alle filters" (en op mobiel in de lade).
 *
 * Een filter zonder bruikbare data in de lijst verschijnt vanzelf niet (Kleur bij de stoffen,
 * Prijs bij etalageproducten); zodra Shopify de waarden heeft, staat hij er zonder codewijziging.
 * Een onbekende sleutel faalt meteen bij het opstarten.
 */
export const FILTERPROFIEL: Record<CategoryId, readonly string[]> = {
  // Behang: klanten vertrekken vanuit het uitzicht (motief, stijl).
  c02: ["type", "kleur", "motief", "stijl", "prijs", "merk", "ruimte", "materiaal", "eigenschappen"],
  // Vloerbekleding: soort vloer, uitzicht en de breedte van de rol (naadloos leggen).
  c04: ["type", "kleur", "look", "rolbreedte", "prijs", "merk", "materiaal", "slijtlaag", "gebruiksklasse", "plaatsing", "poolhoogte", "eigenschappen"],
  // Tapijten: de maat is dé filter (architectuur.md §Datamodel), dan het motief.
  c03: ["type", "kleur", "maat", "motief", "prijs", "merk", "stijl", "vorm", "materiaal", "poolhoogte", "eigenschappen"],
  // Raambekleding (gordijnen & stoffen, raamdecoratie): hoeveel licht er door mag, dan effen of met motief.
  c05: ["type", "kleur", "lichtdoorlatendheid", "motief", "prijs", "merk", "stijl", "materiaal", "stofbreedte", "eigenschappen"],
  c01: ["type", "kleur", "lichtdoorlatendheid", "materiaal", "prijs", "merk", "eigenschappen"],
};

/** Gemengde lijsten (zoeken, aanbiedingen, nieuw binnen, merken) en afdelingen zonder eigen profiel. */
export const FILTERPROFIEL_GEMENGD: readonly string[] = ["categorie", "type", "kleur", "prijs", "merk", "materiaal", "motief", "stijl"];

for (const [id, keys] of Object.entries({ ...FILTERPROFIEL, gemengd: FILTERPROFIEL_GEMENGD })) {
  for (const k of keys) if (!FACET_BY_KEY.has(k)) throw new Error(`[filterprofielen] onbekende filter "${k}" in profiel ${id}`);
}

/** Het profiel van een hoofdcategorie (ID), anders het gemengde. */
export function filterProfiel(hoofdcategorie?: CategoryId): readonly string[] {
  return (hoofdcategorie && FILTERPROFIEL[hoofdcategorie]) || FILTERPROFIEL_GEMENGD;
}

const ID_VAN_SLUG = new Map(CATEGORIES.filter((c) => c.parentId === null).map((c) => [c.slug, c.id]));

/** Profiel via de slug van de hoofdcategorie (de waarde van de filter `categorie`). */
export function filterProfielVoorSlug(slug: string | undefined): readonly string[] {
  return filterProfiel(slug ? ID_VAN_SLUG.get(slug) : undefined);
}
