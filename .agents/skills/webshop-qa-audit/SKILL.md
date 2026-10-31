---
name: webshop-qa-audit
description: QA-audit (alleen lezen) van de Brunic-webshop — filters, productfoto's en hoverbeelden, productkaarten en productnavigatie op desktop en mobiel. Levert een auditrapport met bevestigde fouten, te verifiëren punten en verbeterpunten. Wijzigt niets aan code, data, beelden of Shopify.
disable-model-invocation: true
---

# Webshop-QA-audit — filters, beelden, kaarten, navigatie

Je bent een ervaren e-commerce QA-specialist. Controleer de webshop op de werking van filters, productafbeeldingen, productkaarten en productnavigatie. Beoordeel of de webshop professioneel en gebruiksvriendelijk werkt op desktop en mobiel.

**Deze opdracht is uitsluitend een audit. Je rapporteert problemen en stelt verbeteringen voor, maar voert geen wijzigingen uit.**

## 0. Brunic-context (lees dit eerst)

**Wat je test**
- Productie: https://brunic.vercel.app (elke push naar `master`). Standaard test je hier.
- Lokaal mag ook: `pnpm --filter @brunic/prototype dev` → http://localhost:3100. Vermeld in het rapport welke omgeving en welke commit (`git log -1 --oneline`) je testte.
- Afdelingen (`apps/prototype/src/data/categories.ts`): Gordijnen & stoffen (`/catalogus/gordijnen-en-stoffen`), Behang (`/catalogus/behang`), Vloerbekleding (`/catalogus/vloerbekleding`), Tapijten (`/catalogus/tapijten`). Raamdecoratie, Verf en Slapen & wonen hebben (nog) geen producten. Controleer wel of ze netjes verborgen of leeg zijn.
- Gemengde lijsten met hun eigen filterprofiel: `/zoeken?q=…`, `/aanbiedingen`, `/nieuw-binnen`, `/merken/<merk>`.
- Productpagina: `/product/<slug>`, met variant `/product/<slug>?variant=<id>`.

**Waartegen je toetst**
- `docs/filtersysteem.md` is de specificatie van het filtergedrag: OF binnen een filter, EN tussen filters, EN binnen Eigenschappen, aantallen, chips, URL-formaat, geschiedenis, mobiele lade, lege staat, toegankelijkheid. Ook de filtermatrix per afdeling, de bewuste keuzes ("Bewust geen filter") en de bekende beperkingen staan daar.
- Een afwijking van die specificatie is een fout. Gedrag dat er als **bekende beperking** of **bewuste keuze** staat, is geen nieuwe fout. Label het als "bekend (filtersysteem.md)" en neem het alleen op als het de klant echt hindert. Voorbeeld: kleur en maat gelden per product, niet per variant-combinatie.
- Prijzen: behang en stoffen staan op aanvraag ("Advies en offerte in de winkel"). Een ontbrekende prijs is daar correct. Vloer en tapijt hebben prijzen met eenheid (per m², per rol, per stuk).

**Waar de logica zit** (voor de oorzaak, niet om te wijzigen)
- Kaart: `apps/prototype/src/components/catalog/product-card.tsx`. Het beeld is: gekozen kleurstaal → anders hoverbeeld bij hover → anders `image`. Een klik op een staal wisselt het beeld én de link (`?variant=`).
- Beeldkeuze: `apps/prototype/src/lib/catalog/view.ts` (`toCard`):
  - `image` = eerste productfoto;
  - `hoverImage` = de eerste foto met alt-tekst "– sfeerfoto", anders de tweede foto als die aan geen kleur hangt;
  - staalbeeld = de eerste foto met `optionValue` gelijk aan die kleur;
  - `vormen`: in `/catalogus/tapijten/rond` en `speciale-vormen` toont de kaart de foto in die vorm.
- Galerij en varianten op de productpagina: `apps/prototype/src/components/product/product-view.tsx` en `product-info.tsx`.
- Filters: `src/lib/catalog/filters.ts` (register `FACETS`), `listing.ts` (server: filteren, tellen, sorteren, pagineren), `facet-normalisatie.ts`, `src/data/filterprofielen.ts`, UI in `src/components/catalog/product-listing.tsx`.

**Data voor controles op de volledige catalogus**
- `apps/prototype/.data/shopify-catalogus.json` is de momentopname waarmee de site gebouwd is. Lees dit bestand met een eigen script. Wijzig het nooit.
- `pnpm --filter @brunic/prototype test:filters` mag je draaien. Het leest alleen en controleert elke filterwaarde op de echte catalogus.
- **Niet draaien:** `sync`, `build`/`prebuild`, scripts in `packages/catalog` en alles wat naar Shopify schrijft (`graphql_mutation`, `set-*.mjs`).
- `data/` (ruwe klantdata) mag je lokaal lezen. Stuur het nooit naar een externe dienst.

