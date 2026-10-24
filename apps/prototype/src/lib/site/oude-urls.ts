/**
 * URL's van de oude WooCommerce-site (brunic.be) → de nieuwe site, met een 308 (permanent).
 * Behoudt de vindbaarheid in Google en werkt voor bladwijzers en oude links.
 *
 * - /product/<oude-slug>/ → src/proxy.ts → app/oude-site/product/[slug]: het nieuwe product
 *   (src/data/oude-urls.json, gemaakt door scripts/genereer-oude-urls.mjs), anders de best
 *   passende nieuwe categorie van het oude product, anders de catalogus.
 * - /product-categorie/…/ → app/product-categorie/[...pad]/route.ts (zelfde categoriekoppeling).
 * - Gewone pagina's (/contact/, /privacybeleid/ …) → next.config.ts › redirects().
 *
 * De categoriekoppeling geeft kandidaten in volgorde van voorkeur; bij een bezoek wint de
 * eerste die op dat moment bestaat (een lege categorie zoals Verf bestaat pas zodra Brunic er
 * producten in zet). Zo hoeft er na een nieuwe import niets aangepast te worden.
 */
import oud from "@/data/oude-urls.json";
import { catalog } from "@/lib/catalog/repository";
import { routes } from "@/lib/routes";

type OudProduct = { h?: string; c?: string[] };
const PRODUCTEN = (oud as { producten: Record<string, OudProduct> }).producten;

/** Laatste segment van een oude categorie (bv. "moderne-tapijten") → nieuwe paden, beste eerst. */
const OUDE_CATEGORIE: Record<string, string[]> = {
  // Behang
  behangpapier: ["/catalogus/behang"],
  "behangpapier-effen": ["/catalogus/behang/effen", "/catalogus/behang"],
  "behangpapier-met-print": ["/catalogus/behang"],
  "lijmen-en-toebehoren": ["/catalogus/behang"],
  // Gordijnen & stoffen
  stoffen: ["/catalogus/gordijnen-en-stoffen"],
  "stoffen-stoffen": ["/catalogus/gordijnen-en-stoffen"],
  gordijnen: ["/catalogus/gordijnen-en-stoffen", "/op-maat-en-plaatsing/gordijnen-op-maat"],
  draperieen: ["/catalogus/gordijnen-en-stoffen"],
  voering: ["/catalogus/gordijnen-en-stoffen/isolerend-verduisterend", "/catalogus/gordijnen-en-stoffen"],
  naaigaren: ["/catalogus/gordijnen-en-stoffen/benodigdheden", "/catalogus/gordijnen-en-stoffen"],
  "linten-en-haakjes": ["/catalogus/gordijnen-en-stoffen/benodigdheden", "/catalogus/gordijnen-en-stoffen"],
  kinderstoffen: ["/catalogus/gordijnen-en-stoffen"],
  // Vloerbekleding
  vloerbekleding: ["/catalogus/vloerbekleding"],
  vinylvloeren: ["/catalogus/vloerbekleding/vinyl", "/catalogus/vloerbekleding"],
  "click-vinyl": ["/catalogus/vloerbekleding/vinyl", "/catalogus/vloerbekleding"],
  vasttapijt: ["/catalogus/vloerbekleding/vasttapijt", "/catalogus/vloerbekleding"],
  grastapijt: ["/catalogus/vloerbekleding/grastapijt", "/catalogus/vloerbekleding"],
  "rubber-coco-antivuilmatten": ["/catalogus/vloerbekleding/antivuilmatten", "/catalogus/vloerbekleding/coco", "/catalogus/vloerbekleding/rubber", "/catalogus/vloerbekleding"],
  "benodigdheden-vloerbekleding": ["/catalogus/vloerbekleding/benodigdheden", "/catalogus/vloerbekleding"],
  // Tapijten
  tapijten: ["/catalogus/tapijten"],
  "moderne-tapijten": ["/catalogus/tapijten/modern", "/catalogus/tapijten"],
  "klassieke-tapijten": ["/catalogus/tapijten/klassiek", "/catalogus/tapijten"],
  "buiten-en-binnentapijten": ["/catalogus/tapijten/binnen-buiten", "/catalogus/tapijten"],
  kindertapijten: ["/catalogus/tapijten/kinder", "/catalogus/tapijten"],
  rondetapijten: ["/catalogus/tapijten/rond", "/catalogus/tapijten"],
  "tapijten-op-maat": ["/catalogus/tapijten/op-maat", "/op-maat-en-plaatsing/tapijt-op-maat"],
  logotapijten: ["/catalogus/tapijten/logotapijt", "/catalogus/tapijten"],
  badmatten: ["/catalogus/tapijten/badmatten", "/catalogus/slapen-en-wonen", "/catalogus/tapijten"],
  knoeimatten: ["/catalogus/vloerbekleding/antivuilmatten", "/catalogus/tapijten"],
  schapenvacht: ["/catalogus/tapijten"],
  tapijtloper: ["/catalogus/tapijten"],
  // Raamdecoratie
  "kant-en-klare-rolgordijnen": ["/catalogus/raamdecoratie", "/op-maat-en-plaatsing/raamdecoratie-op-maat"],
  raamdecoratie: ["/catalogus/raamdecoratie", "/op-maat-en-plaatsing/raamdecoratie-op-maat"],
  // Verf
  verf: ["/catalogus/verf"],
  "muur-en-plafondverf": ["/catalogus/verf"],
  "benodigdheden-verf": ["/catalogus/verf"],
  // Slapen & wonen, badkamer, accessoires, home deco
  slaapcomfort: ["/catalogus/slapen-en-wonen"],
  beddengoed: ["/catalogus/slapen-en-wonen"],
  hoofdkussens: ["/catalogus/slapen-en-wonen"],
  matrassen: ["/catalogus/slapen-en-wonen"],
  badkamer: ["/catalogus/slapen-en-wonen"],
  "badhanddoeken-en-washandjes": ["/catalogus/slapen-en-wonen"],
  accessoires: ["/catalogus/slapen-en-wonen"],
  kamerjassen: ["/catalogus/slapen-en-wonen"],
  "home-deco": ["/catalogus/slapen-en-wonen"],
  "plaids-en-kussens": ["/catalogus/slapen-en-wonen"],
  "toile-ciree": ["/catalogus/slapen-en-wonen"],
  // Verlichting zit niet meer in het assortiment: de catalogus (laatste terugval).
};

