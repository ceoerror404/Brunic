/**
 * Opbouw van de homepage. Tegels en campagnes verwijzen naar stabiele categorie-ID's,
 * productslugs of artikelslugs: naam, URL en (waar niet opgegeven) beeld komen uit de
 * catalogus. Een categorie of product dat niet (meer) bestaat, valt gewoon weg.
 *
 * Alle beelden zijn sfeerfoto's van onze leveranciers (src/data/beelden.ts); elke foto
 * komt maar één keer voor op de homepage.
 */
import type { CategoryId, ImageRef } from "@/lib/catalog/types";
import { routes } from "@/lib/routes";
import { BEELD } from "./beelden";

/** Waar een tegel naartoe gaat: een categorie, een product, een artikel of een vaste URL. */
export type Doel = { categoryId: CategoryId } | { product: string } | { article: string } | { href: string };

export const HERO = {
  ticket: "Al 40 jaar in Ninove",
  title: "Gordijnen op maat, uit eigen atelier",
  subtitle: "Advies in de winkel, opmeting en plaatsing bij u thuis",
  cta: { label: "Ontdek gordijnen & stoffen", doel: { categoryId: "c05" } as Doel },
  secondary: { label: "Gratis opmeting aanvragen", href: routes.measurement() },
  image: BEELD.hero,
};

/** Kleine tegels onder de afdelingen (de afdelingen zelf = alle zichtbare hoofdcategorieën). */
export const SMALL_TILES: { label: string; doel: Doel; image: ImageRef }[] = [
  { label: "Nieuw binnen", doel: { href: routes.newArrivals() }, image: BEELD.tegelNieuw },
  { label: "Op maat & plaatsing", doel: { href: routes.services() }, image: BEELD.tegelOpMaat },
  { label: "Gratis opmeting aan huis", doel: { href: routes.measurement() }, image: BEELD.dienstOpmeting },
  { label: "Inspiratie & advies", doel: { href: routes.inspiration() }, image: BEELD.tegelInspiratie },
];

export const CAMPAIGNS: { title: string; subtitle: string; cta: string; doel: Doel; image: ImageRef }[] = [
  {
    title: "Stoffen die het verschil maken",
    subtitle: "Van ADO, Artelux en Loft79 — gemaakt in ons atelier",
    cta: "Bekijk de stoffen",
    doel: { categoryId: "c05" },
    image: BEELD.campagneStoffen,
  },
  {
    title: "Behang met karakter",
    subtitle: "Boråstapeter, ESTAhome en Origin: van bloemen tot fotobehang",
    cta: "Bekijk het behang",
    doel: { categoryId: "c02" },
    image: BEELD.campagneBehang,
  },
];

/** "De trends van het moment": elk beeld linkt naar het product of de categorie op de foto. */
export const TRENDS: { title: string; cta: string; doel: Doel; image: ImageRef }[] = [
  { title: "Warm naturel", cta: "Lees de tips", doel: { article: "warme-tinten" }, image: BEELD.trendNaturel },
  { title: "Grafisch & speels", cta: "Bekijk dit behang", doel: { product: "fotobehang-cirkels-in-bauhaus-stijl-roze-okergeel-en-mintgroen-estahome" }, image: BEELD.trendGrafisch },
  { title: "Diep & donker", cta: "Verduisterende stoffen", doel: { categoryId: "s-stoffen-isolerend-verduisterend" }, image: BEELD.trendDiep },
];

/** "Op zoek naar inspiratie?": één tegel per thema van Inspiratie & advies. */
export const INSPIRATION_TILES = [
  { title: "Stijl", href: routes.inspiration("Stijl"), image: BEELD.inspStijl },
  { title: "Kleur", href: routes.inspiration("Kleur"), image: BEELD.inspKleur },
  { title: "Advies", href: routes.inspiration("Advies"), image: BEELD.inspAdvies },
  { title: "Onderhoud", href: routes.inspiration("Onderhoud"), image: BEELD.inspOnderhoud },
];
