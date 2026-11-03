import { routes } from "@/lib/routes";

export type NavItem = {
  key: string;
  label: string;
  href: string;
  /** Opent het megamenu i.p.v. te navigeren. */
  mega?: boolean;
  /** Visuele nadruk (Aanbiedingen in rood). */
  accent?: "offer";
  /** Enkel tonen als er producten met een actieprijs zijn (anders een lege pagina). */
  alleenMetAanbiedingen?: boolean;
  /** Enkel in het mobiele menu: op desktop staat dezelfde bestemming al in de logorij. */
  enkelMobiel?: boolean;
};

/**
 * Hoofdnavigatie. "Catalogus" opent het megamenu dat volledig uit de categorieboom wordt
 * opgebouwd. ShopChrome filtert "Aanbiedingen" weg zolang er geen acties zijn.
 */
export const MAIN_NAV: NavItem[] = [
  { key: "catalogus", label: "Catalogus", href: routes.catalog(), mega: true },
  { key: "aanbiedingen", label: "Aanbiedingen", href: routes.offers(), accent: "offer", alleenMetAanbiedingen: true },
  { key: "nieuw", label: "Nieuw binnen", href: routes.newArrivals() },
  { key: "merken", label: "Merken", href: routes.brands() },
  { key: "op-maat", label: "Op maat & plaatsing", href: routes.services() },
  { key: "inspiratie", label: "Inspiratie & advies", href: routes.inspiration() },
  { key: "winkel", label: "Winkel & contact", href: routes.store(), enkelMobiel: true },
];

export type FooterColumn = { title: string; links: { label: string; href: string }[] };

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Klantendienst",
    links: [
      { label: "Contact", href: routes.store() },
      { label: "Levering & afhalen", href: routes.info("levering") },
      { label: "Retourneren", href: routes.info("retourneren") },
      { label: "Veelgestelde vragen", href: routes.info("veelgestelde-vragen") },
      { label: "Betaalmethoden", href: routes.info("betaalmethoden") },
    ],
  },
  {
    title: "Over Brunic",
    links: [
      { label: "Over ons", href: routes.info("over-ons") },
      { label: "Onze winkel in Ninove", href: routes.store() },
      { label: "Op maat & plaatsing", href: routes.services() },
      { label: "Gratis opmeting aan huis", href: routes.measurement() },
      { label: "Inspiratie & advies", href: routes.inspiration() },
    ],
  },
  {
    title: "Winkelen",
    links: [
      { label: "Catalogus", href: routes.catalog() },
      { label: "Merken", href: routes.brands() },
      { label: "Nieuw binnen", href: routes.newArrivals() },
      { label: "Mijn verlanglijst", href: routes.wishlist() },
      { label: "Mijn winkelmand", href: routes.cart() },
    ],
  },
  {
    title: "Juridisch",
    links: [
      { label: "Algemene voorwaarden", href: routes.info("algemene-voorwaarden") },
      { label: "Privacyverklaring", href: routes.info("privacy") },
      { label: "Herroepingsrecht", href: routes.info("herroepingsrecht") },
      { label: "Cookies", href: routes.info("cookies") },
    ],
  },
];