/** Bestaat dit nieuwe pad nu? Catalogus: in de categorieboom; vaste pagina's gelden als bestaand. */
async function bestaat(pad: string): Promise<boolean> {
  if (!pad.startsWith("/catalogus/")) return true;
  return Boolean(await catalog.getCategoryByPath(pad.slice("/catalogus/".length).split("/")));
}

/** Diepste bestaande kandidaat over alle oude categorieën heen (bv. "Moderne tapijten" vóór "Tapijten"). */
async function besteCategorie(oudeSlugs: string[]): Promise<string> {
  const kandidaten = oudeSlugs.flatMap((s) => (OUDE_CATEGORIE[s] ?? []).map((pad, i) => ({ pad, i })));
  // Eerst de meest specifieke (meeste segmenten), dan de volgorde van voorkeur.
  kandidaten.sort((a, b) => b.pad.split("/").length - a.pad.split("/").length || a.i - b.i);
  for (const { pad } of kandidaten) if (await bestaat(pad)) return pad;
  return routes.catalog();
}

/** Nieuwe URL voor een oude /product/<slug>/, of null als die slug nooit op de oude site stond. */
export async function nieuweUrlVoorOudProduct(slug: string): Promise<string | null> {
  const o = PRODUCTEN[slug];
  if (!o) return null;
  const p = o.h ? await catalog.getProductBySlug(o.h) : undefined;
  if (p) return routes.product(p.slug);
  return besteCategorie(o.c ?? []);
}

/** Nieuwe URL voor /product-categorie/<…>/ (paginering en lege segmenten genegeerd). */
export async function nieuweUrlVoorOudeCategorie(segmenten: string[]): Promise<string> {
  const delen = segmenten.filter(Boolean);
  const p = delen.indexOf("page");
  const zonderPagina = p >= 0 ? delen.slice(0, p) : delen;
  // Van diep naar ondiep: /stoffen/stoffen-stoffen/gordijnen → gordijnen, stoffen-stoffen, stoffen.
  return besteCategorie([...zonderPagina].reverse());
}
