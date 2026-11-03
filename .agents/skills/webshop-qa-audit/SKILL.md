---
name: webshop-qa-audit
description: QA-audit (alleen lezen) van de Brunic-webshop — filters, productfoto's en hoverbeelden, productkaarten en productnavigatie op desktop en mobiel, plus vindbaarheid, consistentie tussen afdelingen, beloftes en beeldherkomst. Levert een auditrapport met bevestigde fouten, te verifiëren punten en verbeterpunten. Wijzigt niets aan code, data, beelden of Shopify.
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
- Een afwijking van die specificatie is een fout. Gedrag dat er als **bekende beperking** of **bewuste keuze** staat, is geen nieuwe fout. Label het als "bekend (filtersysteem.md)" en neem het alleen op als het de klant echt hindert. Voorbeeld: Rolbreedte is een productfilter, geen variantfilter.
- Prijzen: behang en stoffen staan op aanvraag ("Advies en offerte in de winkel"). Een ontbrekende prijs is daar correct. Vloer en tapijt hebben prijzen met eenheid (per m², per rol, per stuk).

**Regels van de opdrachtgever** (een afwijking is een fout, ook als de code doet wat ze moet doen)
- Een sfeerfoto komt nooit eerst, tenzij die kleur niets anders heeft. Dat geldt voor kaart en productpagina, met en zonder filter.
- Geen voorraadtekst en geen levertermijn: er is geen ERP gekoppeld. Levertermijnen staan nog in de Shopify-data, maar horen niet zichtbaar te zijn op de site. Brunic moet ze eerst bevestigen.
- Desso valt onder Tarkett, en zoeken op "Desso" blijft werken.
- Een kleurstaal is in elke afdeling de vlakke foto van die kleur. Enkel een kleur zonder vlakke foto krijgt een bolletje.

**Waar de logica zit** (voor de oorzaak, niet om te wijzigen)
- Kaart: `apps/prototype/src/components/catalog/product-card.tsx`. Het beeld is: gekozen kleurstaal → anders hoverbeeld bij hover → anders `image`. Een klik op een staal wisselt het beeld, de prijs en de link (`?variant=`).
- Beeldkeuze zonder filter: `apps/prototype/src/lib/catalog/view.ts` (`toCard`) en `product.ts`:
  - `image` = het eerste beeld op de productpagina van de standaardvariant (`standaardVariant`, `imagesForVariant`);
  - `hoverImage` = een foto in dezelfde kleur, liefst een sfeerfoto (`hoverVoor`).
- Toonvariant met filter: `apps/prototype/src/lib/catalog/listing.ts` (`metToonvariant`), zie §Toonvariant in `docs/filtersysteem.md`. Elk staal heeft daar zijn eigen beeld, prijs en link.
- Soort foto en staal: `apps/prototype/src/lib/catalog/shopify-adapter.ts` (`fotoSoort`, `options`).
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
- Het rapport en de screenshots gaan naar `docs/audits/<JJJJ-MM-DD>-webshop-qa/`: het rapport als `rapport.md`, de screenshots in `screenshots/`. Enkel `screenshots/` is gitignored.

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

## 5. Controleer ook wat er niet staat

Een test op wat de site toont, ziet niet wat ontbreekt. Reken deze punten altijd na op de hele momentopname en zet de tabellen in het rapport, ook als er geen fout uit volgt.

**Vindbaarheid**
- Maak per type en merk een tabel: aantal kleuren, hoeveel zonder kleurfamilie, hoeveel met enkel een code als naam (zoals 901D).
- Een kleur die enkel een code heet en geen kleurfamilie heeft, kan een klant niet vinden. Dat is een bevinding, ook al werkt de filter.
- Verdwijnt een filter uit het profiel omdat de data ontbreekt, dan is dat geen geslaagde test maar een bevinding. Voorbeeld: vinyl had op 02/11/2026 geen filter Kleur. "Geen lege filtergroep" klopte, maar de klant kon niet op kleur zoeken.
- Neem ook de dekking van Maat, Vorm, Motief en Stijl mee. `test:filters` drukt ze af.

**Consistentie tussen afdelingen**
- Zet de vier afdelingen naast elkaar: soort staal (foto of bolletje), aandeel kleuren met een eigen vlakke foto, aandeel kaarten met een hoverbeeld, regels op de kaart en kenmerken op de productpagina.
- Een verschil zonder reden in `docs/filtersysteem.md` is een bevinding.

**Beloftes**
- Zoek niet op vaste woorden. Maak eerst een lijst van alle labels in het veld `specificaties`, met hun aantal, en lees die hele lijst. Op 02/11/2026 telde een zoekopdracht op "Levertijd" 31 producten, terwijl er 276 waren: bij de meeste heet het veld "Levertermijn".
- Zoek daarna in de beschrijvingen op levertijd, levertermijn, leverbaar, werkdagen, voorraad, garantie en gratis levering.
- Toets wat de klant echt ziet op de site, want de site verbergt een deel van de data.
- Staat een belofte op de site en is ze niet bevestigd door Brunic, zoals een garantietermijn, dan label je ze "te verifiëren", met het aantal producten.

**Beeldlabels en herkomst**
- Tel per merk de foto's zonder label (soort `overig`). De code kan die niet rangschikken, dus een kamerfoto kan vooraan staan. Bekijk zelf elke kaart die met zo'n foto begint.
- Zoek in de bestandsnamen naar sporen van herkomst: `_AC_SX…` of `_AC_SY…` (Amazon), `…_n.jpg` met lange cijferreeksen (Facebook of Instagram), stockbureaus, Pinterest, WhatsApp, screenshots.
- Label die "te verifiëren (beeldrechten)", met product en bestand. Rechten kun je niet zelf vaststellen, en een vreemde bestandsnaam alleen bewijst geen fout.

**Namen**
- Zoek afgekapte of verminkte productnamen: weggevallen letters zoals "Olivtr d", ontbrekende speciale tekens, namen in kleine letters. Vergelijk titel, slug en alt-tekst.
- Controleer hernoemde producten ook op de oude URL.

**Versheid**
- Vermeld hoe oud de momentopname is (`/api/status`) tegenover het moment van de audit. Wijzigingen in Shopify komen pas na een nieuwe build op de site.
- Of die build automatisch start (webhooks), kun je zelf niet zien, want `packages/catalog` is verboden terrein. Vermeld het als "te verifiëren door iemand met toegang tot Shopify".
- `/api/producten?slugs=…&live=1` geeft de beschikbaarheid live. Wijkt die in een steekproef af van de momentopname, meld dat dan.

## 6. Test daadwerkelijk in de browser

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

## 7. Lever een concreet auditrapport op

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

Neem de tabellen uit §5 op in een eigen hoofdstuk.

Sluit af met de geteste onderdelen, eventuele beperkingen en een prioriteitenlijst voor later herstel.

**Stop na het auditrapport. Ook de voorgestelde oplossingen voer je pas uit na een expliciete vervolgopdracht.** Geef als laatste bericht: het pad naar het rapport, het oordeel in drie zinnen, het aantal bevindingen per soort en prioriteit, en wat je niet kon testen.
