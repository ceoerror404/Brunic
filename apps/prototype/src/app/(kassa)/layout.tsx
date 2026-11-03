import { Logo } from "@/components/layout/logo";
import Link from "next/link";
import { SITE } from "@/lib/site/config";
import { routes } from "@/lib/routes";
import { USPS } from "@/components/layout/usp-band";
import { Icon } from "@/components/ui/icon";

/**
 * Kassa-layout (referentie: winkelmand zonder hoofdnavigatie): logo + USP's.
 * Houdt de focus op afronden; onderaan enkel een juridische regel.
 */
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line bg-white">
        <a href="#inhoud" className="sr-only-focusable absolute left-4 top-2 z-[60] rounded-full bg-ink px-4 py-2 text-white">
          Naar de inhoud
        </a>
        <div className="shell flex min-h-[76px] items-center gap-8 py-3">
          <Logo />
          <ul role="list" className="hidden flex-1 justify-between gap-6 lg:flex">
            {USPS.slice(0, 5).map((u) => (
              <li key={u.text} className="flex max-w-[200px] items-center gap-3 text-[13px] leading-snug text-ink-80">
                <Icon name={u.icon} size={26} strokeWidth={1.4} className="shrink-0 text-ink" />
                {u.text}
              </li>
            ))}
          </ul>
        </div>
      </header>
      {/* De kassa heeft geen kleverige header. */}
      <main id="inhoud" tabIndex={-1} className="outline-none [--header-h:0px]">
        {children}
      </main>
      {/* Zoals de referentie: geen volledige footer in de kassa, enkel een juridische regel. */}
      <footer className="border-t border-line bg-mist">
        <div className="shell flex flex-wrap justify-between gap-3 py-5 text-[12px] text-ink-80">
          <p>
            © {new Date().getFullYear()} {SITE.legalName} · {SITE.address.street}, {SITE.address.postalCode} {SITE.address.city}
          </p>
          <nav aria-label="Juridisch" className="flex flex-wrap gap-4">
            <Link href={routes.info("algemene-voorwaarden")} className="hover:underline">
              Algemene voorwaarden
            </Link>
            <Link href={routes.info("privacy")} className="hover:underline">
              Privacyverklaring
            </Link>
            <Link href={routes.store()} className="hover:underline">
              Hulp & contact
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
