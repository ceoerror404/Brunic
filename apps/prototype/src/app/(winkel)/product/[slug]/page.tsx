import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { catalog } from "@/lib/catalog/repository";
import type { Product } from "@/lib/catalog/types";
import { visibleChildren } from "@/lib/catalog/tree";
import { toCard } from "@/lib/catalog/view";
import { routes } from "@/lib/routes";
import { isIndexable } from "@/lib/catalog/product";
import { brandSlug, merkVan } from "@/lib/catalog/brands";
import { breadcrumbJsonLd, categoryCrumbs, productJsonLd, productMetaDescription, productMetaTitle } from "@/lib/site/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { maatwerkVoor } from "@/lib/site/maatwerk";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Carousel } from "@/components/ui/carousel";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductView } from "@/components/product/product-view";
import { ProductInfo } from "@/components/product/product-info";
import { UspBand } from "@/components/layout/usp-band";
import { RecentlyViewed } from "@/components/commerce/recently-viewed";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  // ± 2.400 producten (straks 14k): niet vooraf bouwen maar bij het eerste bezoek, daarna gecachet.
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await catalog.getProductBySlug(decodeURIComponent((await params).slug));
  if (!p) return { title: "Product niet gevonden" };
  return {
    title: productMetaTitle(p, await catalog.getAllProducts()),
    description: productMetaDescription(p),
    alternates: { canonical: routes.product(p.slug) },
    openGraph: { images: p.images.slice(0, 1).map((i) => ({ url: `${i.src}${i.src.includes("?") ? "&" : "?"}width=1200`, alt: i.alt })) },
    // Fotoloze producten blijven uit de index tot ze verrijkt zijn (architectuur.md).
    ...(isIndexable(p) ? {} : { robots: { index: false, follow: true } }),
  };
}

/** Afstanden in de rangschikking van de categorie: dichtbij én verder weg, zodat elk product snel bereikbaar is. */
const SPREIDING = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];

/**
 * "Dit vindt u misschien ook leuk": eerst andere ontwerpen uit dezelfde collectie van hetzelfde
 * merk, dan producten uit dezelfde (sub)categorie op gespreide afstand in de rangschikking,
 * aangevuld met de populairste van de afdeling. Vroeger toonde elke productpagina dezelfde tien
 * populairste: ±3.100 van de 4.100 producten kregen zo geen enkele interne link (enkel de
 * sitemap). Nu is elk product via interne links bereikbaar, in hoogstens ±8 klikken.
 */
function ookLeuk(product: Product, all: Product[], afdeling: Product[]): Product[] {
  const opPopulariteit = (a: Product, b: Product) => b.popularity - a.popularity;
  const collectie = product.line ? all.filter((p) => p.line === product.line && p.brand === product.brand && p.id !== product.id).sort(opPopulariteit).slice(0, 4) : [];
  const rij = all.filter((p) => p.primaryCategoryId === product.primaryCategoryId).sort(opPopulariteit);
  const plaats = rij.findIndex((p) => p.id === product.id);
  const gespreid = SPREIDING.filter((k) => k < rij.length).map((k) => rij[(plaats + k) % rij.length]);
  const populair = afdeling
    .filter((p) => p.id !== product.id)
    .sort((a, b) => Number(b.categoryIds.includes(product.primaryCategoryId)) - Number(a.categoryIds.includes(product.primaryCategoryId)) || opPopulariteit(a, b));
  return [...new Map([...collectie, ...gespreid, ...populair].map((p) => [p.id, p])).values()].slice(0, 10);
}

/**
 * Productdetail. Plat pad /product/<slug> (architectuur.md §URL-structuur): het
 * kruimelpad volgt de primaire categorie, niet de URL.
 */
export default async function ProductPage({ params }: Props) {
  // Oude WooCommerce-URL's komen hier niet: src/proxy.ts stuurt ze door (lib/site/oude-urls.ts).
  const product = await catalog.getProductBySlug(decodeURIComponent((await params).slug));
  if (!product) notFound();

  const trail = await catalog.getCategoryTrail(product.primaryCategoryId);
  const primary = trail[trail.length - 1];
  const maatwerk = maatwerkVoor(trail[0]?.id);
  const all = await catalog.getAllProducts();
  const related = ookLeuk(product, all, await catalog.getProductsInCategory(trail[0].id)).map(toCard);
  const lineCount = product.line ? all.filter((p) => p.line === product.line).length : 0;

  // "Ontdek ook" (referentie: "Découvrez aussi"): het kruimelpad, de zustercategorieën
  // en de aanbiedingen van de hoofdcategorie — alles uit de categorieboom.
  const tree = await catalog.getTree();
  const parent = primary?.parentId ? tree.byId.get(primary.parentId) : undefined;
  const discover = [
    ...trail.map((t) => ({ label: t.name, href: routes.category(t) })),
    ...(parent ? visibleChildren(parent).filter((c) => c.id !== primary.id).map((c) => ({ label: c.name, href: routes.category(c) })) : []),
    ...(product.brand ? [{ label: `Meer van ${merkVan(product.brand)}`, href: routes.brand(brandSlug(merkVan(product.brand))) }] : []),
    { label: `Nieuw in ${trail[0].name.toLowerCase()}`, href: routes.newArrivals(trail[0].slug) },
  ];

  return (
    <div className="shell">
      <JsonLd data={productJsonLd(product, primary?.name)} />
      <JsonLd data={breadcrumbJsonLd([...categoryCrumbs(trail), { name: product.title, path: routes.product(product.slug) }])} />
      <Breadcrumbs items={[{ label: "Catalogus", href: routes.catalog() }, ...trail.map((t) => ({ label: t.name, href: routes.category(t) })), { label: product.title }]} />
      {/* Geen <Suspense>/useSearchParams rond de PDP: alles staat in de server-HTML (B02). */}
      <ProductView
        product={product}
        lineCount={lineCount}
        lineHref={product.line ? routes.search(product.line) : undefined}
        maatwerk={maatwerk}
        info={<ProductInfo product={product} maatwerk={maatwerk} category={primary ? { name: primary.name, href: routes.category(primary) } : undefined} />}
      />

      <div className="mt-14">
        <UspBand variant="card" count={5} />
      </div>

      {related.length > 0 && (
        <section aria-labelledby="ook-leuk" className="mt-14">
          <h2 id="ook-leuk" className="mb-5 text-xl font-medium lg:text-2xl">
            Dit vindt u misschien ook leuk
          </h2>
          <Carousel label="Dit vindt u misschien ook leuk">
            {related.map((c, i) => (
              <ProductCard key={c.id} product={c} tone={i} />
            ))}
          </Carousel>
        </section>
      )}

      {/* Referentie: ook het huidige product staat in "recent bekeken". */}
      <RecentlyViewed className="mt-14" />

      <nav aria-labelledby="ontdek-ook" className="mt-14">
        <h2 id="ontdek-ook" className="mb-4 text-xl font-medium lg:text-2xl">
          Ontdek ook
        </h2>
        <ul role="list" className="flex flex-wrap gap-2">
          {discover.map((d) => (
            <li key={d.href}>
              <Link href={d.href} className="flex min-h-10 items-center rounded-full border border-line-strong/50 px-4 text-[14px] hover:border-ink">
                {d.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
