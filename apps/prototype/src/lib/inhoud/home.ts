/**
 * Homepage-inhoud: metaobject `pagina_home` (handle "home") met zijn tegels
 * (`onderdeel_tegel`), anders de standaardinhoud uit src/data/home.ts.
 *
 * Regels voor de klant (staan ook in docs/agent-work/inhoud-metaobjects.md):
 * - Titels, knopteksten, links en de herofoto vallen terug op de standaard als ze leeg zijn.
 * - Optionele velden (label boven de titel, tweede knop, ondertitels) mogen leeg: dan verdwijnen ze.
 * - Een tegellijst leegmaken verbergt die rij; een tegel zonder titel of link wordt overgeslagen.
 * - Een interne link naar een pagina die niet bestaat (tikfout, product offline) wordt ook
 *   overgeslagen, met een waarschuwing in de log (lib/site/doel.ts → bestaatLink).
 */
import type { ImageRef } from "@/lib/catalog/types";
import { routes } from "@/lib/routes";
import { bestaatLink, resolveDoel } from "@/lib/site/doel";
import { SITE } from "@/lib/site/config";
import { CAMPAIGNS, HERO, INSPIRATION_TILES, SMALL_TILES, TRENDS } from "@/data/home";
import { metaobject, vulIn, type Inhoud } from "./shopify";

export type Tegel = { title: string; subtitle?: string; cta?: string; href: string; image?: ImageRef };

export type HomeInhoud = {
  hero: { ticket?: string; title: string; subtitle?: string; cta: { label: string; href: string }; secondary?: { label: string; href: string }; image: ImageRef };
  afdelingen: { title: string; subtitle?: string; tegels: Tegel[] };
  selecties: { title: string; kaarten: Tegel[] };
  nieuw: { title: string; cta: string };
  trends: { title: string; kaarten: Tegel[] };
  winkel: { label?: string; title: string; text: string; knopRoute: string; knopContact: string };
  inspiratie: { title: string; cta: string; tegels: Tegel[] };
  merken: { title: string; cta: string };
};

/** Tegels uit de code: enkel die waarvan het doel (categorie, product, artikel) bestaat. */
async function standaardTegels(items: { label?: string; title?: string; subtitle?: string; cta?: string; doel: Parameters<typeof resolveDoel>[0]; image: ImageRef }[]): Promise<Tegel[]> {
  const out: Tegel[] = [];
  for (const it of items) {
    const href = await resolveDoel(it.doel);
    if (href) out.push({ title: it.title ?? it.label ?? "", subtitle: it.subtitle, cta: it.cta, href, image: it.image });
  }
  return out;
}

async function standaard(): Promise<HomeInhoud> {
  return {
    hero: {
      ticket: HERO.ticket,
      title: HERO.title,
      subtitle: HERO.subtitle,
      cta: { label: HERO.cta.label, href: (await resolveDoel(HERO.cta.doel)) ?? routes.catalog() },
      secondary: HERO.secondary,
      image: HERO.image,
    },
    afdelingen: { title: "Welkom in onze afdelingen", subtitle: "Stoffen, behang, vloeren en tapijten — met het advies van onze winkel in Ninove.", tegels: await standaardTegels(SMALL_TILES) },
    selecties: { title: "Onze selecties", kaarten: await standaardTegels(CAMPAIGNS) },
    nieuw: { title: "Nieuw binnen", cta: "Alle nieuwigheden" },
    trends: { title: "De trends van het moment", kaarten: await standaardTegels(TRENDS) },
    winkel: {
      label: "Familiebedrijf sinds 1992",
      title: `Kom langs in onze winkel in ${SITE.address.city}`,
      text: "Voel de stoffen, bekijk de stalenboeken en krijg persoonlijk advies. Bewaar vooraf uw favorieten op uw verlanglijst en neem ze mee — zo vinden we samen snel wat bij uw interieur past.",
      knopRoute: "Route plannen",
      knopContact: "Openingsuren & contact",
    },
    inspiratie: { title: "Op zoek naar inspiratie?", cta: "Alle tips & inspiratie", tegels: INSPIRATION_TILES.map((t) => ({ title: t.title, href: t.href, image: t.image })) },
    merken: { title: "Onze merken", cta: "Alle merken" },
  };
}

