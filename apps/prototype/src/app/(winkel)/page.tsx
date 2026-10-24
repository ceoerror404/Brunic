import type { Metadata } from "next";
import Link from "next/link";
import { catalog } from "@/lib/catalog/repository";
import { toCard } from "@/lib/catalog/view";
import { getBrands } from "@/lib/catalog/brands";
import { IS_SFEER, sfeerfoto } from "@/lib/catalog/imagery";
import { routes } from "@/lib/routes";
import { SITE } from "@/lib/site/config";
import { localBusinessJsonLd, websiteJsonLd } from "@/lib/site/seo";
import { getHome } from "@/lib/inhoud/home";
import { Hero } from "@/components/home/hero";
import { DepartmentTiles } from "@/components/home/department-tiles";
import { Section } from "@/components/home/section";
import { OverlayCard } from "@/components/home/overlay-card";
import { CategoryTile } from "@/components/catalog/category-tile";
import { BrandTile } from "@/components/catalog/brand-tile";
import { ProductCard } from "@/components/catalog/product-card";
import { Carousel } from "@/components/ui/carousel";
import { Icon } from "@/components/ui/icon";
import { JsonLd } from "@/components/seo/json-ld";

// Canonical enkel hier: in de root-layout zou elke pagina zonder eigen canonical "/" erven (B26).
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const tree = await catalog.getTree();
  // Teksten en foto's: Shopify-metaobject "Pagina | Home" (src/lib/inhoud/home.ts).
  const home = await getHome();
  // Nieuw binnen: afwisselend uit elke afdeling, producten met een sfeerfoto eerst — anders
  // toont de homepage tien stalen van dezelfde tapijttegel-collectie.
  const perAfdeling = new Map<string, Awaited<ReturnType<typeof catalog.getNewArrivals>>>();
  for (const p of await catalog.getNewArrivals()) {
    const root = (await catalog.getCategoryTrail(p.primaryCategoryId))[0]?.id ?? "";
    perAfdeling.set(root, [...(perAfdeling.get(root) ?? []), p]);
  }
  const rijen = [...perAfdeling.values()];
  const gemengd = Array.from({ length: Math.max(0, ...rijen.map((r) => r.length)) }, (_, i) => rijen.map((r) => r[i])).flat().filter((p) => p !== undefined);
  const newArrivals = [...gemengd.filter((p) => sfeerfoto(p)), ...gemengd.filter((p) => !sfeerfoto(p))].slice(0, 10).map(toCard);
  const { hero, afdelingen, selecties, nieuw, trends, winkel, inspiratie, merken } = home;

  // Beelden die al op de homepage staan, niet nog eens als merkbeeld tonen.
  const gebruikt = new Set(
    [hero.image, ...[...afdelingen.tegels, ...selecties.kaarten, ...trends.kaarten, ...inspiratie.tegels].map((t) => t.image)].flatMap((i) => (i ? [i.src.split("?")[0]] : [])),
  );
  const brands = (await getBrands()).map((b) => {
    const eigen = b.products.flatMap((p) => p.images.filter((i) => IS_SFEER.test(i.alt))).find((i) => !gebruikt.has(i.src.split("?")[0]));
    return { ...b, image: eigen ?? b.image };
  });

  const heroLinks = [...tree.roots.map((c) => ({ label: c.name, href: routes.category(c) })), { label: "Alle merken", href: routes.brands() }];

  return (
    <>
      <JsonLd data={localBusinessJsonLd()} />
      {/* WebSite: de sitenaam "Brunic" in de zoekresultaten i.p.v. het domein. */}
      <JsonLd data={websiteJsonLd()} />
      <Hero ticket={hero.ticket} title={hero.title} subtitle={hero.subtitle} cta={hero.cta} secondary={hero.secondary} image={hero.image} links={heroLinks} />

      <Section id="afdelingen" title={afdelingen.title} subtitle={afdelingen.subtitle}>
        <DepartmentTiles small={afdelingen.tegels} />
      </Section>

      {selecties.kaarten.length > 0 && (
        <Section id="selecties" title={selecties.title}>
          <div className="grid gap-2 md:grid-cols-2">
            {selecties.kaarten.map((c, i) => (
              <OverlayCard key={c.href + c.title} href={c.href} title={c.title} subtitle={c.subtitle} cta={c.cta} image={c.image} tone={i} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/5] md:aspect-[668/680]" />
            ))}
          </div>
        </Section>
      )}

      {newArrivals.length > 0 && (
        <Section id="nieuw" title={nieuw.title} cta={{ label: nieuw.cta, href: routes.newArrivals() }}>
          <Carousel label={nieuw.title}>
            {newArrivals.map((p, i) => (
              <ProductCard key={p.id} product={p} tone={i} />
            ))}
          </Carousel>
        </Section>
      )}

      {trends.kaarten.length > 0 && (
        <Section id="trends" title={trends.title}>
          <div className="grid gap-2 md:grid-cols-3">
            {trends.kaarten.map((t, i) => (
              <OverlayCard key={t.href + t.title} href={t.href} title={t.title} cta={t.cta} image={t.image} tone={i} sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[4/5] md:aspect-[443/553]" />
            ))}
          </div>
        </Section>
      )}

      {/* Winkelbezoek uitlokken (design-brief §2): de winkel is het ankerpunt. */}
      <section aria-labelledby="winkel" className="shell mt-16 lg:mt-24">
        <div className="grid gap-8 rounded-[var(--radius-pill)] bg-sand p-6 md:grid-cols-[1.3fr_1fr] md:items-center md:p-10 lg:p-14">
          <div>
            {winkel.label && <p className="text-[13px] font-medium uppercase tracking-wide text-ink-60">{winkel.label}</p>}
            <h2 id="winkel" className="mt-2 font-display text-[32px] leading-tight lg:text-[44px]">
              {winkel.title}
            </h2>
            <p className="mt-4 max-w-xl whitespace-pre-line text-base leading-relaxed text-ink-80">{winkel.text}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={SITE.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <Icon name="pin" size={20} /> {winkel.knopRoute}
              </a>
              <Link href={routes.store()} className="btn btn-outline">
                {winkel.knopContact}
              </Link>
            </div>
          </div>
          <dl className="grid gap-4 rounded-[var(--radius-tile)] bg-white p-6 text-[15px]">
            <div>
              <dt className="font-medium">Adres</dt>
              <dd className="text-ink-80">
                {SITE.address.street}, {SITE.address.postalCode} {SITE.address.city}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Openingsuren</dt>
              {SITE.hours.map((h) => (
                <dd key={h.days} className="flex justify-between gap-4 text-ink-80">
                  <span>{h.days}</span>
                  <span>{h.time}</span>
                </dd>
              ))}
            </div>
            <div>
              <dt className="font-medium">Telefoon</dt>
              <dd>
                <a href={SITE.phone.href} className="text-ink-80 underline underline-offset-2 hover:text-ink">
                  {SITE.phone.display}
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {inspiratie.tegels.length > 0 && (
        <Section id="inspiratie" title={inspiratie.title} cta={{ label: inspiratie.cta, href: routes.inspiration() }}>
          <div className="grid grid-cols-2 gap-1 lg:grid-cols-4">
            {inspiratie.tegels.map((t, i) => (
              <CategoryTile key={t.href + t.title} href={t.href} title={t.title} image={t.image} tone={i} size="lg" className="aspect-[4/5]" />
            ))}
          </div>
        </Section>
      )}

      {brands.length > 0 && (
        <Section id="merken" title={merken.title} cta={{ label: merken.cta, href: routes.brands() }}>
          <Carousel label={merken.title} itemClassName="w-[70%] xs:w-[44%] md:w-[30%] lg:w-[23.4%]">
            {brands.map((b, i) => (
              <BrandTile key={b.slug} href={routes.brand(b.slug)} name={b.name} image={b.image} logo={b.logo} tone={i} className="aspect-[4/5] w-full" />
            ))}
          </Carousel>
        </Section>
      )}
    </>
  );
}
