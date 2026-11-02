# Webshop-QA-audit Brunic: filters, beelden, kaarten en navigatie (derde ronde)

- **Datum:** 31/10/2026, tests tussen 21:05 en 22:20 (CET)
- **Uitgevoerd door:** Claude (agent, alleen lezen en testen), in opdracht van Alexander
- **Opdracht:** `.agents/skills/webshop-qa-audit/SKILL.md`, volledige scope: filters, productfoto's en hoverbeelden, productkaarten en productnavigatie, op desktop en mobiel. De filters zijn getoetst aan `docs/filtersysteem.md`.
- **Map:** `docs/audits/2026-10-31-webshop-qa-3/`. Vandaag bestonden al `2026-10-31-webshop-qa/` (18:53) en `2026-10-31-webshop-qa-2/` (20:51). Die zijn niet aangeraakt. Deze audit is onafhankelijk uitgevoerd. Waar een bevinding al in die rapporten stond, staat de vorige code erbij (bv. "bekend: F5").

| Omgeving | Code | Catalogus | Hoe vastgesteld |
|---|---|---|---|
| **Productie** https://brunic.vercel.app | `82ba1b0` "update" (31/10 20:03). De app-code is identiek aan `5fa16a5`: `git diff 5fa16a5 82ba1b0 -- apps/prototype` is leeg. | Momentopname van 31/10/2026 19:04 UTC, 4.070 producten (`/api/status`, om 21:05 en om 22:18 identiek) | Werkkopie `master` = `82ba1b0`, schoon (op de map `-2` na, die niet van mij is). |
| Lokaal (orakel) | Werkkopie `82ba1b0`, enkel ingeladen in eigen Node-scripts. Geen dev-server gedraaid. | `apps/prototype/.data/shopify-catalogus.json` (28/10 14:51 UTC) | De kaartgegevens van alle 4.070 producten op productie (`/api/producten?slugs=…`, zonder `live=1`) zijn identiek aan de lokale momentopname. Enige verschil: bij 3 Desso-vasttapijten is het merk nu Tarkett. Het orakel bootst dat in het geheugen na. |

