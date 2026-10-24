/**
 * Structured data (schema.org JSON-LD) en canonieke URL's. Offers enkel op producten
 * met een echte prijs (architectuur.md §Migratie & SEO): etalage/"prijs op aanvraag"
 * krijgt een Product zonder Offer.
 */
import type { CategoryNode, Product, SalesUnit } from "@/lib/catalog/types";
import { normalize } from "@/lib/catalog/search";
import { routes } from "@/lib/routes";
import { SITE } from "./config";

export const absoluteUrl = (path: string) => `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;

const ORG_ID = `${SITE.url}/#winkel`;

/** Platte tekst → meta description: opsommingstekens weg, ingekort op een woordgrens. */
export function metaDescription(text: string | undefined, max = 155): string | undefined {
  const plat = text
    ?.replace(/\s*•\s*/g, "; ")
    .replace(/:\s*;\s*/g, ": ")
    .replace(/^;\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!plat) return undefined;
  if (plat.length <= max) return plat;
  const kort = plat.slice(0, max - 1);
  return `${kort.slice(0, kort.lastIndexOf(" ") > max * 0.6 ? kort.lastIndexOf(" ") : kort.length).replace(/[\s,;:.–-]+$/, "")}…`;
}

/** "Gordijnstof Movement": het type enkel ervoor als de titel het nog niet zegt (vaak is de titel enkel een modelnaam). */
function productKern(p: Product): string {
  const type = p.facets.type?.[0];
  return type && !normalize(p.title).includes(normalize(type)) ? `${type} ${p.title}` : p.title;
}

const kernTelling = new WeakMap<Product[], Map<string, number>>();

/**
 * Paginatitel van een product: "Gordijnstof Movement · ADO". Dragen meerdere producten dezelfde
 * naam (zelfde ontwerp in een andere collectie), dan komt de collectie erbij.
 */
export function productMetaTitle(p: Product, all: Product[]): string {
  let telling = kernTelling.get(all);
  if (!telling) {
    telling = new Map();
    for (const x of all) telling.set(`${productKern(x)}|${x.brand}`, (telling.get(`${productKern(x)}|${x.brand}`) ?? 0) + 1);
    kernTelling.set(all, telling);
  }
  const kern = productKern(p);
  const dubbel = (telling.get(`${kern}|${p.brand}`) ?? 0) > 1 && p.line && !normalize(kern).includes(normalize(p.line));
  const naam = dubbel ? `${kern} (${p.line})` : kern;
  return p.brand && !normalize(naam).includes(normalize(p.brand)) ? `${naam} · ${p.brand}` : naam;
}

/** Meta description van een product: de beschrijving, aangevuld met wat het product is en wat u kunt doen. */
export function productMetaDescription(p: Product): string | undefined {
  const wat = `${productKern(p)}${p.brand ? ` van ${p.brand}` : ""}`;
  const tekst = normalize(p.description).includes(normalize(p.title)) ? p.description : `${wat}. ${p.description}`.trim();
  const actie = p.pricing === "fixed" ? "Bestel online of vraag advies in onze winkel in Ninove." : "Vraag een offerte aan of kom langs in onze winkel in Ninove.";
  // Korte beschrijving: de oproep erbij, maar enkel als die er volledig bij past.
  const metActie = `${tekst.replace(/[.\s]*$/, ".")} ${actie}`;
  return metaDescription(metActie.length <= 155 ? metActie : tekst);
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    name: SITE.name,
    url: SITE.url,
    inLanguage: "nl-BE",
    publisher: { "@id": ORG_ID },
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HomeGoodsStore",
    "@id": ORG_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    description: SITE.description,
    url: SITE.url,
    logo: absoluteUrl("/brand/logo-kleur.png"),
    image: absoluteUrl("/brand/logo-kleur.png"),
    telephone: SITE.phone.e164,
    email: SITE.email,
    foundingDate: SITE.foundingDate,
    ...(SITE.companyNumber ? { vatID: SITE.companyNumber } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      postalCode: SITE.address.postalCode,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.region,
      addressCountry: SITE.address.countryCode,
    },
    openingHoursSpecification: SITE.openingHours.map((o) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: o.days, opens: o.opens, closes: o.closes })),
    hasMap: SITE.mapsUrl,
    areaServed: "Ninove en de Denderstreek",
    sameAs: SITE.social.map((s) => s.href),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

