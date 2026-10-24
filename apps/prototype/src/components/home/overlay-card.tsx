import Link from "next/link";
import type { ImageRef } from "@/lib/catalog/types";
import { ImageSlot } from "@/components/ui/image-slot";

/**
 * Grote beeldkaart met gecentreerde serif-titel, subtitel en doorschijnende knop
 * (referentie: "Nos sélections à ne pas manquer" en "Les tendances du moment").
 */
export function OverlayCard({
  href,
  title,
  subtitle,
  cta,
  image,
  className = "",
  tone = 0,
  sizes = "(min-width: 768px) 50vw, 100vw",
}: {
  href: string;
  title: string;
  subtitle?: string;
  /** Zonder knoptekst (leeg in de admin) blijft de kaart klikbaar, zonder knop. */
  cta?: string;
  image?: ImageRef;
  className?: string;
  tone?: number;
  sizes?: string;
}) {
  const hasImage = Boolean(image?.src);
  return (
    <Link href={href} className={`group relative block overflow-hidden rounded-[var(--radius-tile)] ${className}`}>
      <ImageSlot
        src={image?.src}
        alt=""
        tone={tone}
        sizes={sizes}
        className={`absolute inset-0 ${hasImage ? "" : "pb-40"}`}
        imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
      />
      {hasImage && <span className="tile-shade absolute inset-0" aria-hidden="true" />}
      <span className={`absolute inset-x-0 bottom-0 flex flex-col items-center p-6 pb-8 text-center lg:p-8 ${hasImage ? "text-white" : "text-ink"}`}>
        <span className="font-display text-[30px] leading-tight [text-shadow:0_2px_12px_rgb(0_0_0/0.3)] lg:text-[40px] lg:leading-[48px]">{title}</span>
        {subtitle && <span className="mt-1 text-[15px] font-medium [text-shadow:0_1px_8px_rgb(0_0_0/0.3)] lg:text-base">{subtitle}</span>}
        {cta && <span className={`btn mt-5 ${hasImage ? "btn-picture" : "btn-primary"}`}>{cta}</span>}
      </span>
    </Link>
  );
}
