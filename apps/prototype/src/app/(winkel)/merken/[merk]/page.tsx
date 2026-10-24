import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getBrand, getBrands } from "@/lib/catalog/brands";
import { catalog } from "@/lib/catalog/repository";
import { facetLabelsFor, toListingItem } from "@/lib/catalog/view";
import { buildListing } from "@/lib/catalog/listing";
import { productCount } from "@/lib/catalog/product";
import { routes } from "@/lib/routes";
import { breadcrumbJsonLd } from "@/lib/site/seo";
import { maatwerkVoor } from "@/lib/site/maatwerk";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CategoryHeader } from "@/components/catalog/category-header";
import { ProductListing } from "@/components/catalog/product-listing";
import { PromoBanner } from "@/components/catalog/promo-banner";
import { ImageSlot } from "@/components/ui/image-slot";
import { JsonLd } from "@/components/seo/json-ld";

type Props = { params: Promise<{ merk: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateStaticParams() {
  return (await getBrands()).map((b) => ({ merk: b.slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const b = await getBrand((await params).merk);
  if (!b) return { title: "Merk niet gevonden" };
  const gefilterd = Object.keys(await searchParams).length > 0;
  // Titel met de belangrijkste producttypes ("Boråstapeter: behang en fotobehang"): zo zoekt men ook.
  const perType = new Map<string, number>();
  for (const p of b.products) for (const t of p.facets.type ?? []) perType.set(t, (perType.get(t) ?? 0) + 1);
  const types = [...perType.entries()].sort((x, y) => y[1] - x[1]).map(([t]) => t.toLowerCase());
  // Opmeting en plaatsing enkel beloven waar Brunic die levert (lib/site/maatwerk.ts), niet bij behang.
  const afdeling = b.products[0] ? (await catalog.getCategoryTrail(b.products[0].primaryCategoryId))[0]?.id : undefined;
  const maatwerk = maatwerkVoor(afdeling);
  const dienst =
    maatwerk === "stoffen" || maatwerk === "vloer" ? "met advies, gratis opmeting en plaatsing" : maatwerk === "tapijten" ? "met advies, ook op maat" : "met persoonlijk advies in onze winkel";
  return {
    title: types.length ? `${b.name}: ${types.slice(0, 2).join(" en ")}` : b.name,
    description: `${types.join(", ")} van ${b.name}: ${productCount(b.count)} bij Brunic in Ninove, ${dienst}.`.replace(/^./, (c) => c.toUpperCase()),
    alternates: { canonical: routes.brand(b.slug) },
    ...(gefilterd ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Alle producten van één merk, met dezelfde filters als een categoriepagina. */
export default async function BrandPage({ params, searchParams }: Props) {
  const brand = await getBrand((await params).merk);
  if (!brand) notFound();
  const tree = await catalog.getTree();
  const items = brand.products.map((p) => toListingItem(p, tree));
  // Band volgens de afdeling van dit merk (Arte → behang → winkel; ADO → stoffen → op maat).
  const afdeling = brand.products[0] ? (await catalog.getCategoryTrail(brand.products[0].primaryCategoryId))[0]?.id : undefined;
  const intro = `Ontdek ${productCount(brand.count)} van ${brand.name} in onze webshop: ${brand.types.join(", ").toLowerCase()}. Wilt u een stof, behang of tapijt in het echt zien of weten wat het kost op uw maten? Vraag vrijblijvend een offerte aan of kom langs in onze winkel in Ninove.`;

  return (
    <div className="shell-inset">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Merken", path: routes.brands() },
          { name: brand.name, path: routes.brand(brand.slug) },
        ])}
      />
      <Breadcrumbs items={[{ label: "Merken", href: routes.brands() }, { label: brand.name }]} />
      <div className="grid items-center gap-6 lg:grid-cols-[1fr_minmax(0,480px)]">
        <CategoryHeader eyebrow="Merk" title={brand.name} intro={intro} />
        {brand.image && <ImageSlot src={brand.image.src} alt={brand.image.alt} priority sizes="(min-width: 1024px) 480px, 100vw" className="aspect-[3/2] w-full rounded-[var(--radius-tile)]" />}
      </div>
      <section aria-label={`Producten van ${brand.name}`} className="mt-8">
        <Suspense>
          <ProductListing data={buildListing(items, await searchParams, facetLabelsFor(tree))} promo={<PromoBanner soort={maatwerkVoor(afdeling)} />} facetLabels={facetLabelsFor(tree)} />
        </Suspense>
      </section>
    </div>
  );
}
