import { NextResponse, type NextRequest } from "next/server";
import oud from "@/data/oude-urls.json";

/**
 * Product-URL's van de oude WooCommerce-site (/product/<oude-slug>) → route handler
 * app/oude-site/product/[slug], die de best passende nieuwe pagina kiest en met een 308
 * doorstuurt (lib/site/oude-urls.ts).
 *
 * Waarom niet in de productpagina zelf: permanentRedirect() tijdens de eerste (on-demand
 * ISR) render gaf twee Location-headers, wat Chrome weigert. Geen enkele oude slug is ook
 * een nieuwe Shopify-handle (gecontroleerd 20/10/2026), dus deze lijst volstaat om te
 * beslissen — zonder de catalogus te laden.
 */
const OUDE_SLUGS = new Set(Object.keys((oud as { producten: Record<string, unknown> }).producten));

export function proxy(request: NextRequest) {
  const slug = decodeURIComponent(request.nextUrl.pathname.slice("/product/".length));
  if (!OUDE_SLUGS.has(slug)) return NextResponse.next();
  const doel = request.nextUrl.clone();
  doel.pathname = `/oude-site/product/${encodeURIComponent(slug)}`;
  return NextResponse.rewrite(doel);
}

export const config = { matcher: ["/product/:slug"] };
