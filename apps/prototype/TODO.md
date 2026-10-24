# TODO — prototype (`apps/prototype`)

Bron: audit van 30/09/2026 (alleen `apps/prototype`, niet `apps/web`). Geauditeerde codeversie: stand van 23:12. De merkwijzigingen van 23:21 (merkenpagina, `brand-tile.tsx`, `data/merken.ts`, `brands.ts`, homepage) zijn niet opnieuw getest.

**Legende:** `Bxx` = bevinding-ID · P0 ernstig risico · P1 blokkeert flow of verkoop · P2 duidelijke tekortkoming · P3 verfijning · inspanning K/M/G = klein/middel/groot · zekerheid tussen haakjes.

**Stand:** begeleide klantdemo mogelijk onder voorwaarden (zie hieronder). Echte verkoop: niet gereed. Geen P0 gevonden: er staan geen secrets in de browsercode, en `/api/kassa` weigert €0- en etalageproducten.

---

## 1. Vóór een demo

- [ ] **B05 · P1 · K** — Demo draaien vanaf een bevroren build/preview, niet vanaf de dev-server waarin gewerkt wordt. Tijdens de audit gaf elke pagina ±30 min HTTP 500 (`routes.account` ontbrak) door gelijktijdige bewerking. Vooraf `pnpm --filter @brunic/prototype typecheck` + korte rooktest. (bevestigd)
- [ ] **Demo-formulieren op dry-run** — `LEADS_DRYRUN=1` zetten. Die staat niet in de root-`.env`; zonder die variabele maakt elk demoformulier een echte klantfiche in de dev-store en start het (vermoedelijk) de Flow-mail. (bevestigd in code)
- [ ] **B14 (deel) · P2 · K** — "Rose Magnifique (kopie)" en het dubbele product (Artelux Brooklyn ↔ Loft79 6826, 31 gedeelde SKU's) offline halen in Shopify. (bevestigd)
- [ ] **B23 · P3 · K** — Claim "Al 40 jaar in Ninove" / "Familiebedrijf, al 40 jaar" laten bevestigen door Brunic. JSON-LD zegt `foundingDate: 1992` (`lib/site/config.ts`). (niet verifieerbaar)
- [ ] Liefst ook **B09** (stille kleurwissel), zie hieronder.

---

## 2. P1 — vóór echte verkoop

- [ ] **B01 · P1 · M — €0-/etalageproducten ook in Shopify zelf afschermen.** Alle 16.620 varianten staan op €0, `availableForSale = true`, voorraad niet gevolgd. De enige blokkade is `src/app/api/kassa/route.ts` (die werkt: 409). → Ook in Shopify blokkeren, bv. voorraad volgen op 0 met "niet verkopen zonder voorraad" voor etalageproducten, of een checkout-validatie. (bevestigd)
- [x] **B02 — opgelost 20/10** (PDP rendert server-side, `?variant=` na het laden; getest met `next build` + headless Chrome). Oorspronkelijke bevinding: **B02 · P1 · K–M — Productpagina's missen hun inhoud in de server-HTML.** In een productiebuild staan galerij, h1, prijs, offerteknop en beschrijving niet in de HTML (`BAILOUT_TO_CLIENT_SIDE_RENDERING`). Oorzaak: `useSearchParams()` in `components/product/product-view.tsx` binnen `<Suspense>` op een statische route. Gevolg: Lighthouse CLS 0,638 (desktop) / 0,846 (mobiel), LCP 5,6 s mobiel. Hetzelfde op `/nieuw-binnen` (0 productlinks in de HTML). De dev-server toont dit niet. → Variant server-side lezen (searchParams van de pagina) of een fallback met identieke layout; controleren met `next build` + `curl`. (bevestigd)
- [x] **B03 — grotendeels opgelost 20/10**: bestaande klant enkel op e-mail, nooit naam/telefoon overschrijven, marketingbewijs niet wissen, rate limit 5/kwartier/IP, `_t` verplicht. Open: double opt-in voor de nieuwsbrief (beslissing Brunic) en een harde limiet over alle Vercel-instanties (Vercel Firewall). Oorspronkelijke bevinding: **B03 · P1 · M — Formulieren kunnen klantfiches overschrijven.** `src/lib/leads/klant.ts`: een aanvraag met het e-mailadres of telefoonnummer van een bestaande klant voert `customerUpdate` uit, met naam, telefoon, notitie en toestemmingsvelden uit het formulier. `schrijfInVoorNieuwsbrief` en het marketingvinkje zetten elk adres op `SUBSCRIBED` zonder bevestiging. Spamfilter en rate limiting moeten sterker. → Bestaande klant nooit overschrijven (enkel notitie/tag toevoegen), double opt-in, rate limiting/captcha. (bevestigd in code, niet uitgevoerd)
- [ ] **B04 · P1 · K — App met te brede rechten.** De server gebruikt de Dev Dashboard-app met veel meer schrijfrechten dan nodig. Voor de formulieren volstaan `read_customers`, `write_customers` en `write_files`. → Aparte app met minimale scopes. (bevestigd)
- [ ] **B06 · P1 · G — Commerciële data ontbreekt** (klant/pipeline, geen programmeerfout): 0/2.386 producten hebben een prijs, er is geen voorraad, en Raamdecoratie, Verf en Slapen & wonen hebben 0 producten (404 + niet in het menu). (bevestigd)

---

## 3. P2

### Code

- [x] **B07 — opgelost 20/10** (max. 100 foto's per product + waarschuwing bij afkapping). Oorspronkelijke bevinding: **B07 · K — Sync kapt afbeeldingen af.** `scripts/sync-shopify.mjs` haalt `images(first: 24)` op zonder door te bladeren. 257 producten verliezen samen 5.335 beelden (bv. `vloerkleed-coral-louis-de-poortere`: 30 → 24). De adapter voegt de hoofdfoto's van varianten terug toe, maar extra detail- en sfeerbeelden gaan verloren. → Doorbladeren via `pageInfo` en afkapping loggen. (bevestigd)
- [ ] **B08 · K — Verzonnen verkoopeenheid.** `src/lib/catalog/shopify-adapter.ts` valt terug op `?? "stuk"`. 374 producten zonder `brunic.verkoop_eenheid` tonen "Verkoopeenheid: Per stuk": fotobehang op maat (145), tapijttegels (84), panoramisch behang (72), passement (32), wandbekleding (24), tapijtloper (16), click vinyl (1). Ook de filter "Verkocht per" op Behang toont "Per stuk (245)". → Geen standaardwaarde tonen; eenheid aanvullen in de data. (bevestigd)
- [x] **B09 — opgelost 20/10** (optielade toont "Enkel met een andere …", na de keuze een melding welke optie mee wisselde). Oorspronkelijke bevinding: **B09 · K — Niet-bestaande combinaties.** In de optielade (`product-view.tsx`, `choose()`) wordt elke waarde als "Op maat" getoond. Een combinatie die niet bestaat wisselt stil de andere optie. Voorbeeld: `vasttapijt-celestial-associated-weavers` → Kleur Navajo 32 + Breedte 500 cm → kleur wordt Onyx 25. Het gaat om 14 producten en 87 combinaties. → Waarde uitgrijzen of een melding tonen. (bevestigd, desktop + 390 px)
- [ ] **B18 · M — Kassa en eenheden.**
  - Meterware en m² kunnen enkel in hele eenheden (`QTY` step 1).
  - De eenheid gaat niet mee naar de Shopify-checkout (geen regeleigenschappen).
  - ~~`/api/kassa` laat ongeldige regels stil vallen~~ → opgelost 20/10: 400 met duidelijke melding.
  - ~~Een product-ID in plaats van een variant-ID geeft HTTP 502~~ → opgelost 20/10: 400.
  → Verkoopmodel voor meterware beslissen; eenheid als line attribute meesturen; ongeldige regels melden. (bevestigd in code/API)
- [ ] **B19 — deels opgelost 20/10**: beschikbaarheid live in winkelmand en PDP; catalogus herbouwt vanzelf bij wijzigingen (webhook + deploy hook, dagelijkse controle). Prijzen in de winkelmand komen nog uit de momentopname (prijsweergave buiten scope van de audit). Oorspronkelijke bevinding: **B19 · M — Verouderde prijzen mogelijk.** De winkelmand toont prijzen uit de momentopname (sync bij build) en er is geen revalidatie bij productwijzigingen. De kassa controleert wel live, dus zodra er prijzen zijn kan de prijs in de mand verschillen van die in de checkout. → Revalidatie via webhook of live prijs in de winkelmand. (vermoedelijk)
- [ ] **B20 · K — Toegankelijkheid** (axe 4.11, WCAG 2.2 AA):
  - links "+N kleuren" op productkaarten zijn 20–23×17 px (2.5.8);
  - groene tekst "Op maat" in de variantlade haalt 4,16:1 (1.4.3);
  - h3-kaarten zonder h2 op lijstpagina's;
  - niet-unieke landmarks;
  - header-transities negeren `prefers-reduced-motion`.
  (bevestigd, automatisch)

### Data (pipeline / Shopify)

- [ ] **B14 · M — Productdata opschonen:**
  - Engelse optiewaarde bij Desso "Rug" ("EcoBase - 100% recyclable …");
  - vasttapijt (Desso, Tarkett) staat onder "Tapijten › Tapijten op maat";
  - kleurfamilie maar bij 47/2.386 producten, waardoor er geen kleurfilter is bij behang en stoffen.
  (bevestigd)

### Juridisch (verkoop)

- [ ] **B16 · K–M — Ontbrekende informatie:**
  - RPR + rechtbank van de zetel (WVV art. 2:20);
  - concrete leveringskosten en aanvaarde betaalmiddelen uiterlijk bij het begin van het bestelproces (WER VI.45, VI.46 §3);
  - online herroepingsfunctie (WER VI.61/2);
  - toegankelijkheidsverklaring (EAA, WER VIII.60).
  (ontbreken vastgesteld; draagwijdte: juridisch advies)
- [ ] **B17 · K — Retourtekst laten toetsen.** Het accordeon "Retourneren" op elke PDP (`components/product/product-info.tsx`) stelt dat "op maat gesneden stoffen, behang of vasttapijt" wettelijk niet onder het herroepingsrecht vallen. Behang per rol is geen maatwerk. → Laten toetsen aan WER VI.53 3°. (juridisch advies nodig)

Bronnen, geraadpleegd via een onderzoeksagent: WER op Justel (geconsolideerd tot 04/08/2026), de e-commerce-richtlijnen van de FOD Economie (28/09/2026) en de cookie-checklist van de GBA. Dit is geen volledige conformiteitsbeoordeling.

---

## 5. Lanceringschecklist (bewust uitgeschakeld in de testfase)

- [ ] `SITE_INDEXEREN=1` en `SITE_URL` zetten (nu overal noindex + `Disallow: /`)
- [x] 301-map van WooCommerce naar de nieuwe URL's — 20/10: alle 2.061 URL's uit de oude sitemaps → 308 naar een bestaande pagina (README §2). Na de domeinoverdracht opnieuw testen op www.brunic.be.
- [ ] Cookie-consent (Consent Mode v2) zodra GA4 wordt toegevoegd; de cookieverklaring zegt nu terecht "geen tracking"
- [ ] Shopify: verzendtarieven, betalingen (Bancontact), btw en checkout-branding instellen. Niet gecontroleerd: de app mist de leesrechten daarvoor.
- [ ] Vectorlogo (staat al open in de README)

---

## 6. Nog handmatig of in een testomgeving te testen

- [ ] Volledige checkout met een testbetaling in een afgeschermde winkel, inclusief de weigering van €0- en etalageproducten
- [ ] Formulieren versturen in dry-run en in een testwinkel: Flow-mail, foto-upload (≤ 5 foto's, limiet 4 MB), fout- en successtatussen
- [ ] Echte toestellen: iOS Safari en Android Chrome, schermtoetsenbord, liggende weergave
- [ ] Schermlezer (NVDA / VoiceOver), zoom tot 200 %, tekstafstand
- [ ] INP en CWV-veldgegevens na publicatie (nu enkel labmetingen)
- [ ] Merkwijzigingen van 30/09 23:21 (niet opnieuw geaudit)

---

## Wat al aantoonbaar werkt (niet breken)

- `/api/kassa` weigert etalage-, €0-, onbestaande en ongeldige varianten live (409/400); er wordt dan geen mandje aangemaakt.
- Geen Shopify-secrets in de client-bundels of responses.
- De data komt uit de juiste winkel (`brunic-3`) en het juiste kanaal (Brunic Headless): Admin, Storefront en momentopname tellen elk 2.386 actieve producten.
- Filters: de aantallen komen exact overeen met de Shopify-data, ook gecombineerd; de filterstatus staat in de URL.
- Menu's en lades: focus blijft binnen de lade, Escape sluit, de focus keert terug naar de opener en de pagina scrollt niet mee.
- Terug naar de lijst herstelt de scrollpositie; "meer tonen" verplaatst de focus naar het eerste nieuwe product.
- Crawl van 158 URL's: allemaal HTTP 200, geen consolefouten, geen kapotte afbeeldingen; echte 404's.
- Geen horizontale scroll op 360, 414, 768, 844 (liggend), 1366 en 1920 px.
- De offerteflow neemt product en variant mee en toont ze zichtbaar.

## Metingen (lab, lokale productiebuild, Lighthouse 12.8; indicatief)

| Pagina | Mobiel | Desktop | Mobiel LCP / TBT / CLS |
|---|---|---|---|
| `/` | 79 | 98 | 4,6 s / 170 ms / 0,012 |
| `/catalogus/behang?weergave=producten` | 35 | 87 | 6,4 s / 490 ms / 0,846 |
| `/product/gordijnstof-movement-ado` | 49 | 71 | 5,6 s / 190 ms / 0,846 |
| `/op-maat-en-plaatsing/opmeting-aan-huis` | 70 | 100 | 4,6 s / 430 ms / 0,012 |

Toegankelijkheid scoort 95–97 en best practices 100. SEO scoort 69, maar enkel door de bewuste noindex.