Er is niets gewijzigd aan code, data, beelden, koppelingen of Shopify. Er is niets gecommit of gepusht, en er is niets in de winkelmand gezet. Hulpscripts staan in de scratchpad van deze sessie (`cdp.mjs`, `oracle.mjs`, `s1`–`s6`, `a1`–`a14`, `d1`–`d11`, `ev-bewijs.mjs`). Ruwe uitvoer staat in `%TEMP%\brunic-qa\r3\`. Screenshots staan in `screenshots/` (gitignored, voorvoegsel `r3-`).

---

## 1. Oordeel

**Het filtersysteem werkt inhoudelijk correct.** Elke lijst en elke filterstap die getest is, geeft exact het resultaat van de code: totaal, volgorde van de kaarten, aantallen per waarde en chips (zie §4). Ook OF, EN, Eigenschappen-EN, geschiedenis, herladen, lege staat en snel klikken werken. Op desktop en mobiel is er geen horizontale overflow (behalve bij precies 1280–1289 px) en zijn er geen consolefouten. Alle 10.579 kaart-, hover- en staalbeelden laden.

**De belangrijkste problemen:**
- **Toetsenbord (nieuw, P2):** de filterlade ("Alle filters" en de mobiele lade) is niet met Tab te bedienen. De focus springt tussen "Sluiten" en de eerste groep heen en weer. Op desktop zijn daardoor filter 7 en verder onbereikbaar, onder 1024 px alle filters.
- **Prijsfilter tapijten (nieuw, P2):** de filter rekent met de vanaf-prijs (kleinste maat). Bij "€ 100 – € 250" ziet de klant 31 van de 124 tapijten die in die prijsklasse een maat hebben, bij "Meer dan € 250" 4 van 80.
- **Lege filterknoppen (nieuw, P2):** na een keuze blijven filters staan die geen enkele waarde meer hebben. Kies bijvoorbeeld Vinylvloer en klik daarna op Kleur: het paneel is leeg.
- **Beelden (bekend, P2):** het hoverbeeld toont soms een andere kleur dan de kaart. Na een kleurfilter tonen de meeste kaarten een andere kleur dan de gekozen kleur. Bij 27 producten opent de productpagina met een ander beeld dan de kaart.
- **Meer tonen (bekend, P2):** vanaf de tweede klik springt de pagina terug.
- **Te verifiëren (nieuw, P2):** elk product met een prijs (2.642) toont "Op voorraad" in het groen, terwijl Shopify geen voorraad volgt.

**Bruikbaarheid:** zoeken, filteren en navigeren zijn snel en betrouwbaar voor muis- en aanraakgebruikers. Wat de klant hindert, zijn vooral beelden die niet bij de gekozen kleur passen, een prijsfilter die relevante tapijten mist, en een lade die niet met het toetsenbord werkt.

---

## 2. Bevindingen

Legende. Soort: **F** = bevestigde fout · **T** = te verifiëren · **V** = verbeterpunt. Prioriteit: **P1** blokkeert kopen of vinden of toont foute informatie · **P2** duidelijk storend · **P3** afwerking. "Nieuw" = niet in de vorige rapporten van vandaag. "Bekend" = opnieuw vastgesteld, met de code uit het vorige rapport. Pagina-URL's zijn relatief tot https://brunic.vercel.app.

### 2.1 Bevestigde fouten

| Prioriteit | Pagina/product/variant | Probleem | Verwacht gedrag | Vastgesteld gedrag | Bewijs en reproductiestappen | Voorgestelde oplossing |
|---|---|---|---|---|---|---|
| **P2** · R3-01 · nieuw | Filterlade op elke lijst: "Alle filters" op desktop, de enige filter-UI onder 1024 px. Bv. `/catalogus/vloerbekleding?weergave=producten` | De lade is niet met het toetsenbord te bedienen | `filtersysteem.md` §Toegankelijkheid vraagt een lade met focusval. Tab loopt door alle groepen, vinkjes en knoppen en blijft binnen de lade. | Tab: Sluiten → Enkel aanbiedingen → summary "Type" → Sluiten → … (lus van 3). Shift+Tab: "Toon 582 producten" ↔ summary "Eigenschappen". Van de 95 focusbare elementen (12 groepen, 79 vinkjes) zijn er 3 bereikbaar. Zo zijn Materiaal, Slijtlaag, Gebruiksklasse, Plaatsing, Poolhoogte en Eigenschappen op desktop niet met het toetsenbord te kiezen. Op 768 px staan er geen filterknoppen, dus daar geen enkele filter. Hetzelfde gedrag op 390 px. Escape sluit wel, en de focus gaat terug naar "Alle filters". | `screenshots/r3-kbd-lade-tab-terug-naar-sluiten.jpg` (focusring op "Sluiten" na Tab vanaf "Type"), `r3-kbd-lade-focus.jpg`, log `d4-log.txt` en `s5.json`. Reproductie: open de pagina, Tab tot "Alle filters", Enter, druk 10× Tab. | **Code** `src/components/ui/drawer.tsx:7`: `summary` ontbreekt in `FOCUSABLE`. Daardoor geldt een gefocuste summary op `:62` als "buiten" en stuurt `:63-69` de focus terug naar het eerste of laatste element. Voeg `summary` toe aan `FOCUSABLE`, of bepaal "binnen" met `panel.current.contains(active)`. |
| **P2** · R3-02 · nieuw | Tapijten, Prijs. Bv. `/catalogus/tapijten?weergave=producten&prijs=100-250`, `&prijs=250-plus`, `&maat=170-240&prijs=100-250` | De prijsfilter gebruikt de vanaf-prijs (goedkoopste maat) | Een tapijt verschijnt in elke prijsklasse waarin een van zijn maten valt. In combinatie met Maat telt de prijs van die maat. | Van de 136 tapijten met prijs hebben er 121 maten in meer dan één klasse. Getoond tegenover tapijten met een maat in die klasse: Tot € 25: 7/7 · € 25–50: 53/60 · € 50–100: 41/94 · **€ 100–250: 31/124** · **meer dan € 250: 4/80**. Voorbeeld Rampur 0600 (€ 49 tot € 599): niet bij "Meer dan € 250", niet bij "170–240 cm + € 100–250", hoewel 160 × 230 cm € 195 kost. | `screenshots/r3-bewijs-tapijten-prijs-250plus.jpg` (4 producten, enkel Lalee "vanaf € 295"), `r3-bewijs-rampur-maten-prijzen.jpg`, `r3-desk-catalogus-tapijten-weergave-producten-maat-170-240-prijs-100.jpg`. Telling: `a11-prijs.mjs`. Behang en vinyl hebben één prijs per product, dus daar speelt het niet. | **Code** `src/lib/catalog/filters.ts:174-182` (`derivedFacetValues` → `lowestPrice`, `product.ts:44-50`): de klassen van alle varianten als waarden meegeven. Beter nog: bij een actieve Maat-filter de prijzen van de passende maten nemen. Staat dit niet op de planning, dan als beperking opnemen in `filtersysteem.md` §Beperkingen. |
| **P2** · R3-03 · nieuw | Elke afdeling na een keuze. Bv. `/catalogus/vloerbekleding?weergave=producten&type=vinylvloer` (Kleur), `/catalogus/behang?weergave=producten&type=fotobehang-op-maat` (Kleur, Motief, Stijl), `/catalogus/tapijten?weergave=producten&type=vasttapijt` (Maat, Motief), `/catalogus/gordijnen-en-stoffen?weergave=producten&type=passement` (Lichtdoorlatendheid, Motief, Stijl), Vloer › Tapijttegel (Rolbreedte) | Een filter zonder enige waarde blijft als knop staan | Specificatie: "Waarden zonder resultaat verdwijnen" en "Een filter verschijnt alleen als hij de lijst kan verkleinen". | Bij 5 van de 12 Type-keuzes zijn 1 tot 3 van de 6 zichtbare knoppen leeg. Het paneel toont dan enkel "Wissen" (uitgeschakeld) en "Klaar". Over alle 350 enkelvoudige keuzes (elke waarde van elke filter, 4 afdelingen) ontstaan 398 lege groepen. | `screenshots/r3-desk-behang-lege-kleurgroep.jpg`, `r3-desk-vloer-vinyl-lege-kleur.jpg`, `r3-bewijs-stoffen-passement-lege-motief.jpg`, `r3-bewijs-tapijten-vasttapijt-lege-maat.jpg`. Telling: `a6-lege-groepen.mjs`, `a7-type-leeg.mjs`. Reproductie: open de vinyl-URL en klik op "Kleur". | **Code** `src/lib/catalog/filters.ts:307-319`: `nuttig` wordt op de hele lijst berekend, en de groep wordt ook toegevoegd als `options` leeg is. Toevoegen: `if (options.length === 0 && chosen.length === 0) continue;`. Zie ook R3-28. |
| **P2** · R3-04 · bekend (F3, N4) | 66 producten met een hover-sfeerfoto die aan een andere kleur hangt, en 189 meerkleurige producten met een sfeerfoto zonder kleur (ADO 177, Balsan 10, Lano 1, AW 1). Visueel bevestigd: Strada, Arien, Les Best, Malaika (§3.1) | Het hoverbeeld toont een andere kleur dan de kaart | Hover toont een interieur van hetzelfde product in dezelfde kleur. Anders blijft de productfoto staan. | Strada: lichtgrijs (Moonstone 07) → groen tapijt (Cedar 22). Arien: grijsblauwe ruit (110) → bruine ruit (193). Les Best: grijs (007) → rood tapijt. Malaika: lichte bloemen (684) → donkere variant. | `screenshots/r3-bewijs-strada-*.jpg`, `r3-bewijs-arien-*.jpg`, `r3-bewijs-lesbest-*.jpg`, `r3-bewijs-malaika-*.jpg`, `r3-contact-kaarten-01.jpg` (#5–#8). Reproductie: zoek "Strada" en beweeg de muis over de kaart. | **Code** `src/lib/catalog/view.ts:71`: een sfeerfoto enkel als hover nemen als `optionValue` gelijk is aan die van het kaartbeeld. Een kleurloze sfeerfoto enkel bij producten met één kleur. **Shopify:** sfeerfoto's aan hun kleur koppelen (alt "… – sfeerfoto – kleur X"). |
| **P2** · R3-05 · bekend (F4) | 27 producten (Beauflor 10, Boråstapeter 7, ADO 6, Tarkett 3, AW 1). Bv. `behang-myrten-borastapeter`, `vinyl-fairplay-aqua-beauflor` | Kaart en productpagina tonen een ander beeld | De link op de kaart opent de productpagina met het kaartbeeld als eerste foto. | Myrten: de kaart toont een donkerblauw interieur (kleur 5717), de productpagina opent op kleur 5712 met één lichte rolfoto. Fairplay Aqua: de kaart toont het waterdessin (gekoppeld aan breedte 4 m), de productpagina opent op 2 m met enkel een badkamerfoto. | `screenshots/r3-pdp-behang-myrten-borastapeter.jpg`, `r3-contact-kaarten-02.jpg` (#13, #15), `r3-pdp-vinyl-fairplay-aqua-beauflor.jpg`. Telling: `a1-data.mjs` (`cardOnPdp ≠ 0`). | **Code** `view.ts:69` en `product-view.tsx:81`: de kaartlink naar de variant van het kaartbeeld laten wijzen (`?variant=`), of als kaartbeeld het eerste beeld van de standaardvariant nemen. **Shopify:** bij Boråstapeter een vlakke foto per kleur. |
| **P2** · R3-06 · bekend (F5) | `/catalogus/behang?weergave=producten&sorteer=naam` (geldt voor elke lijst) | "Meer tonen" springt vanaf de 2e klik terug | Na elke klik blijft de pagina staan en krijgt het eerste nieuwe product de focus. | 1e klik: in orde (focus op kaart 49). 2e klik: scroll van 10.203 → 5.829 px, de focus staat opnieuw op kaart 49. 3e klik: 14.743 → 10.356 px, de focus staat op kaart 97 in plaats van 145. Geen dubbels, geen extra stap in de geschiedenis (correct). | `d1-meer.mjs` (log in deze sessie). Reproductie: klik 3× op "48 meer tonen" en volg `scrollY`. | **Code** `src/components/catalog/product-listing.tsx:101-108`, `:224`, `:246-249`: `setFocusNew(true)` pas zetten als de nieuwe items binnen zijn (bv. de verwachte lengte onthouden en in het effect vergelijken met `shown.length`). |
| **P3** · R3-07 · nieuw | Elke lijst met 1 resultaat, bv. `/zoeken?q=Myrten` | "U hebt 1 van 1 producten bekeken" | "U hebt 1 van 1 product bekeken" | Het meervoud staat er altijd | `screenshots/r3-desk-kaart-Blregn-staal2.jpg` (onder de kaart) | **Code** `product-listing.tsx:237`: zelfde enkelvoud/meervoud als op `:141`. |
| **P3** · R3-08 · nieuw | Optielade op de productpagina bij elk product op aanvraag, bv. `behang-ida-borastapeter` (kleuren) en `vloerkleed-papercut-louis-de-poortere` (maten) | Status "Op maat" onder elke keuze, ook waar niets op maat is | Een status die klopt: niets, of "Prijs op aanvraag" | Behang Ida: "8178 – Op maat", … Papercut: "80 × 150 cm – Op maat", "Staal 21 × 30 cm – Op maat" | `screenshots/r3-desk-pdp-optielade-behang-ida-borastapeter.jpg`, `r3-desk-pdp-optielade-vloerkleed-papercut-louis-de-p.jpg`, `r3-mob-variantlade.jpg` | **Code** `src/components/product/product-view.tsx:376`: "Op maat" enkel tonen als `isOpMaat(maatwerk)` en het geen vaste maat of staal is. Anders niets of "Op aanvraag". |
| **P3** · R3-09 · nieuw | Alle 84 Lalee- en 52 Ragolle-tapijten, bv. `vloerkleed-la-plata-via-901-lalee` | "Art.nr." toont een Shopify-variant-ID | Het ERP-artikelnummer, of geen regel | "Art.nr. 59354776535372". Alle 1.089 varianten van deze twee merken hebben geen SKU in Shopify. | `screenshots/r3-bewijs-lalee-artnr.jpg`. Telling: `a9-sku.mjs`. | **Shopify:** SKU invullen voor Lalee en Ragolle. **Code** `shopify-adapter.ts:327` (`v.sku \|\| kortId(v.id)`) en `product-view.tsx:314`: zonder SKU geen "Art.nr." tonen. |
| **P3** · R3-10 · nieuw | Elke pagina bij een vensterbreedte van 1280–1289 px | Horizontale overflow in de header | Geen horizontale scroll | Bij 1280 px valt de knop "Opmeting aanvragen" 7 px buiten beeld (1285 px: 2 px). De pagina scrolt 7 px opzij. Bij 1240, 1290, 1366 en 1440 px geen overflow. | `screenshots/r3-desk-1280-header.jpg`. Meting: `d10-overflow.mjs`, `d11-overflow.mjs`. | **Code** `src/components/layout/site-header.tsx:173-217`: vanaf `xl` krijgen de links `px-4` en verschijnt het knoplabel. Het label pas vanaf `2xl` tonen, of `gap`/padding verkleinen, of `min-w-0` met `overflow-hidden` op de lijst. |
| **P3** · R3-11 · bekend (N2) | Productpagina van elk behang met prijs per rol (1.908), bv. `behang-vintage-auto-s-rood-geel-en-groen-estahome` | "Totaal voor 1 rollen" | "Totaal voor 1 rol" | "Totaal voor 1 rollen: € 52,95" (desktop en mobiel) | `screenshots/r3-bewijs-behang-1-rollen-op-voorraad.jpg`, `r3-mob-pdp-behang-prijs.jpg` | **Code** `product-view.tsx:267`: `UNIT_NAME[unit].one` bij hoeveelheid 1. |
| **P3** · R3-12 · bekend (F6) | Mobiel, kaarten met stalen en een sfeerfoto, bv. Les Best op `/catalogus/vloerbekleding/vasttapijt` | "Kleverige hover" op touch | Staal uitzetten → de productfoto komt terug | Staal 2 aan → staalbeeld. Staal 2 uit → de sfeerfoto (`…-39abcdc75b.jpg`) blijft staan. | `screenshots/r3-mob-kaart-staal2.jpg`, `r3-mob-kaart-staal-uit.jpg`, `s4.json` | **Code** `product-card.tsx:31-32`: hover enkel bij `pointerType === "mouse"`. |
| **P3** · R3-13 · bekend (N1) | `/catalogus/tapijten?weergave=producten&kleur=Multicolor` | Oud kleurlabel geeft een lege lijst | Specificatie: oude links met labels werken nog | 0 producten, chip "Kleur: multicolor". `kleur=meerkleurig` geeft er 20. | `s2.json` (stap "link …Multicolor") | **Code** `filters.ts:342`: de kleursynoniemen uit `facet-normalisatie.ts` ook in `parseListState` toepassen. |
| **P3** · R3-14 · bekend (F7) | `/zoeken?q=bloemen&categorie=behang` | Zoekkop en lijst tonen een ander aantal | Eén aantal, of een kop die zegt dat het om het totaal gaat | Kop "382 producten en 1 categorie gevonden.", lijst "333 producten" | `s2.json` (notitie "zoekkop vs lijst") | **Code** `src/app/(winkel)/zoeken/page.tsx:42`: na filteren `listing.total` tonen, of "382 resultaten, 333 na filters". |
| **P3** · R3-15 · bekend (F8, V9) · data | Boråstapeter: Citrontr d, Olivtr d, Dahliadr m, rtag rd, Bl regn. Loft79: titels in kleine letters (abbey, bolton…) | Productnamen met verloren Zweedse tekens of zonder hoofdletter | Citronträd, Blå regn, Örtagård… · "Abbey" | Ongewijzigd op productie (`/api/producten`) | `screenshots/r3-desk-kaart-Blregn-standaard.jpg` | **Shopify:** titels corrigeren. Eventueel in de adapter een hoofdletter vooraan zetten. |

### 2.2 Te verifiëren

| Prioriteit | Pagina/product/variant | Probleem | Verwacht gedrag | Vastgesteld gedrag | Bewijs en reproductiestappen | Voorgestelde oplossing |
|---|---|---|---|---|---|---|
| **P2** · R3-16 · nieuw | Elk product met een prijs: 2.642 (behang 2.229, vinyl 277, vloerkleden 136). Kaart en productpagina. | "Op voorraad" (groen) zonder voorraadgegevens | Een voorraadbelofte enkel als Shopify voorraad volgt. `filtersysteem.md` §Bewust geen filter: "Shopify volgt geen voorraad, elke variant staat op beschikbaar (TODO B01)". Daarom bestaat er bewust geen filter Beschikbaarheid. | Alle 2.642 kaarten en productpagina's tonen "Op voorraad". Geen enkele variant in de catalogus staat op uitverkocht. Of de producten echt in voorraad zijn (bv. ESTAhome-behang, fotobehang), is uit de data niet af te leiden. | `screenshots/r3-bewijs-behang-1-rollen-op-voorraad.jpg`, `r3-bewijs-lalee-artnr.jpg`, `r3-desk-aanbiedingen.jpg`. Telling: `prodcards.json` (2.642/2.642). | Navragen bij Brunic of "Op voorraad" mag worden beloofd. Zo niet: **code** `product-card.tsx:73`, `product-view.tsx:246`, `shopify-adapter.ts:330` een neutrale tekst laten tonen ("Online te bestellen", "Levertijd: vraag het ons") tot TODO B01 opgelost is. |
| **P3** · R3-17 · nieuw | 35 producten waarvan het beeld van een kleur (= het staal op de kaart en het eerste beeld op de productpagina) een rolfoto of sfeerfoto is: Boråstapeter 31, ADO 2, AW 2. Bij 31 is het staal op de kaart zichtbaar. Lijst: §3.2. | Een klik op een staal toont een opgerolde rol of een interieur, geen vlak staal | Kader: een duidelijke productfoto, staal of detail waarop kleur en structuur herkenbaar zijn | Blå regn staal 2 → foto van een rol. Myrten stalen 5712–5715 → rollen. Ook de staalbolletjes zelf zijn verkleinde rolfoto's (grijze vlekjes). | `screenshots/r3-desk-kaart-Blregn-staal2.jpg`, `r3-desk-kaart-Myrten-staal2.jpg`, `r3-desk-kaart-Hortensia-staal2.jpg`, `r3-contact-kaarten-02.jpg` (#13, #14). Telling: `a2-facets.mjs` (groep H). | **Shopify:** per kleur een vlakke staal- of productfoto toevoegen (of bij de leverancier opvragen). **Code** `view.ts:82`: bij de keuze van het staalbeeld rolfoto's overslaan als er een ander beeld van die kleur is. Bij enkel een rolfoto het kleurbolletje uit `brunic.kleurfamilie` gebruiken. |
| **P3** · R3-18 · bekend (T1, groep D) | Bv. `passement-boord-4625-ado` (kleuren 12 en 13, 1 foto) | Productpagina opent op kleur 12 met de foto die aan 13 hangt | Elke kleur toont zijn eigen foto, of geen | Productpagina "Kleur: 12" met de enige foto (witte kant op zwart). Bij 9 producten heeft één kleur geen eigen beeld en geen gedeeld beeld, en valt de pagina terug op alle beelden (`product.ts:81`). | `screenshots/r3-pdp-passement-boord-4625-ado.jpg`, `r3-contact-kaarten-02.jpg` (#10). Telling: `a8-kleurbeeld.mjs`. | **Shopify:** de koppeling variantbeeld en kleur nakijken. **Code** `product.ts:75-82`: zonder beelden van die kleur een melding "Foto van deze kleur volgt" in plaats van beelden van een andere kleur. |
| **P3** · R3-19 · bekend (N3) | `vasttapijt-paradiso-ab69-desso`, `vasttapijt-asteranne-a411-desso`, `vasttapijt-soft-sense-ii-ac27-desso` | Merk is Tarkett op productie, Desso in titel en slug | Eén lijn voor Desso | Productie (`/api/producten`): `brand: "Tarkett"`, lokaal (28/10): "Desso". Verder niets gewijzigd. | `prodcards-verschil.json` | Navragen of dit een bewuste migratie is. Zie het vorige rapport, N3. |
| **P3** · R3-20 · nieuw · buiten scope (inhoud) | `/catalogus/behang` (intro) | De intro noemt merken die niet in de catalogus staan | Merken die er echt zijn | "…behang van **Arte** … collecties als **Flamant en Missoni**". De catalogus heeft ESTAhome, Origin, Boråstapeter, Walls4You en Sanders & Sanders. | `screenshots/r3-desk-behang-lege-kleurgroep.jpg` (bovenaan) | Tekst nakijken (Shopify-collectie "behang" of `src/data/categorie-teksten.ts`). |

### 2.3 Verbeterpunten

| Prioriteit | Pagina/product/variant | Probleem | Verwacht gedrag | Vastgesteld gedrag | Bewijs en reproductiestappen | Voorgestelde oplossing |
|---|---|---|---|---|---|---|
| **P2** · R3-21 · bekend (V1) | Elke lijst met een kleurfilter, bv. `/catalogus/gordijnen-en-stoffen?weergave=producten&kleur=rood` | De kaart toont de standaardkleur, niet de gefilterde | Bij "Kleur: Rood" toont de kaart de rode variant en linkt ze naar die variant | Eerste pagina, kaartbeeld in een andere kleurfamilie: stoffen Rood 31/35 · vloer Rood 23/48 · tapijten Blauw 27/35 · tapijten Grijs 39/48 · behang Blauw 4/48. Bij stoffen Rood zijn de eerste vier kaarten lila, grijs, lichtgroen en lavendel. | `screenshots/r3-bewijs-stoffen-kleur-rood.jpg`. Telling: `a12-kaartkleur.mjs`. | **Code** `src/lib/catalog/listing.ts:40-52` (`inVorm` past enkel de vorm aan): bij een actieve kleurfilter het staal en beeld van de eerste passende kleur kiezen en `variantId` in de link zetten. |
| **P3** · R3-22 · bekend (T3, groep B en E) | 22 producten met een sfeerfoto als kaartbeeld (21 Boråstapeter, 1 AW) en 4 met een rolfoto (Angle, Sahara Moon, Mirage, Olivtr d) | Het standaardbeeld is geen productfoto | Productfoto, staal of detail als kaartbeeld | Bv. Myrten: interieur. Mirage: rol. | `r3-contact-kaarten-02.jpg` (#13, #14) | **Shopify:** vlakke foto's toevoegen. |
| **P3** · R3-23 · nieuw | `/catalogus/behang` (tegels) | "Babybehang" en "Jeugdbehang meisjes" tonen hetzelfde tegelbeeld | Elke subcategorie een eigen beeld | Beide: `behang-strepen-terracotta-roze-en-wit-estahome-ff93f86226.jpg`. De andere afdelingen hebben geen dubbels. | `screenshots/r3-desk-behang-lege-kleurgroep.jpg` (tegels 1 en 2). Meting: `d6-tegels.mjs`. | **Code** `src/lib/catalog/imagery.ts:19-28`: bij zustertegels een beeld dat al gebruikt is overslaan (zoals `sfeerfotos()` met `skip` doet). Of in Shopify een eigen collectiebeeld instellen. |
| **P3** · R3-24 · nieuw | Lightbox op mobiel, bv. `/product/vloerkleed-papercut-louis-de-poortere` | Vegen werkt niet in de vergrote weergave | Vegen naar de volgende foto, zoals in de galerij | Op de galerij werkt vegen (stip 2 actief). In de lightbox blijft de teller na een veeg op "3 / 10". Enkel de knoppen werken. | `screenshots/r3-mob-lightbox.jpg`, `s4b.json` | **Code** `src/components/product/gallery.tsx:91-156`: veegbeweging (pointer- of touch-events) of een scroll-snap-strook in de lightbox. |
| **P3** · R3-25 · bekend (V5) | Behang, Prijs. `filtersysteem.md` | De prijsfilter mengt "per rol" en "per stuk", en de documentatie loopt achter | Specificatie: "Prijs bij behang verborgen (alles op aanvraag)" en "Binnen één afdeling speelt [het mengen van eenheden] niet" | Behang heeft nu prijzen: 1.908 per rol (€ 23,95–170,95) en 321 per stuk (fotobehang € 64,95–470,95, wanddecoratie). "Meer dan € 250" bevat 82 fotobehangen per stuk. | `test-filters-r3.txt` (behang: Prijs getoond, 6 waarden), `a7-type-leeg.mjs` | `filtersysteem.md` bijwerken (matrix en §Beperkingen). Eventueel de prijsfilter van behang per type of per eenheid tonen. |
| **P3** · R3-26 · bekend (V2) | Kaarten met een hoverbeeld | Het hoverbeeld laadt pas bij de hover | Direct wisselen | 50–700 ms tot het beeld geladen is, zonder hoogteverschil of flikkering (18 kaarten, Δh = 0) | `s3.json` (`msTotGeladen`) | Het hoverbeeld vooraf laden bij `pointerenter` op de lijst, of met lage prioriteit preloaden voor de eerste rij. |
| **P3** · R3-27 · bekend (V8) | Lijstpagina's | Consolewaarschuwingen "preloaded but not used" voor merklogo's | Geen waarschuwingen | Bv. `/merken/artelux.svg … was preloaded … but not used` | `s2.json` (notitie "console") | Preload van de logo's in de mega-menu weghalen, of pas laden bij openen. |
| **P3** · R3-28 · nieuw | Na een keuze, bv. Behang › Fotobehang op maat: Prijs "Prijs op aanvraag (143)", Merk "Boråstapeter (143)". Mobiele lade: Type "Vloerkleed (67)" bij kleur grijs en maat 170–240. | Een filter met één waarde die alle resultaten dekt, blijft staan | Volgens de geest van "verschijnt alleen als hij de lijst kan verkleinen" | 558 keer bij de 350 enkelvoudige keuzes | `screenshots/r3-mob-lade-gekozen.jpg` (Type: enkel "Vloerkleed 67"), `a6-lege-groepen.mjs` | **Code** `filters.ts:307-308`: de nuttigheid ook op de gefilterde basis toetsen (gekozen groepen blijven altijd staan). |
| **P3** · R3-29 · nieuw · specificatie dubbelzinnig | `/catalogus/vloerbekleding?weergave=producten&beschikbaarheid=op-voorraad&eenheid=per-stuk&kleur=grijs` | Vervallen parameters blijven in de URL tot de volgende filterklik | Specificatie: "Vervallen parameters (`beschikbaarheid`, `eenheid`) worden uit de URL gehaald" | Het resultaat is correct (179, parameters genegeerd), maar de URL behoudt ze na het laden. Pas bij de volgende keuze verdwijnen ze (`serializeListState`). | `s2.json` (stap "link …beschikbaarheid") | Bij het laden met `router.replace` de opgeschoonde URL zetten, of de specificatie verduidelijken ("bij de volgende stap"). |

---

## 3. Fotoproblemen per product

Beoordeeld door de beelden zelf te bekijken: contactbladen `screenshots/r3-contact-kaarten-01.jpg` en `-02.jpg` (per product: kaart standaard, kaart hover, kaart na staal 2, eerste foto van de productpagina via het staal en zonder variant), de viewport-screenshots `r3-bewijs-*` en `r3-desk-kaart-*`, en het hoverbeeld van Malaika op volle grootte. Alle beeld-URL's beginnen met `https://cdn.shopify.com/s/files/1/1072/8662/6636/files/`, hieronder afgekort tot `…/`.

