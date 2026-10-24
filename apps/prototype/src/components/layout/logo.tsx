import Link from "next/link";
import { routes } from "@/lib/routes";

/**
 * Brunic-logo (kleurversie: geel vlak met mascotte + rode woordmerk, bron brunic.be).
 * ⏳ Vectorlogo volgt van de klant — dan hier vervangen door de SVG.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href={routes.home()} aria-label="Brunic — naar de startpagina" className={`shrink-0 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-kleur.png" alt="Brunic" width={600} height={376} className="h-[42px] w-auto rounded-[6px] lg:h-[54px]" />
    </Link>
  );
}
