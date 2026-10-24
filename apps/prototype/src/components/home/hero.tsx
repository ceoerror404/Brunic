import Link from "next/link";
import type { ImageRef } from "@/lib/catalog/types";
import { ImageSlot } from "@/components/ui/image-slot";

/**
 * Hero zoals de referentie: brede foto (8 px marge, afgeronde hoeken) met links een
 * ticketlabel, grote serif-titel, ondertitel en een doorschijnende knop; eronder een
 * zandkleurige band met snelkoppelingen naar de hoofdcategorieën.
 */
export function Hero({
  ticket,
  title,
  subtitle,
  cta,
  secondary,
  image,
  links,
}: {
  ticket?: string;
  title: string;
  subtitle?: string;
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
  image: ImageRef;
  links: { label: string; href: string }[];
}) {
  return (
    <section aria-labelledby="hero-titel" className="px-2 pt-3">
      <div className="relative overflow-hidden rounded-t-[var(--radius-tile)]">
        <ImageSlot src={image.src} alt={image.alt} priority sizes="100vw" className="h-[520px] w-full md:h-[560px] lg:h-[min(42vw,640px)] lg:min-h-[520px]" />
        <div className="hero-shade absolute inset-0 max-lg:bg-[linear-gradient(180deg,rgb(19_12_12/0.05),rgb(19_12_12/0.5))]" aria-hidden="true" />
        <div className="absolute inset-0 flex items-end justify-center p-6 pb-10 text-white lg:items-center lg:justify-start lg:p-12">
          <div className="flex flex-col items-center text-center">
            {ticket && <p className="ticket mb-5 bg-white px-6 py-2 text-[13px] text-ink">{ticket}</p>}
            <h1 id="hero-titel" className="font-display text-[44px] leading-[1.1] [text-shadow:0_2px_16px_rgb(0_0_0/0.25)] md:text-[56px] lg:text-[64px] lg:leading-[80px]">
              {title}
            </h1>
            {subtitle && <p className="mt-2 text-lg font-medium [text-shadow:0_1px_8px_rgb(0_0_0/0.3)] lg:text-[22px]">{subtitle}</p>}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href={cta.href} className="btn btn-picture">
                {cta.label}
              </Link>
              {secondary && (
                <Link href={secondary.href} className="btn bg-white text-ink hover:bg-sand">
                  {secondary.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      <nav aria-label="Snel naar een afdeling" className="rounded-b-[10px] bg-sand p-1">
        <ul role="list" className="flex flex-col lg:flex-row">
          {links.map((l, i) => (
            <li key={l.href} className="flex flex-1 items-stretch border-b border-line-strong/15 last:border-0 lg:border-0">
              <Link
                href={l.href}
                className="flex min-h-[40px] w-full items-center justify-center rounded-[10px] px-2 py-2 text-center text-[13px] transition-colors hover:bg-white lg:min-h-[55px] lg:text-[14px]"
              >
                {l.label}
              </Link>
              {i < links.length - 1 && <span aria-hidden="true" className="my-3 hidden w-px bg-line-strong/25 lg:block" />}
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
