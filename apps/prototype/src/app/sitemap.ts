import type { MetadataRoute } from "next";
import { catalog } from "@/lib/catalog/repository";
import { getBrands } from "@/lib/catalog/brands";
import { ARTICLES, INFO_PAGES, SERVICES } from "@/data/content";
import { routes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site/seo";
import { isIndexable } from "@/lib/catalog/product";

/**
 * sitemap.xml: vaste pagina's, categorieën met producten, merken, diensten, artikels en
 * producten mét foto (fotoloze producten blijven noindex tot ze verrijkt zijn — architectuur.md).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tree = await catalog.getTree();
  const products = await catalog.getAllProducts();
  const offers = await catalog.getOffers(1);
  const vast = [
    routes.home(),
    routes.catalog(),
    routes.brands(),
    routes.newArrivals(),
    ...(offers.length ? [routes.offers()] : []),
    routes.services(),
    routes.inspiration(),
    routes.store(),
  ];
  const categorieen = [];
  for (const node of tree.byId.values()) {
    if (!node.hidden && (await catalog.getProductsInCategory(node.id)).length > 0) categorieen.push(routes.category(node));
  }
  return [
    ...vast.map((p) => ({ url: absoluteUrl(p), changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.7 })),
    ...categorieen.map((p) => ({ url: absoluteUrl(p), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...(await getBrands()).map((b) => ({ url: absoluteUrl(routes.brand(b.slug)), changeFrequency: "weekly" as const, priority: 0.5 })),
    ...SERVICES.map((s) => ({ url: absoluteUrl(routes.service(s.slug)), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...ARTICLES.map((a) => ({ url: absoluteUrl(routes.article(a.slug)), lastModified: a.date, changeFrequency: "yearly" as const, priority: 0.5 })),
    ...INFO_PAGES.map((i) => ({ url: absoluteUrl(routes.info(i.slug)), changeFrequency: "yearly" as const, priority: 0.2 })),
    ...products.filter(isIndexable).map((p) => ({ url: absoluteUrl(routes.product(p.slug)), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