### 3.1 Steekproef: producten met een probleem

| Product (titel + slug) | Variant/kleur | Pagina-URL | Standaardbeeld-URL | Hoverbeeld-URL | Screenshot | Oordeel | Voorstel |
|---|---|---|---|---|---|---|---|
| Strada (`vasttapijt-strada-associated-weavers`) | kaart Moonstone 07 (lichtgrijs) · hover Cedar 22 (groen) | /product/vasttapijt-strada-associated-weavers | …/vasttapijt-strada-associated-weavers-318c41e8e3.jpg | …/vasttapijt-strada-associated-weavers-17ed1bb86d.jpg | r3-bewijs-strada-standaard.jpg, r3-bewijs-strada-hover.jpg, contact-01 #5 | fout (visueel bevestigd) | Code `view.ts:71` (hover enkel in dezelfde kleur). Shopify: sfeerfoto per kleur. |
| Arien (`gordijnstof-arien-ado`) | kaart 110 (grijsblauwe ruit) · hover 193 (bruine ruit) | /product/gordijnstof-arien-ado | …/gordijnstof-arien-ado-5615f3aada.jpg | …/gordijnstof-arien-ado-31aa89b45c.jpg | r3-bewijs-arien-*.jpg, contact-01 #6 | fout (visueel bevestigd) | Idem. Het staalbeeld van 193 is diezelfde sfeerfoto (§3.2). |
| Les Best (`vasttapijt-les-best-balsan`) | kaart 007 (grijs) · hover: rood tapijt in slaapkamer, sfeerfoto zonder kleur | /product/vasttapijt-les-best-balsan | …/vasttapijt-les-best-balsan-580f5677a9.jpg | …/vasttapijt-les-best-balsan-39abcdc75b.jpg | r3-bewijs-lesbest-*.jpg, contact-01 #7 | fout (visueel bevestigd) | Shopify: sfeerfoto aan de rode kleur koppelen. Code: kleurloze sfeerfoto niet als hover bij 46 kleuren. |
| Malaika (`gordijnstof-malaika-ado`) | kaart 684 (lichte grond) · hover: gordijnen met donkere grond (lijkt 957) | /product/gordijnstof-malaika-ado | …/gordijnstof-malaika-ado-f53dfd2f9b.jpg | …/gordijnstof-malaika-ado-d4ffdabf14.jpg | r3-bewijs-malaika-*.jpg, contact-01 #8 | fout (hover op volle grootte bekeken) | Shopify: sfeerfoto aan 957 koppelen. |
| Myrten (`behang-myrten-borastapeter`) | kaart: interieur 5717 (donkerblauw) · hover: tweede interieur · productpagina opent 5712 (lichte rol) · stalen 5712–5715 = rolfoto's | /product/behang-myrten-borastapeter | …/behang-myrten-borastapeter-cbcdab72da.jpg | …/behang-myrten-borastapeter-f5aabdf150.jpg | r3-pdp-behang-myrten-borastapeter.jpg, r3-desk-kaart-Myrten-*.jpg, contact-02 #13 | fout (kaart ≠ productpagina, visueel bevestigd) | Shopify: vlakke foto per kleur. Code: kaartlink naar de kleur van het kaartbeeld (R3-05). |
| Fairplay Aqua (`vinyl-fairplay-aqua-beauflor`) | kaart: waterdessin (gekoppeld aan "4 m") · productpagina opent "2 m" met enkel de badkamerfoto | /product/vinyl-fairplay-aqua-beauflor | …/aqua_000v_cv_beauflor_psh.jpg | …/aqua_cv_beauflor_rsh_01.jpg | r3-pdp-vinyl-fairplay-aqua-beauflor.jpg, contact-02 #15 | fout | Shopify: het dessinbeeld niet aan een breedte koppelen (breedte is geen kleur). Zie het vorige rapport, groep C. |
| Mirage (`behang-mirage-borastapeter`) | kaart 4742 = rolfoto · staal 4743 = rolfoto · geen hover | /product/behang-mirage-borastapeter | …/behang-mirage-borastapeter-7f08c35fad.jpg | geen | contact-02 #14, r3-pdp-behang-mirage-borastapeter*.jpg | te verifiëren (er bestaan enkel rolfoto's) | Shopify: vlakke staal- of interieurfoto toevoegen. |
| Boord 4625 (`passement-boord-4625-ado`) | productpagina "Kleur: 12" met de enige foto, die aan 13 hangt | /product/passement-boord-4625-ado | …/passement-boord-4625-ado-84bcc35d6a.jpg | geen | r3-pdp-passement-boord-4625-ado.jpg, contact-02 #10 | te verifiëren (welke kleur de foto toont) | Shopify: koppeling foto ↔ kleur nakijken, foto van 12 toevoegen. |
| Blå regn (`behang-bl-regn-borastapeter`) | kaart 5707 = sfeerfoto · staal 5708 = rolfoto | /product/behang-bl-regn-borastapeter | …/behang-bl-regn-borastapeter-724119d7a5.jpg | (sfeerfoto van 5707) | r3-desk-kaart-Blregn-standaard.jpg, r3-desk-kaart-Blregn-staal2.jpg | te verifiëren (kwaliteit staalbeeld) | Shopify: vlakke foto per kleur. Titel corrigeren ("Blå regn"). |
| Hortensia (`behang-hortensia-borastapeter`) | kaart 5726 = sfeerfoto · stalen 5727, 5728 = rolfoto | /product/behang-hortensia-borastapeter | …/behang-hortensia-borastapeter-9b642c4fc8.jpg | (sfeerfoto) | r3-desk-kaart-Hortensia-*.jpg | te verifiëren (kwaliteit staalbeeld) | Idem. |

