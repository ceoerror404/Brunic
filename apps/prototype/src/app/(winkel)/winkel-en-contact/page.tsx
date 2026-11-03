import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "@/data/content";
import { SITE } from "@/lib/site/config";
import { routes } from "@/lib/routes";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Accordion } from "@/components/ui/accordion";
import { Icon, type IconName } from "@/components/ui/icon";
import { Suspense } from "react";
import { LeadForm } from "@/components/content/lead-form";
import { JsonLd } from "@/components/seo/json-ld";
import { localBusinessJsonLd } from "@/lib/site/seo";

export const metadata: Metadata = {
  title: "Winkel & contact",
  description: `Bezoek Brunic in Ninove (${SITE.address.street}) of neem contact op: ${SITE.phone.display}, ${SITE.email}. ${SITE.hoursShort}.`,
  alternates: { canonical: routes.store() },
};

function ContactLink({ href, icon, label, external = false }: { href: string; icon: IconName; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-1 text-[14px] hover:bg-mist"
    >
      <span className="flex items-center gap-3">
        <Icon name={icon} size={20} /> {label}
      </span>
      <Icon name="arrowRight" size={18} />
    </a>
  );
}

export default function StorePage() {
  return (
    <div className="shell">
      <JsonLd data={localBusinessJsonLd()} />
      <Breadcrumbs items={[{ label: "Winkel & contact" }]} />
      <div className="mx-auto max-w-[1040px]">
        {/* Banner (referentie: "Besoin d'aide ?") */}
        <section id="hulp" aria-labelledby="hulp-titel" className="relative mt-2 overflow-hidden rounded-[6px] bg-[linear-gradient(100deg,#e21f1d_0%,#ef3b33_45%,#f7696f_100%)] text-white">
          <div className="relative z-10 px-8 py-10 md:px-14 md:py-14">
            <h1 id="hulp-titel" className="font-display text-[40px] font-semibold leading-tight [font-variation-settings:'SOFT'_100,'WONK'_0] md:text-[56px]">
              Hulp nodig?
            </h1>
            <p className="mt-2 text-lg">Vind het antwoord op uw vragen</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mascotte.png" alt="" className="absolute bottom-0 right-10 hidden h-full w-auto py-1 md:block" />
        </section>

        <section aria-labelledby="faq-titel" className="mt-10">
          <h2 id="faq-titel" className="text-lg font-semibold">
            Meest gestelde vragen
          </h2>
          <div className="mt-3">
            {FAQ.map((f) => (
              <Accordion key={f.q} title={f.q} variant="line">
                <p>{f.a}</p>
              </Accordion>
            ))}
          </div>
          <Link href={routes.info("veelgestelde-vragen")} className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium underline underline-offset-2">
            Alle veelgestelde vragen <Icon name="arrowRight" size={16} />
          </Link>
        </section>

        <section aria-labelledby="contact-titel" className="mt-12">
          <h2 id="contact-titel" className="text-lg font-semibold">
            Contacteer ons
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-[var(--radius-tile)] border border-line p-5 shadow-[0_2px_12px_-6px_rgb(19_12_12/0.12)]">
              <p className="font-semibold">Advies over producten of maatwerk?</p>
              <p className="mt-1 text-[14px] text-ink-80">Onze adviseurs helpen u graag, in de winkel of telefonisch.</p>
              <p className="mt-2 text-[13px] text-ink-60">{SITE.hoursShort}</p>
              <div className="mt-4">
                <ContactLink href={SITE.phone.href} icon="phone" label={`Bellen: ${SITE.phone.display}`} />
                <ContactLink href={SITE.mapsUrl} icon="pin" label="Route naar de winkel" external />
              </div>
            </div>
            <div className="rounded-[var(--radius-tile)] border border-line p-5 shadow-[0_2px_12px_-6px_rgb(19_12_12/0.12)]">
              <p className="font-semibold">Vragen over een bestelling?</p>
              <p className="mt-1 text-[14px] text-ink-80">Wij volgen uw bestelling of afspraak graag voor u op.</p>
              <p className="mt-2 text-[13px] text-ink-60">{SITE.hoursShort}</p>
              <div className="mt-4">
                <ContactLink href={`mailto:${SITE.email}`} icon="mail" label={`E-mail: ${SITE.email}`} />
                <ContactLink href="#formulier" icon="chat" label="Contactformulier" />
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="winkel-titel" className="mt-12 grid gap-6 rounded-[var(--radius-tile)] bg-sand p-5 md:grid-cols-2 md:p-8">
          <div>
            <h2 id="winkel-titel" className="font-display text-[28px] leading-tight">
              Onze winkel in {SITE.address.city}
            </h2>
            <address className="mt-4 space-y-1 text-[15px] not-italic">
              <p className="font-medium">{SITE.legalName}</p>
              <p>{SITE.address.street}</p>
              <p>
                {SITE.address.postalCode} {SITE.address.city}
              </p>
            </address>
            <h3 className="mt-6 font-semibold">Openingsuren</h3>
            <dl className="mt-2 space-y-1 text-[15px]">
              {SITE.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4 border-b border-line-strong/20 py-1.5">
                  <dt>{h.days}</dt>
                  <dd className="font-medium">{h.time}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[13px] text-ink-60">Op feestdagen en tijdens verlofperiodes kunnen de openingsuren afwijken.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={SITE.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <Icon name="pin" size={20} /> Route plannen
              </a>
              <Link href={routes.measurement()} className="btn btn-outline">
                Opmeting aanvragen
              </Link>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6 rounded-[var(--radius-tile)] bg-white p-6">
            <div>
              <p className="font-display text-[24px] leading-tight">Zo vindt u ons</p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-80">
                U vindt onze winkel aan de Ring-West in {SITE.address.city}. Kom gerust binnen om stoffen te voelen, stalenboeken door te bladeren of uw
                verlanglijst te overlopen met een van onze adviseurs.
              </p>
            </div>
            <a href={SITE.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-[var(--radius-field)] border border-line px-4 py-3 text-[14px] font-medium hover:border-ink">
              <span className="flex items-center gap-3">
                <Icon name="pin" size={20} /> Open in Google Maps
              </span>
              <Icon name="arrowRight" size={18} />
            </a>
          </div>
        </section>

        <div id="formulier" className="mt-12">
          <Suspense>
            <LeadForm
              title="Stel uw vraag"
              titelMetProducten="Vraag uw offerte aan"
              intro="Stuur ons een bericht; we antwoorden doorgaans binnen 1 à 2 werkdagen."
              soort="contact"
              productContext
              bevestiging="We antwoorden doorgaans binnen 1 à 2 werkdagen."
              allowPhotos
              fields={[
                { name: "voornaam", label: "Voornaam", required: true, autoComplete: "given-name", half: true },
                { name: "naam", label: "Naam", required: true, autoComplete: "family-name", half: true },
                { name: "email", label: "E-mail", type: "email", required: true, autoComplete: "email", half: true },
                { name: "telefoon", label: "Telefoon (optioneel)", type: "tel", autoComplete: "tel", half: true },
                {
                  name: "onderwerp",
                  label: "Onderwerp",
                  type: "select",
                  required: true,
                  options: ["Productadvies", "Offerte", "Opmeting of plaatsing", "Mijn bestelling", "Projecten (horeca, zorg)", "Andere vraag"],
                },
                { name: "bericht", label: "Uw bericht", type: "textarea", required: true, placeholder: "Beschrijf uw vraag" },
              ]}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
