import type { ReactNode } from "react";
import { catalog } from "@/lib/catalog/repository";
import { toMegaMenu } from "@/lib/catalog/menu-data";
import { MAIN_NAV } from "@/lib/site/navigation";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

/** Header + inhoud + footer. Het menu wordt server-side uit de categorieboom gebouwd. */
export async function ShopChrome({ children }: { children: ReactNode }) {
  const menu = await toMegaMenu();
  const heeftAanbiedingen = (await catalog.getOffers(1)).length > 0;
  const nav = MAIN_NAV.filter((n) => !n.alleenMetAanbiedingen || heeftAanbiedingen);
  return (
    <>
      <SiteHeader menu={menu} nav={nav} />
      {/* Minimaal één scherm hoog: de lijst komt gestreamd binnen, de footer staat er anders even in beeld en springt weg. */}
      <main id="inhoud" tabIndex={-1} className="min-h-[calc(100dvh-var(--header-h))] outline-none">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
