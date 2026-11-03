import Link from "next/link";
import { routes } from "@/lib/routes";

/**
 * Brunic-logo: uitgesneden mascotte met tapijtrol + rood BRUNIC-woordmerk, rechtstreeks op de
 * achtergrond van de header (geen geel vlak). De mascotte is smal en hoog en heeft de
 * rijhoogte nodig om herkenbaar te blijven.
 * ⏳ Vectorlogo volgt van de klant — dan de PNG's hier vervangen door de SVG.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href={routes.home()} aria-label="Brunic — naar de startpagina" className={`flex shrink-0 items-center gap-1.5 lg:gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/mascotte-tapijtrol.png" alt="" width={101} height={240} className="h-[46px] w-auto lg:h-[60px]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/woordmerk-brunic.png" alt="" width={449} height={120} className="h-[22px] w-auto min-[360px]:h-[26px] lg:h-[36px]" />
    </Link>
  );
}