/** Kruimelpad Home › Catalogus › … › categorie (voor categorie- en productpagina's). */
export function categoryCrumbs(trail: CategoryNode[]) {
  return [{ name: "Home", path: "/" }, { name: "Catalogus", path: routes.catalog() }, ...trail.map((t) => ({ name: t.name, path: routes.category(t) }))];
}

/** UN/CEFACT-code voor prijzen per lengte of oppervlakte; per stuk, rol of set is de prijs gewoon die van het artikel. */
const PRIJS_PER: Partial<Record<SalesUnit, { code: string; tekst: string }>> = {
  meter: { code: "MTR", tekst: "per lopende meter" },
  m2: { code: "MTK", tekst: "per m²" },
};

function offers(p: Product) {
  const geprijsd = p.variants.filter((v) => v.price && v.price.amount.amount > 0);
  if (p.pricing !== "fixed" || geprijsd.length === 0) return undefined;
  const bedragen = geprijsd.map((v) => v.price!.amount.amount);
  const [laag, hoog] = [Math.min(...bedragen), Math.max(...bedragen)];
  const per = PRIJS_PER[geprijsd[0].price!.unit];
  const availability = geprijsd.some((v) => v.availability === "op-voorraad" || v.availability === "beperkt")
    ? "https://schema.org/InStock"
    : geprijsd.some((v) => v.availability === "op-bestelling")
      ? "https://schema.org/BackOrder"
      : "https://schema.org/OutOfStock";
  // Vinyl kost bv. € 11,99 per m²: zonder eenheid leest een zoekmachine dat als prijs per stuk.
  const eenheid = (bedrag: Record<string, string>) =>
    per
      ? {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            ...bedrag,
            priceCurrency: "EUR",
            unitText: per.tekst,
            referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: per.code },
          },
        }
      : {};
  const basis = { priceCurrency: "EUR", availability, itemCondition: "https://schema.org/NewCondition", url: absoluteUrl(routes.product(p.slug)), seller: { "@id": ORG_ID } };
  // Eén prijs → Offer; verschillende prijzen per variant → AggregateOffer met de volledige vork.
  return laag === hoog
    ? { "@type": "Offer", price: laag.toFixed(2), ...basis, ...eenheid({ price: laag.toFixed(2) }) }
    : {
        "@type": "AggregateOffer",
        lowPrice: laag.toFixed(2),
        highPrice: hoog.toFixed(2),
        offerCount: geprijsd.length,
        ...basis,
        ...eenheid({ minPrice: laag.toFixed(2), maxPrice: hoog.toFixed(2) }),
      };
}

export function productJsonLd(p: Product, categoryName?: string) {
  const aanbod = offers(p);
  // Kenmerken als machineleesbare eigenschappen. Niet de verkoopeenheid: die valt soms terug op "Per stuk" (TODO B08).
  const eigenschappen = [...p.specs, ...p.dimensions].filter((s) => s.label !== "Merk" && s.label !== "Verkoopeenheid");
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    url: absoluteUrl(routes.product(p.slug)),
    image: p.images.slice(0, 6).map((i) => i.src),
    description: metaDescription(p.description, 500),
    sku: p.variants[0]?.sku,
    ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
    ...(categoryName ? { category: categoryName } : {}),
    ...(p.facets.materiaal?.length ? { material: p.facets.materiaal.join(", ") } : {}),
    ...(eigenschappen.length ? { additionalProperty: eigenschappen.map((s) => ({ "@type": "PropertyValue", name: s.label, value: s.value })) } : {}),
    ...(aanbod ? { offers: aanbod } : {}),
  };
}