**In orde in de steekproef:** ESTAhome "Behang vintage auto's" en Origin "Behang bladeren donker taupe" (productfoto, hover = interieur met hetzelfde behang). Papercut (blauw, hover = blauw tapijt in slaapkamer; staal Sea Spray → groen, en de productpagina opent op dezelfde foto). La Plata VIA 901 en Rampur 0600 (hover = interieur in dezelfde kleur). Easytex Westbury (hover = kinderkamer met dezelfde lichte visgraat). Loft79 6908 (hover = kamer met roestbruine gordijnen in de kaartkleur). Movement, Montana B128 en Light Grey Uni (geen hoverbeeld: de productfoto blijft staan, correct). Bij alle 14 producten met stalen wisselen bij een klik op een staal het beeld en de link (`?variant=`). De productpagina opent dan op die kleur, met het staalbeeld als eerste foto. Bij 16 van de 18 is het kaartbeeld ook de eerste foto op de productpagina.

### 3.2 Nieuw: staalbeeld is een rolfoto of sfeerfoto (35 producten)

Het "staalbeeld" is het eerste beeld dat aan die kleur hangt: het beeld na een klik op het staal, het staalbolletje zelf en de eerste foto op de productpagina voor die kleur. Bij de 4 producten met één kleur (Angle, Sahara Moon, Herbarium, Shell Sand) toont de kaart geen stalen. Daar speelt enkel de productpagina. Voorbeeld-URL = het staalbeeld van de eerste genoemde kleur.

