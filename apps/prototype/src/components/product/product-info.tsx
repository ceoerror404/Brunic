import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { routes } from "@/lib/routes";
import { SITE } from "@/lib/site/config";
import { isOpMaat, type Maatwerk } from "@/lib/site/maatwerk";
import { Accordion } from "@/components/ui/accordion";
import { Collapsible } from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";

/** Infosecties onder de galerij (referentie: "Ce qui le rend unique", Descriptif, Caractéristiques & dimensions, accordeons). */
export function ProductInfo({ product, category, maatwerk }: { product: Product; category?: { name: string; href: string }; maatwerk: Maatwerk }) {
  const specs = product.specs;
  const optionSpecs = product.options.map((o) => ({ label: o.name, value: o.values.map((v) => v.value).join(", ") }));

  return (
    <div className="space-y-2">
      {product.highlights.length > 0 && (
      <section aria-labelledby="bijzonder" className="rounded-[var(--radius-pill)] border border-line-strong/40 p-6 lg:p-8">
        <h2 id="bijzonder" className="text-lg font-semibold">
          Wat dit product bijzonder maakt
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-[15px]">
          {product.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </section>
      )}

      <section id="beschrijving" aria-labelledby="beschrijving-titel" className="scroll-mt-[calc(var(--header-h,106px)+16px)] px-2 pt-6">
        <h2 id="beschrijving-titel" className="text-2xl font-medium">
          Beschrijving
        </h2>
        <Collapsible collapsedHeight={200}>
          <p className="mt-5 text-base font-semibold">
            {[product.facets.type?.[0], product.title].filter(Boolean).join(" ")}
            {product.brand && ` van ${product.brand}`}
            {product.line && ` — collectie ${product.line}`}
          </p>
          {product.description.split("\n\n").filter(Boolean).map((p, i) => (
            <p key={i} className="mt-4 text-base leading-relaxed text-ink-80">
              {p}
            </p>
          ))}
          <p className="mt-5 text-[14px] text-ink-60">Foto&apos;s kunnen licht afwijken van het werkelijke product.</p>
        </Collapsible>
      </section>

      <section id="kenmerken" aria-labelledby="kenmerken-titel" className="scroll-mt-[calc(var(--header-h,106px)+16px)] border-t border-line px-2 pt-8">
        <h2 id="kenmerken-titel" className="text-2xl font-medium">
          Kenmerken & afmetingen
        </h2>
        <Collapsible collapsedHeight={230}>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="flex gap-4">
            <Icon name="tag" size={26} className="shrink-0" />
            <div>
              <h3 className="text-base font-semibold">Kenmerken</h3>
              <dl className="mt-3 space-y-2 text-[15px]">
                {[...specs, ...optionSpecs].map((s) => (
                  <div key={s.label} className="flex flex-wrap gap-x-2">
                    <dt className="font-medium">{s.label}:</dt>
                    <dd className="text-ink-80">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="flex gap-4">
            <Icon name="ruler" size={26} className="shrink-0" />
            <div>
              <h3 className="text-base font-semibold">Afmetingen</h3>
              {product.dimensions.length ? (
                <dl className="mt-3 space-y-2 text-[15px]">
                  {product.dimensions.map((s) => (
                    <div key={s.label} className="flex flex-wrap gap-x-2">
                      <dt className="font-medium">{s.label}:</dt>
                      <dd className="text-ink-80">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-[15px] text-ink-60">
                  {product.pricing !== "on-request"
                    ? "Zie de gekozen uitvoering."
                    : isOpMaat(maatwerk)
                      ? "Op maat: wij bepalen de afmetingen samen met u, bij een opmeting aan huis of in de winkel."
                      : "De afmetingen en de hoeveelheid die u nodig hebt, bekijken we graag samen met u in onze winkel."}
                </p>
              )}
            </div>
          </div>
        </div>
        </Collapsible>
      </section>

      <div className="space-y-2 pt-8">
        {product.pricing === "on-request" && (
          <Accordion title="Hoe verloopt een offerte?">
            <p>
              {isOpMaat(maatwerk) ? (
                <>
                  U vraagt vrijblijvend een offerte aan via de knop bovenaan of in onze winkel in {SITE.address.city}. Wij bekijken samen uw wensen en maten —
                  waar nodig met een gratis opmeting aan huis — en bezorgen u een duidelijke prijs, met maakwerk en plaatsing als u dat wenst.{" "}
                  <Link href={routes.service("opmeting-aan-huis")} className="underline underline-offset-2">
                    Meer over de opmeting aan huis
                  </Link>
                </>
              ) : (
                <>
                  U vraagt vrijblijvend een offerte aan via de knop bovenaan of in onze winkel in {SITE.address.city}, waar u ook de stalenboeken kunt bekijken.
                  Wij bezorgen u een duidelijke prijs voor de hoeveelheid die u nodig hebt.
                </>
              )}
            </p>
          </Accordion>
        )}
        <Accordion title={isOpMaat(maatwerk) ? "Levering, plaatsing & afhalen" : "Levering & afhalen"}>
          <p>
            U haalt uw bestelling af in onze winkel ({SITE.address.street}, {SITE.address.city}) of wij leveren ze bij u thuis
            {isOpMaat(maatwerk) ? "; plaatsen doen onze eigen mensen." : "."}{" "}
            <Link href={routes.info("levering")} className="underline underline-offset-2">
              Alles over levering & afhalen
            </Link>
          </p>
        </Accordion>
        <Accordion title="Betalen">
          <p>
            In de winkel betaalt u ter plaatse; bij een online bestelling ziet u de beschikbare betaalmethoden bij het afrekenen.{" "}
            <Link href={routes.info("betaalmethoden")} className="underline underline-offset-2">
              Betaalmethoden
            </Link>
          </p>
        </Accordion>
        <Accordion title="Retourneren">
          <p>
            Voor online aankopen geldt een herroepingsrecht van 14 dagen. Op maat gemaakte producten en op maat gesneden stoffen, behang of vasttapijt vallen daar
            wettelijk niet onder.{" "}
            <Link href={routes.info("retourneren")} className="underline underline-offset-2">
              Retourneren
            </Link>
          </p>
        </Accordion>
      </div>

      {category && (
        <p className="px-1 pt-4 text-[14px]">
          <Link href={category.href} className="underline underline-offset-2">
            Bekijk onze catalogus: {category.name}
          </Link>
        </p>
      )}
    </div>
  );
}
