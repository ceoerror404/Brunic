/**
 * Eén ontwerp = één product op de site, ook als het in Shopify over meerdere producten verspreid
 * staat. Zo tellen menu en lijsten ontwerpen, en verschijnt een kleur nooit als apart product
 * naast het ontwerp waar ze bij hoort.
 *
 * 1. Dubbel ingevoerd: alle artikelnummers van een product zitten ook in een ander product van
 *    dezelfde afdeling (Loft79 "6826" = een deel van Artelux "Brooklyn") → enkel het volledigste blijft.
 * 2. Eén ontwerp over meerdere producten: zelfde merk en naam, kleuren als code (Boråstapeter
 *    "Hip Rose" in de collecties Icons en Woodland; Desso "Linon" met één product per kleur) → één
 *    product met alle kleuren. Enkel bij dezelfde afdeling, opties, eenheid en prijswijze, en als geen
 *    kleur dubbel voorkomt. Kleuren als woord (ESTAhome "zwart en goud") tellen niet mee: daar is de
 *    titel een omschrijving die verschillende ontwerpen delen.
 * 3. Delen andere ontwerpen toch dezelfde naam (zie ZELFDE_NAAM_ANDER_ONTWERP), dan komt de
 *    collectie achter de naam: "Fuse B755 – Fuse Create".
 */
import { ZELFDE_NAAM_ANDER_ONTWERP } from "@/data/shopify-bron";
import { normalize } from "./search";
import type { Category, CategoryId, Product } from "./types";

const sleutel = (merk: string | undefined, titel: string) => `${normalize(merk ?? "")}|${normalize(titel).replace(/\s+/g, " ").trim()}`;
const naam = (p: Product) => sleutel(p.brand, p.title);
const ANDER_ONTWERP = new Set(ZELFDE_NAAM_ANDER_ONTWERP.map((x) => sleutel(x.merk, x.titel)));

const kleurOptie = (p: Product) => p.options.find((o) => /kleur|color|colour/i.test(o.name));
const combinatie = (options: Record<string, string>) => Object.entries(options).map(([k, w]) => `${k}=${w}`).sort().join("|");

function groepeer(products: Product[], key: (p: Product) => string): Map<string, Product[]> {
  const out = new Map<string, Product[]>();
  for (const p of products) out.set(key(p), [...(out.get(key(p)) ?? []), p]);
  return out;
}

/** Dubbel ingevoerde producten: hun ID en URL leiden voortaan naar het volledigste. */
function metDubbels(hoofd: Product, dubbels: Product[]): Product {
  return {
    ...hoofd,
    aliases: [...(hoofd.aliases ?? []), ...dubbels.flatMap((p) => [{ id: p.id, slug: p.slug }, ...(p.aliases ?? [])])],
    categoryIds: [...new Set([hoofd, ...dubbels].flatMap((p) => p.categoryIds))],
  };
}

/** Eén product met de kleuren, beelden en categorieën van alle delen. */
function voegSamen(hoofd: Product, rest: Product[]): Product {
  const alle = [hoofd, ...rest];
  const options = hoofd.options.map((o) => {
    const values = [...o.values];
    for (const p of rest) for (const v of p.options.find((x) => x.name === o.name)?.values ?? []) if (!values.some((x) => x.value === v.value)) values.push(v);
    return { ...o, values };
  });
  // Een beeld zonder kleur hoort bij de enige kleur van zijn product (Desso Linon: één product per kleur).
  const images = alle.flatMap((p) => {
    const kleuren = kleurOptie(p)?.values ?? [];
    return kleuren.length === 1 ? p.images.map((i) => (i.optionValue ? i : { ...i, optionValue: kleuren[0].value })) : p.images;
  });
  const facets: Record<string, string[]> = {};
  for (const p of alle) for (const [k, v] of Object.entries(p.facets)) facets[k] = [...new Set([...(facets[k] ?? []), ...v])];
  const lijnen = [...new Set(alle.map((p) => p.line).filter((l): l is string => Boolean(l)))];
  const datums = alle.map((p) => p.createdAt).sort();
  const wijzigingen = alle.map((p) => p.updatedAt).filter((d): d is string => Boolean(d)).sort();
  return {
    ...metDubbels(hoofd, rest),
    line: lijnen.length ? lijnen.join(" / ") : undefined,
    images,
    options,
    variants: alle.flatMap((p) => p.variants),
    description: hoofd.description || rest.find((p) => p.description)?.description || "",
    facets,
    badges: [...new Set(alle.flatMap((p) => p.badges))],
    createdAt: datums[0],
    updatedAt: wijzigingen[wijzigingen.length - 1],
    popularity: Math.max(...alle.map((p) => p.popularity)),
  };
}

