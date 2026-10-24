import type { Doel } from "@/data/home";
import { ARTICLES, INFO_PAGES, SERVICES } from "@/data/content";
import { catalog } from "@/lib/catalog/repository";
import { getBrand } from "@/lib/catalog/brands";
import { routes } from "@/lib/routes";

/**
 * Bestaat de pagina achter een link uit de Shopify-admin (vrije tekst in een metaobject)?
 * Interne links naar een product, categorie, merk, dienst, artikel of infopagina worden
 * gecontroleerd tegen de catalogus; externe links en vaste pagina's gelden als geldig.
 * Zo geeft een tikfout of een intussen verdwenen product geen 404 op de homepage.
 */
export async function bestaatLink(href: string): Promise<boolean> {
  if (!href.startsWith("/")) return true;
  const pad = href.split(/[?#]/)[0];
  const [deel, ...rest] = pad.split("/").filter(Boolean).map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });
  switch (deel) {
    case "product":
      return rest.length === 1 && Boolean(await catalog.getProductBySlug(rest[0]));
    case "catalogus":
      return rest.length === 0 || Boolean(await catalog.getCategoryByPath(rest));
    case "merken":
      return rest.length === 0 || (rest.length === 1 && Boolean(await getBrand(rest[0])));
    case "op-maat-en-plaatsing":
      return rest.length === 0 || SERVICES.some((s) => s.slug === rest[0]);
    case "inspiratie-en-advies":
      return rest.length === 0 || ARTICLES.some((a) => a.slug === rest[0]);
    case "info":
      return rest.length === 1 && INFO_PAGES.some((i) => i.slug === rest[0]);
    default:
      return true;
  }
}

/** Vertaalt een tegeldoel naar een URL; null als de categorie/het product/artikel niet bestaat. */
export async function resolveDoel(doel: Doel): Promise<string | null> {
  if ("href" in doel) return doel.href;
  if ("categoryId" in doel) {
    const node = (await catalog.getTree()).byId.get(doel.categoryId);
    return node ? routes.category(node) : null;
  }
  if ("product" in doel) {
    // De slug van het product zelf: een opgegaan Shopify-product leidt naar zijn ontwerp.
    const p = await catalog.getProductBySlug(doel.product);
    return p ? routes.product(p.slug) : null;
  }
  return ARTICLES.some((a) => a.slug === doel.article) ? routes.article(doel.article) : null;
}
