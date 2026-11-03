import Link from "next/link";
import type { ReactNode } from "react";
import type { ImageRef } from "@/lib/catalog/types";
import type { Article } from "@/data/content";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { ImageSlot } from "@/components/ui/image-slot";
import { ReadMore } from "@/components/ui/read-more";
import { CategoryTile } from "./category-tile";
import { OverlayCard } from "@/components/home/overlay-card";
import { ArticleCard } from "@/components/content/article-card";

export type LandingSubCard = { href: string; name: string; image?: ImageRef; links: { href: string; name: string }[]; allHref: string };

/**
 * Landingspagina van een hoofdcategorie (referentie: "Canapé et fauteuil"):
 * gecentreerde titel, sfeerbeeld in een zandkader met intro, subcategoriekaarten met
 * linklijst — en daaronder ALLE producten van de categorie met filters (bij Brunic zit
 * het merendeel van de producten niet in een subcategorie), dan campagnes en advies.
 */
export function CategoryLanding({
  crumbs,
  title,
  subtitle,
  intro,
  image,
  subCards,
  listing,
  total,
  campaigns,
  articles,
}: {
  crumbs: Crumb[];
  title: string;
  subtitle?: string;
  intro?: string;
  image?: ImageRef;
  subCards: LandingSubCard[];
  /** De productlijst (met filters) van de hele categorie. */
  listing: ReactNode;
  total: number;
  campaigns: { title: string; subtitle: string; cta: string; href: string; image: ImageRef }[];
  articles: Article[];
}) {
  const cols = subCards.length === 3 ? "lg:grid-cols-3" : subCards.length === 2 ? "lg:grid-cols-2" : subCards.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4";
  return (
    <div className="shell">
      <Breadcrumbs items={crumbs} />
      <header className="py-3 text-center">
        <h1 className="font-display text-[36px] leading-tight lg:text-[48px]">{title}</h1>
        {subtitle && <p className="mt-2 text-base text-ink-80 lg:text-lg">{subtitle}</p>}
      </header>

      <div className="mt-6 rounded-[var(--radius-pill)] bg-sand p-2">
        <ImageSlot src={image?.src} alt={image?.alt ?? ""} priority sizes="100vw" className="aspect-[4/3] w-full rounded-[var(--radius-tile)] md:aspect-[1328/520]" />
        {intro && <ReadMore text={intro} className="px-3 pb-3 pt-5 lg:px-5" />}
      </div>

      <p className="mt-6 text-center">
        <a href="#alle-producten" className="btn btn-primary">
          {total === 0 ? "Nog geen producten in deze categorie" : `Bekijk alle ${total} producten`}
        </a>
      </p>

      <section aria-label={`Onderverdeling van ${title}`} className={`mt-10 grid gap-3 sm:grid-cols-2 ${cols}`}>
        {subCards.map((c, i) => (
          <div key={c.href} className="self-start rounded-[var(--radius-pill)] bg-sand p-2">
            <CategoryTile href={c.href} title={c.name} image={c.image} tone={i} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="aspect-[4/3] sm:aspect-[311/388]" />
            <ul role="list" className="px-2 py-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="flex min-h-11 items-center text-[14px] hover:underline">
                    {l.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={c.allHref} className="flex min-h-11 items-center text-[14px] font-medium underline underline-offset-2">
                  Alles in {c.name}
                </Link>
              </li>
            </ul>
          </div>
        ))}
      </section>

      <section id="alle-producten" aria-labelledby="alle-producten-titel" className="mt-16">
        <h2 id="alle-producten-titel" className="section-title">
          Alle producten in {title.toLowerCase()}
        </h2>
        <div className="mt-6">{listing}</div>
      </section>

      {campaigns.length > 0 && (
        <section aria-label="Acties en nieuwigheden" className="mt-16 grid gap-3 md:grid-cols-2">
          {campaigns.map((c, i) => (
            <OverlayCard key={c.href} href={c.href} title={c.title} subtitle={c.subtitle} cta={c.cta} image={c.image} tone={i} className="aspect-[4/3] md:aspect-[660/440]" />
          ))}
        </section>
      )}

      {articles.length > 0 && (
        <section aria-labelledby="advies" className="mt-16">
          <h2 id="advies" className="section-title mb-8">
            Onze tips voor {title.toLowerCase()}
          </h2>
          <ul role="list" className="grid gap-x-4 gap-y-10 md:grid-cols-3">
            {articles.slice(0, 3).map((a, i) => (
              <li key={a.slug}>
                <ArticleCard article={a} tone={i} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
