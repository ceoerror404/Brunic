import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site/config";

/** Enkel de productieomgeving (SITE_INDEXEREN=1) laat crawlers binnen. */
export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_INDEXEREN !== "1") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    // ?product= / ?verlanglijst=: het aanvraagformulier voorgevuld vanaf elke productpagina (routes.quote) —
    // anders kruipt een zoekmachine duizenden kopieën van de contact- en opmetingspagina af.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/winkelmand", "/verlanglijst", "/zoeken", "/*?product=", "/*?verlanglijst="] },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
