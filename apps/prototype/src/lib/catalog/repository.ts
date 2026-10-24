/**
 * ════════════════════════════════════════════════════════════════════════
 *  AANSLUITPUNT VOOR DE DATABRON
 * ════════════════════════════════════════════════════════════════════════
 * Pagina's en componenten halen catalogusdata UITSLUITEND via `catalog` hieronder.
 *
 * Bron: de Shopify-momentopname die `pnpm prototype:sync` (Storefront API, alleen lezen)
 * schrijft naar .data/shopify-catalogus.json, vertaald door ./shopify-adapter.ts. De build
 * haalt ze automatisch op (zie package.json → prebuild); ontbreekt ze, dan stopt de app met
 * een duidelijke fout in plaats van stilletjes lege of verzonnen producten te tonen.
 *
 * Alles is async, ook al is de bron in het geheugen: zo verandert er niets aan de
 * aanroepers wanneer het later een live netwerk-API wordt.
 */
import { buildCategoryTree, descendantIds, findByPath, ancestry, type CategoryTree } from "./tree";
import type { Category, CategoryId, CategoryNode, Product } from "./types";
import { searchProducts } from "./search";
import { laadShopifyCatalogus, snapshotBestaat, snapshotVersie } from "./shopify-adapter";

export type CatalogRepository = {
  /** Korte omschrijving van de geladen momentopname (logging). */
  source: { info: string };
  getTree(): Promise<CategoryTree>;
  getCategoryByPath(slugs: string[]): Promise<CategoryNode | undefined>;
  getCategoryTrail(id: CategoryId): Promise<CategoryNode[]>;
  /** Producten in de categorie én al haar subcategorieën. */
  getProductsInCategory(id: CategoryId): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductsByIds(ids: string[]): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  getNewArrivals(limit?: number): Promise<Product[]>;
  getOffers(limit?: number): Promise<Product[]>;
  search(query: string): Promise<Product[]>;
};

function createRepository(categories: Category[], products: Product[], source: CatalogRepository["source"]): CatalogRepository {
  const tree = buildCategoryTree(categories);
  // Ook de ID's en URL's van Shopify-producten die in een ontwerp opgingen (lib/catalog/ontwerpen.ts).
  const bySlug = new Map(products.flatMap((p) => [p, ...(p.aliases ?? [])].map((a) => [a.slug, p] as const)));
  const byId = new Map(products.flatMap((p) => [p, ...(p.aliases ?? [])].map((a) => [a.id, p] as const)));

  // Producten die naar een onbekende categorie verwijzen zijn een datafout: meteen melden.
  for (const p of products) {
    for (const cid of p.categoryIds) {
      if (!tree.byId.has(cid)) throw new Error(`Product ${p.id} verwijst naar onbekende categorie ${cid}`);
    }
  }

  const newest = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const inCategory = new Map<CategoryId, Product[]>();

  return {
    source,
    async getTree() {
      return tree;
    },
    async getCategoryByPath(slugs) {
      return findByPath(tree, slugs);
    },
    async getCategoryTrail(id) {
      return ancestry(tree, id);
    },
    async getProductsInCategory(id) {
      let list = inCategory.get(id);
      if (!list) {
        const ids = descendantIds(tree, id);
        list = products.filter((p) => p.categoryIds.some((c) => ids.has(c)));
        inCategory.set(id, list);
      }
      return list;
    },
    async getProductBySlug(slug) {
      return bySlug.get(slug);
    },
    async getProductsByIds(ids) {
      return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
    },
    async getAllProducts() {
      return products;
    },
    async getNewArrivals(limit) {
      const list = newest.filter((p) => p.badges.includes("nieuw"));
      return limit ? list.slice(0, limit) : list;
    },
    async getOffers(limit) {
      const list = products.filter((p) => p.badges.includes("aanbieding")).sort((a, b) => b.popularity - a.popularity);
      return limit ? list.slice(0, limit) : list;
    },
    async search(query) {
      return searchProducts(products, tree, query);
    },
  };
}

function kiesBron(): CatalogRepository {
  if (!snapshotBestaat()) {
    throw new Error("[catalogus] Geen Shopify-momentopname (.data/shopify-catalogus.json). Draai `pnpm prototype:sync` (of de build, die dat zelf doet).");
  }
  const { categories, products, info } = laadShopifyCatalogus();
  console.log(`[catalogus] ${info}`);
  return createRepository(categories, products, { info });
}

/**
 * De geladen catalogus. Wordt opnieuw ingelezen zodra `pnpm prototype:sync` een nieuwe
 * momentopname schreef — lokaal volstaat dan een paginavernieuwing.
 */
let huidig = kiesBron();
let versie = snapshotVersie();
function actueel(): CatalogRepository {
  const nu = snapshotVersie();
  if (nu !== versie) {
    versie = nu;
    huidig = kiesBron();
  }
  return huidig;
}

export const catalog: CatalogRepository = {
  get source() {
    return actueel().source;
  },
  getTree: () => actueel().getTree(),
  getCategoryByPath: (slugs) => actueel().getCategoryByPath(slugs),
  getCategoryTrail: (id) => actueel().getCategoryTrail(id),
  getProductsInCategory: (id) => actueel().getProductsInCategory(id),
  getProductBySlug: (slug) => actueel().getProductBySlug(slug),
  getProductsByIds: (ids) => actueel().getProductsByIds(ids),
  getAllProducts: () => actueel().getAllProducts(),
  getNewArrivals: (limit) => actueel().getNewArrivals(limit),
  getOffers: (limit) => actueel().getOffers(limit),
  search: (query) => actueel().search(query),
};