export function eenProductPerOntwerp(products: Product[], categories: Category[]): Product[] {
  const ouder = new Map(categories.map((c) => [c.id, c.parentId]));
  const afdeling = (p: Product): CategoryId => {
    let id = p.primaryCategoryId;
    for (let o = ouder.get(id); o; o = ouder.get(id)) id = o;
    return id;
  };

  // 1. Dubbel ingevoerd. Grootste eerst: het product met de meeste varianten blijft.
  const opGrootte = [...products].sort((a, b) => b.variants.length - a.variants.length || a.createdAt.localeCompare(b.createdAt) || a.slug.localeCompare(b.slug));
  const bijSku = new Map<string, Product>();
  const dubbels = new Map<Product, Product[]>();
  for (const p of opGrootte) {
    const q = p.variants[0] && bijSku.get(p.variants[0].sku);
    if (q && afdeling(q) === afdeling(p) && p.variants.every((v) => bijSku.get(v.sku) === q)) {
      dubbels.get(q)!.push(p);
      continue;
    }
    dubbels.set(p, []);
    for (const v of p.variants) if (!bijSku.has(v.sku)) bijSku.set(v.sku, p);
  }
  const uniek = products.filter((p) => dubbels.has(p)).map((p) => (dubbels.get(p)!.length ? metDubbels(p, dubbels.get(p)!) : p));

  // 2. Eén ontwerp over meerdere producten.
  const kanSamen = (groep: Product[]) => {
    const [a] = groep;
    const opties = (p: Product) => p.options.map((o) => o.name).sort().join("|");
    const gezien = new Set<string>();
    return groep.every((p) => {
      const kleur = kleurOptie(p);
      const ok =
        kleur?.values.every((v) => /\d/.test(v.value)) &&
        afdeling(p) === afdeling(a) &&
        opties(p) === opties(a) &&
        p.pricing === a.pricing &&
        p.facets.eenheid?.[0] === a.facets.eenheid?.[0] &&
        p.variants.every((v) => !gezien.has(combinatie(v.options)));
      for (const v of p.variants) gezien.add(combinatie(v.options));
      return ok;
    });
  };
  const perNaam = groepeer(uniek, naam);
  const ontwerpen = uniek.flatMap((p) => {
    const groep = perNaam.get(naam(p))!;
    if (groep.length < 2 || ANDER_ONTWERP.has(naam(p)) || !kanSamen(groep)) return [p];
    const opDatum = [...groep].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.slug.localeCompare(b.slug));
    // De kortste URL blijft: zonder het achtervoegsel ("-woodland") dat Shopify aan latere producten met dezelfde naam gaf.
    const hoofd = opDatum.reduce((a, b) => (b.slug.length < a.slug.length ? b : a));
    return p === hoofd ? [voegSamen(hoofd, opDatum.filter((x) => x !== hoofd))] : [];
  });

  // 3. Andere ontwerpen met dezelfde naam: de collectie erbij.
  const nogDubbel = groepeer(ontwerpen, naam);
  return ontwerpen.map((p) => {
    const groep = nogDubbel.get(naam(p))!;
    const onderscheidt = groep.length > 1 && new Set(groep.map((x) => x.line)).size > 1;
    return onderscheidt && p.line && !normalize(p.title).includes(normalize(p.line)) ? { ...p, title: `${p.title} – ${p.line}` } : p;
  });
}