| Product (titel + slug) | Kleuren | Kleur(en) met enkel een rolfoto | Kleur(en) met een sfeerfoto als staalbeeld | Voorbeeld-URL |
|---|---|---|---|---|
| Arien (`gordijnstof-arien-ado`) | 4 | – | 193 | …/gordijnstof-arien-ado-31aa89b45c.jpg |
| Naran FR (`gordijnstof-naran-fr-ado`) | 4 | – | 200 | …/gordijnstof-naran-fr-ado-ba56f03397.jpg |
| Java (`vasttapijt-java-associated-weavers`) | 3 | – | Silver 90, Marble 93 | …/vasttapijt-java-associated-weavers-9b2637c87c.jpg |
| Sonrisa (`vasttapijt-sonrisa-associated-weavers`) | 15 | – | Beige 04 | …/vasttapijt-sonrisa-associated-weavers-18b149750c.jpg |
| Arne Jacobsen Trapez (`behang-arne-jacobsen-trapez-borastapeter`) | 3 | 4736 | – | …/behang-arne-jacobsen-trapez-borastapeter-1f1a89f275.jpg |
| Venice (`behang-venice-borastapeter`) | 3 | 4730 | – | …/behang-venice-borastapeter-a90e530aee.jpg |
| My Secret Garden (`behang-my-secret-garden-borastapeter`) | 3 | – | 4749 | …/behang-my-secret-garden-borastapeter-4293940ad4.jpg |
| Zen (`behang-zen-borastapeter`) | 3 | 4731, 4732 | 4733 | …/behang-zen-borastapeter-fde03654db.jpg |
| Curve (`behang-curve-borastapeter`) | 2 | 4735 | 4734 | …/behang-curve-borastapeter-dfc89b93be.jpg |
| Angle (`behang-angle-borastapeter`) | 1 | 4738 | – | …/behang-angle-borastapeter-e2cb46602a.jpg |
| Sahara Moon (`behang-sahara-moon-borastapeter`) | 1 | 4737 | – | …/behang-sahara-moon-borastapeter-55acb2a777.jpg |
| Diamonds (`behang-diamonds-borastapeter`) | 3 | 4740, 4741 | 4739 | …/behang-diamonds-borastapeter-55b322d6af.jpg |
| Mirage (`behang-mirage-borastapeter`) | 3 | 4742, 4743, 4744 | – | …/behang-mirage-borastapeter-7f08c35fad.jpg |
| Cube (`behang-cube-borastapeter`) | 4 | 4745, 4747, 4748 | 4746 | …/behang-cube-borastapeter-9f4dcf311b.jpg |
| Arch (`behang-arch-borastapeter`) | 2 | 4750 | 4751 | …/behang-arch-borastapeter-83615fdfdf.jpg |
| Prisma (`behang-prisma-borastapeter`) | 2 | 4752 | 4753 | …/behang-prisma-borastapeter-1332831764.jpg |
| Cosmopolitan (`behang-cosmopolitan-borastapeter`) | 2 | 4754 | 4755 | …/behang-cosmopolitan-borastapeter-1ae29bb7ea.jpg |
| Arboretum (`behang-arboretum-borastapeter`) | 3 | – | Blauw 5834 | …/behang-arboretum-borastapeter-c50705105c.jpg |
| Citrontr d (`behang-citrontr-d-borastapeter`) | 3 | – | 5701, 5702, 5703 | …/behang-citrontr-d-borastapeter-676175ca17.jpg |
| Olivtr d (`behang-olivtr-d-borastapeter`) | 3 | 5705, 5706 | – | …/behang-olivtr-d-borastapeter-90fb9443df.jpg |
| Bl regn (`behang-bl-regn-borastapeter`) | 5 | 5708, 5709, 5710 | 5707 | …/behang-bl-regn-borastapeter-724119d7a5.jpg |
| Dahliadr m (`behang-dahliadr-m-borastapeter`) | 3 | 5719, 5720 | 5718 | …/behang-dahliadr-m-borastapeter-6a2de42e7a.jpg |
| Myrten (`behang-myrten-borastapeter`) | 6 | 5712, 5713, 5714, 5715 | – | …/behang-myrten-borastapeter-09adce69a1.jpg |
| rtag rd (`behang-rtag-rd-borastapeter`) | 5 | 5722, 5723, 5724 | 5721 | …/behang-rtag-rd-borastapeter-9147af4932.jpg |
| Hortensia (`behang-hortensia-borastapeter`) | 3 | 5727, 5728 | 5726 | …/behang-hortensia-borastapeter-9b642c4fc8.jpg |
| Kamelia (`behang-kamelia-borastapeter`) | 2 | 5730 | 5729 | …/behang-kamelia-borastapeter-1e83198099.jpg |
| Paradise Birds (`behang-paradise-birds-borastapeter`) | 2 | – | 1903 | …/behang-paradise-birds-borastapeter-icons-f760947e5a.jpg |
| Indigo Garden (`behang-indigo-garden-borastapeter`) | 2 | 3131 | – | …/behang-indigo-garden-borastapeter-ba1d23ce4e.jpg |
| Rabarber (`behang-rabarber-borastapeter`) | 2 | – | 1791, 1792 | …/behang-rabarber-borastapeter-8b02535015.jpg |
| Herbarium (`behang-herbarium-borastapeter`) | 1 | – | 1978 | …/behang-herbarium-borastapeter-3205ad0c5f.jpg |
| Alicia (`behang-alicia-borastapeter`) | 2 | – | 2006, 2008 | …/behang-alicia-borastapeter-d64ec9a039.jpg |
| Acanthus (`behang-acanthus-borastapeter`) | 2 | – | 2009, 2011 | …/behang-acanthus-borastapeter-883eba43a3.jpg |
| Syren (`behang-syren-borastapeter`) | 3 | – | 6963, 6964, 6965 | …/behang-syren-borastapeter-dc0b5caa44.jpg |
| Shell Sand (`behang-shell-sand-borastapeter`) | 1 | – | 7575 | …/behang-shell-sand-borastapeter-61752b27ae.jpg |
| Treasured Thistle (`behang-treasured-thistle-borastapeter`) | 3 | – | 2273 | …/behang-treasured-thistle-borastapeter-f638333fdd.jpg |