## 1. Grenzen van je opdracht

- Wijzig geen code, instellingen, productgegevens, filters of collecties.
- Wijzig, vervang, verwijder of herschik geen afbeeldingen.
- Pas geen koppelingen tussen afbeeldingen, producten en varianten aan.
- Upload geen nieuwe afbeeldingen en genereer geen vervangende beelden.
- Installeer niets (ook geen npm-pakketten zoals Playwright of Puppeteer), voer geen datamigraties uit en publiceer niets. Commit en push niets.
- Plaats geen bestellingen en verstuur geen offerte-, opmeting- of contactaanvragen. Zet niets in de winkelmand en start geen checkout.

Je mag de website bezoeken, filters bedienen, productvarianten selecteren, tussen pagina's navigeren en screenshots maken. Je mag beschikbare code en productgegevens lezen om de oorzaak van een probleem te onderzoeken.

**Enige plekken waar je schrijft:**
- Je hulpscripts en ruwe uitvoer gaan naar je scratchpad-map of naar `$env:TEMP\brunic-qa\`, nooit in de repo.
- Het rapport en de screenshots gaan naar `docs/audits/<JJJJ-MM-DD>-webshop-qa/`: het rapport als `rapport.md`, de screenshots in `screenshots/`. Die map is gitignored.

Ook bij een overduidelijke fout blijft je taak: vaststellen, documenteren en een oplossing voorstellen.

## 2. Controleer alle webshopfilters

Onderzoek iedere hoofdcategorie en alle aanwezige filtergroepen.

Controleer onder andere:

- Passen de filters bij de productcategorie?
- Komen filterwaarden overeen met de werkelijke productgegevens?
- Verschijnen uitsluitend producten die aan de geselecteerde criteria voldoen?
- Werken meerdere waarden binnen één filtergroep en combinaties van verschillende filtergroepen logisch samen?
- Verwijzen gecombineerde variantfilters naar een daadwerkelijk bestaande variant?
- Wordt de volledige relevante catalogus gefilterd, inclusief producten die nog niet geladen zijn?
- Kloppen resultaataantallen en beschikbare filteropties?
- Werken sortering, paginering en "meer laden" samen met de actieve filters?
- Zijn actieve filters zichtbaar, individueel verwijderbaar en volledig te wissen?
- Is de melding bij nul resultaten duidelijk?
- Blijven filters correct werken na vernieuwen, terugnavigeren en het openen van een gedeelde URL?
- Ontstaan er fouten wanneer je snel verschillende filters selecteert?

Controleer prijsfilters alleen waar deze aanwezig zijn en let op correcte bedragen, eenheden en ontbrekende prijzen.

Tip: leg getoonde aantallen naast een eigen telling op de momentopname. Zo test je "volledige catalogus" en "aantallen kloppen" zonder alles in de browser te laden.

## 3. Controleer productfoto's en hoverbeelden

Gebruik het volgende gewenste gedrag als beoordelingskader:

- **Standaard op de productkaart:** een duidelijke productfoto, productstaal of detailbeeld waarop product, kleur en structuur herkenbaar zijn.
- **Bij hover op desktop:** een passende interieur- of sfeerfoto van hetzelfde product en, waar relevant, dezelfde kleurvariant.
- **Na hover:** de oorspronkelijke productfoto verschijnt opnieuw.
- **Zonder geschikte interieurfoto:** de productfoto blijft zichtbaar.

Controleer visueel of:

- De standaardfoto werkelijk geschikt is als eerste productbeeld.
- Het hoverbeeld een relevante interieurfoto is.
- Beide beelden bij hetzelfde product en de geselecteerde variant horen.
- Kleurstalen de juiste afbeeldingen oproepen.
- Productkaarten en productdetailpagina's met elkaar overeenkomen.
- Afbeeldingen ontbreken, dubbel voorkomen, onscherp zijn, verkeerd uitsnijden of niet laden.
- De overgang flikkert of de kaart doet verspringen.

Ga niet automatisch uit van een fout omdat bestandsnamen of de volgorde van afbeeldingen vreemd lijken. Gebruik beschikbare productinformatie en visuele aanwijzingen. **Bekijk de screenshots en beelden zelf** (open het PNG/JPG-bestand). Oordeel nooit alleen op URL of alt-tekst.

**Kun je niet betrouwbaar vaststellen of een afbeelding bij het juiste product of de juiste kleur hoort, vermeld dan "te verifiëren". Presenteer een vermoeden niet als een bevestigde fout.**

Vermeld per fotoprobleem het product, de variant, de pagina en de betrokken afbeeldingen. Voeg waar mogelijk een screenshot en de afbeeldings-URL's toe. Verander zelf niets aan de beelden of hun koppelingen.

## 4. Controleer desktop en mobiel

Beoordeel:

- Consistentie en leesbaarheid van productkaarten.
- Correcte productnamen, prijzen en prijseenheden.
- Links naar het juiste product en de juiste variant.
- Mobiele filters: openen, sluiten, scrollen, selecteren en wissen.
- Productnavigatie op touchscreens zonder afhankelijkheid van hover.
- Toegankelijkheid van extra beelden via de productgalerij.
- Overlappende elementen, horizontale overflow en onbereikbare knoppen.
- Toetsenbordbediening en zichtbare focus.

## 5. Test daadwerkelijk in de browser

Test alle hoofdcategorieën, iedere filtergroep en representatieve combinaties. Neem producten met één afbeelding, meerdere afbeeldingen, kleurvarianten en ontbrekende beelden mee. Zoek die producten vooraf op in de momentopname, zodat je steekproef bewust gekozen is.

Controleer waar mogelijk de volledige catalogus op ontbrekende beeldverwijzingen en filtergegevens. Vermeld duidelijk welke controles volledig zijn uitgevoerd en welke op een steekproef berusten.

**Browser:**
- Is er een browsertool beschikbaar (Claude in Chrome, de ingebouwde browser), gebruik die en laad eerst de bijhorende skill.
- Anders gebruik je headless Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`, `--headless=new --remote-debugging-port=…`) via het Chrome DevTools Protocol. Schrijf daarvoor een eigen Node-script met de ingebouwde `WebSocket` van Node 24, zonder pakketten te installeren.
  - Desktop: 1366×900. Hover via `Input.dispatchMouseEvent` (`mouseMoved`) op de kaart, daarna de muis weg.
  - Mobiel: 390×844, met `Emulation.setDeviceMetricsOverride` (`mobile: true`) en `Emulation.setTouchEmulationEnabled`. Tik via `Input.dispatchTouchEvent`.
  - Toetsenbord: `Input.dispatchKeyEvent` (Tab, Enter, Escape). Controleer daarna `document.activeElement` en of de focusring zichtbaar is.
  - Lees ook consolefouten, mislukte netwerkverzoeken (`Network.loadingFailed`, 4xx/5xx op beelden) en `scrollWidth > clientWidth` voor horizontale overflow.
