# Architectuur — Brunic webshop

> Beslist op 06-08/07/2026 (dossier: J.A.R.V.I.S `clients/brunic/`, decisions/log.md). Dit doc = de bouwkant; open punten staan onderaan.

## Stack (beslist)
- **Front:** Next.js (App Router) + Tailwind, deploy op Vercel (team fruitcocktailbe-projects). nl-BE only. Géén Hydrogen/Oxygen — afweging in [ADR 0001](adr/0001-nextjs-vercel-geen-hydrogen-oxygen.md); wél `@shopify/hydrogen-react` als bibliotheek binnen Next.js.
- **Commerce-motor:** **headless Shopify** via de Storefront API ("optie B", beslist 06/07) — de motor is inwisselbaar, de front is van ons. Checkout blijft Shopify-hosted (Basic-plan: enkel logo/kleur-branding).
- **Chatbot:** eigen service (spec: dossier-doc 14 — herijken op 13.9k catalogus); productgids + FAQ + lead-capture → terugbelformulier. Anthropic-key met spend-cap (constructie: zie dossier 17).
- **Catalogus-pipeline:** de trechter (Python) uit het dossier wordt hier een echte pipeline: ERP-exports + WooCommerce-export → verrijking (prijzen, foto's, nette titels, metafields) → Shopify bulk-import (JSONL). Herhaalbaar — correctierondes zijn her-runs, geen handwerk.

## Voorgestelde repo-structuur (mini-monorepo)
```
apps/prototype    # Next.js storefront (de enige front; apps/web verwijderd op 20/10/2026)
services/chatbot  # chatbot-service (later; spec eerst)
packages/catalog  # trechter → verrijking → Shopify-import (Python/Node)
docs/             # design-brief, architectuur, ADR's
data/             # ruwe exports — GITIGNORED, device-local
```

## Shopify-aanpak
- ✅ **Dev-store live: `brunic-3.myshopify.com`** (Partner-account van HackersQuattro, plan Development, EUR/BE — aangemaakt 08/07, claude.ai-Shopify-connector eraan gekoppeld). ⚠️ Store-timezone staat op EDT — bij de settings-pass op Europe/Brussels zetten (admin UI, niet via API).
- Bouwen in deze **gratis Partner development store**; overdracht naar Bruno's betaalde Basic-store bij livegang (Bruno = store owner, wij = collaborator — eigendomsprincipe).
- Vóór de offerte-details vastklikken: verifiëren dat **Basic** volstaat — Storefront API-limieten, Search & Discovery-filters op metafields, checkout-branding. Geen Plus-features beloven.
- Shopify Payments + Bancontact (KYC door Bruno — vroeg starten).

## Datamodel — beslist 08/07 (geverifieerd op shopify.dev)
1. **✅ Variantenmodel: varianten per product, GEEN aparte producten per maat** (Jeroen, 08/07). Eén product per design/kleur; maten = varianten. Technisch gedekt: de variant-limiet is sinds 15/10/2025 **2048 voor alle merchants** via de GraphQL product-API's ([changelog](https://shopify.dev/changelog/the-product-variant-limit-is-now-2048-for-all-merchants)) — tapijten hebben er typisch 5-15, ruim binnen limiet. Let op: enkel de GraphQL-API's ondersteunen >100 (REST-apps niet — geen probleem, wij bouwen GraphQL-only).
2. **✅ Maatfilter-ontwerp (dé belangrijkste filter):** per variant een option "Maat" ("160 × 230 cm") + **numerieke variant-metafields `breedte_cm` / `lengte_cm`**. Geverifieerd: Storefront API `productFilters` ondersteunt `productMetafield`/`variantMetafield` op numeric_integer/decimal/tekst/boolean, maar **enkel exacte waarden — geen numerieke ranges** (alleen prijs heeft een range-filter; [docs](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/filter-products)). Daarom: **bucket-filters** in de UI ("tot 120" · "120–170" · "170–240" · "240+ cm") die elk vertalen naar een OR-lijst van discrete metafield-waarden (OR binnen een filter, AND tussen filters = native S&D-gedrag). Werkt perfect omdat tapijten in vaste handelsmaten komen. Upgrade-pad als ooit een échte slider gewenst is: eigen zoekindex (Meilisearch/Typesense) — geen startvereiste. Webcategorieën worden Shopify-**collections** (filters werken binnen collections).
3. **Metafields dag 1** (filterable gedefinieerd via Search & Discovery): breedte/lengte · poolhoogte + hoog/laagpolig · materiaal · kleurfamilie · stijl/design · brandvertragend-certificaat · **etalage-vlag** · ERP-familiecode. Schema per categorie in `packages/catalog/schema` (tapijten ≠ behang ≠ stoffen).
4. **Per-meter-verkoop** (open): 0,1m-increment vs. lengte-invoer (line-item properties). Minimale afname + snij-increment bij Sandra ophalen.
5. **Eenheden-normalisatie** (beslist 14/07 + aanvulling 02/08): stoffen per **lopende meter** óf per **kamerhoogte** (rol van 2,70/3,20 m — verkoopmodel kamerhoogte nog bij Sandra, J.A.R.V.I.S doc 20 punt 8) · vloerbekleding per **m²** · behang per **rol** (meestal 10 m × 0,53 m). Metafield `brunic.verkoop_eenheid` (aangemaakt 02/08) draagt de eenheid per product.
6. **ERP-sync-model** (open): eenmalige import vs. periodieke handmatige export. Voorraad tonen: ja/nee/"op aanvraag" per categorie.

## Filters & facetten (beslist 11/07/2026)

**Twee mechanismen, bewust gescheiden:**
1. **Maat = eigen route** (`/[collection]/maat/[bucket]`) — statisch, indexeerbaar, deelbaar, werkt zonder JS. Buckets (`tot 120 · 120–170 · 170–240 · 240+`) vertalen naar een OR-lijst van discrete `breedte_cm`-waarden (Storefront kent geen numerieke ranges). Zie §Datamodel.
2. **Generieke facets = query-string** (`?kleur=Beige&materiaal=Wol`) — kleur, materiaal, poolklasse… Meerdere waarden binnen één facet = OR, verschillende facets = AND (native S&D-gedrag). Gefilterde combinaties zijn **`noindex` + canonical → het kale pad** (geen facet-explosie in de index). Maat + facets composeren: de facet-querystring blijft behouden bij het wisselen van maat-bucket.

**Implementatie (sinds 20/10/2026 enkel `apps/prototype`):** `src/lib/catalog/filters.ts` (`FACETS`) + `components/catalog/product-listing.tsx`; de filters rekenen op de catalogus-momentopname (waarden uit de metafields via `shopify-adapter.ts`), niet op Search & Discovery. Routes: `/catalogus/<hoofd>/<sub>` met filters in de querystring. *(De maat-route `/[collection]/maat/[bucket]` hierboven was de implementatie van het verwijderde `apps/web`.)* Facets zijn exact-match op metafield-waarden; numerieke assen (rolbreedte) krijgen dezelfde bucket-behandeling als maat. Alleen prijs heeft een native range-filter.

**Voorgestelde facet-taxonomie per webcategorie** (Kleur + Prijs + Beschikbaarheid overal; later Merk zodra de leverancierslijst er is):

| Categorie | Facets (naast Kleur/Prijs/Beschikbaarheid) |
|---|---|
| **Tapijten** | Maat (breedte-bucket) · Materiaal · Poolklasse (hoog/laagpolig) · Stijl (modern/klassiek) · Vorm (rond/vierkant/speciaal) — stijl & vorm dragen ook de subcollecties |
| **Behang** | Patroon (effen/bloemen/streep — draagt de subcollecties) · Type (vlies/vinyl) · Rolbreedte (bucket) · Wasbaarheid |
| **Gordijnen & stoffen** | Type (black-out/voile/living/project) · Transparantie · Patroon (effen/tekening) · Brandvertragend (B2B) · Wasbaarheid |
| **Vloerbekleding** | Type (vinyl/click/vasttapijt/gras/rubber/coco) · Look (click vinyl: parket/uniform/tegel) · Houttint · Slijtklasse · Waterbestendig · Toepassing |
| **Verf** | Finish (mat/satijn/glans) · Toepassing (muur/plafond/hout/buiten) · Binnen/buiten · Verpakking (L) · Merk |
| **Raamdecoratie** | Type (rolgordijn/duo/plissé) · Lichtdoorlatendheid · Maat |
| **Slapen & wonen** | subcategorie-afhankelijk |

**Status (02/08):** live op het staal = Kleur (universeel), Materiaal + Poolklasse (tapijten). Metafield-definities die al bestaan: `materiaal, kleurfamilie, poolklasse, brandvertragend_norm, breedte_cm, lengte_cm` + sinds 02/08 `patroon, stijl_design, vorm, look, toepassing, rolbreedte_cm, verkoop_eenheid`. **Nog toe te voegen (iteratie):** `type, transparantie, finish` + de bijhorende S&D-filters (⚠️ filters aanzetten kan enkel handmatig in de Search & Discovery-app, niet via API). Dit blijft bewust open: de definitieve facetlijst per categorie hangt af van **welke producten er straks echt zijn en welke attributen de leveranciersfeeds meegeven** — pas invullen wanneer de echte catalogus + supplier-attributen bekend zijn (zie J.A.R.V.I.S doc 17 §8 Lane C).

## Productdata: bron van waarheid (beslist 08/07 — de PIM-vraag)
**Drie lagen, één bron — géén losse Excel als master, géén Shopify-admin als master:**
1. **Bron = de catalog-pipeline in dit repo** (`packages/catalog`): gestructureerde dataset (SQLite; schema git-versioned, data gitignored). Álle verrijking landt hier programmatisch: ERP-joins, leveranciers-scraping (poolhoogte, kleur, design, materiaal, patroon…), foto-mapping, nette titels. Herhaalbare her-runs (trechter-principe) — dat kan niet als de admin of een Excel de master is.
2. **Shopify = publicatiekanaal**: de pipeline pusht via **`productSet` (bulk/JSONL)** — de door Shopify gedocumenteerde route voor sync vanuit een externe bron. Veld-eigenaarschap vastleggen: pipeline-owned (attributen, metafields, beelden, titels — overschreven bij sync) vs. admin-owned (prijs-tweaks, status, voorraad — nooit overschreven). Zo blijft de admin bruikbaar voor Aga zonder drift.
3. **AI leest uit dezelfde bron**: de chatbot krijgt de catalog-DB als kennisbank (filter-tools op attributen: "laagpolig wollen tapijt in beige tot 170 breed" = query, geen hallucinatie) + productteksten voor retrieval. Niet terug-scrapen via de Shopify-API — zelfde data, drie afnemers (site-filters, Shopify, AI), nul drift.
**Review-laag voor het team:** CSV-export per categorie → Sandra/Aga vinken af in een sheet → pipeline leest terug in. De sheet is een *interface*, nooit de bron.

## Foto's & CDN (beslist 08/07)
**Alle productfoto's op Shopify (product-media/Files → Shopify CDN), niet op Vercel.**
- Shopify CDN + opslag zit in het abonnement; limiet 20 MB / 20 MP per beeld (aanbevolen ~2048px — batch-herschalen bij upload); Shopify genereert automatisch responsive formaten; on-the-fly transformaties via `image.url(transform: {maxWidth, preferredContentType: WEBP})`.
- **next/image met een custom Shopify-loader** die die CDN-transformaties gebruikt → Vercel Image-Optimization-kost ≈ €0 (anders betaalt Vercel-transformatiepricing op 14k producten × formaten de marge op de maandvergoeding op). Vercel serveert enkel UI-assets.
- Eigendom: beelden zitten in Bruno's store (verkoopverhaal) en elk later kanaal (Google Shopping-feed) leest ze gratis mee; koppeling beeld↔product/variant is ook in de admin zichtbaar voor Aga.
- Upload-route: gescrapete beelden → staging `data/media/` (artikelnummer-genaamd, bron+licentie gelogd) → staged uploads + koppeling via `productSet`.

## URL-structuur (beslist 12/07/2026)
**Producten blijven op een plat pad `/product/<slug>`, niet genest onder de categorie.** Collecties zijn `/[collection]`; generieke facets leven in de query-string (zie §Filters). Waarom plat:
- Een product hoort vaak in **meerdere categorieën** (badmat = Tapijten én later Badkamer). Nesten dwingt één canonical-ouder af en geeft duplicate-content/canonical-problemen zodra hetzelfde product via meerdere paden bereikbaar is. Plat = exact één URL per product.
- Het is **Shopify's eigen conventie** (`/products/handle`); Google heeft er geen enkel probleem mee.
- **Mapdiepte is een verwaarloosbaar rankingsignaal** — de keyword-rijke *slug* draagt de waarde, niet het `/product/`-voorvoegsel.
- **Stabiliteit = linkwaarde:** herclassificeren mag de product-URL niet breken. Een plat pad leeft even lang als het product; een genest pad zou bij elke hercategorisering een 301 vergen.
- Hiërarchie geven we door via **BreadcrumbList-JSON-LD** + het zichtbare kruimelpad (PDP toont Home › webcategorie › [subcategorie] › product o.b.v. de échte collecties van het product), niet via het pad.

**Gevolg voor de pipeline:** genereer **propere keyword-slugs** (naam + kleur + maat, géén ERP-/ontwerpcodes; de staal-handles als `tapijt-ravenna-057-0119-9295` zijn precies wat te vermijden is).

**Subcategorieën (indeling beslist 02/08 — klant-conventies, J.A.R.V.I.S doc 11 §v3).** Per hoofdcategorie komen subcategorieën (Behang › Effen/Bloemen/Streep/Jeugd…, Tapijten › Modern/Klassiek/Rond… — patroon/stijl/vorm-gedreven; materiaal en herkomst zijn facetten). Dat is een **collectie**-niveau, niet productniveau: het platte product-pad blijft `/product/<slug>`.
- ✅ **Sub-collectie-URL = genest: `/behang/effen`.** Een subcategorie heeft precies één ouder, dus nesten mag hier wél (anders dan bij producten, die in meerdere categorieën zitten). Route wordt `/[collection]/[subcollection]`; let op de reservering van `maat` als subpad (`/[collection]/maat/[bucket]`) — subcollectie-slugs mogen daar niet mee botsen.
- Het **kruimelpad** wordt dan Home › Behang › Vliesbehang › product.
- **Pas dán** de **BreadcrumbList + Product/Offer-JSON-LD** op de PDP bouwen, zodat ze het volledige (diepere) pad weerspiegelen — daarom nu bewust nog niet gebouwd. Offer enkel op koopbare, niet-etalage items.
- ✅ **Klant-input ontvangen én gebouwd 02/08:** hoofdnav hernoemd naar **Gordijnen & stoffen · Behang · Vloerbekleding · Tapijten** (Shopify-handles `vloerbekleding`, `tapijten`); 29 subcollecties aangemaakt en gepubliceerd op Brunic Headless, handle-conventie **`<hoofdprefix>-<sub>`** (`stoffen-effen`, `tapijten-modern`…). Click-vinyl-looks (parket/uniform/tegel) = facet `look`, geen derde routeniveau. De **familie→sub-mapping per artikel** vergt nog verrijkte attributen (Lane C, doc 17 §8).

**Implementatie in de front — nu (`apps/prototype`, de enige front sinds 20/10/2026):** de boom volgt uit `src/data/shopify-bron.ts` — hoofdcategorieën vast in `src/data/categories.ts`, subcategorieën via het handle-voorvoegsel (`SHOPIFY_SUB_VOORVOEGSEL`, uitzonderingen in `SHOPIFY_SUB_EXTRA`), URL `/catalogus/<hoofd>/<sub>`; een lege collectie verschijnt nergens. Een subcategorie toevoegen = enkel de collectie in Shopify.

*Historisch (02/08, het verwijderde `apps/web`; de punten hieronder beschrijven die implementatie):* `apps/web/src/lib/shopify/taxonomie.ts` was de **enige bron** van de boom — Shopify kent géén hiërarchie tussen collecties, en het handle-voorvoegsel is een conventie, geen relatie (`gordijnen-stoffen` › `stoffen-effen` breekt ze al). Routes, kruimelpaden, de chips op de PLP en het dropdownmenu lezen alle vier uit die tabel; een subcategorie toevoegen = één regel daar + de collectie in Shopify.
- **Eén URL per subcategorie, afgedwongen in code.** De route is `/[collection]/[subcollection]` (`/behang/effen`); de kale handle `/behang-effen` en `/stoffen-effen` geven **404** — anders zou `/[collection]` elke subcollectie een tweede, indexeerbare URL geven (duplicate content). `dynamicParams = false` op de subroute: onbekende slugs 404'en meteen.
- ✅ **`logotapijt` (twee ouders) → canonieke URL = `/tapijten/logotapijt`.** `/vloerbekleding/logotapijt` bestaat niet (404); Vloerbekleding toont de chip en linkt naar de canonieke URL. Zo blijft "één subcategorie = één URL" waar, ook bij gedeelde subs.
- **`maat` blijft gereserveerd**: `/tapijten/maat/120-170` werkt, `/tapijten/maat` is geen subcategorie (404). Subcategorie-slugs mogen dus nooit `maat` heten (`op-maat` mag wel).
- **Maat-buckets bestaan alleen ónder een categorie, niet onder een subcategorie** — bewust: `/tapijten/modern/maat/170-240` zou de indexeerbare combinaties vermenigvuldigen (9 subs × 4 buckets) terwijl er nog geen catalogus is. Op een subpagina filtert men op de facetten. Te heroverwegen zodra de echte producten er zijn.
- **Lege subcategorie = `noindex`** (zolang er geen producten in zitten), zelfde redenering als de lege maat-bucket.
- **PDP-kruimelpad volgt nu de diepte**: zit een product in een subcollectie, dan toont de PDP Home › Behang › Effen › product. De **BreadcrumbList-JSON-LD** hangt hier nog niet aan (zie hierboven) — dat is de logische volgende stap nu het pad wel klopt.

## Migratie & SEO
- Volledige **301-map**: alle WooCommerce-URL's + brunic.shop-legacy → nieuwe structuur. GSC onder Bruno's account.
- **Indexatiestrategie:** producten zonder foto/degelijke omschrijving = noindex tot verrijkt; gefaseerde sitemap; Product-schema mét Offer enkel op koopbare items. (12k thin-content-pagina's in één keer indexeren schaadt de bestaande posities — Google levert vandaag ~400 clicks + 24-35 calls/mnd.)
- **wp-content-backup vóór elke domein-actie** — de Woo-foto's hangen aan brunic.be.
- E-mailcontinuïteit (MX/SPF/DKIM) is deel van het domein-draaiboek (dossier 17 §3).

## Analytics
GA4 onder Bruno's account (wij beheerder) + consent mode v2; e-commerce-events zelf implementeren op de headless front + Shopify customer events voor checkout-stappen. Meting vanaf dag 1 — de latere performance-upsell hangt eraan.

## Randvoorwaarden
- Niets live vóór getekende offerte + voorschot (afspraak 08/07). Dev-store bouwen mag.
- Recurring: maandvergoeding vanaf maand 4 (afgesproken 08/07) — hostingkost bewaken (image-optimization op 14k producten; ISR/caching-strategie kiezen).
- `data/` en `.env*` nooit committen; klant-credentials in J.A.R.V.I.S `clients/brunic/.env.client`.
