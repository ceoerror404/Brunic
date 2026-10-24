# Taak: SEO-, AI-search- en conversie-audit + gerichte verbeteringen

**Eigenaar:** Alexander (met Claude) · 20/10/2026 · bouwt verder op de niet-gecommitte wijzigingen van `productieklaar.md` en `inhoud-metaobjects.md` (niets teruggedraaid). Prijsweergave valt buiten scope; enkel de juistheid van de Product/Offer-structured data is gecontroleerd.

**Status:** code klaar en lokaal geverifieerd, **niet gecommit of gedeployd** (git ontbreekt op deze pc). Kopieën van de originele bestanden: scratchpad van de sessie (`backup-voor-seo/`).

## Gewijzigde bestanden (apps/prototype)
- `src/app/(winkel)/product/[slug]/page.tsx`: "Dit vindt u misschien ook leuk" (`ookLeuk`), metatitel en -beschrijving
- `src/lib/site/seo.ts`: `metaDescription`, `productMetaTitle`, `productMetaDescription`, `websiteJsonLd`, Offer-correcties, `additionalProperty`, `hasMap`
- `src/app/(winkel)/catalogus/[...pad]/page.tsx`: titel zonder herhaalde ouder, beschrijving op woordgrens
- `src/app/(winkel)/merken/[merk]/page.tsx`: titel met producttypes, beschrijving belooft opmeting/plaatsing enkel waar Brunic die levert
- `src/app/(winkel)/page.tsx`: WebSite-JSON-LD
- `src/app/robots.ts`: `Disallow: /*?product=` en `/*?verlanglijst=` (enkel op productie)
- `src/app/sitemap.ts`, `src/lib/catalog/types.ts`, `src/lib/catalog/shopify-adapter.ts`: `lastmod` per product (`updatedAt` uit Shopify)

## Audit: wat al goed zit (niet aanraken)
- Indexeren enkel met `SITE_INDEXEREN=1`; previews blijven noindex + `Disallow: /`.
- Canonicals op alle indexeerbare templates; gefilterde/gesorteerde lijsten zijn `noindex, follow` + canonical; filters zijn knoppen (geen facet-explosie).
- PDP volledig server-side (B02), h1 op elke PDP; kruimelpad-JSON-LD op PDP, categorie, merk, artikel en dienst; HomeGoodsStore met NAP, uren en KBO; Article-JSON-LD.
- 2.061 oude WooCommerce-URL's → 308.
- Beelden: Shopify-CDN met `srcset`, vaste beeldverhoudingen (geen CLS door beelden), alt-tekst op 37.506 van de 37.506 beelden.
- Inhoud: feitelijke categorie-intro's, 8 dienstpagina's, 10 artikels, 16 FAQ's; `maatwerk.ts` voorkomt valse beloftes (geen opmeting bij behang).
- Conversie op de PDP: uitleg bij "prijs op aanvraag", offerteknop met product voorgevuld, telefoonblok, kleverige bestelbalk, verlanglijst → offerte, winkelbezoek-CTA's.
- AI-crawlers (GPTBot, ClaudeBot, PerplexityBot …) zijn toegelaten via `User-Agent: *`; blokkeren is een keuze van Brunic.

## Bevindingen en plan