**Oordeel:** te verifiëren. Het beeld hoort bij het juiste product en de juiste kleur. De vraag is of er een vlakke foto bestaat (leverancier) die kleur en dessin beter toont. Visueel bekeken: Myrten, Mirage, Blå regn, Hortensia.

### 3.3 Groepen over de hele catalogus (berekend op de data, ongewijzigd tegenover het vorige rapport)

| Groep | Aantal | Per merk | Volledige lijst |
|---|---|---|---|
| A · hover-sfeerfoto hangt aan een andere kleur dan het kaartbeeld | 66 | Lano 36, Balsan 10, Boråstapeter 11, AW 4, ADO 2, Loft79 2, Ragolle 1 | vorig rapport §3 (A), `groups.json` |
| N4/N5 · kleurloze sfeerfoto als hover bij meerdere kleuren | 189 | ADO 177, Balsan 10, Lano 1, AW 1 | rapport `-2` §4.2, `groups.json` (D_hoverKleurloosMeerkleurig) |
| B · kaartbeeld is een sfeerfoto | 22 | Boråstapeter 21, AW 1 | vorig rapport §3 (B) |
| C · kaartbeeld niet vooraan op de productpagina | 27 | Beauflor 10, Boråstapeter 7, ADO 6, Tarkett 3, AW 1 | vorig rapport §3 (C) |
| E · kaartbeeld is een rolfoto | 4 | Boråstapeter 4 | vorig rapport §3 (E) |
| H · staalbeeld is een rolfoto of sfeerfoto (**nieuw**) | 35 | Boråstapeter 31, ADO 2, AW 2 | §3.2 hierboven |
| Producten zonder beeld · dubbele beelden binnen een product | 0 · 0 | – | `summary.json` |
| Producten met 1 beeld (geen hover, correct) | 67 | Tarkett 18, Beauflor 17, Ragolle 12, ADO 11, Lalee 6, Boråstapeter 3 | `groups.json` (I_eenBeeld) |