- Wees zuinig met de Shopify-CDN. Controleer beeld-URL's van de hele catalogus met HEAD-verzoeken en hoogstens 8 tegelijk.

Als toegang ontbreekt, rapporteer dan wat je niet kon controleren. Claim geen succesvolle test zonder die uitgevoerd te hebben.

## 6. Lever een concreet auditrapport op

Schrijf het rapport in het Nederlands (nl-BE) naar `docs/audits/<JJJJ-MM-DD>-webshop-qa/rapport.md`, met bovenaan de datum, de geteste omgeving en de commit.

Begin met een kort oordeel over de bruikbaarheid van de webshop en de belangrijkste problemen.

Gebruik daarna een tabel met:

| Prioriteit | Pagina/product/variant | Probleem | Verwacht gedrag | Vastgesteld gedrag | Bewijs en reproductiestappen | Voorgestelde oplossing |
|---|---|---|---|---|---|---|

Onderscheid:
- **Bevestigde fouten:** daadwerkelijk waargenomen en reproduceerbaar.
- **Te verifiëren:** onvoldoende bewijs, bijvoorbeeld een onzekere fotokoppeling.
- **Verbeterpunten:** de werking is correct, maar kan gebruiksvriendelijker.

Prioriteit: **P1** = blokkeert kopen/vinden of toont foute informatie · **P2** = duidelijk storend · **P3** = afwerking. Verwijs bij een oorzaak in code naar `bestand:regel`. Gaat het om data, noem dan het product en het veld in Shopify.

Geef fotoproblemen een apart overzicht zodat ik per product kan beoordelen wat eventueel aangepast moet worden. Per regel: product (titel + slug), variant/kleur, pagina-URL, standaardbeeld-URL, hoverbeeld-URL, screenshot, oordeel (fout / te verifiëren) en voorstel.

Sluit af met de geteste onderdelen, eventuele beperkingen en een prioriteitenlijst voor later herstel.

**Stop na het auditrapport. Ook de voorgestelde oplossingen voer je pas uit na een expliciete vervolgopdracht.** Geef als laatste bericht: het pad naar het rapport, het oordeel in drie zinnen, het aantal bevindingen per soort en prioriteit, en wat je niet kon testen.
