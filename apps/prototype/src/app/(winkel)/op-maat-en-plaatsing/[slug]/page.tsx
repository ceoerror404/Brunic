import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SERVICES } from "@/data/content";
import { catalog } from "@/lib/catalog/repository";
import { toCard } from "@/lib/catalog/view";
import { routes } from "@/lib/routes";
import { SITE } from "@/lib/site/config";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ImageSlot } from "@/components/ui/image-slot";
import { Carousel } from "@/components/ui/carousel";
import { Icon } from "@/components/ui/icon";
import { ProductCard } from "@/components/catalog/product-card";
import { Suspense } from "react";
import { LeadForm } from "@/components/content/lead-form";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/site/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = SERVICES.find((x) => x.slug === slug);
  return s ? { title: s.title, description: s.summary, alternates: { canonical: routes.service(s.slug) } } : { title: "Dienst niet gevonden" };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) notFound();

  const tree = await catalog.getTree();
  const related = (await Promise.all(service.relatedCategoryIds.map((id) => catalog.getProductsInCategory(id)))).flat();
  const cards = [...new Map(related.map((p) => [p.id, p])).values()].sort((a, b) => b.popularity - a.popularity).slice(0, 10).map(toCard);
  const others = SERVICES.filter((s) => s.slug !== slug);
  const isOpmeting = service.slug === "opmeting-aan-huis";

  return (
    <div className="shell-inset">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Op maat & plaatsing", path: routes.services() },
          { name: service.title, path: routes.service(service.slug) },
        ])}
      />
      <Breadcrumbs items={[{ label: "Op maat & plaatsing", href: routes.services() }, { label: service.title }]} />

      <div className="grid items-center gap-8 py-3 lg:grid-cols-2 lg:gap-12">
        <div>
          <h1 className="font-display text-[34px] leading-tight lg:text-[48px]">{service.title}</h1>
          <p className="mt-4 text-base leading-relaxed text-ink-80">{service.summary}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#aanvraag" className="btn btn-primary">
              Aanvraag starten
            </a>
            <a href={SITE.phone.href} className="btn btn-outline">
              <Icon name="phone" size={20} /> {SITE.phone.display}
            </a>
          </div>
        </div>
        <ImageSlot src={service.image.src} alt={service.image.alt} priority sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-[var(--radius-tile)]" />
      </div>

      <section aria-labelledby="stappen" className="mt-14">
        <h2 id="stappen" className="text-2xl font-medium">
          Zo verloopt het
        </h2>
        <ol className="mt-6 grid gap-3 md:grid-cols-4">
          {service.steps.map((st, i) => (
            <li key={st.title} className="rounded-[var(--radius-tile)] border border-line p-5">
              <span className="flex size-10 items-center justify-center rounded-full bg-sand text-sm font-semibold">{i + 1}</span>
              <p className="mt-4 text-lg font-medium">{st.title}</p>
              <p className="mt-1 text-[14px] text-ink-80">{st.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
        <section aria-labelledby="meer-info" className="prose-brunic">
          <h2 id="meer-info" className="!mt-0">
            Meer over {service.title.toLowerCase()}
          </h2>
          {service.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <h2>Welke producten?</h2>
          <p>
            Bekijk onder meer{" "}
            {service.relatedCategoryIds.map((id, i) => {
              const c = tree.byId.get(id);
              return c ? (
                <span key={id}>
                  {i > 0 && " en "}
                  <Link href={routes.category(c)} className="font-medium text-ink underline underline-offset-2">
                    {c.name}
                  </Link>
                </span>
              ) : null;
            })}
            .
          </p>
        </section>

        <div id="aanvraag">
          <Suspense>
            <LeadForm
              title={isOpmeting ? "Vraag uw gratis opmeting of offerte aan" : "Vraag uw afspraak aan"}
              intro="Beschrijf kort uw project. Wij nemen binnen 1 à 2 werkdagen contact met u op om een afspraak te plannen."
              soort={isOpmeting ? "opmeting" : "aanvraag"}
              productContext={isOpmeting}
              submitLabel="Aanvraag versturen"
              allowPhotos
              fields={[
                { name: "voornaam", label: "Voornaam", required: true, autoComplete: "given-name", half: true },
                { name: "naam", label: "Naam", required: true, autoComplete: "family-name", half: true },
                { name: "email", label: "E-mail", type: "email", required: true, autoComplete: "email", half: true },
                { name: "telefoon", label: "Telefoon of gsm", type: "tel", required: true, autoComplete: "tel", half: true },
                { name: "postcode", label: "Postcode", type: "postcode", required: true, autoComplete: "postal-code", half: true },
                { name: "onderwerp", label: "Waarvoor?", type: "select", required: true, options: SERVICES.map((s) => s.title), half: true },
                { name: "bericht", label: "Uw project", type: "textarea", placeholder: "Welke ruimte, hoeveel ramen of m², uw wensen en timing…" },
              ]}
            />
          </Suspense>
        </div>
      </div>

      {cards.length > 0 && (
        <section aria-labelledby="gerelateerd" className="mt-16">
          <h2 id="gerelateerd" className="mb-5 text-xl font-medium lg:text-2xl">
            Producten uit ons assortiment
          </h2>
          <Carousel label="Producten uit ons assortiment">
            {cards.map((c, i) => (
              <ProductCard key={c.id} product={c} tone={i} />
            ))}
          </Carousel>
        </section>
      )}

      <section aria-labelledby="andere-diensten" className="mt-16">
        <h2 id="andere-diensten" className="mb-5 text-xl font-medium lg:text-2xl">
          Andere diensten
        </h2>
        <ul role="list" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((s) => (
            <li key={s.slug}>
              <Link href={routes.service(s.slug)} className="flex min-h-16 items-center justify-between gap-3 rounded-[var(--radius-tile)] border border-line px-5 py-4 text-[15px] font-medium hover:border-line-strong">
                {s.title} <Icon name="chevronRight" size={18} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