/** Link uit de admin enkel gebruiken als de pagina bestaat (lib/site/doel.ts); anders melden in de log. */
async function geldig(href: string | undefined, waar: string): Promise<string | undefined> {
  if (!href) return undefined;
  if (await bestaatLink(href)) return href;
  console.warn(`[inhoud] Homepage (${waar}): link "${href}" verwijst naar een pagina die niet bestaat — overgeslagen. Pas ze aan in Shopify › Metaobjects › Pagina | Home.`);
  return undefined;
}

async function tegels(lijst: Inhoud[], waar: string): Promise<Tegel[]> {
  const out: Tegel[] = [];
  for (const t of lijst) {
    const title = t.tekst("titel");
    const href = await geldig(t.tekst("link"), `${waar} "${title ?? t.handle}"`);
    if (!title || !href) continue;
    out.push({ title, subtitle: t.tekst("ondertitel"), cta: t.tekst("knoptekst"), href, image: t.beeld("foto", title) });
  }
  return out;
}

export async function getHome(): Promise<HomeInhoud> {
  const [s, m] = await Promise.all([standaard(), metaobject("pagina_home", "home")]);
  if (!m) return s;
  const plaats = { gemeente: SITE.address.city, bedrijfsnaam: SITE.name };
  const link2 = await geldig(m.tekst("hero_link_2"), "hero, tweede knop");
  const tweede = m.tekst("hero_knoptekst_2") && link2 ? { label: m.tekst("hero_knoptekst_2")!, href: link2 } : undefined;

  return {
    hero: {
      ticket: m.tekst("hero_label"),
      title: m.tekst("hero_titel") ?? s.hero.title,
      subtitle: m.tekst("hero_ondertitel"),
      cta: { label: m.tekst("hero_knoptekst") ?? s.hero.cta.label, href: (await geldig(m.tekst("hero_link"), "hero")) ?? s.hero.cta.href },
      secondary: tweede,
      image: m.beeld("hero_foto", m.tekst("hero_titel") ?? s.hero.title) ?? s.hero.image,
    },
    afdelingen: { title: m.tekst("afdelingen_titel") ?? s.afdelingen.title, subtitle: m.tekst("afdelingen_ondertitel"), tegels: await tegels(m.lijst("afdelingen_tegels"), "afdelingen") },
    selecties: { title: m.tekst("selecties_titel") ?? s.selecties.title, kaarten: await tegels(m.lijst("selecties_kaarten"), "selecties") },
    nieuw: { title: m.tekst("nieuw_titel") ?? s.nieuw.title, cta: m.tekst("nieuw_knoptekst") ?? s.nieuw.cta },
    trends: { title: m.tekst("trends_titel") ?? s.trends.title, kaarten: await tegels(m.lijst("trends_kaarten"), "trends") },
    winkel: {
      label: m.tekst("winkel_label"),
      title: vulIn(m.tekst("winkel_titel") ?? s.winkel.title, plaats),
      text: vulIn(m.tekst("winkel_tekst") ?? s.winkel.text, plaats),
      knopRoute: m.tekst("winkel_knop_route") ?? s.winkel.knopRoute,
      knopContact: m.tekst("winkel_knop_contact") ?? s.winkel.knopContact,
    },
    inspiratie: { title: m.tekst("inspiratie_titel") ?? s.inspiratie.title, cta: m.tekst("inspiratie_knoptekst") ?? s.inspiratie.cta, tegels: await tegels(m.lijst("inspiratie_tegels"), "inspiratie") },
    merken: { title: m.tekst("merken_titel") ?? s.merken.title, cta: m.tekst("merken_knoptekst") ?? s.merken.cta },
  };
}
