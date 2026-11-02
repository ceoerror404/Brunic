import type { CategoryTree } from "./tree";
import { ancestry } from "./tree";
import type { CategoryNode, Product } from "./types";

/** Kleine letters, zonder accenten — "Plissé" vindt ook "plisse". */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function tokens(q: string): string[] {
  return normalize(q)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
}

/**
 * Eenvoudige zoekfunctie over de catalogus (in het geheugen): elk zoekwoord moet voorkomen in titel,
 * merk, lijn, categorienamen, artikelnummers of filterwaarden. Scoring: treffers in
 * de titel wegen zwaarder. Later vervangen door Shopify Search / een zoekindex.
 */
export function searchProducts(products: Product[], tree: CategoryTree, query: string): Product[] {
  const qs = tokens(query);
  if (qs.length === 0) return [];

  const scored: { p: Product; score: number }[] = [];
  for (const p of products) {
    const title = normalize(p.title);
    const catNames = p.categoryIds.flatMap((id) => ancestry(tree, id).map((c) => c.name)).join(" ");
    const haystack = normalize(
      [
        p.title,
        p.brand,
        p.merkBron,
        p.line,
        catNames,
        ...p.variants.map((v) => v.sku),
        ...Object.values(p.facets).flat(),
        ...p.options.flatMap((o) => o.values.map((v) => v.value)),
      ]
        .filter(Boolean)
        .join(" "),
    );
    if (!qs.every((t) => haystack.includes(t))) continue;
    const score = qs.reduce((s, t) => s + (title.includes(t) ? 3 : 1), 0) + p.popularity / 100;
    scored.push({ p, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((x) => x.p);
}

/** Categorieën waarvan de naam het zoekwoord bevat (voor de suggestielijst). */
export function searchCategories(tree: CategoryTree, query: string, limit = 6): CategoryNode[] {
  const qs = tokens(query);
  if (qs.length === 0) return [];
  return [...tree.byId.values()]
    .filter((c) => !c.hidden)
    .filter((c) => {
      const hay = normalize(ancestry(tree, c.id).map((a) => a.name).join(" "));
      return qs.every((t) => hay.includes(t));
    })
    .sort((a, b) => a.depth - b.depth)
    .slice(0, limit);
}