---

## 4. Geteste onderdelen

### 4.1 Volledig uitgevoerd (hele catalogus)

- **Kaartgegevens productie tegenover de momentopname:** alle 4.070 producten (41 GET's op `/api/producten`, zonder `live=1`). Identiek op 3 merkvelden na (R3-19).
- **Beeld-URL's:** 10.579 unieke kaart-, hover- en staalbeelden met HEAD gecontroleerd, max. 8 tegelijk, in 457 s. Resultaat: **0 problemen** (allemaal 200 en `image/*`). Geen product zonder beeld.
- **`pnpm --filter @brunic/prototype test:filters`:** 505 geslaagd, 0 mislukt (`%TEMP%\brunic-qa\test-filters-r3.txt`).
- **Beeldgroepen** A, B, C, E, H, N4/N5, 1-beeld, ontbrekend en dubbel: berekend op alle producten met de eigen code van de site (`toCard`, `imagesForVariant`).
- **Lege en nutteloze filtergroepen:** elke waarde van elke filter in de 4 afdelingen afzonderlijk gekozen (350 lijsten, orakel). Basis voor R3-03 en R3-28.
- **Prijsklassen tegenover variantprijzen** (tapijten, behang, vinyl) en **kleur × maat per variant** (tapijten): 1 van de 1.019 combinaties zonder passende variant (Ripley 0226, Beige + tot 120 cm). Dat valt onder de bekende beperking van `filtersysteem.md`.
- **Kaartkleur na kleurfilter:** 5 lijsten, eerste pagina (R3-21).
- **SKU's:** alle varianten. Enkel bij Lalee en Ragolle ontbreken ze (R3-09).

### 4.2 In de browser (headless Chrome 156 via CDP, productie)

Desktop 1366×900, mobiel 390×844 met touch, tablet 768×1024 en 1024×768, en 1240–1440 px voor de header.

- **S1, overzicht (59 paginabezoeken):** de 4 afdelingen (landing en `?weergave=producten`), alle 20 subcategorieën, 5 zoekopdrachten (waarvan 1 zonder resultaat), aanbiedingen, nieuw binnen en 5 merken. Op mobiel 19 daarvan. Telkens het totaal, de volgorde van alle getoonde kaarten en de 6 filterknoppen naast het orakel: **alles identiek**. Geen overflow, geen consolefouten, geen mislukte verzoeken. Raamdecoratie, Verf en Slapen & wonen geven 404 en staan niet in het menu (desktop en mobiel).
- **S2, filterbediening desktop (40 stappen, alle 40 identiek aan het orakel):**
  - Behang: Kleur Blauw → + Groen (OF, 167 → 468) → + Motief Bloemen via het zoekveld (EN, 67) → sorteren op naam → meer tonen → chip weg → terug → vooruit → herladen → alle filters wissen.
  - Vloer: Look Planken → + Rolbreedte 400 cm → + Prijs tot € 25 → sorteren op prijs (oplopend gecontroleerd, allemaal onder € 25 per m²).
  - Tapijten: Grijs → + 170–240 cm → + € 100–250 → prijs aflopend. Ook Vorm Rond: de kaarten tonen de ronde foto.
  - Stoffen: Black-out → + Eigenschappen Wasbaar en Brandvertragend in de lade (EN, 8 → 6). Lege combinatie: uitleg, "Filters aanpassen" (lade met de 3 keuzes op 0) en "Alle filters wissen".
  - Snel klikken: 4 motieven na elkaar, en Roze aan/uit + Wit, telkens zonder op de server te wachten (±40 ms pauze tussen de klikken). URL, lijst en vinkjes klopten.
  - Oude en onzinnige links (`kleur=Grijs`, `Multicolor`, vervallen parameters, filter buiten het profiel, `pagina=abc`, `sorteer=hack`).
  - Gemengde lijst: zoeken "bloemen" + Categorie + Prijs.
- **S3, kaarten desktop (18 producten, bewust gekozen uit de data):** hover wisselt en keert terug (18/18, hoogteverschil 0). Staal 2: beeld en link wisselen, `aria-pressed`, hover laat het staalbeeld staan (14/14). Productpagina via het staal en zonder variant. Contactblad met alle beelden.
- **S4, mobiel:**
  - Lade: openen, focus in de lade, pagina scrolt niet mee, vegen in de lade tot de voet, kiezen (lade en groep blijven open), "Toon 67 producten", chips, "Alles wissen", sluiten met X.
  - Kaarten: staal tikken navigeert niet, tik op de kaart opent het product, terug herstelt de scrollpositie.
  - Productpagina: galerij vegen (stip 2), lightbox, variantlade (`?variant=`, eerste foto wisselt), melding bij een combinatie die niet bestaat (Rampur), kleverige bestelbalk na scrollen.
  - Menu tot alle 7 tapijtcategorieën.
  - Geen overflow, geen consolefouten.
- **S5, toetsenbord desktop:**
  - Skiplink, filterknoppen met zichtbare focusring, Enter opent het paneel, Tab naar het vinkje, Spatie filtert, Escape geeft de focus terug.
  - Sorteren met pijl omlaag.
  - Kaarten: hartje → link (ring via `::after`) → 4 stalen → "+N" → volgende kaart. Enter opent het product.
  - Productpagina: foto → lightbox (pijlen, Tab blijft binnen, Escape geeft de focus terug), optieknop → lade → Enter kiest.
  - **Filterlade: niet bedienbaar (R3-01).**
- **S6, productpagina's (9 + aanbieding):** prijs en eenheid (€ / rol, € / m², per stuk, op aanvraag), "Prijs per …", totaal, opties, aantal foto's en "Meer foto's tonen", kenmerken, "Dit vindt u misschien ook leuk" (10 kaarten), "Ontdek ook". Doorstreepte prijs en −% op kaart en productpagina (Gerflor Senso, Tarkett Trude).
- **SEO-signalen:** gefilterde lijst `noindex, follow` + canonical naar het kale pad. Ongefilterde pagina `noindex, nofollow` (site-breed zolang niet live, bewust).

### 4.3 Steekproef

- Visuele beoordeling van beelden: 18 producten volledig (contactblad), 4 extra hoverbewijzen en 3 Boråstapeter-kaarten met stalen. De groepen in §3.3 zijn op de data berekend, niet allemaal bekeken.
- Productpagina's: 22 verschillende producten geopend (S3, S4, S5, S6).

---

## 5. Beperkingen en niet getest

- **Geen echte toestellen** (iOS Safari, Android) en **geen schermlezer** (NVDA, VoiceOver). Touch is geëmuleerd in Chrome. De aria-attributen en de focus zijn enkel via de DOM gecontroleerd.
- **Niet aangeraakt, zoals de opdracht vraagt:** winkelmand, kassa en formulieren (offerte, opmeting, contact). "In winkelmand" en "Offerte aanvragen" zijn enkel gelezen, niet aangeklikt.
- **Geen toegang tot Shopify-admin of Vercel.** Waarom productie niet automatisch herbouwt (rapport `-2`, T2) is niet opnieuw onderzocht, en `/api/catalogus/vernieuwen` is bewust niet aangeroepen.
- **Niet elke productfoto bekeken:** de momentopname heeft 41.877 unieke beelden. De kaart-, hover- en staalbeelden (10.579) zijn met HEAD gecontroleerd. De overige galerijbeelden niet, uit zuinigheid met het CDN.
- Groep N4/N5 (189) en groep A (66) zijn niet allemaal visueel bekeken. Zie het vorige rapport voor de steekproef van 20.
- Geen lokale dev-server of productiebuild (niet nodig: productie = `82ba1b0`).
- Prestaties enkel indicatief: van filterklik tot nieuwe lijst ±0,3–0,6 s (12 metingen, inclusief serverrender), hoverbeeld 50–700 ms.

---

## 6. Prioriteitenlijst voor herstel

1. **R3-01 (P2):** focusval van de lade: `summary` in `drawer.tsx:7`. Kleine wijziging, groot effect voor toetsenbordgebruikers.
2. **R3-03 (P2):** lege filtergroepen niet tonen (`filters.ts:315-319`). Neem R3-28 (groep met één waarde) meteen mee.
3. **R3-02 (P2):** prijsfilter tapijten op alle variantprijzen, en bij een Maat-filter op de passende maten (`filters.ts:174-182`).
4. **R3-04, R3-05, R3-21 (P2):** beeldlogica op de kaart: hover enkel in dezelfde kleur (`view.ts:71`), kaartlink naar de kleur van het kaartbeeld (`view.ts:69`), kaartbeeld volgt de kleurfilter (`listing.ts:40-52`). Daarna de Shopify-koppelingen van sfeerfoto's aanvullen (groepen A en N4/N5).
5. **R3-16 (P2, te verifiëren):** beslissen of "Op voorraad" mag blijven staan zolang de voorraad niet gevolgd wordt.
6. **R3-06 (P2):** focus en scroll na "meer tonen" (`product-listing.tsx:101-108`).
7. **R3-09 (P3, data):** SKU's voor Lalee en Ragolle in Shopify, en geen "Art.nr." zonder SKU.
8. **Teksten (P3):** R3-07 (1 producten), R3-08 (Op maat), R3-11 (1 rollen), R3-14 (zoekkop), R3-15 (titels), R3-20 (intro behang).
9. **R3-17 en R3-22 (P3, beelden):** vlakke foto's per kleur voor Boråstapeter (§3.2).
10. **Afwerking (P3):** R3-10 (header 1280 px), R3-12 (hover op touch), R3-13 (Multicolor), R3-23 (dubbel tegelbeeld), R3-24 (vegen in de lightbox), R3-26 (hover vooraf laden), R3-27 (preload), R3-29 (vervallen parameters).
11. **Documentatie:** R3-25: `filtersysteem.md` bijwerken (prijs bij behang, de prijsbasis van R3-02 en de stand van 31/10).

**Telling:** 29 bevindingen. Bevestigde fouten 15 (P2: 6 · P3: 9). Te verifiëren 5 (P2: 1 · P3: 4). Verbeterpunten 9 (P2: 1 · P3: 8). Geen P1. Nieuw in deze ronde: 14 (R3-01, -02, -03, -07, -08, -09, -10, -16, -17, -20, -23, -24, -28, -29). Opnieuw vastgesteld uit de vorige rapporten: 15.