| Onderdeel | Huidige situatie | Verbetering | Impact | Risico | Prio | Status |
|---|---|---|---|---|---|---|
| Interne links naar producten | Lijsten tonen 48 producten, "meer tonen" is een knop; "ook leuk" toonde op elke PDP dezelfde 10 populairste. Model: 962/4.111 producten (23 %) bereikbaar via links, de rest enkel via de sitemap | Zelfde collectie eerst, dan gespreide buren in dezelfde (sub)categorie | Indexatie van de long tail (merk + model + collectie) | Laag (zelfde component) | P1 | ✅ |
| Offer-JSON-LD | 277 vinylvloeren € x **per m²** gepubliceerd zonder eenheid; ook één prijs als `AggregateOffer`; nooit `OutOfStock` | `Offer` bij één prijs, `AggregateOffer` met `highPrice` bij een vork, `UnitPriceSpecification` (MTK/MTR), juiste beschikbaarheid | Geen misleidende prijs in Google | Laag | P1 | ✅ |
| Crawlbudget | Elke PDP linkt naar een eigen voorgevulde formulier-URL (`?product=…`): ±4.100 kopieën van contact/opmeting | `Disallow: /*?product=` | Crawl gaat naar producten | Laag (canonical bleef) | P1 | ✅ |
| PDP-titels | "Behang bladmotief wit · Behang · ESTAhome": type dubbel, 1.526 titels > 70 tekens, 337 dubbele | Type enkel als de titel het niet zegt; bij dubbele naam de collectie erbij | Leesbare SERP-titels | Laag | P1 | ✅ (> 70: 926; dubbel: 180) |
| PDP-description | `slice(0,160)` midden in een woord; 276 gedeelde teksten | Woordgrens, wat/van wie vooraan als dat ontbreekt, oproep als die volledig past | CTR | Laag | P2 | ✅ |
| Categorietitels | "Effen behang · Behang", "Isolerende & verduisterende stoffen · Gordijnen & stoffen" | Ouder enkel als de naam hem niet zegt | Kortere, natuurlijke titels | Laag | P2 | ✅ |
| Merkpagina's | Titel "ESTAhome bij Brunic"; description beloofde "opmeting en plaatsing" ook bij behangmerken | "Boråstapeter: behang en fotobehang op maat"; dienst volgens `maatwerk.ts` | Merk+type-zoekopdrachten, juistheid | Laag | P2 | ✅ |
| Sitenaam, sitemap | Geen WebSite-JSON-LD; geen `lastmod` | WebSite-JSON-LD, `hasMap`, `lastmod` | Sitenaam in Google, recrawl | Laag | P2 | ✅ |
| Rendering lijstpagina's | `/catalogus/[...pad]` en `/merken/[merk]` zijn dynamisch per request (lezen `searchParams`): geen CDN-cache; lab-LCP mobiel 6,4 s op behang | Kale URL statisch/ISR, filters apart | CWV, serverkosten | Middel (architectuur) | P2 | Voorstel |
| Categorie-inhoud | Behang: "van Arte en Boråstapeter", maar online 0 Arte en vooral ESTAhome (1.600) en Origin (591); vloerbekleding-intro noemt geen vinylmerken (277 vinyl) | Brunic past teksten aan in Shopify (Categorie \| Tekst en foto) | Vertrouwen, AI-antwoorden | Geen code | P2 | Brunic |
| FAQ per afdeling | Categorielandingen hebben geen koopvragen | Bestaande FAQ's per afdeling tonen (Accordion hergebruiken) | Minder twijfel, AEO | Laag | P2 | Voorstel |
| Productbeschrijvingen | 1.017 < 100 tekens; 47× "Dit Zweedse behang onderscheidt zich…"; Gerflor als ruwe specificatietekst | Verrijken in de pipeline (`packages/catalog`) uit de specificaties | Unieke content | Middel | P2 | Pipeline |
| Product zonder Offer | 3.698 producten op aanvraag → Product-JSON-LD zonder `offers`: Search Console meldt "ongeldig item" voor productfragmenten (geen straf) | Lost zich op met prijzen (B06) | — | — | Info | Bewust zo |
| GTIN | Barcodes niet gesynchroniseerd | Na prijzen: `barcode` mee ophalen voor Merchant Center | Shopping | Laag | P3 | Voorstel |
| Winkel & contact | H1 "Hulp nodig?" | Lokale H1 (bv. "Winkel & contact in Ninove") in dezelfde stijl | Lokale zoekintentie | Laag | P3 | Voorstel |

Al bekend en niet herhaald: TODO.md (B01, B06, B08, B14, B16–B20), homepage-tegel `/product/behang-nastri-arte` (inhoud-metaobjects.md).

## Verificatie (20/10/2026, lokale productiebuild, momentopname 20/10 15:52)
- `tsc --noEmit` ✅ · `eslint .` ✅ (0 errors, dezelfde 7 bestaande warnings) · `next build` ✅ (zonder prebuild-sync).
- Crawl van de productiebuild met `SITE_INDEXEREN=1` en de robots-regels van productie, vanaf `/`, enkel via `<a href>`: 4.195 pagina's, allemaal 200; **4.111/4.111 productpagina's bereikbaar**, klikdiepte vanaf home mediaan 4, max 10; 0 PDP's zonder h1; 0 JSON-LD-parsefouten; 281 `Offer` + 132 `AggregateOffer`, waarvan 277 met eenheid per m²; meta description 90–155 tekens, nooit leeg.
- robots.txt en sitemap.xml (4.187 URL's, 4.111 producten met `lastmod`) gecontroleerd; daarna opnieuw gebouwd zonder `SITE_INDEXEREN`.
- Nulmeting interne links (23 %) komt uit een model van de code op de momentopname, niet uit een crawl; het model voorspelde voor de nieuwe versie 100 % en max. 8 klikken vanaf een lijstpagina, wat de crawl bevestigt.

## Niet getest
- Visuele controle in een browser (wel: de "ook leuk"-carrousel toont 10 producten, eerst uit dezelfde collectie).
- Rich Results Test / Search Console (pas na livegang).
- Gedrag op Vercel (enkel lokaal).

## Strategische uitbreidingen (later)
1. Prijzen in Shopify + Merchant Center via het Google-kanaal van Shopify: de grootste hefboom; zonder prijs geen Shopping/merchant listings.
2. Behangcalculator ("hoeveel rollen heb ik nodig?") op de ±2.700 behang-PDP's: uniek, vermindert twijfel, levert leads op.
3. Collectiepagina's (bv. Boråstapeter Adorn), enkel als Search Console vraag toont.
4. Lokaal vertrouwen: Google Business Profile op naam van Brunic, echte reviews, eigen atelier- en projectfoto's.
5. `pnpm seo:check` in de build: de crawl van deze taak als test (titels, descriptions, h1, JSON-LD, bereikbaarheid).

## Volgende actie
Alexander/Jeroen: diff nakijken samen met `productieklaar.md`, committen, preview-deploy, enkele PDP's door de Rich Results Test halen. Brunic: categorieteksten behang/vloerbekleding bijwerken in Shopify.
