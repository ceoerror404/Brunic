# Webshop-QA-audit Brunic: volledige controle na de R4-oplossingen (vijfde ronde)

- **Datum:** 03/11/2026, tests tussen 14:50 en 16:08 (CET)
- **Uitgevoerd door:** Claude (agent, alleen lezen en testen)
- **Opdracht:** `.agents/skills/webshop-qa-audit/SKILL.md`, volledige scope, getoetst aan `docs/filtersysteem.md`
- **Map:** `docs/audits/2026-11-03-webshop-qa/`. Screenshots in `screenshots/` (gitignored, voorvoegsel `r5-`). Alle bestandsnamen hieronder staan daar.
- **Vergelijking:** met `docs/audits/2026-11-02-webshop-qa/rapport.md` (R4) en, via de R3-nummers, met `docs/audits/2026-10-31-webshop-qa-3/rapport.md`. Status per eerdere bevinding: §10. De twee oudste rapporten van 31/10 zijn niet apart nagelopen: hun punten kregen in R3 een nieuw nummer. De oudere mappen zijn niet gewijzigd.

| Omgeving | Code | Catalogus | Hoe vastgesteld |
|---|---|---|---|
| **Productie** https://brunic.vercel.app, deployment `dpl_B5D6ncgHjiRs2JkTXK9YjPm2VXcZ` (begin en einde gelijk) | `c31c200` "Audit-agent: ook nakijken wat er niet staat". Lokale `master`, `origin/master` en `git ls-remote` wijzen daarnaar. De site toont geen commit, dus dit is afgeleid. `c31c200` raakt enkel de skill, de laatste code is `fdf941e`. | `/api/status`: "Shopify-momentopname van 2026-11-03 13:48 · 4070 producten (4111 in Shopify, zelfde ontwerp samengevoegd) · 24 categorieën · 2 zonder gekoppelde collectie". Tijd in UTC, dus 14:48 CET: 3 minuten oud bij de start van de audit. | Alle 4.070 kaarten en variantprijzen op productie (`/api/producten`) zijn identiek aan wat de code van `c31c200` berekent op de lokale momentopname: **0 verschillen**. Ook 47.191 filtertellingen en het productmodel van 423 productpagina's komen overeen. |
| Lokaal (enkel als rekenmodel) | Werkkopie `c31c200`. Geen dev-server. | `apps/prototype/.data/shopify-catalogus.json`, 02/11 19:35 UTC, dus **ouder dan productie**. De opdracht noemt dit "de momentopname waarmee de site gebouwd is", maar productie heeft een eigen, nieuwere. | Zie hierboven: de inhoud verschilt niet op wat ik kon nameten. |

Er is niets gewijzigd aan code, data, beelden, koppelingen of Shopify. Er is niets gecommit of gepusht. De winkelmand, de kassa, de formulieren en het hartje zijn niet aangeraakt. Hulpscripts staan in de scratchpad van deze sessie (`scratchpad/r5/`), ruwe uitvoer in `%TEMP%\brunic-qa\r5\`.

**Let op:** tijdens de audit verschenen lokale, niet-gecommitte wijzigingen in `logo.tsx`, `site-header.tsx`, `navigation.ts` en `public/brand/`. Die zijn niet van mij, ik heb ze niet aangeraakt, en ze staan niet op productie. Ze raken de catalogus niet, dus ook niet mijn rekenmodel.

---

## 1. Oordeel

**De winkel werkt technisch goed. Wat de klant tegenhoudt, zit in de data.** Filteren, tellen, sorteren en pagineren kloppen volledig: op 1.300 productielijsten met 95.769 kaarten en 47.191 tellingen vond ik geen enkele afwijking van mijn eigen, los van de filtercode gerekende uitkomst. Op 43 kaarten na (4 producten met een foute kleurkoppeling in Shopify) kloppen ook beeld, prijs, hover en link. De vier P2-fouten uit het vorige rapport zijn opgelost, net als R4-05 en R4-06. Alle 41.951 productfoto's antwoorden met een geldig beeld.

**De drie zwaarste punten:**

1. **R5-01 en R5-02 (P1): grote delen van de catalogus zijn niet te vinden op kleur of motief.** Vinyl (277 producten) heeft geen filter Kleur. Boråstapeter (495 producten) heeft bijna geen kleur (9 producten), geen motief, geen stijl en geen ruimte. Wie in Behang op motief, stijl of ruimte filtert, verliest dat merk volledig. In totaal zijn 1.624 kleuren enkel een code zonder kleurfamilie.
2. **R5-28 (P1, te verifiëren): bij twee Gerflor-producten staat de doosprijs er vermoedelijk als prijs per m².** Senso Wallstreet toont "€ 55,48 / m²", terwijl de doos 2,22 m² bevat en de tekst zegt "ENKEL VERKOCHT PER DOOS". Per m² zou dat € 24,99 zijn.
3. **Beloftes die Brunic niet bevestigd heeft, in de stem van een ander.** 483 Boråstapeter-pagina's beloven een opmeting aan huis (R5-08), waar Brunic die niet levert. 36 Louis De Poortere-pagina's zeggen "onze eigen fabriek", "snelle levering in heel Europa" en "wij halen het gratis op" (R5-30). 245 vinylproducten noemen een garantietermijn (R5-29).

**Daarnaast storend, en snel op te lossen:** wie ver gescrold een filter kiest, belandt bij de footer zonder producten of filterbalk (R5-04). De beschrijving van 243 vinylproducten toont een tabel als één lopende zin (R5-05). Bijna elk vloerkleed wordt op kaart en productpagina voor de helft weggesneden, ook in de lijst "Speciale vormen", waar het net om de vorm gaat (R5-06). 25 vinylkaarten beginnen met een kamerfoto terwijl er een vlakke foto is, waaronder 10 van de 12 aanbiedingen (R5-07).

**Bruikbaarheid:** op desktop en mobiel kan een klant vlot bladeren, filteren en een product openen. Geen enkele pagina is stuk. Vóór de overstap zou ik de vindbaarheid en de beloftes rechtzetten: dat raakt het vertrouwen en de omzet meer dan de overgebleven afwerking.

### Stand tegenover 02/11

| Punt | 02/11 | 03/11 (zelf gemeten op productie) | Oordeel |
|---|---|---|---|
| R4-01 prijs na een klik op een staal | 1.006 keer | 0. Rampur 0600 bij `maat=tot-120`: kaart € 79, staal 7272 "vanaf € 49", pagina € 49 | **Opgelost** |
| R4-02 kaart rechthoekig, pagina rond | 25 producten | 0. Papercut bij 120–170 opent op 140 × 200 cm | **Opgelost** |
| R4-03 staal blijft hangen na een kleurfilter | ja | Nee. Papercut Sea Spray + Kleur Blauw: kaart blauw, staal uit. Sorteren laat het staal staan, zoals de specificatie zegt | **Opgelost** |
| R4-04 sfeerfoto vooraan bij Organisch | 3 Lalee-producten | 0. Lech HEA 900, Lamego 701 en 702 op de productfoto | **Opgelost** |
| R4-05 vormlijst met extra filter | 19 producten | 0. POP: kaart en pagina op dezelfde foto | **Opgelost** |
| R4-06 "+N" op een andere kleur | ja | Nee. Koren: "+N" en titel op dezelfde variant | **Opgelost** |
| R4-11 Levertijd in de kenmerken | 31 | 0 van de 276 producten (243 Levertermijn, 33 Levertijd). Restpunten: R5-10, R5-34 | **Grotendeels opgelost** |
| R4-07, -08, -09, -10, -12 t/m -19 | open | Nog aanwezig, allemaal opnieuw getest. Volledige lijst per punt: §10 | **Open** |
| `test:filters` | 525 geslaagd | 535 geslaagd, 0 mislukt | In orde |

---

## 2. Bevindingen

Prioriteit: **P1** blokkeert kopen of vinden, of toont foute informatie · **P2** duidelijk storend · **P3** afwerking. Pagina-URL's zijn relatief tot https://brunic.vercel.app. "Regel" = regel van de opdrachtgever: een afwijking is een fout, ook als de code doet wat ze moet doen. Logbestanden (`*.json`, `*-log`, `test-filters.txt`) staan in `%TEMP%\brunic-qa\r5\`.

### 2.1 Bevestigde fouten

| Prioriteit | Pagina/product/variant | Probleem | Verwacht gedrag | Vastgesteld gedrag | Bewijs en reproductiestappen | Voorgestelde oplossing |
|---|---|---|---|---|---|---|
| **P1** · R5-01 · bekend, nog niet opgelost · data | Alle vinyl: 277 producten, 514 kleuren. `/catalogus/vloerbekleding/vinyl` | Geen filter Kleur | De klant kan vinyl op kleur zoeken. Een verdwenen filter is geen geslaagde test (opdracht §5). | Knoppen: Look, Rolbreedte, Prijs, Merk, Slijtlaag, Plaatsing. In `/catalogus/vloerbekleding` sluit elke kleurkeuze alle vinyl uit. 390 kleuren heten enkel een code (162L, 901D). Bij 31 producten staat de kleur er wel als kenmerk (Barinas: "Kleur: Zwart / Wit"), maar de filter leest dat niet. | `r5-bewijs-vinyl-geen-kleurfilter.jpg`, §4.1. Reproductie: open de URL en zoek de knop Kleur. | **Shopify:** de nagekeken tags wegschrijven (`BRUNIC_VINYL_TAGS_2026-11-02.json`, 1.924 velden, zie `docs/agent-work/r4-en-vinylkleuren-2026-11-03.md`) en een nieuwe build. De build van 13:48 UTC bevat ze nog niet. |
| **P1** · R5-02 · nieuw als geheel · data | Boråstapeter: 495 producten, 1.147 kleuren. `/merken/borastapeter`, `/catalogus/behang?weergave=producten` | Het merk is amper te vinden met de filters | Motief, Stijl, Ruimte, Materiaal en Kleur gelden voor heel Behang | Kleur: 9 van de 495 producten. Motief, Stijl, Ruimte, Materiaal: **0**. 1.113 kleuren zijn enkel een code zonder familie. Wie in Behang Motief "Bloemen" kiest, ziet geen enkel Boråstapeter-product. De merkpagina heeft enkel Type, Kleur en Eigenschappen. Prijs valt weg, want alles staat op aanvraag. | `r5-bewijs-boras-merkpagina-filters.jpg`, `test-filters.txt`, §4.1. Reproductie: `/catalogus/behang?weergave=producten&motief=bloemen&merk=borastapeter` geeft 0 producten. | **Shopify:** kleurfamilie, motief en stijl taggen, op dezelfde manier als de gordijnstoffen (fototags, 28/10). De front neemt ze vanzelf over. |
| **P2** · R5-03 · bekend (§Wat er in Shopify ontbreekt) · data | Behang ESTAhome 615, Origin 137, Walls4You 7, Sanders 3 producten. Vasttapijt en lopers: AW 885 van de 1.207 kleuren, Lano 382 van de 668. | Kleur staat in de titel, maar niet in de filter | Een product met kleur "blauw" in de naam verschijnt onder Kleur: Blauw | 725 producten hebben een kleurwoord in de titel en geen kleurfamilie. Van de 157 behangen met "blauw" in de naam ontbreken er 61 onder Blauw, bv. "Behang kersenbloesems Van-Gogh-blauw". Vasttapijt: het product verschijnt, maar veel kleuren ervan niet. | `a7-log`, §4.1. Reproductie: `/zoeken?q=kersenbloesems` en daarna `/catalogus/behang?weergave=producten&kleur=blauw`. | **Shopify:** kleurfamilie aanvullen (fototags). De titel kan als voorstel dienen. Niet in de front afleiden: "liever geen waarde dan een gegokte". |
| **P2** · R5-04 · nieuw · code | Elke lijst op desktop, na scrollen. `/catalogus/tapijten?weergave=producten` scroll 3.500, Kleur → Roze | Na een filterkeuze ziet u de resultaten niet meer | De klant ziet de resultaten en de filterbalk | Kort resultaat (6 producten): de pagina springt naar 2.100, eerste kaart op −1.266 px, filterknop op −548 px, **0 kaarten in beeld, enkel de footer**. Ook "Klaar" is weg (paneel op −494 px). Behang + Rood: idem. Lang resultaat (103): de balk blijft staan, maar u kijkt naar kaart 25 en verder. | `r5-desk-sticky-paneel-na-keuze.jpg`, `r5-desk-filter-vanaf-scroll-kort-resultaat.jpg`, `-behang-Rood.jpg`, `-lang-resultaat.jpg`. Reproductie: scrol, open Kleur in de kleverige balk, kies een kleine kleur. | **Code** `product-listing.tsx:61` (`scroll: false`): na een filter of sortering naar het begin van de lijst scrollen als dat boven beeld staat. "Meer tonen" niet. |
| **P2** · R5-05 · nieuw · code + data | 243 vinylproducten (Beauflor 197, Tarkett 37, Gerflor 9). Bv. `/product/vinyl-bacopa-moonlight-cobble-beauflor` | De beschrijving toont een tabel als één lopende zin | Leesbare tekst, en geen herhaling van de kenmerken | "Dikte 2,50 mm Slijtlaag 0,25 mm Gewicht 1360 gr/m² Productgroep Vinyl Kleur Meerderkleurig Dessin Kasseien … Vloerverwarming ja Beste klanten," | `r5-desk-pdp-vinyl-bacopa-beschrijving.jpg`. Reproductie: open de pagina, sectie Beschrijving. | **Code** `shopify-adapter.ts:149-165` (`htmlNaarTekst`): de hele `<table>` weghalen, want dezelfde data staat al in de kenmerken. Dat lost ook de garantie in de tekst op (R5-29). |
| **P2** · R5-06 · nieuw · code | Alle vloerkleden: 171 van de 172 (LDP 36, Lalee 83, Ragolle 52). Bv. `/catalogus/tapijten/speciale-vormen`, `/product/vloerkleed-drop-louis-de-poortere` | Het tapijt wordt boven en onder afgesneden | Product en vorm zijn herkenbaar op de kaart en de eerste foto (opdracht §3) | Staande foto (LDP 1504 × 2048, Ragolle 2825 × 4096, Lalee 600 × 900) in een kader 4:3 met `object-cover`: 45 tot 50% van de hoogte valt weg. In "Ronde tapijten" is de cirkel onderaan afgeknot, in "Speciale vormen" is de vorm boven en onder weg. Links en rechts blijft wit over. Op de productpagina idem: enkel de eerste foto is `cover`, de rest `contain`. | `r5-desk-raster-organisch.jpg`, `r5-desk-raster-rond.jpg`, `r5-desk-pdp-ldp-drop.jpg`, `r5-contact-ldp-kaarten.jpg`, §4.4 | **Code** `product-card.tsx:40`, `gallery.tsx:72`: voor vloerkleden `contain` op een neutrale achtergrond. Behang en stof hebben er minder last van (patroon). |
| **P2** · R5-07 · bekend, regel · data | 28 vinylkaarten, waarvan **25 met een vlakke foto** in de galerij. `/aanbiedingen`: 10 van de 12 | De kaart en de pagina beginnen met een kamer | "Een sfeerfoto komt nooit eerst, tenzij die kleur niets anders heeft" | Zelf geteld op de contactbladen. De foto's zijn ongelabeld (soort `overig`), dus de code kan ze niet rangschikken. Hover draait mee om: kaart = kamer, hover = vloer. Enkel Kindervinyl Trude, Rock Grey Black Uni en Tila Derby Grege hebben niets anders. | `r5-contact-kamers-alle-fotos.jpg`, `r5-contact-overig-vloer-1.jpg`, `-2.jpg`, `r5-desk-gemengd--aanbiedingen.jpg`, lijst in §3.1 | **Shopify:** label `sfeerfoto` op deze foto's (voorstel ligt klaar, zie de overdracht). `fotos-index-brunic-vinyl.csv` kent de soort al. |
| **P2** · R5-08 · nieuw · code | 483 Boråstapeter-behangen zonder afmetingen. Bv. `/product/behang-lily-tree-borastapeter` | Belofte die Brunic daar niet waarmaakt | Opmeting enkel beloven waar Brunic die levert (`lib/site/maatwerk.ts`). Bij behang: kom naar de winkel. | Blok Afmetingen: "Op maat: wij bepalen de afmetingen samen met u, bij een opmeting aan huis of in de winkel." Op dezelfde pagina staat terecht "Bekijk de stalenboeken in onze winkel". | HTML van de pagina, telling `a11`. Reproductie: open de URL, sectie Kenmerken & afmetingen. | **Code** `product-info.tsx:84-86`: enkel als `isOpMaat(maatwerk)`. Anders "Zie de gekozen uitvoering" of niets. |
| **P2** · R5-09 · bekend (R4-10) · data | Toscana B592 (`vasttapijt-toscana-b592-desso`) | Rood op de kaart, blauw bij hover, voor dezelfde kleur | Elke kleur toont haar eigen foto | Kaart "729": de foto met alt "710" (rood). Hover: de echte 729 (blauw). Kleur 710 heeft geen foto. Bij `kleur=rood` staat de rode foto aan de blauwe kleur. | `r5-r4-10-toscana-kaart.jpg`, `r5-r4-10-toscana-hover.jpg`, `r5-contact-koppeling.jpg` #15. Kaartcontrole: 43 meldingen op 4 producten (§3.2) | **Shopify:** variantfoto 710 → `…-a275158a63.jpg`, 729 → `…-caa208aed4.jpg`. |
| **P3** · R5-10 · bekend (overdracht), regel · data | Goodnight (`gordijnstof-goodnight-artelux`) | "Deze stof heeft een korte levertijd" | Geen levertermijn op de site | Staat in de zichtbare tekst en in de structured data. De filter pakt enkel tabelrijen. | `r5-bewijs-goodnight-levertijd.jpg` | **Shopify:** zin uit de beschrijving halen. |
| **P3** · R5-11 · bekend (R4-09), regel · data | Soft Sense II AC27, Asteranne A411, Paradiso AB69 | Niet vindbaar op "Desso" | Zoeken op Desso blijft werken | `/zoeken?q=desso`: 97 van de 100 Desso-producten. Bij deze 3 staat de vendor al op Tarkett, dus `merkBron` is leeg. | `a7-log` | **Shopify:** vendor terug op Desso. Of **code** `shopify-adapter.ts:392`: ook de slug `-desso` meetellen. |
| **P3** · R5-12 · bekend (R4-07) · code | Lade, uitvinken van een waarde met aantal 0. `/catalogus/tapijten?weergave=producten&kleur=roze&vorm=loper` | De focus valt weg | "Verdwijnt het element met de focus, dan gaat de focus naar…" | `activeElement` = `BODY`, de lade blijft open. Desktop en mobiel. | `b1-desk.json`, `b1-mob.json` | **Code** `product-listing.tsx:117-122` geldt enkel voor de balk. In de lade de focus op de groep zetten. |
| **P3** · R5-13 · nieuw · code | Elke lijst, Shift+Tab door de kaarten | De focus verdwijnt onder de kleverige filterbalk | De focus blijft zichtbaar | 3 van de 26 stops: het hartje van Lagoon, Sakura en Baobab op y = 122, onder de balk. | `r5-desk-focus-onder-balk.jpg`, `b7.json` | **Code:** `scroll-padding-top` op `html`, gelijk aan header + filterbalk. |
| **P3** · R5-14 · bekend (R4-08) · code | `/product/behang-olivtr-d-borastapeter` en 4 andere oude URL's | 404 | Een hernoemd product blijft bereikbaar | Alle 5: 404. `/merken/desso` geeft wel netjes 308. | `b4.json` | **Code** `next.config.ts`: 5 redirects, vóór livegang. |
| **P3** · R5-15 · bekend (R3-13) · code | `/catalogus/tapijten?weergave=producten&kleur=Multicolor` | Oud label geeft een lege lijst | "Oude links met labels werken nog" | 0 producten, chip "Kleur: multicolor". `kleur=Grijs` en `merk=Boråstapeter` werken wel. | `b1-desk.json` | **Code** `filters.ts:403`: de kleursynoniemen ook hier toepassen. |
| **P3** · R5-16 · bekend (R3-29) · code | `…&beschikbaarheid=op-voorraad&eenheid=per-stuk&kleur=grijs` | Vervallen parameters blijven in de URL | "worden uit de URL gehaald" | Resultaat correct (101), URL ongewijzigd tot de volgende klik. | `b1-desk.json` | `router.replace` bij het laden, of de specificatie verduidelijken. |
| **P3** · R5-17 · bekend (R3-07) · code | Lijst met 1 resultaat, bv. `/zoeken?q=Myrten` | "U hebt 1 van 1 producten bekeken" | Enkelvoud | Staat er zo. | `b4.json` | **Code** `product-listing.tsx:255`. |
| **P3** · R5-18 · bekend (R3-14) · code | `/zoeken?q=bloemen&categorie=behang` | Zoekkop en lijst tonen een ander aantal | Eén aantal | Kop "382 producten", lijst "333 producten". | `b4.json` | **Code** `zoeken/page.tsx:42`: `listing.total` tonen. |
| **P3** · R5-19 · bekend (R3-11) · code | 1.908 behangen per rol | "Totaal voor 1 rollen" | "1 rol" | "Totaal voor 1 rollen: € 52,95". | `b4.json` | **Code** `product-view.tsx:256`. |
| **P3** · R5-20 · bekend (R3-09) · data | Alle 136 Lalee- en Ragolle-tapijten, 1.089 varianten | "Art.nr." is een Shopify-ID | Artikelnummer, of geen regel | "Art.nr. 59354776535372". | `r5-desk-pdp-ragolle-rampur-0445.jpg` | **Shopify:** SKU's. **Code** `shopify-adapter.ts:339`, `product-view.tsx:303`: zonder SKU geen regel. |
| **P3** · R5-21 · bekend (R3-10) · code | Elke pagina op 1.280–1.289 px | Horizontale overflow | Geen zijwaartse scroll | 7 px bij 1.280, 2 px bij 1.285 ("Opmeting aanvragen"). 1.024, 1.100, 1.240, 1.290, 1.366, 1.440, 1.600, 1.920: in orde. | `r5-desk-overflow-1280.jpg` | **Code** `site-header.tsx`. Let op: dat bestand staat lokaal in wijziging. |
| **P3** · R5-22 · bekend (R3-12) · code | Mobiel, kaart met stalen, bv. Les Best op `/catalogus/vloerbekleding/vasttapijt` | Kleverige hover op touch | Staal uit → de eerste foto | Staal aan en weer uit: de sfeerfoto blijft staan (`…-63f7915484.jpg` in plaats van `…-a80edac8e1.jpg`). Geëmuleerd, niet op een echt toestel. | `r5-mob-staal-aan.jpg`, `r5-mob-staal-uit.jpg` | **Code** `product-card.tsx:30-31`: hover enkel bij `pointerType === "mouse"`. |
| **P3** · R5-23 · bekend (R3-24) · code | Lightbox op mobiel | Vegen werkt niet | Vegen zoals in de galerij | De teller blijft op "2 / 10". De knoppen werken. | `r5-mob-lightbox.jpg`, `b5.json` | **Code** `gallery.tsx:91-156`. |
| **P3** · R5-24 · nieuw · code | 13 vinylproducten, bv. Barinas Inspire Modena | Twee keer "Kleur:" in de kenmerken | Eén regel | "Kleur: Zwart / Wit" en "Kleur: 901D". | `r5-bewijs-dubbel-kleur-kenmerken.jpg` | **Code** `product-info.tsx:60`: het kenmerk "Kleur" hernoemen of samenvoegen. |
| **P3** · R5-25 · nieuw · code | Prime Zelfklevend 1m² (`vinyl-prime-zelfklevend-1m2-gerflor`) | 3 dessins, geen stalen op de kaart | Kleurkeuze op de kaart | De optie heet "Dessin". De adapter telt ze als kleur (`shopify-adapter.ts:250`), de kaart niet (`view.ts:166`, `product.ts:93`). Enige product met dit geval. | `a7-log` | Eén definitie van `kleurOptie`, of de optie in Shopify "Kleur" noemen. |
| **P3** · R5-26 · bekend (R3-15) · data | 45 van de 66 Loft79-titels | Kleine letters: abbey, bolton, portland | Hoofdletter, zoals de rest | Ongewijzigd. | `r5-contact-gelabeld-1.jpg` | **Shopify:** titels. Of een hoofdletter in de adapter. |
| **P3** · R5-27 · bekend (R3-20) · inhoud | `/catalogus/behang`, `/catalogus/tapijten` | De intro noemt niet wat er staat | Merken uit de catalogus | Behang: "van Arte en Boråstapeter … Flamant en Missoni Home". Arte staat niet in de catalogus, ESTAhome (1.600) en Origin (591) wel. Tapijten noemt enkel Louis De Poortere, Lalee en Ragolle ontbreken. | `r5-desk-behang-landing.jpg`, `r5-desk-tapijten-start.jpg` | Tekst nakijken (Shopify-collectie of `categorie-teksten.ts`). |

### 2.2 Te verifiëren

| Prioriteit | Pagina/product/variant | Probleem | Verwacht gedrag | Vastgesteld gedrag | Bewijs en reproductiestappen | Voorgestelde oplossing |
|---|---|---|---|---|---|---|
| **P1** · R5-28 · nieuw · data | Senso Wallstreet Light Urban 2,22m² (`vinyl-senso-wallstreet-light-urban-2-22m2-zelfklevend-gerflor`), Senso Premium Grey Marble (`vinyl-senso-premium-grey-marble-gerflor`) | Doosprijs lijkt als prijs per m² te staan | Prijs en eenheid horen bij elkaar. De klant koopt wat de pagina zegt. | Wallstreet: "€ 55,48 / m²", "Min. 1 m²", "!ENKEL VERKOCHT PER DOOS!", 2,22 m² per doos, wat € 24,99/m² zou zijn. De andere vinyl kost € 11–31/m². Premium: "€ 48,90 / m²", 7 tegels van 73 × 39,9 cm = 2,04 m² per doos, dus ± € 24/m². Prime: € 12,99, doos van 1 m², daar klopt het. **Niet bewezen:** ik ken de echte prijs niet. Zeker is wel dat de pagina de klant 1 m² laat bestellen van iets dat per doos verkocht wordt. | `r5-bewijs-senso-wallstreet-prijs.jpg`, `-doos.jpg`, `r5-bewijs-senso-premium-prijs.jpg`. Niet getest: wat de kassa ervan maakt. | Brunic vragen wat de prijs voorstelt. **Shopify:** eenheid "per doos" of de prijs per m², en de hoeveelheid in dozen. |
| **P2** · R5-29 · nieuw als telling · data | 245 producten met kenmerk "Garantie" (Beauflor 197, Tarkett 37, Gerflor 11), 248 in de beschrijving | Garantietermijn zonder bevestiging | Enkel wat Brunic bevestigt | "5 jaar" 78, "10 jaar residentieel" 60, "7 jaar" 46, "7 jaar residentieel" 22, "8 jaar" 12, "10 jaar" 12, "15 Jaar" 9, "15 jaar residentieel" 4, "3 jaar" 1, "20 Jaar" 1. Leveranciersdata. Of Brunic die mag doorgeven, kan ik niet afleiden. | `r5-bewijs-garantie-kenmerken.jpg`, `r5-bewijs-garantie-beschrijving.jpg`, §4.3 | Navragen. Mag het niet: `IS_LEVERBELOFTE` (`shopify-adapter.ts:145`) uitbreiden, en R5-05 lost de tekst op. |
| **P2** · R5-30 · nieuw · data | Alle 36 Louis De Poortere-tapijten | Tekst in de stem van de fabrikant, met beloftes | Geen levering en dienst beloven die Brunic niet bevestigt | "Elk tapijt wordt geproduceerd in onze eigen fabriek in België en rechtstreeks bij u thuis geleverd, met snelle levering in heel Europa." "Scan dan de QR-code … Wij halen het gratis op." "ons Take Care-programma", "ons eigen R&D-team". Op de site van Brunic leest dat alsof Brunic die fabriek heeft. | `r5-bewijs-ldp-snelle-levering.jpg`, `r5-bewijs-ldp-gratis-op.jpg` | **Shopify:** alinea "Erfgoed met een toekomst" herschrijven in de derde persoon, zonder leverbelofte. Navragen of "gratis ophalen" voor klanten van Brunic geldt. |
| **P2** · R5-31 · nieuw als geheel · data | Prime Zelfklevend 1m² (2 foto's), Kindervinyl Trude (1 foto) | Bestandsnaam wijst op Amazon en Facebook | Beeldrechten in orde | `81LV4aT7k5L._AC_SY879.jpg`, `71y0u1c1QUL._AC_SX679.jpg`, `369636489_817757739793605_…_n.jpg`. Ze komen van de oude site (`brunic.be/wp-content/uploads/2025/12` en `2023/08`, volgens `fotos-index-brunic-vinyl.csv`). Rechten kan ik niet vaststellen. Bij Trude is het de enige foto, en die zit ook in de aanbiedingen. | `r5-contact-herkomst.jpg`, §3.5 | Navragen bij Brunic. Eventueel vervangen door een foto van de leverancier. |
| **P2** · R5-32 · nieuw · proces | Shopify → site | Komen wijzigingen vanzelf op de site? | Filtersysteem: "bij elke Shopify-wijziging herbouwd (webhook, `herbouw.ts`)" | De overdracht van vandaag zegt "de webhooks staan nog niet aan". Dan verschijnt een prijswijziging pas na een handmatige build. Ik kan dit niet zien: `packages/catalog` is verboden terrein en ik heb geen toegang tot Shopify. | `filtersysteem.md:35` tegenover `r4-en-vinylkleuren-2026-11-03.md:43` | Iemand met toegang tot Shopify kijkt het na. Daarna één van de twee documenten rechtzetten. |
| **P2** · R5-33 · nieuw · data of opdracht | 305 producten in Vloerbekleding (vasttapijt, tegels, lopers) en 36 LDP-tapijten | Geen prijs | Opdracht §0: "Vloer en tapijt hebben prijzen met eenheid" | Prijs op aanvraag, met "Advies en offerte in de winkel". Dat kan correct zijn, maar de opdracht en de data zeggen iets anders. Omgekeerd staat behang niet "op aanvraag", zoals de opdracht zegt: 2.229 van de 2.724 hebben een prijs. | `test-filters.txt`, §4.2 | Beslissen wat klopt en de opdracht en `filtersysteem.md` rechtzetten (R5-58). |
| **P3** · R5-34 · bekend (overdracht) · data | 9 Boråstapeter-producten uit Nordic Folk, bv. Noras ang | "Leverbaar tot (volgens leverancier): 12/26" | Geen levertermijn, en een einddatum die klopt | Zichtbaar als kenmerk. Het is een einddatum, geen levertermijn. Het label valt buiten `IS_LEVERBELOFTE`. | `r5-bewijs-leverbaar-tot.jpg` | Navragen. Mag het weg: label toevoegen aan de filter. |
| **P3** · R5-35 · nieuw · inhoud | Vaste pagina's | Servicebeloftes | Enkel wat Brunic bevestigt | "Gratis opmeting" (op elke pagina), "Wij nemen binnen 1 à 2 werkdagen contact met u op" (`/op-maat-en-plaatsing/opmeting-aan-huis`), "Eigen atelier", "al 40 jaar". Wettelijk en dus geen punt: "uiterlijk 30 dagen" (`/info/levering`), "wettelijke garantie van twee jaar". | `a7-log` | Eén keer laten bevestigen door Brunic. |
| **P3** · R5-36 · nieuw · data | 11 Ragolle-kaarten en 3 kleuren (§3.3) | Eerste beeld is een schuine, wat vage close-up, terwijl de foto erna scherper en vlak is | Duidelijke productfoto vooraan | Bestandsnaam `…-sfeerfoto.jpg`, label "productfoto". Rampur 0445 en 0477 ogen echt vaag. Omgekeerd heten 27 foto's `…-productfoto.jpg` met label "sfeerfoto". De labels komen uit de indeling `BRUNIC_RAGOLLE_FOTO_INDELING_2026-10-22.json`, dus de bestandsnaam alleen bewijst niets. | `r5-contact-ragolle-eerste.jpg`, `r5-desk-pdp-ragolle-rampur-0445.jpg` | Beoordelen per product. Zo nodig de eerste foto als detail labelen, dan schuift de tweede naar voren. |
| **P3** · R5-37 · nieuw · data | Lalee: 80 van de 84 eerste beelden smaller dan 800 px (75 op 600 × 900). Boråstapeter: 337 van de 495 (mediaan 600 px). 118 in de hele catalogus onder 600 px. | Zacht op de productpagina | Scherp beeld | De pagina toont ±790 px breed. Op de kaart (±270 px) valt het niet op. | §4.4, `r5-contact-lalee-kaarten.jpg` | Scherpere versies opvragen. Geen fout zolang er geen betere bestaan. |
| **P3** · R5-38 · bekend (R4-12) · data | Mehari 0474 (Rond Ø 200 cm € 80, terwijl 120 × 170 € 129 kost). Rampur 0600 (Rond Ø 120 € 86,99, Ø 160 € 159,60; de rest zijn ronde bedragen) | Prijzen die uit de toon vallen | Correcte prijzen | Ongewijzigd. Zonder doorstreepte prijs. | `a8-log` | Prijs nakijken in Shopify. |
| **P3** · R5-39 · bekend (R4-13) · data | Boråstapeter: Noras ang, Skogsstjarna, Solangen, Tradgardsfrojd, Poeme d'amour | Lijken Zweedse of Franse tekens te missen | Zelfde lijn als Citronträd | Ongewijzigd. Niet met de leverancier gecontroleerd. | §4.5 | Nakijken met de leverancier. |
| **P3** · R5-40 · bekend (R4-14) · data | Samira 38743 (`behang-samira-borastapeter`) | Kaart oogt leeg, geen hover | Kleur en structuur herkenbaar | Bijna wit, opnieuw bekeken. De sfeerfoto hangt aan 38742. | `r5-r4-14-samira-kaart.jpg`, `r5-contact-sfeer-eerst.jpg` | Beoordelen of er een betere foto bestaat. |
| **P3** · R5-41 · nieuw · data | ESTAhome en Origin, bv. "Behang auto's blauw", "Behang ornamenten glanzend brons" | Merkteken van de leverancier zichtbaar op de foto | Neutrale foto | Bv. "esta" midden op het dessin. In de steekproef 4 van de 10 ESTAhome en 2 van de 10 Origin. Niet geteld op alle foto's. | `r5-contact-gelabeld-2.jpg` (#27, #33, #40, #42, #44, #45) | Beoordelen of dit storend is. |
| **P3** · R5-42 · bekend (R4-10, R3-18) · data | 14 andere producten met een foto aan een andere kleur (§3.2). 7 kleuren zonder enige foto: Uni 3173 (55), Uni 3174 (20), Boord 4625 (12), Macramé 4624 (12), Macramé 4794 (12), Zen (Heather 1 061), Toscana (710) | Elke kleur hoort haar eigen foto te tonen | Eigen foto, of geen | Berekend op de data, enkel Toscana visueel bevestigd. De 7 kleuren krijgen op de pagina de foto's van andere kleuren, op de kaart meestal een bolletje. | `r5-contact-koppeling.jpg`, `legenda.json` | **Shopify:** koppelingen nakijken. |

### 2.3 Verbeterpunten

| Prioriteit | Pagina/product/variant | Probleem | Verwacht gedrag | Vastgesteld gedrag | Bewijs en reproductiestappen | Voorgestelde oplossing |
|---|---|---|---|---|---|---|
| **P2** · R5-43 · nieuw | Mobiel, elke lijst | "Alle filters" is enkel bovenaan bereikbaar | Op desktop kleeft de balk, op mobiel kan de klant ook verder filteren | Bij scroll 4.000 staat de knop op −3.316 px. 48 kaarten zijn ±9.400 px, 96 kaarten ±17.000 px. | `r5-mob-scroll-geen-filter.jpg`, `b5.json` | **Code** `product-listing.tsx:132`: een kleine kleverige filterknop op mobiel. |
| **P3** · R5-44 · bekend (R3-28) | Lijsten na een keuze, bv. Fotobehang op maat: Prijs "op aanvraag (143)" | Filter met één waarde die alles dekt | "Een filter verschijnt alleen als hij de lijst kan verkleinen" | 1.802 keer in de 1.300 lijsten. De regel wordt enkel op de ongefilterde lijst getoetst. | `a4.json` | **Code** `filters.ts:366`: ook op de gefilterde basis, gekozen groepen blijven staan. |
| **P3** · R5-45 · bekend (R4-18) | 25 kaarten: Artelux 18, Loft79 7 (§3.4) | Hover is een smalle strook met maatlijnen | Hover = interieur, anders blijft de foto staan | Toegelaten door de specificatie ("liefst een sfeerfoto"), maar oogt technisch. Alle 25 bekeken. | `r5-contact-hover-overig-1.jpg`, `-2.jpg` | **Code** `product.ts:100-110` overslaan, of een eigen label in Shopify. |
| **P3** · R5-46 · bekend (R3-26) | Kaarten met hover | Het hoverbeeld laadt pas bij de hover | Direct wisselen | Mediaan 509 ms, max. 1.030 ms (96 kaarten). Geen leeg kader, ook niet op een trage verbinding zonder cache, en de hoogte verandert niet. De wissel is dus enkel traag, ze flikkert niet. | `r5-flikker-stof-1.jpg`, `-3.jpg`, `b3-desk.json`, `b9.json` | Hover vooraf laden bij `pointerenter` op de lijst. |
| **P3** · R5-47 · bekend (R4-15) | Gedeelde link met `?variant=` | Eerst de standaardkleur, dan de gevraagde | Meteen de gevraagde kleur | Papercut: eerst `…9b0a90fcd4` (t = 41 ms), dan `…8c2e4cbf3f` (t = 293 ms), op een snelle verbinding. | `b7.json`. `product-view.tsx:82-85` | Variant op de server renderen, of de galerij pas tonen als de variant bekend is. |
| **P3** · R5-48 · bekend (R4-17) | og:image en structured data | Niet het eerste beeld op de pagina | Zelfde beeld | 69 van de 423 pagina's in de steekproef (andere kleur, geen sfeerfoto). Bv. Fjord, Brooklyn. | `a6.json`. `product/[slug]/page.tsx:36`, `seo.ts:176` | `imagesForVariant(p, standaardVariant(p))`. |
| **P3** · R5-49 · bekend (R4-19) | Broncode van elke lijst en pagina | `availability: "op-voorraad"` in de pagina-data | Geen belofte die een machine kan lezen | 48 keer in een lijst, 67 keer op een pagina. Niet zichtbaar, geen schema.org. | `a8-log`. `shopify-adapter.ts:342` | Waarde hernoemen. |
| **P3** · R5-50 · nieuw | Zoekvelden in de header en de lade | 14 px | Minstens 16 px, anders zoomt iOS in bij het aantikken | Gemeten in Chrome, niet getest op een echt toestel. | `b5.json`. `product-listing.tsx:376` | Lettergrootte op mobiel 16 px. |
| **P3** · R5-51 · bekend (R3-27) | Lijstpagina's | Consolewaarschuwing "preloaded but not used" voor merklogo's | Geen waarschuwingen | Enige consolemelding in alle tests. | `b1-desk.json` | Preload van de logo's weghalen. |
| **P3** · R5-52 · bekend (R3-23) | `/catalogus/behang` | Babybehang en Jeugdbehang meisjes: zelfde tegelbeeld | Eigen beeld | `behang-strepen-terracotta-roze-en-wit-estahome-ff93f86226.jpg`, twee keer. | `r5-desk-behang-landing.jpg` | **Code** `imagery.ts`: een gebruikt beeld overslaan. |
| **P3** · R5-53 · nieuw | Filterpaneel op desktop | Tab uit het paneel: het blijft open en bedekt de kaarten | Paneel sluit als de focus weggaat | Na 24 keer Tab staat de focus op een kaart onder het paneel. | `b4.json` | **Code** `FacetDropdown`: sluiten op `focusout`. |
| **P3** · R5-54 · nieuw | 2.693 producten, bv. "Kleur: wit (1)", "Breedte: 2 m (1)" | Optieknop met één waarde opent een lade met één keuze | Enkel tekst, geen knop | Op de meeste behangpagina's. | `r5-desk-pdp-vinyl-bacopa-beschrijving.jpg` | **Code** `product-view.tsx:200-221`. |
| **P3** · R5-55 · nieuw | 36 LDP-tapijten op aanvraag | "De prijs hangt af van uw maten en afwerking" | Tekst die past | Het zijn vaste maten (100 × 140 cm …). | `r5-desk-pdp-ldp-drop.jpg`. `product-view.tsx:233-235` | Aparte tekst voor vaste maten. |
| **P3** · R5-56 · nieuw | Kenmerken op de pagina | Schrijfwijze per leverancier, deels Engels | nl-BE, één schrijfwijze | Dubbels: Plank Afmeting / Plank afmeting, Totaal gewicht / Totaalgewicht, Slijtlaag / Slijtlaagdikte / Dikte van de slijtlaag, Akoestische / Akoestisch isolatie. Engels bij 138 producten: "Carbon Impact over the Entire Product Lifecycle", "Green Building Certifications Contribution", "EcoBase - 100% recyclable, contains up to…". Hoofdletters: "GETUFT". | §4.3 | Woordenlijst in de normalisatie, of in de pipeline. |
| **P3** · R5-57 · nieuw | 69 titels gedeeld door 150 producten binnen hetzelfde merk, bv. "Behang grafisch 3D motief zand beige" (3×) | Zelfde naam op verschillende kaarten | Onderscheidbare namen | Bewust niet samengevoegd (`ontwerpen.ts`), want het zijn andere ontwerpen. De klant ziet het verschil enkel op de foto. | `a2-log` | **Shopify:** titels aanvullen met de collectie. |
| **P3** · R5-58 · bekend (R3-25) | `docs/filtersysteem.md`, opdracht §0 | Documentatie loopt achter | Klopt met de site | Matrix: "Prijs bij behang verborgen (alles op aanvraag)", terwijl de filter 6 waarden heeft. Rolbreedte 65% (nu 69%). Webhook: zie R5-32. Opdracht: zie R5-33. | `test-filters.txt` | Bijwerken. |
| **P3** · R5-59 · bekend (§Wat er in Shopify ontbreekt, #2) | Behang, filters Motief (53 waarden) en Stijl (27) | Waarden overlappen | Eén plek per begrip | "Vintage", "Art deco" en "Jungle" staan in beide filters. "Auto" (13) naast "Auto & vliegtuig" (42), "Panter" (33) naast "Dierenhuid" (90), "Kids jungle" (64) naast "Jungle" (125). De telling klopt, de keuze is wel verwarrend. | `a8-log` | Opschonen in de pipeline, zoals de specificatie voorziet. |

### 2.4 Bekend en bewust, niet als bevinding geteld

- **Rolbreedte is een productfilter, geen variantfilter** (bekend, filtersysteem.md, R4-16): van de 1.018 kaarten over de 9 breedtes openen er 616 op een andere breedte dan de gekozen, net als op 02/11. 67 van de 4.129 combinaties kleur × breedte bestaan niet als variant, bv. Celestial Navajo 32 + 500 cm. De filter doet wat de specificatie zegt, dus niet als nieuwe bevinding geteld.
- **Prijsklassen mengen eenheden** (bekend, filtersysteem.md): behang per rol naast fotobehang per stuk.
- **Hoverbeeld ontbreekt als de sfeerfoto aan geen kleur hangt** (bekend, filtersysteem.md): 5 producten.
- **"De actie loopt zolang de voorraad strekt"** op `/aanbiedingen`: actievoorwaarde, bewust zo gelaten.
- **"Desso en Tarkett" in teksten en "desso" in slugs:** bewust. Merk, filter, kaart en structured data zeggen overal Tarkett.
- **`noindex` en `Disallow: /`:** bewust tot livegang (`SITE_INDEXEREN`). Niet vergeten bij de overstap.

---

## 3. Fotoproblemen per product

Alle URL's beginnen met `https://cdn.shopify.com/s/files/1/1072/8662/6636/files/`, hieronder `…/`. Screenshots staan in `screenshots/`. Beelden zelf bekeken op de contactbladen `r5-contact-*.jpg`.

### 3.1 Kaart begint met een kamer (R5-07)

Zelf geteld: 18 op `r5-contact-overig-vloer-1.jpg`, 10 op `-2.jpg`. Elke foto per product: `r5-contact-kamers-alle-fotos.jpg`. De kolom hover is vaak de vlakke foto, dus omgekeerd.

| Product (titel + slug) | Variant/kleur | Pagina-URL | Standaardbeeld-URL | Hoverbeeld-URL | Screenshot | Oordeel | Voorstel |
|---|---|---|---|---|---|---|---|
| Bacopa Moonlight Cobble (`vinyl-bacopa-moonlight-cobble-beauflor`) | enige | /product/vinyl-bacopa-moonlight-cobble-beauflor | …/1715036976.jpg | …/1715060007.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Bacopa Moonlight Daisies (`vinyl-bacopa-moonlight-daisies-beauflor`) | enige | /product/vinyl-bacopa-moonlight-daisies-beauflor | …/2020413475.jpg | …/2020424292.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Bacopa Moonlight Street (`vinyl-bacopa-moonlight-street-beauflor`) | enige | /product/vinyl-bacopa-moonlight-street-beauflor | …/1843946841.jpg | …/1843941649.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Barinas Inspire Modena (`vinyl-barinas-inspire-modena-beauflor`) | 901D | /product/vinyl-barinas-inspire-modena-beauflor | …/1387451242-1.jpg | …/1387444517-1.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Beau Liana (`vinyl-beau-liana-beauflor`) | 999D | /product/vinyl-beau-liana-beauflor | …/1381475933-1.jpg | …/1381488051-1.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Bennet Spectrum Solid (`vinyl-bennet-spectrum-solid-beauflor`) | 000S | /product/vinyl-bennet-spectrum-solid-beauflor | …/1387304133-1.jpg | …/1387292684-1.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Bente Turbo Lancaster (`vinyl-bente-turbo-lancaster-beauflor`) | 196M | /product/vinyl-bente-turbo-lancaster-beauflor | …/1838848515-1.jpg | …/1838847659-1.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Birgit Supreme Montreal (`vinyl-birgit-supreme-montreal-beauflor`) | 900M | /product/vinyl-birgit-supreme-montreal-beauflor | …/Sonipro-Montreal-900M.jpg | …/Sonipro-Montreal-900M-2.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Birgit Supreme Zurich (`vinyl-birgit-supreme-zurich-beauflor`) | 991M | /product/vinyl-birgit-supreme-zurich-beauflor | …/1770282711.jpg | …/1770292719.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Bonita Blacktex Col Oak (`vinyl-bonita-blacktex-col-oak-beauflor`) | 629L | /product/vinyl-bonita-blacktex-col-oak-beauflor | …/1838760750.jpg | …/1838741915.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Bonita Cosytex Spanish Oak (`vinyl-bonita-cosytex-spanish-oak-beauflor`) | 900L | /product/vinyl-bonita-cosytex-spanish-oak-beauflor | …/1770401300.jpg | …/1770407913.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Bonita Quintex Havana Oak (`vinyl-bonita-quintex-havana-oak-beauflor`) | 699L | /product/vinyl-bonita-quintex-havana-oak-beauflor | …/1838737165.jpg | …/1838737170.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Bonita Texstyle Havana Oak (`vinyl-bonita-texstyle-havana-oak-beauflor`) | 696L | /product/vinyl-bonita-texstyle-havana-oak-beauflor | …/1838824190.jpg | …/1838829128.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Bonita Texstyle Water Oak (`vinyl-bonita-texstyle-water-oak-beauflor`) | 676L | /product/vinyl-bonita-texstyle-water-oak-beauflor | …/1838536686.jpg | …/1838556357.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| DJ Black Uni (`vinyl-dj-black-uni-tarkett`) | enige | /product/vinyl-dj-black-uni-tarkett | …/1976543797-1.jpg | …/1976551261-1.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Gebroken Steen (`vinyl-gebroken-steen-tarkett`) | enige | /product/vinyl-gebroken-steen-tarkett | …/1979521320.jpg | …/1979514696.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Kindervinyl Trude (`vinyl-kindervinyl-trude-tarkett`) | enige | /product/vinyl-kindervinyl-trude-tarkett | …/369636489_817757739793605_202972958917430398_n.jpg | geen | r5-contact-kamers-alle-fotos.jpg | toegelaten (geen andere foto), te verifiëren of er een vlakke foto bestaat | Vlakke foto opvragen |
| Rock Grey Black Uni (`vinyl-rock-grey-black-uni-tarkett`) | enige | /product/vinyl-rock-grey-black-uni-tarkett | …/1974083892-1.jpg | …/1974152089-1.jpg | r5-contact-kamers-alle-fotos.jpg | toegelaten (geen andere foto), te verifiëren of er een vlakke foto bestaat | Vlakke foto opvragen |
| Ster Zaragoza Tegel (`vinyl-ster-zaragoza-tegel-tarkett`) | enige | /product/vinyl-ster-zaragoza-tegel-tarkett | …/2329213021-1.jpg | …/2316146251-1.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Stylish Concrete Grey (`vinyl-stylish-concrete-grey-tarkett`) | enige | /product/vinyl-stylish-concrete-grey-tarkett | …/1979477893.jpg | …/1979477863.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Tara Arcadia Middle Grey (`vinyl-tara-arcadia-middle-grey-tarkett`) | enige | /product/vinyl-tara-arcadia-middle-grey-tarkett | …/1979862893.jpg | …/1979886414.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Tia Cosmo Clay (`vinyl-tia-cosmo-clay-tarkett`) | enige | /product/vinyl-tia-cosmo-clay-tarkett | …/5827242-scaled.jpg | …/5827242-1.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Tia Legacy Oak Grey (`vinyl-tia-legacy-oak-grey-tarkett`) | enige | /product/vinyl-tia-legacy-oak-grey-tarkett | …/5827066-scaled.jpg | …/5827066-1.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Tia Selene Light Grey (`vinyl-tia-selene-light-grey-tarkett`) | enige | /product/vinyl-tia-selene-light-grey-tarkett | …/5827031-1.jpg | …/5827031.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Tila Derby Grege (`vinyl-tila-derby-grege-tarkett`) | enige | /product/vinyl-tila-derby-grege-tarkett | …/1979908776.jpg | …/1979908781.jpg | r5-contact-kamers-alle-fotos.jpg | toegelaten (geen andere foto), te verifiëren of er een vlakke foto bestaat | Vlakke foto opvragen |
| Tila Tegel 34cm x 34cm Grijs (`vinyl-tila-tegel-34cm-x-34cm-grijs-tarkett`) | enige | /product/vinyl-tila-tegel-34cm-x-34cm-grijs-tarkett | …/2366992240.jpg | …/2366999205.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Trude (`vinyl-trude-tarkett`) | 5331091 | /product/vinyl-trude-tarkett | …/1593960540.jpg | …/1593960861.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |
| Visgraat Parket (`vinyl-visgraat-parket-tarkett`) | enige | /product/vinyl-visgraat-parket-tarkett | …/1979454630-1.jpg | …/1979455624-1.jpg | r5-contact-kamers-alle-fotos.jpg | fout (regel opdrachtgever) | Label `sfeerfoto` op de kamerfoto in Shopify (voorstel klaar, zie overdracht) |

### 3.2 Foto hangt aan een andere kleur dan de alt-tekst (R5-09, R5-42)

Berekend op de data. Enkel Toscana is met zekerheid fout. "Raakt de kaart" = dit is de foto op de kaart.

| Product (titel + slug) | Variant/kleur | Pagina-URL | Standaardbeeld-URL | Hoverbeeld-URL | Screenshot | Oordeel | Voorstel |
|---|---|---|---|---|---|---|---|
| Moonglaze Blackout FR (`gordijnstof-moonglaze-blackout-fr-ado`) | alt-tekst 575, hangt aan 775 | /product/gordijnstof-moonglaze-blackout-fr-ado | …/gordijnstof-moonglaze-blackout-fr-ado-fbdbcafa1e.jpg | …/gordijnstof-moonglaze-blackout-fr-ado-805b81daed.jpg | r5-contact-koppeling.jpg | te verifiëren | Variantfoto nakijken in Shopify |
| Largo (`gordijnstof-largo-ado`) | alt-tekst 110, hangt aan 112 | /product/gordijnstof-largo-ado | …/gordijnstof-largo-ado-c4783dbc5e.jpg | …/gordijnstof-largo-ado-cf32b87f17.jpg | r5-contact-koppeling.jpg | te verifiëren | Variantfoto nakijken in Shopify |
| Waterlily (`gordijnstof-waterlily-ado`) | alt-tekst 383, hangt aan 995 | /product/gordijnstof-waterlily-ado | …/gordijnstof-waterlily-ado-5e00f5e751.jpg | …/gordijnstof-waterlily-ado-04e4e5b7e6.jpg | r5-contact-koppeling.jpg | te verifiëren | Variantfoto nakijken in Shopify |
| Pigmentdruk (`gordijnstof-pigmentdruk-ado`) | alt-tekst 200, hangt aan 381 | /product/gordijnstof-pigmentdruk-ado | …/gordijnstof-pigmentdruk-ado-cd1f447277.jpg | geen | r5-contact-koppeling.jpg | te verifiëren | Variantfoto nakijken in Shopify |
| Vitrage 3033 (`gordijnstof-vitrage-3033-ado`) | alt-tekst 11, hangt aan 13 | /product/gordijnstof-vitrage-3033-ado | …/gordijnstof-vitrage-3033-ado-7c9a8aad24.jpg | …/gordijnstof-vitrage-3033-ado-ae40a48034.jpg | r5-contact-koppeling.jpg | te verifiëren | Variantfoto nakijken in Shopify |
| Uni 3173 (`gordijnstof-uni-3173-ado`) | alt-tekst 20, hangt aan 55 | /product/gordijnstof-uni-3173-ado | …/gordijnstof-uni-3173-ado-a6214043e8.jpg | geen | r5-contact-koppeling.jpg | te verifiëren | Variantfoto nakijken in Shopify |
| Macramé-onderrand 4623 (`passement-macrame-onderrand-4623-ado`) | alt-tekst 12, hangt aan 13 | /product/passement-macrame-onderrand-4623-ado | …/passement-macrame-onderrand-4623-ado-ab52635f6b.jpg | …/passement-macrame-onderrand-4623-ado-f3b25db62e.jpg | r5-contact-koppeling.jpg | te verifiëren | Variantfoto nakijken in Shopify |
| Boord 4625 (`passement-boord-4625-ado`) | alt-tekst 12, hangt aan 13 · raakt de kaart | /product/passement-boord-4625-ado | …/passement-boord-4625-ado-84bcc35d6a.jpg | geen | r5-contact-koppeling.jpg | te verifiëren | Variantfoto nakijken in Shopify |
| Macramé-inzetstuk 4624 (`passement-macrame-inzetstuk-4624-ado`) | alt-tekst 12, hangt aan 13 · raakt de kaart | /product/passement-macrame-inzetstuk-4624-ado | …/passement-macrame-inzetstuk-4624-ado-81c13716e7.jpg | geen | r5-contact-koppeling.jpg | te verifiëren | Variantfoto nakijken in Shopify |
| Uni 3174 (`gordijnstof-uni-3174-ado`) | alt-tekst 20, hangt aan 75 | /product/gordijnstof-uni-3174-ado | …/gordijnstof-uni-3174-ado-8c7ae048ec.jpg | …/gordijnstof-uni-3174-ado-6c4eed7bd9.jpg | r5-contact-koppeling.jpg | te verifiëren | Variantfoto nakijken in Shopify |
| Macramé-boord 4794 (`passement-macrame-boord-4794-ado`) | alt-tekst 12, hangt aan 13 · raakt de kaart | /product/passement-macrame-boord-4794-ado | …/passement-macrame-boord-4794-ado-a7b2986763.jpg | geen | r5-contact-koppeling.jpg | te verifiëren | Variantfoto nakijken in Shopify |
| Sonrisa (`vasttapijt-sonrisa-associated-weavers`) | alt-tekst Beige 04, hangt aan Moss 28 | /product/vasttapijt-sonrisa-associated-weavers | …/vasttapijt-sonrisa-associated-weavers-d17c807b25.jpg | …/vasttapijt-sonrisa-associated-weavers-b0985a9406.jpg | r5-contact-koppeling.jpg | te verifiëren | Variantfoto nakijken in Shopify |
| Soft Distinction (`vasttapijt-soft-distinction-lano`) | alt-tekst Teal Grey 0874, hangt aan Greystone 0842 | /product/vasttapijt-soft-distinction-lano | …/vasttapijt-soft-distinction-lano-73b3e056d8.jpg | …/vasttapijt-soft-distinction-lano-a39c24f670.jpg | r5-contact-koppeling.jpg | te verifiëren | Variantfoto nakijken in Shopify |
| Zen (`vasttapijt-zen-lano`) | alt-tekst Heather 1 061, hangt aan Muscat 4 164 | /product/vasttapijt-zen-lano | …/vasttapijt-zen-lano-6eadd915bb.jpg | …/vasttapijt-zen-lano-f6723d401e.jpg | r5-contact-koppeling.jpg | te verifiëren | Variantfoto nakijken in Shopify |
| Toscana B592 (`vasttapijt-toscana-b592-desso`) | alt-tekst 710, hangt aan 729 · raakt de kaart | /product/vasttapijt-toscana-b592-desso | …/vasttapijt-toscana-b592-desso-a275158a63.jpg | …/vasttapijt-toscana-b592-desso-caa208aed4.jpg | r5-r4-10-toscana-kaart.jpg, r5-r4-10-toscana-hover.jpg | fout (visueel bevestigd) | Variantfoto nakijken in Shopify |

### 3.3 Ragolle: eerste beeld heet "sfeerfoto" (R5-36)

| Product (titel + slug) | Variant/kleur | Pagina-URL | Standaardbeeld-URL | Hoverbeeld-URL | Screenshot | Oordeel | Voorstel |
|---|---|---|---|---|---|---|---|
| Rampur 0056 (`vloerkleed-rampur-0056-ragolle`) | 6747 (kaart) | /product/vloerkleed-rampur-0056-ragolle?variant=59354980778316 | …/rampur-0056-6747-06-sfeerfoto.jpg | …/rampur-0056-6747-08-foto.jpg | r5-contact-ragolle-eerste.jpg | te verifiëren (kwaliteit, label) | Tweede foto vooraan (kolom hover = die tweede foto) |
| Rampur 0097 (`vloerkleed-rampur-0097-ragolle`) | 6747 (enkel via staal) | /product/vloerkleed-rampur-0097-ragolle?variant=59354987725132 | …/rampur-0097-6747-01-sfeerfoto.jpg | …/rampur-0097-6747-08-foto.jpg | r5-contact-ragolle-eerste.jpg | te verifiëren (kwaliteit, label) | Tweede foto vooraan (kolom hover = die tweede foto) |
| Rampur 0445 (`vloerkleed-rampur-0445-ragolle`) | 5332 (kaart) | /product/vloerkleed-rampur-0445-ragolle?variant=59355001913676 | …/rampur-0445-5332-07-sfeerfoto.jpg | …/rampur-0445-5332-08-foto.jpg | r5-contact-ragolle-eerste.jpg | te verifiëren (kwaliteit, label) | Tweede foto vooraan (kolom hover = die tweede foto) |
| Rampur 0477 (`vloerkleed-rampur-0477-ragolle`) | 2787 (kaart) | /product/vloerkleed-rampur-0477-ragolle?variant=59355006533964 | …/rampur-0477-2787-06-sfeerfoto.jpg | …/rampur-0477-2787-07-foto.jpg | r5-contact-ragolle-eerste.jpg | te verifiëren (kwaliteit, label) | Tweede foto vooraan (kolom hover = die tweede foto) |
| Rampur 0477 (`vloerkleed-rampur-0477-ragolle`) | 3372 (enkel via staal) | /product/vloerkleed-rampur-0477-ragolle?variant=59355006861644 | …/rampur-0477-3372-01-sfeerfoto.jpg | …/rampur-0477-3372-07-foto.jpg | r5-contact-ragolle-eerste.jpg | te verifiëren (kwaliteit, label) | Tweede foto vooraan (kolom hover = die tweede foto) |
| Ravenna 0174 (`vloerkleed-ravenna-0174-ragolle`) | 6265 (kaart) | /product/vloerkleed-ravenna-0174-ragolle?variant=59355017544012 | …/ravenna-0174-6265-01-sfeerfoto.jpg | geen | r5-contact-ragolle-eerste.jpg | te verifiëren (kwaliteit, label) | Vlakke foto opvragen |
| Ripley 0014 (`vloerkleed-ripley-0014-ragolle`) | 6262 (kaart) | /product/vloerkleed-ripley-0014-ragolle?variant=59355021640012 | …/ripley-0014-6262-03-sfeerfoto.jpg | …/ripley-0014-6262-04-foto.jpg | r5-contact-ragolle-eerste.jpg | te verifiëren (kwaliteit, label) | Tweede foto vooraan (kolom hover = die tweede foto) |
| Ripley 0023 (`vloerkleed-ripley-0023-ragolle`) | 3342 (enkel via staal) | /product/vloerkleed-ripley-0023-ragolle?variant=59355026358604 | …/ripley-0023-3342-01-sfeerfoto.jpg | …/ripley-0023-3342-02-foto.jpg | r5-contact-ragolle-eerste.jpg | te verifiëren (kwaliteit, label) | Tweede foto vooraan (kolom hover = die tweede foto) |
| Ripley 0204 (`vloerkleed-ripley-0204-ragolle`) | 6242 (kaart) | /product/vloerkleed-ripley-0204-ragolle?variant=59355029602636 | …/ripley-0204-6242-07-sfeerfoto.jpg | …/ripley-0204-6242-08-foto.jpg | r5-contact-ragolle-eerste.jpg | te verifiëren (kwaliteit, label) | Tweede foto vooraan (kolom hover = die tweede foto) |
| Ripley 0205 (`vloerkleed-ripley-0205-ragolle`) | 6362 (kaart) | /product/vloerkleed-ripley-0205-ragolle?variant=59355030389068 | …/ripley-0205-6362-07-sfeerfoto.jpg | …/ripley-0205-6362-08-foto.jpg | r5-contact-ragolle-eerste.jpg | te verifiëren (kwaliteit, label) | Tweede foto vooraan (kolom hover = die tweede foto) |
| Ripley 0221 (`vloerkleed-ripley-0221-ragolle`) | 6312 (kaart) | /product/vloerkleed-ripley-0221-ragolle?variant=59355034124620 | …/ripley-0221-6312-07-sfeerfoto.jpg | …/ripley-0221-6312-08-foto.jpg | r5-contact-ragolle-eerste.jpg | te verifiëren (kwaliteit, label) | Tweede foto vooraan (kolom hover = die tweede foto) |
| Ripley 0224 (`vloerkleed-ripley-0224-ragolle`) | 6362 (kaart) | /product/vloerkleed-ripley-0224-ragolle?variant=59355034550604 | …/ripley-0224-6362-01-sfeerfoto.jpg | …/ripley-0224-6362-07-foto.jpg | r5-contact-ragolle-eerste.jpg | te verifiëren (kwaliteit, label) | Tweede foto vooraan (kolom hover = die tweede foto) |
| Ripley 0226 (`vloerkleed-ripley-0226-ragolle`) | 6342 (kaart) | /product/vloerkleed-ripley-0226-ragolle?variant=59355036254540 | …/ripley-0226-6342-06-sfeerfoto.jpg | …/ripley-0226-6342-08-foto.jpg | r5-contact-ragolle-eerste.jpg | te verifiëren (kwaliteit, label) | Tweede foto vooraan (kolom hover = die tweede foto) |
| Ripley 0239 (`vloerkleed-ripley-0239-ragolle`) | 6362 (kaart) | /product/vloerkleed-ripley-0239-ragolle?variant=59355040088396 | …/ripley-0239-6362-06-sfeerfoto.jpg | …/ripley-0239-6362-07-foto.jpg | r5-contact-ragolle-eerste.jpg | te verifiëren (kwaliteit, label) | Tweede foto vooraan (kolom hover = die tweede foto) |

### 3.4 Hover is een smalle strook (R5-45)

| Product (titel + slug) | Variant/kleur | Pagina-URL | Standaardbeeld-URL | Hoverbeeld-URL | Screenshot | Oordeel | Voorstel |
|---|---|---|---|---|---|---|---|
| Bamboe (`gordijnstof-bamboe-artelux`) | 01 | /product/gordijnstof-bamboe-artelux | …/gordijnstof-bamboe-artelux-7d4a2dc6d1.jpg | …/gordijnstof-bamboe-artelux-250aa75295.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Beuk (`gordijnstof-beuk-artelux`) | 01 | /product/gordijnstof-beuk-artelux | …/gordijnstof-beuk-artelux-58a7bc8f8f.jpg | …/gordijnstof-beuk-artelux-97b98df3fa.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Braam (`gordijnstof-braam-artelux`) | 01 | /product/gordijnstof-braam-artelux | …/gordijnstof-braam-artelux-1199e565e9.jpg | …/gordijnstof-braam-artelux-ca2b807d2e.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Dille (`gordijnstof-dille-artelux`) | 01 | /product/gordijnstof-dille-artelux | …/gordijnstof-dille-artelux-533158fb44.jpg | …/gordijnstof-dille-artelux-2d5a2a3b23.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Hazelaar (`gordijnstof-hazelaar-artelux`) | 01 | /product/gordijnstof-hazelaar-artelux | …/gordijnstof-hazelaar-artelux-ac87799bc5.jpg | …/gordijnstof-hazelaar-artelux-97afb9d355.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Hennep (`gordijnstof-hennep-artelux`) | 01 | /product/gordijnstof-hennep-artelux | …/gordijnstof-hennep-artelux-576dfa7ad5.jpg | …/gordijnstof-hennep-artelux-9a2f75e481.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Iep (`gordijnstof-iep-artelux`) | 01 | /product/gordijnstof-iep-artelux | …/gordijnstof-iep-artelux-091f2724b4.jpg | …/gordijnstof-iep-artelux-af158e613a.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Jungle (`gordijnstof-jungle-artelux`) | 01 | /product/gordijnstof-jungle-artelux | …/gordijnstof-jungle-artelux-2eed8e07f5.jpg | …/gordijnstof-jungle-artelux-20f1bc5a05.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Mangrove (`gordijnstof-mangrove-artelux`) | 01 | /product/gordijnstof-mangrove-artelux | …/gordijnstof-mangrove-artelux-c37860f04e.jpg | …/gordijnstof-mangrove-artelux-14d8bd90e8.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Moesson (`gordijnstof-moesson-artelux`) | 01 | /product/gordijnstof-moesson-artelux | …/gordijnstof-moesson-artelux-3f9cd7045c.jpg | …/gordijnstof-moesson-artelux-c70ef7c33b.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Populier (`gordijnstof-populier-artelux`) | 01 | /product/gordijnstof-populier-artelux | …/gordijnstof-populier-artelux-ce5aa02bbe.jpg | …/gordijnstof-populier-artelux-5a2f114092.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Rubus (`gordijnstof-rubus-artelux`) | 01 | /product/gordijnstof-rubus-artelux | …/gordijnstof-rubus-artelux-54e3e26c88.jpg | …/gordijnstof-rubus-artelux-c44a4c140a.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Salix (`gordijnstof-salix-artelux`) | 01 | /product/gordijnstof-salix-artelux | …/gordijnstof-salix-artelux-cafeea00d0.jpg | …/gordijnstof-salix-artelux-8b3d158620.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Salvia (`gordijnstof-salvia-artelux`) | 01 | /product/gordijnstof-salvia-artelux | …/gordijnstof-salvia-artelux-9b9934d73d.jpg | …/gordijnstof-salvia-artelux-88bf9b0e9c.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Tijm (`gordijnstof-tijm-artelux`) | 01 | /product/gordijnstof-tijm-artelux | …/gordijnstof-tijm-artelux-7bfa61b9eb.jpg | …/gordijnstof-tijm-artelux-bbf8544c62.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Veld (`gordijnstof-veld-artelux`) | 01 | /product/gordijnstof-veld-artelux | …/gordijnstof-veld-artelux-1a16666c7a.jpg | …/gordijnstof-veld-artelux-5f50bf25b9.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Weide (`gordijnstof-weide-artelux`) | 01 | /product/gordijnstof-weide-artelux | …/gordijnstof-weide-artelux-6e94da87d4.jpg | …/gordijnstof-weide-artelux-d4540446f4.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| Vlier (`gordijnstof-vlier-artelux`) | 01 | /product/gordijnstof-vlier-artelux | …/gordijnstof-vlier-artelux-b793a7a2b3.jpg | …/gordijnstof-vlier-artelux-127d592856.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| abbey (`gordijnstof-abbey-loft79`) | 01 | /product/gordijnstof-abbey-loft79 | …/gordijnstof-abbey-loft79-770fa1a6e4.jpg | …/gordijnstof-abbey-loft79-b6cb1833f7.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| bolton (`gordijnstof-bolton-loft79`) | 01 | /product/gordijnstof-bolton-loft79 | …/gordijnstof-bolton-loft79-d2d9c5fce4.jpg | …/gordijnstof-bolton-loft79-25ab756043.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| camden (`gordijnstof-camden-loft79`) | 01 | /product/gordijnstof-camden-loft79 | …/gordijnstof-camden-loft79-fb673e6b81.jpg | …/gordijnstof-camden-loft79-e2eb3d4694.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| cross (`gordijnstof-cross-loft79`) | 01 | /product/gordijnstof-cross-loft79 | …/gordijnstof-cross-loft79-0c39007cce.jpg | …/gordijnstof-cross-loft79-bc1172d918.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| darwin (`gordijnstof-darwin-loft79`) | 01 | /product/gordijnstof-darwin-loft79 | …/gordijnstof-darwin-loft79-9598bdf4bd.jpg | …/gordijnstof-darwin-loft79-3146556894.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| hove (`gordijnstof-hove-loft79`) | 01 | /product/gordijnstof-hove-loft79 | …/gordijnstof-hove-loft79-34216ceb5a.jpg | …/gordijnstof-hove-loft79-98b2b598ff.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |
| portland (`gordijnstof-portland-loft79`) | 01 | /product/gordijnstof-portland-loft79 | …/gordijnstof-portland-loft79-b306596c56.jpg | …/gordijnstof-portland-loft79-66405933c7.jpg | r5-contact-hover-overig-1.jpg | te verifiëren (kwaliteit) | Hover overslaan of interieur koppelen |

### 3.5 Beeldrechten (R5-31)

| Product (titel + slug) | Bestand | Pagina | Oorsprong volgens de fotolijst | Oordeel |
|---|---|---|---|---|
| Prime Zelfklevend 1m² (`vinyl-prime-zelfklevend-1m2-gerflor`) | 81LV4aT7k5L._AC_SY879.jpg | /product/vinyl-prime-zelfklevend-1m2-gerflor | brunic.be/wp-content/uploads (oude site, `fotos-index-brunic-vinyl.csv`) | te verifiëren (beeldrechten) |
| Prime Zelfklevend 1m² (`vinyl-prime-zelfklevend-1m2-gerflor`) | 71y0u1c1QUL._AC_SX679.jpg | /product/vinyl-prime-zelfklevend-1m2-gerflor | brunic.be/wp-content/uploads (oude site, `fotos-index-brunic-vinyl.csv`) | te verifiëren (beeldrechten) |
| Kindervinyl Trude (`vinyl-kindervinyl-trude-tarkett`) | 369636489_817757739793605_202972958917430398_n.jpg | /product/vinyl-kindervinyl-trude-tarkett | brunic.be/wp-content/uploads (oude site, `fotos-index-brunic-vinyl.csv`) | te verifiëren (beeldrechten) |

### 3.6 Kleuren die met een sfeerfoto beginnen en niets anders hebben

Toegelaten door de regel. Op de kaart: geen enkele, deze kleuren krijg je enkel via een staal.

| Product (slug) | Kleur | Beeld | Staal | Oordeel |
|---|---|---|---|---|
| Arien (`gordijnstof-arien-ado`) | 193 | …/gordijnstof-arien-ado-31aa89b45c.jpg | bolletje | toegelaten: de kleur heeft niets anders |
| Naran FR (`gordijnstof-naran-fr-ado`) | 200 | …/gordijnstof-naran-fr-ado-ba56f03397.jpg | bolletje | toegelaten: de kleur heeft niets anders |
| Java (`vasttapijt-java-associated-weavers`) | Silver 90 | …/vasttapijt-java-associated-weavers-9b2637c87c.jpg | bolletje | toegelaten: de kleur heeft niets anders |
| Java (`vasttapijt-java-associated-weavers`) | Marble 93 | …/vasttapijt-java-associated-weavers-507fbcff7b.jpg | foto | toegelaten: de kleur heeft niets anders |
| Sonrisa (`vasttapijt-sonrisa-associated-weavers`) | Beige 04 | …/vasttapijt-sonrisa-associated-weavers-18b149750c.jpg | bolletje | te verifiëren (koppeling, zie R5-08) |
| Sonrisa (`vasttapijt-sonrisa-associated-weavers`) | Moss 28 | …/vasttapijt-sonrisa-associated-weavers-43a7836043.jpg | bolletje | te verifiëren (koppeling, zie R5-08) |
| Samira (`behang-samira-borastapeter`) | 38742 | …/behang-samira-borastapeter-e44774c738.webp | foto | toegelaten: de kleur heeft niets anders |
| Indigo Garden (`behang-indigo-garden-borastapeter`) | 3133 | …/behang-indigo-garden-borastapeter-dd29e0ad57.webp | foto | toegelaten: de kleur heeft niets anders |

### 3.7 Afgesneden en onscherp

R5-06 geldt voor 171 vloerkleden, en de oplossing zit in de code, dus hieronder voorbeelden. Alle kaarten per merk: `r5-contact-ldp-kaarten.jpg`, `r5-contact-lalee-kaarten.jpg`, `r5-contact-ragolle-kaarten.jpg`. Cijfers per merk: §4.4.

| Product (titel + slug) | Variant/kleur | Pagina-URL | Standaardbeeld-URL | Hoverbeeld-URL | Screenshot | Oordeel | Voorstel |
|---|---|---|---|---|---|---|---|
| Drop (`vloerkleed-drop-louis-de-poortere`) | Moss 2100 | /product/vloerkleed-drop-louis-de-poortere | …/vloerkleed-drop-louis-de-poortere-9969a35dda.webp | …/vloerkleed-drop-louis-de-poortere-d9c40f1825.webp | r5-desk-pdp-ldp-drop.jpg, r5-contact-ldp-kaarten.jpg | fout (uitsnede, R5-06) | `contain` voor vloerkleden |
| Kanji (`vloerkleed-kanji-louis-de-poortere`) | Darkstreet | /product/vloerkleed-kanji-louis-de-poortere | …/vloerkleed-kanji-louis-de-poortere-5d51e96340.webp | …/vloerkleed-kanji-louis-de-poortere-66718cab2b.webp | r5-desk-raster-organisch.jpg | fout (uitsnede, R5-06): vorm niet zichtbaar in "Speciale vormen" | `contain` voor vloerkleden |
| Griff (`vloerkleed-griff-louis-de-poortere`) | Columbus Gold | /product/vloerkleed-griff-louis-de-poortere | …/vloerkleed-griff-louis-de-poortere-d084275c29.webp | …/vloerkleed-griff-louis-de-poortere-d0100422ca.webp | r5-desk-raster-rond.jpg | fout (uitsnede, R5-06): cirkel afgeknot in "Ronde tapijten" | `contain` voor vloerkleden |
| Lech HEA 900 (`vloerkleed-lech-hea-900-lalee`) | Amber | /product/vloerkleed-lech-hea-900-lalee | …/lech-hea-900-amber-05-productfoto.jpg | …/lech-hea-900-amber-01-sfeerfoto.jpg | r5-contact-lalee-kaarten.jpg #30 | fout (uitsnede, R5-06) | `contain` voor vloerkleden |
| Rampur 0445 (`vloerkleed-rampur-0445-ragolle`) | 5332 | /product/vloerkleed-rampur-0445-ragolle | …/rampur-0445-5332-07-sfeerfoto.jpg | …/rampur-0445-5332-01-sfeerfoto.jpg | r5-desk-pdp-ragolle-rampur-0445.jpg | te verifiëren (onscherp, R5-36) | Scherpere foto vooraan |
| Samira (`behang-samira-borastapeter`) | 38743 | /product/behang-samira-borastapeter | …/behang-samira-borastapeter-df59b04296.jpg | geen | r5-contact-sfeer-eerst.jpg | te verifiëren (R5-40) | Beoordelen of er een betere foto bestaat |
| DJ Black Uni (`vinyl-dj-black-uni-tarkett`) | enige | /product/vinyl-dj-black-uni-tarkett | …/1976543797-1.jpg | …/1976551261-1.jpg | r5-contact-kamers-alle-fotos.jpg #15 | te verifiëren: tweede foto is 310 × 310 en 916 byte, egaal zwart | Beoordelen. Ook R5-07 |


**In orde in de steekproef:**

- **Kaart en hover per merk:** 128 paren bekeken (8 per merk). Hover hoort telkens bij hetzelfde product en dezelfde kleur, op Toscana na. ADO gebruikt een gordijnfoto als hover, dat werkt goed.
- **Eerste beeld:** alle 235 kaarten met soort "overig" bekeken. Vinyl: 96 waarvan 28 kamers. Boråstapeter: 139, allemaal dessins of muurprints, geen kamer. Plus 160 gelabelde (10 per merk): geen kamer.
- **Hover in de browser:** 111 kaarten over 14 lijsten. 96 wisselen, alle 111 keren terug, de kaart verspringt nergens. De 15 zonder wissel hebben in die kleur geen tweede foto, en dan hoort de foto te blijven staan.
- **Staal → beeld → pagina:** 14 lijsten, telkens wisselen beeld en link, de pagina opent op hetzelfde beeld, de kaart verspringt niet.

---

## 4. Wat er niet staat

### 4.1 Vindbaarheid (hele momentopname)

"Enkel een code" = minstens één cijfer en hoogstens twee letters: 901D, 162L, AD08. "Fog 04" en "Groen 5801" tellen als naam. Een product zonder kleuroptie telt als één kleur. **Vetgedrukt = de klant kan die kleur niet vinden**, tenzij hij de code kent.

| Afdeling | Type | Merk | Producten | Kleuren | Zonder kleurfamilie | Enkel een code | **Code én geen familie** | Producten zonder enige kleur | Maat | Vorm | Motief | Stijl | Voorbeeld |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Behang | Behang | ESTAhome | 1304 | 1304 | 502 (38%) | 0 | **0** | 502 | 0% | 0% | 97% | 91% |  |
| Behang | Behang | Origin Wallcoverings | 566 | 566 | 131 (23%) | 0 | **0** | 131 | 0% | 0% | 99% | 100% |  |
| Behang | Behang | Boråstapeter | 352 | 887 | 853 (96%) | 853 | **853** | 343 | 0% | 0% | 0% | 0% | Lily Tree 7227, Lily Tree 7229 |
| Behang | Fotobehang | ESTAhome | 259 | 259 | 100 (39%) | 0 | **0** | 100 | 0% | 0% | 93% | 93% |  |
| Behang | Fotobehang op maat | Boråstapeter | 143 | 260 | 260 (100%) | 260 | **260** | 143 | 0% | 0% | 0% | 0% | Blossom II 9401W, Blossom II 9402W |
| Behang | Wanddecoratie | ESTAhome | 37 | 37 | 13 (35%) | 0 | **0** | 13 | 0% | 0% | 97% | 51% |  |
| Behang | Fotobehang | Origin Wallcoverings | 25 | 25 | 6 (24%) | 0 | **0** | 6 | 0% | 0% | 100% | 96% |  |
| Behang | Behang | Walls4You | 21 | 21 | 7 (33%) | 0 | **0** | 7 | 0% | 0% | 100% | 100% |  |
| Behang | Behang | Sanders & Sanders | 17 | 17 | 3 (18%) | 0 | **0** | 3 | 0% | 0% | 100% | 88% |  |
| Gordijnen & stoffen | Gordijnstof | ADO | 424 | 2051 | 0 (0%) | 2051 | **0** | 0 | 0% | 0% | 100% | 100% |  |
| Gordijnen & stoffen | Gordijnstof | Artelux | 84 | 1094 | 0 (0%) | 1094 | **0** | 0 | 0% | 0% | 100% | 100% |  |
| Gordijnen & stoffen | Gordijnstof | Loft79 | 66 | 799 | 0 (0%) | 799 | **0** | 0 | 0% | 0% | 100% | 100% |  |
| Gordijnen & stoffen | Passement | ADO | 18 | 26 | 0 (0%) | 26 | **0** | 0 | 0% | 0% | 0% | 0% |  |
| Tapijten | Vloerkleed | Lalee | 84 | 179 | 0 (0%) | 0 | **0** | 0 | 100% | 100% | 100% | 100% |  |
| Tapijten | Vloerkleed | Ragolle | 52 | 70 | 0 (0%) | 70 | **0** | 0 | 100% | 100% | 100% | 100% |  |
| Tapijten | Vasttapijt | Tarkett (Desso) | 44 | 474 | 86 (18%) | 474 | **86** | 10 | 0% | 0% | 0% | 0% | Esprit B226 219, Esprit B226 234 |
| Tapijten | Vloerkleed | Louis De Poortere | 36 | 138 | 0 (0%) | 0 | **0** | 0 | 100% | 100% | 100% | 100% |  |
| Tapijten | Vasttapijt | Tarkett | 10 | 114 | 29 (25%) | 114 | **29** | 7 | 0% | 0% | 0% | 0% | Soft Sense II AC27 1318, Soft Sense II AC27 1320 |
| Vloerbekleding | Vinylvloer | Beauflor | 212 | 402 | 402 (100%) | 387 | **387** | 212 | 0% | 0% | 0% | 0% | Easytex Westbury 162L, Easytex Westbury 689D |
| Vloerbekleding | Vasttapijt | Associated Weavers | 113 | 1149 | 845 (74%) | 0 | **0** | 11 | 0% | 0% | 0% | 0% |  |
| Vloerbekleding | Vinylvloer | Tarkett | 53 | 93 | 93 (100%) | 2 | **2** | 53 | 0% | 0% | 0% | 0% | Trude 5331091, Trude 5331141 |
| Vloerbekleding | Tapijttegel | Tarkett (Desso) | 50 | 660 | 0 (0%) | 657 | **0** | 0 | 0% | 0% | 0% | 0% |  |
| Vloerbekleding | Vasttapijt | Lano | 44 | 668 | 382 (57%) | 0 | **0** | 0 | 0% | 0% | 0% | 0% |  |
| Vloerbekleding | Vasttapijt | Balsan | 20 | 353 | 1 (0%) | 57 | **0** | 0 | 0% | 0% | 0% | 0% |  |
| Vloerbekleding | Tapijtloper | Associated Weavers | 16 | 58 | 40 (69%) | 0 | **0** | 5 | 0% | 0% | 0% | 0% |  |
| Vloerbekleding | Vinylvloer | Gerflor | 12 | 19 | 19 (100%) | 1 | **1** | 12 | 0% | 0% | 0% | 0% | Senso Premium Grey Marble 1539 |
| Vloerbekleding | Tapijttegel | Balsan | 6 | 37 | 6 (16%) | 37 | **6** | 1 | 0% | 0% | 0% | 0% | Sky 160, Sky 640 |
| Vloerbekleding | Vasttapijt | Tarkett (Desso) | 2 | 23 | 0 (0%) | 23 | **0** | 0 | 0% | 0% | 0% | 0% |  |
| **Totaal** | | | **4070** | **11783** | **3778 (32%)** | **6905** | **1624** | **1559** | | | | | |

Per afdeling (primaire categorie):

| Afdeling | Producten | Zonder kleur | Kleuren | Zonder familie | Code én geen familie |
|---|---:|---:|---:|---:|---:|
| Behang | 2724 | 1248 (46%) | 3376 | 1875 (56%) | 1113 |
| Gordijnen & stoffen | 592 | 0 (0%) | 3970 | 0 (0%) | 0 |
| Tapijten | 226 | 17 (8%) | 975 | 115 (12%) | 115 |
| Vloerbekleding | 528 | 294 (56%) | 3462 | 1788 (52%) | 396 |

**Wat dit betekent:**

- **Gordijnstoffen zijn het voorbeeld dat het kan:** alle 3.970 kleuren zijn codes, en toch vindbaar, omdat elke kleur een familie heeft (fototags).
- **Maat en Vorm** gelden enkel voor vloerkleden en zijn daar volledig. Bij vasttapijt zijn ze niet van toepassing.
- **Motief en Stijl:** het gat bij Behang (21–24%) is bijna volledig Boråstapeter (495 van de 559 zonder motief). Bij Tapijten is het vasttapijt (54), bij Stoffen passement (18). Dat laatste is een bewuste keuze.

**Filters die wegvallen, per lijst.** Vetgedrukt: er is geen enkel product met data. De rest valt weg omdat alle producten dezelfde waarde hebben, en dat is correct. Vinyl mist Kleur, Gebruiksklasse en Poolhoogte. Bij Poolhoogte is dat logisch, Kleur is R5-01.

| Lijst | Producten | Getoond | Niet getoond (producten met data) |
|---|---:|---|---|
| /catalogus/gordijnen-en-stoffen | 592 | Type, Kleur, Lichtdoorlatendheid, Motief, Merk, Stijl, Materiaal, Stofbreedte, Eigenschappen | Prijs (592) |
| /catalogus/behang | 2724 | Type, Kleur, Motief, Stijl, Prijs, Merk, Ruimte, Materiaal, Eigenschappen | – |
| /catalogus/vloerbekleding | 582 | Type, Kleur, Look, Rolbreedte, Prijs, Merk, Materiaal, Slijtlaag, Gebruiksklasse, Plaatsing, Poolhoogte, Eigenschappen | – |
| /catalogus/tapijten | 226 | Type, Kleur, Maat, Motief, Prijs, Merk, Stijl, Vorm, Materiaal, Poolhoogte, Eigenschappen | – |
| /catalogus/behang/baby | 505 | Type, Kleur, Motief, Stijl, Prijs, Merk, Ruimte, Materiaal, Eigenschappen | – |
| /catalogus/behang/jeugd-meisjes | 445 | Type, Kleur, Motief, Stijl, Prijs, Merk, Ruimte, Materiaal, Eigenschappen | – |
| /catalogus/behang/bloemen | 327 | Type, Kleur, Motief, Stijl, Prijs, Merk, Ruimte, Materiaal, Eigenschappen | – |
| /catalogus/vloerbekleding/vinyl | 277 | Look, Rolbreedte, Prijs, Merk, Slijtlaag, Plaatsing, Eigenschappen | Type (277), **Kleur (0)**, Materiaal (277), **Gebruiksklasse (0)**, **Poolhoogte (0)** |
| /catalogus/gordijnen-en-stoffen/tekening | 262 | Kleur, Lichtdoorlatendheid, Motief, Merk, Stijl, Materiaal, Stofbreedte, Eigenschappen | Type (262), Prijs (262) |
| /catalogus/behang/jeugd-jongens | 246 | Type, Kleur, Motief, Stijl, Prijs, Merk, Ruimte, Materiaal, Eigenschappen | – |
| /catalogus/vloerbekleding/vasttapijt | 233 | Kleur, Look, Rolbreedte, Merk, Materiaal, Gebruiksklasse, Plaatsing, Poolhoogte, Eigenschappen | Type (233), Prijs (233), **Slijtlaag (0)** |
| /catalogus/behang/streep | 157 | Type, Kleur, Motief, Stijl, Prijs, Merk, Ruimte, Materiaal, Eigenschappen | – |
| /catalogus/behang/effen | 134 | Type, Kleur, Motief, Stijl, Prijs, Merk, Ruimte | Materiaal (134), **Eigenschappen (0)** |
| /catalogus/tapijten/modern | 105 | Kleur, Maat, Motief, Prijs, Merk, Stijl, Vorm, Materiaal, Poolhoogte, Eigenschappen | Type (105) |
| /catalogus/gordijnen-en-stoffen/brandvrij | 96 | Kleur, Lichtdoorlatendheid, Motief, Merk, Stijl, Materiaal, Stofbreedte, Eigenschappen | Type (96), Prijs (96) |
| /catalogus/tapijten/op-maat | 54 | Kleur, Materiaal, Eigenschappen | Type (54), **Maat (0)**, **Motief (0)**, Prijs (54), Merk (54), **Stijl (0)**, **Vorm (0)**, **Poolhoogte (0)** |
| /catalogus/tapijten/binnen-buiten | 36 | Kleur, Maat, Motief, Prijs, Merk, Stijl, Vorm, Materiaal, Poolhoogte, Eigenschappen | Type (36) |
| /catalogus/gordijnen-en-stoffen/isolerend-verduisterend | 34 | Kleur, Lichtdoorlatendheid, Motief, Merk, Stijl, Materiaal, Eigenschappen | Type (34), Prijs (34), Stofbreedte (34) |
| /catalogus/tapijten/rond | 25 | Kleur, Maat, Motief, Prijs, Merk, Stijl, Vorm, Materiaal, Poolhoogte, Eigenschappen | Type (25) |
| /catalogus/tapijten/klassiek | 24 | Kleur, Maat, Motief, Prijs, Merk, Stijl, Materiaal, Poolhoogte, Eigenschappen | Type (24), Vorm (24) |
| /catalogus/gordijnen-en-stoffen/benodigdheden | 18 | Kleur | Type (18), **Lichtdoorlatendheid (0)**, **Motief (0)**, Prijs (18), Merk (18), **Stijl (0)**, Materiaal (18), **Stofbreedte (0)**, Eigenschappen (18) |
| /catalogus/tapijten/speciale-vormen | 7 | Kleur, Maat, Motief, Stijl, Vorm | Type (7), Prijs (7), Merk (7), Materiaal (7), **Poolhoogte (0)**, Eigenschappen (7) |
| /catalogus/tapijten/kinder | 6 | Kleur, Motief | Type (6), Maat (6), Prijs (6), Merk (6), Stijl (6), Vorm (6), Materiaal (6), Poolhoogte (6), **Eigenschappen (0)** |
| /catalogus/gordijnen-en-stoffen/effen | 4 | Kleur, Lichtdoorlatendheid, Motief, Stijl, Materiaal, Stofbreedte | Type (4), Prijs (4), Merk (4), Eigenschappen (4) |

### 4.2 Consistentie tussen afdelingen

| | Gordijnen & stoffen | Behang | Vloerbekleding | Tapijten |
|---|---:|---:|---:|---:|
| Producten (primaire afdeling) | 592 | 2724 | 528 | 226 |
| Kleuren | 3970 | 3376 | 3430 | 975 |
| Staal = foto | 3963 (100%) | 3376 (100%) | 3427 (100%) | 974 (100%) |
| Staal = bolletje | 7 | 0 | 3 | 1 |
| Kleur met eigen vlakke foto | 3963 (100%) | 3374 (100%) | 3425 (100%) | 974 (100%) |
| Kaart met hoverbeeld | 561 (95%) | 2579 (95%) | 412 (78%) | 153 (68%) |
| · hover = sfeerfoto | 36 | 2579 | 370 | 143 |
| · hover = detail (bv. gordijnfoto ADO) | 500 | 0 | 2 | 5 |
| · hover = ongelabeld | 25 | 0 | 40 | 0 |
| · hover = productfoto | 0 | 0 | 0 | 5 |
| Kaart begint met: productfoto / detail / ongelabeld | 588 / 4 / 0 | 2327 / 258 / 139 | 432 / 0 / 96 | 226 / 0 / 0 |
| Producten met één foto | 11 | 1 | 35 | 18 |
| Prijs op de kaart / op aanvraag | 0 / 592 | 2229 / 495 | 277 / 251 | 136 / 90 |
| Eenheid op de kaart | – | rol 1908, stuk 321 | m2 277 | stuk 136 |
| Regel onder de prijs: "Online te bestellen" / "Advies en offerte in de winkel" | 0 / 592 | 2229 / 495 | 277 / 251 | 136 / 90 |
| Kaart met stalen / met "+N" | 557 / 164 | 306 / 44 | 377 / 215 | 143 / 58 |
| "vanaf" op de kaart | 0 | 0 | 0 | 132 |
| Gem. kenmerken / afmetingen per product | 10.1 / 1.7 | 8.3 / 0.8 | 13.1 / 2.8 | 14.2 / 2.9 |
| Producten zonder blok Afmetingen | 2 | 483 | 47 | 1 |

**Verschillen:**

- **Stalen: consequent.** In elke afdeling een foto, 11 bolletjes op 11.751 kleuren, enkel waar geen vlakke foto is. Let op: bij vinyl telt een ongelabelde kamer als "vlak", dus kan een staal ook een miniatuurkamer zijn. Dat lost R5-07 mee op.
- **Hover: wel verschil zonder reden in de specificatie.** Vloer 78% en Tapijten 68% tegenover 95% elders. Dat komt door Tarkett: 144 van de 159 producten hebben geen hover, want er zijn geen gelabelde interieurfoto's. Dat is de regel "dan blijft de foto staan", maar het maakt de afdeling wel minder rijk. Volledige lijst: `geenhover.json` (365 producten).
- **Hover-soort:** behang altijd een sfeerfoto, stoffen vooral een detail van het gordijn. Toegelaten ("liefst een sfeerfoto").
- **"vanaf":** enkel bij Tapijten. Klopt: vinyl en behang hebben per product één prijs.
- **Blok Afmetingen:** 483 behangen hebben er geen, en daar staat een foute tekst (R5-08).
- **Prijs:** 0% bij stoffen, 82% bij behang, 52% bij vloer, 60% bij tapijten. Zie R5-33.

### 4.3 Beloftes

**Alle 182 labels in `brunic.specificaties`** staan in bijlage A. Wat een belofte kan zijn:

| Label | Producten | Zichtbaar op de site? | Oordeel |
|---|---:|---|---|
| Levertermijn | 243 | Nee, verborgen (`IS_LEVERBELOFTE`) | In orde (regel) |
| Levertijd | 33 | Nee, verborgen | In orde (regel) |
| Leverbaar tot (volgens leverancier) | 9 | **Ja** | Te verifiëren (R5-34) |
| Garantie | 245 | **Ja** | Te verifiëren (R5-29) |
| Minimale afname | 25 | Ja. Allemaal op aanvraag, dus de hoeveelheid speelt niet online | In orde |
| EPD, MHS "Beschikbaar" | 69 / 68 | Ja | Leveranciersdata over documenten, geen dienst |
| Keurmerken, Certificeringen, Cradle to Cradle, ISO | 34–111 | Ja | Leveranciersclaims. Niet nagekeken |

**Woorden in wat de klant echt ziet** (beschrijving na de filter, en kenmerken, op alle 4.070 producten):

| Woord | In de beschrijving | Merken | In de kenmerken | Oordeel |
|---|---:|---|---:|---|
| levertijd | 1 | Artelux | 0 | Fout (R5-10) |
| levertermijn | 0 | | 0 | In orde |
| werkdagen | 0 | | 0 | In orde. Ruw 276 keer, allemaal weggefilterd |
| voorraad | 0 | | 0 | In orde |
| leverbaar | 4 | Tarkett 3, Balsan 1 ("ook als tegel leverbaar") | 9 | Geen belofte, behalve R5-34 |
| garantie | 248 | Beauflor 197, Tarkett 40, Gerflor 11 | 245 | Te verifiëren (R5-29) |
| gratis levering | 0 | | 0 | In orde |
| gratis | 36 | Louis De Poortere | 0 | Te verifiëren (R5-30) |
| levering, snelle levering | 36 | Louis De Poortere | 0 | Te verifiëren (R5-30) |

**Steekproef in de echte HTML:** 423 productpagina's. "Op voorraad", "werkdagen", "levertermijn" of `InStock`: 0 keer. Eén keer "levertijd" (Goodnight). Geen `availability` in de structured data.

### 4.4 Beeldlabels en herkomst

| Merk | Producten | Foto's | Zonder label (overig) | Kaart begint met overig | Kaart met productfoto / detail | Kaart met hover | Geen hover |
|---|---:|---:|---:|---:|---:|---:|---:|
| ESTAhome | 1600 | 14380 | 2798 (19%) | 0 | 1600 / 0 | 1600 | 0 |
| Origin Wallcoverings | 591 | 5220 | 1095 (21%) | 0 | 591 / 0 | 591 | 0 |
| Boråstapeter | 495 | 3574 | 252 (7%) | 139 | 98 / 258 | 350 | 145 |
| ADO | 442 | 7066 | 83 (1%) | 0 | 438 / 4 | 417 | 25 |
| Beauflor | 212 | 820 | 72 (9%) | 31 | 181 / 0 | 190 | 22 |
| Tarkett | 159 | 1401 | 130 (9%) | 53 | 106 / 0 | 15 | 144 |
| Associated Weavers | 129 | 2463 | 0 (0%) | 0 | 129 / 0 | 128 | 1 |
| Artelux | 84 | 1431 | 50 (3%) | 0 | 84 / 0 | 81 | 3 |
| Lalee | 84 | 871 | 27 (3%) | 0 | 84 / 0 | 78 | 6 |
| Loft79 | 66 | 1005 | 17 (2%) | 0 | 66 / 0 | 63 | 3 |
| Ragolle | 52 | 420 | 0 (0%) | 0 | 52 / 0 | 38 | 14 |
| Lano | 44 | 801 | 0 (0%) | 0 | 44 / 0 | 44 | 0 |
| Louis De Poortere | 36 | 1301 | 0 (0%) | 0 | 36 / 0 | 36 | 0 |
| Balsan | 26 | 802 | 8 (1%) | 0 | 26 / 0 | 24 | 2 |
| Walls4You | 21 | 136 | 21 (15%) | 0 | 21 / 0 | 21 | 0 |
| Sanders & Sanders | 17 | 155 | 31 (20%) | 0 | 17 / 0 | 17 | 0 |
| Gerflor | 12 | 105 | 105 (100%) | 12 | 0 / 0 | 12 | 0 |
| **Totaal** | **4070** | **41951** | **4689 (11%)** | **235** | | **3705** | **365** |

Het zijn vooral foto's achteraan in de galerij. **Op de kaart komen er 235 vooraan**: Boråstapeter 139 (geen kamer), Tarkett 53, Beauflor 31, Gerflor 12. Alle 235 bekeken.

**Herkomst volgens de bestandsnaam** (41.951 unieke foto's):

| Spoor | Aantal | Oordeel |
|---|---:|---|
| Amazon (`_AC_SX…`, `_AC_SY…`) | 2, Prime Zelfklevend | Te verifiëren (R5-31) |
| Facebook of Instagram (`…_n.jpg`) | 1, Kindervinyl Trude | Te verifiëren (R5-31) |
| Stockbureaus, Pinterest, WhatsApp, screenshots, camerabestanden | 0 | In orde |
| "gemini", "dalle" (AI-programma's) | 149 | Vals alarm: dat zijn productnamen (AW Gemini, Balsan Ultrasoft Dalle) |
| Lange cijferreeks (`1715036976.jpg`) | 66 (Beauflor 34, Tarkett 32) | Waarschijnlijk leverancierscodes. Geen aanwijzing voor een probleem |

**Uitsnede en resolutie van het eerste beeld** (R5-06, R5-37). Afmetingen uit Shopify, hele catalogus:

| Afdeling · merk | Kaarten | Staand eerste beeld | >30% valt weg in 4:3 | Gemiddeld weg | Breedte < 600 px | < 800 px | Mediane breedte |
|---|---:|---:|---:|---:|---:|---:|---:|
| Behang · ESTAhome | 1600 | 225 | 227 | 28% | 5 | 14 | 1500 px |
| Behang · Boråstapeter | 495 | 146 | 162 | 29% | 90 | 337 | 600 px |
| Gordijnen & stoffen · ADO | 442 | 172 | 157 | 31% | 7 | 19 | 1500 px |
| Tapijten · Lalee | 84 | 83 | 83 | 50% | 5 | 80 | 600 px |
| Vloerbekleding · Beauflor | 212 | 45 | 71 | 27% | 1 | 22 | 1000 px |
| Tapijten · Ragolle | 52 | 40 | 52 | 50% | 2 | 2 | 2825 px |
| Tapijten · Louis De Poortere | 36 | 36 | 36 | 45% | 0 | 0 | 1504 px |
| Behang · Origin Wallcoverings | 591 | 23 | 23 | 26% | 2 | 2 | 1500 px |
| Vloerbekleding · Gerflor | 12 | 7 | 6 | 36% | 0 | 1 | 1429 px |
| Vloerbekleding · Lano | 44 | 2 | 2 | 4% | 0 | 2 | 1417 px |
| Gordijnen & stoffen · Artelux | 84 | 2 | 1 | 25% | 0 | 0 | 2048 px |
| Behang · Sanders & Sanders | 17 | 1 | 1 | 27% | 0 | 0 | 1500 px |
| Vloerbekleding · Balsan | 26 | 3 | 0 | 25% | 4 | 4 | 2048 px |

Bij behang en stof is afsnijden minder erg, want het patroon loopt door. Bij vloerkleden valt de rand weg, en daar is die de vorm.

**Overig:** geen product zonder foto, geen dubbele foto binnen een galerij, geen foto gedeeld tussen producten. 178 foto's zijn kleiner dan 500 px aan de langste zijde (Boråstapeter 90, Balsan 61). Eén foto is maar 916 byte: `1976551261-1.jpg` (DJ Black Uni, 310 × 310, egaal zwart).

### 4.5 Namen

| Controle | Aantal | Oordeel |
|---|---:|---|
| Afgekapt: los teken, weggevallen letter ("Olivtr d") | 0 | In orde. De vijf Boråstapeter-namen zijn rechtgezet |
| Rare tekens, HTML-entiteiten, dubbele spaties | 0 | In orde |
| Alt-tekst noemt een ander product | 0 | In orde |
| Slug bevat een woord uit de titel niet | 2 | Onschuldig: "1m²" → `1m2`, "2,22m²" → `2-22m2` |
| Begint met een kleine letter | 45, allemaal Loft79 | Fout (R5-26) |
| Tekens lijken te ontbreken | 5 | Te verifiëren (R5-39) |
| Hernoemd, oude URL | 5 | Fout (R5-14): 404 |
| Zelfde titel binnen een merk | 69 titels, 150 producten | Verbeterpunt (R5-57) |

### 4.6 Versheid

- **Leeftijd:** productie 03/11 13:48 UTC, dus 3 minuten oud bij de start en ±1 u 21 min bij het einde. Geen nieuwe build tijdens de audit.
- **Lokale momentopname:** 02/11 19:35 UTC. Inhoud gelijk op alles wat ik kon nameten (4.070 kaarten, 47.191 tellingen, 423 productmodellen). Bij 25 van die 423 kon ik de beschrijving niet vergelijken, want die staat als aparte verwijzing in de pagina.
- **Live tegenover de momentopname:** `/api/producten?live=1` op 300 willekeurige producten, 1.105 varianten: **0 afwijkingen**. Alle 15.927 varianten staan op beschikbaar. Shopify volgt geen voorraad, dus dat zegt weinig.
- **Webhooks:** te verifiëren door iemand met toegang tot Shopify (R5-32).

---

## 5. Regels van de opdrachtgever

| Regel | Meting | Oordeel |
|---|---|---|
| Een sfeerfoto komt nooit eerst, tenzij die kleur niets anders heeft | Gelabeld: 0 fouten op 95.769 kaarten in lijsten, en op alle 4.070 zonder filter. 8 kleuren hebben niets anders (§3.6). **Ongelabeld: 25 vinylkaarten fout** (R5-07). | **Niet in orde** |
| Geen voorraadtekst | 0 op 423 pagina's. Geen `availability` in de structured data. Enkel de interne waarde (R5-49). Winkelmand niet getest. | In orde |
| Geen levertermijn | 276 producten verborgen, 0 zichtbaar. Eén keer in lopende tekst (R5-10). Twee aanverwante punten: R5-34, R5-30. | **Bijna in orde** |
| Desso valt onder Tarkett, zoeken op Desso blijft werken | Merk "Desso": 0 producten. `?merk=desso` → Tarkett, `/merken/desso` → 308. Zoeken: 97 van de 100 (R5-11). | **Bijna in orde** |
| Een kleurstaal is de vlakke foto van die kleur | 11.740 foto's, 11 bolletjes, alle 11 zonder vlakke foto. | In orde |

---

## 6. Geteste onderdelen

### 6.0 De filtervragen uit de opdracht

| Vraag | Antwoord | Hoe getest |
|---|---|---|
| Passen de filters bij de categorie? | Ja. Elk profiel volgt de matrix. Boråstapeter en vinyl vallen buiten de boot door de data (R5-01, R5-02). Motief en Stijl overlappen (R5-59). | Alle 24 lijsten, §4.1 |
| Komen de waarden overeen met de productgegevens? | Ja. 0 afwijkingen op 4.055 producten: Kleur, Type, Merk, Slijtlaag, Poolhoogte, Stofbreedte, Rolbreedte, Lichtdoorlatendheid, Wasbaar, Vloerverwarming, Materiaal, Motief. Maat, Vorm en Prijs per variant zelf gerekend. Look, Stijl, Ruimte, Plaatsing en Gebruiksklasse enkel via `test:filters`. | Eigen berekening uit de ruwe momentopname |
| Enkel producten die voldoen? | Ja. 0 fouten. | 1.300 lijsten |
| Meerdere waarden en combinaties? | Ja. OF binnen, EN tussen, EN in Eigenschappen. | 744 lijsten, browser |
| Bestaat de variant achter de filter? | Ja voor Kleur, Maat, Vorm, Prijs: 0 fouten op 17.540 kaarten met een eigen variant. Rolbreedte valt erbuiten (bekend). | 95.769 kaarten |
| Hele catalogus, ook niet geladen? | Ja. Filteren gebeurt op de server. | `pagina=999` tegenover eigen telling |
| Aantallen en opties? | Ja. 47.191 tellingen, 0 afwijkingen. Eén waarde die alles dekt blijft staan na een keuze (R5-44). | 1.300 lijsten |
| Sorteren, paginering, meer laden? | Ja. Positie en focus in orde, filter zet de pagina terug. | 48 lijsten, browser |
| Chips en wissen? | Ja. Individueel en volledig, desktop en mobiel. | Browser |
| Melding bij nul resultaten? | Ja. Uitleg, "Filters aanpassen" en "Alle filters wissen". | Browser |
| Vernieuwen, terug, gedeelde URL? | Ja. Na filteren vanaf ver in de lijst ziet u de resultaten niet (R5-04). Oud label Multicolor werkt niet (R5-15). | Browser |
| Fouten bij snel klikken? | Nee. 52 runs, alle keuzes bewaard. | Browser |
| Prijsfilter? | Klassen, eenheden en ontbrekende prijzen kloppen met de data. Doosprijs: R5-28. | 1.300 lijsten |

### 6.1 Volledig uitgevoerd (hele catalogus)

- **Productie tegenover de code:** 4.070 kaarten en variantprijzen via `/api/producten`: 0 verschillen. De sitemap bevat dezelfde 4.070 URL's.
- **Eigen model tegenover 1.300 productielijsten** (`pagina=999`): elke waarde van elke filter in de 4 afdelingen (348), paren van variantfilters (436), 3 en 4 filters tegelijk (100), meerdere waarden (76), gemengd met andere filters (100), Eigenschappen EN (32), sorteringen op prijs, naam en nieuwste (48), alle subcategorieën (81), zoeken, aanbiedingen, nieuw binnen en merken (75). Het model rekent zelf per variant, los van `filters.ts` en `listing.ts`.
  - **95.769 kaarten:** toonvariant voldoet aan de filter, prijs = prijs achter de link, laagste in die kleur, "vanaf" klopt, prijs binnen de gekozen klasse, beeld = eerste foto op de pagina, geen sfeerfoto vooraan, hover in de kleur van de kaart, staal = eigen variant, beeld, prijs en link: **0 fouten**, op de 43 meldingen van R5-09 na.
  - **47.191 tellingen: 0 afwijkingen.** Totaal en leden: 0 afwijkingen. Sortering: 0 fouten. Lege groepen: 0. Gekozen waarde weg: 0. 311 lijsten met 0 resultaten: de lege staat is correct.
- **Beeld-URL's:** alle 41.951 unieke foto's met HEAD, max. 8 tegelijk (33 minuten): **0 problemen**.
- **`test:filters`:** 535 geslaagd, 0 mislukt (`%TEMP%\brunic-qa\r5\test-filters.txt`).
- **Tabellen in §4:** alle producten. Voor de site-tekst: de beschrijving en kenmerken zoals de adapter ze doorgeeft.

### 6.2 In de browser (headless Chrome via CDP, productie)

Desktop 1366 × 900, mobiel 390 × 844 met touch. Er was geen browsertool beschikbaar.

- **Filters, desktop en mobiel (`b1`):** één filter, OF, EN, Eigenschappen EN, sorteren, terug, vooruit, herladen, gedeelde URL, chip weg, alles wissen, meer tonen (positie, focus, geen stap in de geschiedenis), lege staat, zoeken in een lange lijst, Escape, oude links, gemengde lijsten, verborgen afdelingen. Desktop 64 stappen in orde, mobiel 68. Wat misging staat in §2 (R5-12, -15, -16). Raamdecoratie, Verf en Slapen & wonen geven 404 en staan niet in het menu.
- **Snel klikken (`b2`, `b2b`):** 21 runs met vaste intervallen (50–2.000 ms), 24 met willekeurige, 4 in het paneel, 3 over verschillende filters: **alle keuzes bewaard**. Een eerste melding bleek een fout in mijn script.
- **Kaarten (`b3`):** 14 lijsten, alle afdelingen, met en zonder filter. Desktop: hover op 111 kaarten, kaart → pagina → terug op 41 kaarten (titel, beeld, prijs, URL en scrollpositie: 41 van de 41), 14 stalen. Mobiel: kaart aantikken → pagina → terug op 41 kaarten (titel 41, beeld 41, prijs 41, URL 41, scrollpositie 41 van de 41), 14 stalen (blijft op de lijst: 14, zelfde beeld op de pagina: 14).
- **Toetsenbord (`b4`):** 46 Tab-stops zonder ontbrekende focusring, skiplink, paneel, lade met focusval, Escape, sorteren, staal, kaart, galerij, lightbox, optielade. 27 stappen tot de eerste filter, 38 tot de eerste kaart.
- **Mobiel (`b5`):** 19 soorten pagina's zonder overflow. Lade openen, vegen, kiezen, "Toon N", heropenen, wissen, kruisje. Staal, tikdoelen (40 en 44 px), galerij, lightbox, optielade, kleverige balk, menu.
- **Vorige reproducties (`b7`, `s3`):** R4-01 t/m R4-06, Toscana, flits, kaarthoogte.
- **Flikkeren (`b8`, `b9`):** 24 kaarten met metingen per frame, 3 op een trage verbinding zonder cache met beelden: geen leeg kader.
- **Console en netwerk:** enkel de preload-waarschuwing (R5-51). Geen mislukte verzoeken, op 4 keer `ERR_SSL_PROTOCOL_ERROR` bij het eerste laden van één test na. Die verdwenen bij een nieuwe poging. De oorzaak ken ik niet, de testmachine draaide toen ook de HEAD-controle.

### 6.3 Steekproef

- **Productpagina's in de HTML:** 423 (22 per merk, alle aanbiedingen, alle met één foto, kleuren zonder foto): tekst, structured data, meta, productmodel.
- **Visueel:** alle 235 "overig", 160 gelabelde eerste beelden, 128 paren kaart + hover, 65 hover "overig", alle foto's van de 28 kamers, 52 Ragolle, 84 Lalee, 36 LDP, 15 koppelingen, 8 sfeerfoto's, 3 herkomst. Niet elke van de 41.951 foto's is bekeken: "juiste kleur op de foto" steunt op de koppelingen en deze steekproef.

---

## 7. Beperkingen en niet getest

- **Geen echte toestellen** (iOS Safari, Android) en **geen schermlezer** (NVDA, VoiceOver). Touch is geëmuleerd. R5-22 en R5-50 zijn daarom enkel in Chrome vastgesteld.
- **Niet aangeraakt, zoals gevraagd:** winkelmand, kassa, offerte-, opmeting- en contactformulieren. Het hartje is niet aangeklikt. Wat de kassa doet met R5-28 weet ik dus niet. Of de winkelmand iets over voorraad zegt, is hier niet nagekeken.
- **Geen toegang tot Shopify-admin of Vercel.** De commit op productie is afgeleid. Webhooks, metafields en of de vinyltags intussen weggeschreven zijn na de build van 13:48 UTC: niet zichtbaar.
- **Bronbestanden:** `data/` in de repo bevat enkel een README. De ruwe exports staan in `Website-shop\Data\`. Daar heb ik enkel de fotolijst gelezen, voor de herkomst.
- **Prijzen:** ik kan niet vaststellen of een prijs juist is, enkel of ze intern klopt.
- **Snelheid** is niet beoordeeld, enkel de wachttijd van de hover.

---

## 8. Prioriteitenlijst voor herstel

1. **R5-28:** Brunic vragen wat de prijs van de Senso-producten voorstelt. Kost één telefoontje en kan foute informatie wegnemen.
2. **R5-01:** de vinyltags wegschrijven en een nieuwe build. De export ligt klaar.
3. **R5-02, R5-03:** Boråstapeter en de rest van Behang taggen op kleur, motief en stijl, op dezelfde manier als de stoffen.
4. **R5-07:** de fotolabels voor vinyl (voorstel klaar). Dat lost ook het staal en de hover van die kaarten op. Neem R5-09 en R5-42 in dezelfde ronde mee.
5. **R5-04, R5-05, R5-06, R5-08 (code):** vier kleine ingrepen met veel effect: scrollen na een filter, de tabel uit de beschrijving, `contain` voor vloerkleden, de opmetingstekst.
6. **R5-29, R5-30, R5-33, R5-34, R5-35:** één lijst met vragen aan Brunic over garantie, de LDP-tekst, prijzen op aanvraag en servicebeloftes. Neem R5-31 (beeldrechten) en R5-32 (webhooks) mee.
7. **R5-43:** kleverige filterknop op mobiel.
8. **Vóór livegang:** R5-14 (redirects), R5-20 (SKU's), R5-27 (intro's), en `SITE_INDEXEREN` aanzetten.
9. **Afwerking (P3):** R5-10 tot en met R5-13, R5-15 tot en met R5-19, R5-21 tot en met R5-26, en de verbeterpunten. Veel daarvan is één regel code.

---

## 9. Telling

**59 bevindingen.** Van de opgeloste punten uit de vorige rapporten is er bij mijn hertest geen enkel teruggekomen. Status per punt: §10.

| Soort | P1 | P2 | P3 | Totaal |
|---|---:|---:|---:|---:|
| Bevestigde fouten | 2 | 7 | 18 | 27 |
| Te verifiëren | 1 | 5 | 9 | 15 |
| Verbeterpunten | 0 | 1 | 16 | 17 |
| **Totaal** | **3** | **13** | **43** | **59** |

Nieuw: 22 (R5-04, -05, -06, -08, -13, -24, -25, -28, -30, -32, -33, -35, -36, -37, -41, -43, -50, -53 t/m -57), plus 3 die nu voor het eerst als geheel of met een telling staan (R5-02, -29, -31). De andere 34 waren al gemeld of stonden in de overdracht.

---

## 10. Status per eerdere bevinding

**Opgelost** = opnieuw getest en weg. **Open** = opnieuw getest en nog aanwezig. **Bekend** = opnieuw gemeten, maar de specificatie staat het toe. Alle punten zijn deze ronde opnieuw getest, tenzij er "niet opnieuw getest" staat.

### 10.1 Rapport van 02/11 (R4)

| Punt | Onderwerp | Status 03/11 | Hoe nagekeken | Nu |
|---|---|---|---|---|
| R4-01 | Prijs na een klik op een staal | **Opgelost** | Browser (Rampur 0600: € 79 → "vanaf € 49" → pagina € 49) en 95.769 kaarten | – |
| R4-02 | Kaart rechthoekig, pagina rond | **Opgelost** | Browser (Papercut, 140 × 200 cm) en 95.769 kaarten | – |
| R4-03 | Staal blijft hangen na een kleurfilter | **Opgelost** | Browser (Papercut). Sorteren laat het staal staan, zoals de specificatie zegt | – |
| R4-04 | Sfeerfoto vooraan bij Vorm Organisch | **Opgelost** | Browser (Lech, Lamego 701 en 702) en 95.769 kaarten | – |
| R4-05 | Lijst over één vorm met een extra filter | **Opgelost** | Browser (POP) en 81 subcategorielijsten | – |
| R4-06 | "+N" op een andere kleur | **Opgelost** | Browser (Koren) | – |
| R4-07 | Focus valt weg in de lade | **Open** | Browser, desktop en mobiel | R5-12 |
| R4-08 | Oude Boråstapeter-URL's geven 404 | **Open** | Alle 5 opgevraagd | R5-14 |
| R4-09 | 3 Desso-tapijten niet vindbaar | **Open** | Zoekfunctie op alle producten | R5-11 |
| R4-10 | Foto aan een andere kleur | **Open**, 15 producten | Op de data. Toscana bekeken | R5-09, R5-42 |
| R4-11 | Levertijd in de kenmerken | **Grotendeels opgelost**: 276 producten verborgen, 0 zichtbaar. Goodnight en "Leverbaar tot" blijven | Alle producten, 423 pagina's | R5-10, R5-34 |
| R4-12 | Prijzen die uit de toon vallen | **Open** | Op de data (Mehari 0474, Rampur 0600) | R5-38 |
| R4-13 | Namen met ontbrekende tekens | **Open**, de 5 namen staan er nog | Op de data | R5-39 |
| R4-14 | Samira oogt leeg | **Open** | Kaart bekeken | R5-40 |
| R4-15 | Eerst de standaardkleur bij `?variant=` | **Open** (293 ms) | Gemeten per frame | R5-47 |
| R4-16 | Rolbreedte is een productfilter | **Bekend**, ongewijzigd: 616 kaarten | Op 9 productielijsten | §2.4, niet geteld |
| R4-17 | og:image is niet het eerste beeld | **Open**: 69 van 423 (was 52 van 354, zelfde orde) | 423 pagina's | R5-48 |
| R4-18 | Hover is een smalle strook | **Open**, 25 kaarten | Alle 25 bekeken | R5-45 |
| R4-19 | `availability` in de pagina-data | **Open** | HTML van een lijst en een pagina | R5-49 |

### 10.2 Rapport van 31/10, derde ronde (R3)

| Punt | Onderwerp | Status 03/11 | Hoe nagekeken | Nu |
|---|---|---|---|---|
| R3-01 | Lade met Tab | **Opgelost** | 40 Tab-stappen blijven in de lade, Shift+Tab, Escape. Niet opnieuw alle 94 elementen op volgorde | – |
| R3-02 | Prijsklassen tapijten | **Opgelost** | Elke klasse en alle paren tegenover eigen telling | – |
| R3-03 | Lege filtergroepen | **Opgelost**: 0 in 1.300 lijsten | Productielijsten | – |
| R3-04 | Hover in een andere kleur | **Opgelost**, op R4-10 na | 95.769 kaarten, 128 paren bekeken | R5-09 |
| R3-05 | Kaart en pagina op een ander beeld | **Opgelost** | 95.769 kaarten, 41 + mobiel in de browser | – |
| R3-06 | "Meer tonen" springt terug | **Opgelost** | 2 klikken, desktop en mobiel (R4: 3 klikken) | – |
| R3-07 | "1 van 1 producten" | **Open** | Browser | R5-17 |
| R3-08 | "Op maat" in de optielade | **Opgelost** | Lade van Papercut en Rampur 0600, en de code | – |
| R3-09 | Art.nr. is een Shopify-ID | **Open**, 1.089 varianten | Alle varianten | R5-20 |
| R3-10 | Header-overflow bij 1.280 px | **Open** | 10 breedtes gemeten | R5-21 |
| R3-11 | "Totaal voor 1 rollen" | **Open** | Browser | R5-19 |
| R3-12 | Kleverige hover op touch | **Open** | Geëmuleerd | R5-22 |
| R3-13 | `kleur=Multicolor` geeft 0 | **Open** | Browser | R5-15 |
| R3-14 | Zoekkop en lijst verschillen | **Open** (382 tegenover 333) | Browser | R5-18 |
| R3-15 | Verminkte en kleine letters in namen | **Deels opgelost**: Boråstapeter recht, Loft79 nog 45 | Alle titels | R5-26 |
| R3-16 | "Op voorraad" | **Opgelost** | 423 pagina's. Interne waarde blijft: R5-49 | R5-49 |
| R3-17 | Kleuren die met een rol- of sfeerfoto beginnen | **Sterk verbeterd**: 8 kleuren in 6 producten, 0 rolfoto's. Toegelaten door de regel | Op de data, bekeken | §3.6 |
| R3-18 | Pagina opent op de foto van een andere kleur | **Open** | Op de data | R5-42 |
| R3-19 | Desso-merk | **Opgelost**: merk overal Tarkett. Vindbaarheid: R4-09 | Alle producten | R5-11 |
| R3-20 | Intro behang noemt andere merken | **Open** | Browser | R5-27 |
| R3-21 | Kaart volgt de kleurfilter niet | **Opgelost** | 95.769 kaarten. Stoffen Rood in de browser | – |
| R3-22 | Kaart begint met een gelabelde sfeer- of rolfoto | **Opgelost**: 0. Ongelabeld: R5-07 | Alle kaarten | R5-07 |
| R3-23 | Twee tegels met hetzelfde beeld | **Open** | Browser | R5-52 |
| R3-24 | Vegen in de lightbox | **Open** | Geëmuleerd | R5-23 |
| R3-25 | Documentatie loopt achter | **Open** | Vergeleken | R5-58 |
| R3-26 | Hoverbeeld laadt pas bij de hover | **Open** (mediaan 509 ms), geen flikkering | 111 kaarten | R5-46 |
| R3-27 | Preload-waarschuwingen | **Open** | Console | R5-51 |
| R3-28 | Groep met één waarde | **Open** (1.802 keer) | 1.300 lijsten | R5-44 |
| R3-29 | Vervallen parameters in de URL | **Open** | Browser | R5-16 |

**Niet opnieuw getest:** niets uit R3 en R4 is helemaal overgeslagen. Wel smaller dan toen: R3-01 (zie boven) en de winkelmandtekst uit R4 (§7). De punten uit de twee oudste rapporten van 31/10 zijn enkel gevolgd voor zover ze in R3 terugkomen.

---

## Bijlage A. Alle labels in `brunic.specificaties`

Ruw in de momentopname, met het aantal producten (182 labels). Levertermijn en Levertijd zijn op de site verborgen.

| Label | Producten | Verschillende waarden | Meest voorkomend |
|---|---:|---:|---|
| Samenstelling | 2813 | 190 | FSC gecertificeerd vliesbehang (1492); 100% polyester (290) |
| Geschikt voor | 2260 | 144 | slaapkamer, woonkamer (706); slaapkamer, woonkamer, werkkamer,  (272) |
| Aanbrengen | 2238 | 4 | wand inlijmen (2184); zelfklevend, inlijmen niet nodig (34) |
| Afmetingen | 2229 | 47 | 53 cm x 10,05 m (1776); 0,53 x 10,05 m (82) |
| Motief | 2221 | 161 | bloemen (267); grafisch (153) |
| Patroonaansluiting | 2167 | 8 | recht (1013); verspringend (637) |
| Stijl | 2129 | 220 | scandinavisch (198); vintage (100) |
| Patroonherhaling | 1681 | 35 | 53 cm (1360); 26,5 cm (154) |
| Collectie | 978 | 84 | Boras Studio (143); Linen (43) |
| Patroonverzet | 641 | 12 | 26,5 cm (569); 13,25 cm (20) |
| Onderhoud | 625 | 18 | Fijnwas op 30 °C, Niet bleken, Nie (222); Extra goed afwasbaar (178) |
| Eigenschappen | 598 | 147 | Heatset-garen (52); Kamerhoog, Wasbaar, Geschikt voor  (37) |
| Stofbreedte | 574 | 22 | 300 cm (291); 295 cm (55) |
| Gewicht | 460 | 149 | 1475g/m² (37); 1500 gr/m2 (35) |
| Lichtechtheid | 428 | 11 | Zeer lichtvast (178); 5 van 8 (109) |
| Vloerverwarming | 362 | 7 | Ja (185); Geschikt (maximaal 27°C) (71) |
| Transparantie | 357 | 6 | Semi-transparant (150); Transparant (113) |
| Poolmateriaal | 309 | 29 | 100% polypropyleen (85); 100% polyamide (54) |
| Poolhoogte | 275 | 54 | 11 mm (34); 9 mm (27) |
| Collecties | 275 | 144 | Everybody Bonjour, Walls for Kids  (11); Little Bandits, Walls for Kids XL2 (11) |
| Slijtlaag | 274 | 16 | 0,25mm (68); 0,2mm (49) |
| Dikte | 274 | 22 | 2,8mm (71); 2,6mm (37) |
| Totaal gewicht | 263 | 84 | 3850 g/m² (29); 3.200 g/m² (22) |
| Garantie | 245 | 10 | 5 jaar (78); 10 jaar residentieel (60) |
| Levertermijn | 243 | 2 | 3-5 Werkdagen (234); 5-10 Werkdagen (9) |
| Rapport (b × h) | 239 | 212 | 11 cm × – (5); 63 cm × 300 cm (3) |
| Afwerking | 202 | 14 | Zandreliëf (84); Matt PU + Houtreliëf (39) |
| Patroon | 197 | 22 | 100 x 100cm (87); 200 x 150cm (29) |
| Rug | 194 | 27 | FusionBac (68); Comfortex Plus Feltbac (23) |
| Verwijderen | 183 | 4 | Nat verwijderbaar (178); Nat verwijderbaar (vermeld bij 2 v (3) |
| Brandklasse (EU) | 183 | 4 | B-s1, d0 (178); B-s1, d0 (vermeld bij 2 van 3 kleu (3) |
| Producttype | 171 | 3 | Textiele vloerbedekking (124); Geëxpandeerde (gedempte) poly(viny (37) |
| Productieproces | 162 | 3 | GETUFT (117); Getuft (44) |
| Totale dikte | 159 | 64 | 6 mm (40); 6,50 mm (22) |
| Brandklasse | 158 | 5 | Bfl-s1 (89); Cfl-s1 (51) |
| Installatiemethode | 156 | 3 | Los gelegd (75); Verlijmd (44) |
| Structuur | 152 | 18 | Frisé (53); Lussenpool (45) |
| Breedte | 152 | 13 | 50 cm (76); 400 cm (54) |
| Dichtheid | 151 | 5 | Inbetween/Transparant (73); Gesloten (60) |
| Krimp | 149 | 3 | 1% (116); 2% (20) |
| Wasvoorschriften (code) | 149 | 8 | mHDLU (106); mHELU (26) |
| Geschikt voor vouwgordijnen | 148 | 2 | Nee (76); Ja (72) |
| Warmteweerstand | 147 | 29 | 0,11 m²·K/W (20); < 0,15 m²·K/W (14) |
| Formaat | 136 | 3 | Tegels 50 x 50 cm (76); Rol 4 m (54) |
| Formaattype | 134 | 2 | Tegel (78); Rol (56) |
| Poolvezel | 132 | 15 | BCF PA6 (55); BCF PA6 ECONYL (32) |
| Stapelconstructie | 132 | 5 | Gestructureerde lussenpool (70); Lussenpool (32) |
| Effectieve pooldikte | 131 | 50 | 2,8 mm (29); 4 mm (8) |
| Totale vezelmassa | 131 | 62 | 610 g/m² (26); 730 g/m² (11) |
| Prestatieverklaring | 130 | 16 | 0493-CPR-0002-04 (65); 0493-CPR-0003-01 (21) |
| Geproduceerd in | 130 | 2 | Europe (96); België (34) |
| Antislipeigenschappen (EN 13893) | 127 | 1 | Klasse DS (µ ≥ 0,30) (127) |
| Uitzicht | 126 | 2 | Effen/gespikkeld (96); Structuur/dessin (30) |
| Residentiële gebruiksklasse | 126 | 2 | 23 Zwaar (123); 22 Algemeen/Medium (3) |
| Verfmethode | 124 | 6 | In de massa geverfd (77); Stukgeverfd (continu) (28) |
| Totale hoogte | 123 | 37 | 6,5 mm (10); 5,4 mm (10) |
| Primaire rug | 122 | 6 | Polyester fleece (73); Polypropylene woven + fleece (27) |
| Patroontype | 122 | 8 | Structuur (75); Uni (30) |
| Effectieve poolmassa | 120 | 63 | 355 g/m² (26); 415 g/m² (6) |
| Luxe beoordeling | 119 | 5 | LC1 (49); LC2 (38) |
| Tuft-dichtheid | 117 | 39 | 1580 /dm² (69); 1500 /dm² (3) |
| Residentieel gebruik | 116 | 5 | Normaal: slaapkamer, logeerkamer,  (35); Intensief: slaapkamer, logeerkamer (32) |
| Deling | 116 | 6 | 1/10" (90); 1/8" (8) |
| Verpakking | 113 | 3 | 20 tegels per doos, 5 m² per doos (76); 100% recyclebare plastic (35) |
| Keurmerken | 111 | 1 | OEKOTEX (111) |
| Geschikt voor zwenkwielen | 107 | 4 | Intensief gebruik (87); Incidenteel gebruik (14) |
| Statische elektrische neiging | 106 | 1 | Antistatisch (≤ 2 kV) (106) |
| Vezeldichtheid | 104 | 45 | 0,127 g/cm³ (25); 0,126 g/cm³ (6) |
| Punten per m² | 103 | 13 | 212.000 (22); 1.000.000 (15) |
| Secundaire rug | 100 | 6 | EcoBase - 100% recyclable, contain (66); T1 Textile SWB Synthetic (14) |
| Commerciële gebruiksklasse | 97 | 3 | 33 Intensief (83); 32 Normaal (11) |
| Vermindering van impactgeluid - ∆Lw | 97 | 11 | 25 dB (41); 24 dB (13) |
| Akoestische absorptie - αw | 96 | 3 | 0,15 (67); 0,2 (22) |
| Cradle to Cradle® | 96 | 3 | Zilver (62); Brons (31) |
| Kleurbestendigheid tegen water - Kleuring | 95 | 2 | ≥ 2-3 (59); ≥ 3-4 (36) |
| Kleurweerstand tegen water - Kleurverandering | 95 | 1 | ≥ 3-4 (95) |
| Kleurvastheid bij nat wrijving | 95 | 1 | ≥ 3 (95) |
| Kleurvastheid bij droog wrijving | 95 | 2 | ≥ 3-4 (91); ≥ 3 (4) |
| Plank Afmeting | 95 | 26 | 20 x 150cm (18); 12,5 x 100cm (10) |
| Thermische weerstand | 91 | 40 | 0,066 m²•K/W (24); 0,078 m²•K/W (8) |
| Ftalaatvrij | 89 | 1 | 100% Ftalaat-vrij (89) |
| GUI Allergy Certificate # | 82 | 11 | AT 100-111-17 (33); Certificate FST 100-051-08 (21) |
| GUI Fine Dust | 81 | 2 | Basic (75); Gold + (6) |
| Dimensionele stabiliteit | 80 | 3 | ≤ 0,20 % (46); Gemiddelde gemeten waarde : ≤ 0,2  (19) |
| Artikelen per doos | 78 | 2 | 20 (76); 16 (2) |
| Oppervlakte per doos | 78 | 2 | 5 m² (76); 4 m² (2) |
| Legrichting | 76 | 13 | HorzA/Quart (41); Mono/Quart/HorzA/VertA (10) |
| Doos per pallet | 76 | 5 | 44 (32); 40 (32) |
| Oppervlakte per pallet | 76 | 6 | 220 m² (32); 200 m² (32) |
| Formaldehyde-emissie | 73 | 1 | E1 (73) |
| Recycleerbaarheid | 73 | 2 | Ja, vloerafval na gebruik via ReSt (64); Ja – afval na gebruik, alleen gare (9) |
| CO2-voetafdruk (Cradle-to-Gate, EPD Modules A1-A3) | 72 | 25 | 4,27 kg CO₂e /m² (24); 7,63 kg CO₂e /m² (7) |
| EPD-nummer | 71 | 24 | S-P-10808 (24); S-P-08639 (8) |
| Tegel Afmeting | 70 | 20 | Allover (25); 20 x 20cm (10) |
| EPD (Environmental product declarations) | 69 | 1 | Beschikbaar (69) |
| MHS (Material Health Statement) | 68 | 1 | Beschikbaar (68) |
| Totale VOS-emissie na 28 dagen | 65 | 2 | Gold (≤ 100 µg / m³) (41); ≤ 1000 µg / m³ (24) |
| Gebruik | 65 | 5 | Binnen/Buiten (34); Zwaar gebruik (19) |
| CO2-voetafdruk (EPD Modules A-D) | 63 | 22 | 1,71 kg CO₂e /m² (24); 1,58 kg CO₂e /m² (6) |
| Lijn | 62 | 8 | Carpetyourlife (19); Invictus (14) |
| Kwaliteits- en milieucertificaten | 62 | 2 | ISO 14001 (47); ISO 9001 (15) |
| Carbon Impact over the Entire Product Lifecycle | 62 | 13 | 1,7071 kg CO₂e /m² (24); 6,44 kg CO₂e /m² (10) |
| Elektrische weerstand | 60 | 1 | SD (60) |
| Global Green Tag | 60 | 1 | Level A (60) |
| Slijtvastheid (Martindale) | 48 | 15 | 55.000 toeren (16); 100.000 toeren (11) |
| Productmateriaal | 45 | 1 | Getuft (45) |
| Kwaliteitscode | 44 | 44 | BAO (1); LBLX (1) |
| Commercieel gebruik | 40 | 3 | Licht: hotelkamer, hotelsuite (22); Normaal: hotelkamer, hotelsuite, b (11) |
| Hoogte | 37 | 3 | 3mm (35); 300mm (1) |
| Green Building Certifications Contribution | 36 | 1 | Ja (36) |
| Rapport | 36 | 19 | 130 cm (5); Verspringende aansluiting (half dr (4) |
| Samenstelling rug | 35 | 2 | Antislip-latex (polyester) (34); Natuurlijke antislip-latex (1) |
| Dessin | 35 | 18 | Houten Lat (6); All-Over (4) |
| Weefproces | 34 | 1 | Jacquard, vlakgeweven (34) |
| Certificeringen | 34 | 1 | OEKO-TEX®, ISO 9001, GRS Certified (34) |
| Ontvlambaarheid | 34 | 1 | BS4790 CFR1630-FF1-70 (34) |
| UV-test | 34 | 1 | Blootstelling volgens ISO 4892-3 (34) |
| Wasvoorschriften | 34 | 1 | Machinewasbaar (30 °C) (34) |
| CRI Green Label Plus Certification | 34 | 4 | GLP 3372 (25); GLP 1726 (6) |
| Levertijd | 33 | 2 | 3 – 5 werkdagen (32); 7 werkdagen (1) |
| Inhoud van pentachloorfenol | 32 | 1 | DL (32) |
| Productgroep | 31 | 1 | Vinyl (31) |
| Kleur | 31 | 14 | Meerderkleurig (7); Grijs (7) |
| Breedte rol | 31 | 6 | 4 m (19); 2 m (6) |
| FDES A1-A3 | 30 | 7 | 4,19 kg CO₂e /m² (10); 3,64 kg CO₂e /m² (8) |
| Lichtreflectiewaarde (%) | 30 | 30 | 35,14 (1); 29,36 (1) |
| Rapport (l × b) | 28 | 10 | 95 × 67/80/100 cm (7); 95 × 100 cm (5) |
| Totaalgewicht | 26 | 24 | 1900 g/m² (2); 4080 g/m² (2) |
| Poolgewicht | 26 | 20 | 1300 g/m² (3); 1000 g/m² (3) |
| Minimale afname | 25 | 3 | 4 m2 (19); 1 doos (5) |
| Pooldichtheid | 23 | 17 | 250000 punten/m² (3); 189600 punten/m² (2) |
| Steek (gauge) | 23 | 6 | 1/10 (11); 5/64 (6) |
| Artikelnaam bij ADO | 23 | 11 | Macrame-Borte (11); Gardine (2) |
| Contactgeluidisolatie | 22 | 11 | ΔLw 30 dB (4); ΔLw 25 dB (4) |
| Antistatisch | 21 | 1 | 2kV (21) |
| Geluidsabsorptie | 14 | 5 | αω 0,25 (4); αω 0,15 (3) |
| Rolbreedte | 13 | 1 | 4 m (13) |
| Plank afmeting | 10 | 5 | 20 x 150cm (5); 18 x 150cm (2) |
| Leverbaar tot (volgens leverancier) | 9 | 1 | 12/26 (9) |
| Rolmaat | 9 | 1 | 10,05 m × 0,53 m (9) |
| Herhaling Patroon | 9 | 4 | 100 x 100cm (4); 133,3 x 100cm (3) |
| Antistatische eigenschappen | 9 | 1 | Ja (9) |
| Anti-slip | 9 | 1 | Ja (R10) (9) |
| Brandvertragend (norm) | 8 | 5 | BS 5867 part 2 type C, ISO 6940 69 (2); BS 5867 part 2 type c, ISO 6940 69 (2) |
| Aantal knopen (nr/m2) | 8 | 7 | 1500 (2); 1580 (1) |
| UPEC-klasse | 7 | 7 | U3P3E1C0 - 04/070/23 (1); U3SP3E1C0 - 04/084-03/23 (1) |
| Afmeting Dessin | 5 | 4 | 25 x 133,3cm (2); 10 x 25cm (1) |
| Industriële wasvoorschriften (code) | 3 | 1 | pHDLU (3) |
| Gerecycleerd materiaal | 3 | 3 | 64 % (1); 56 % (1) |
| Afmeting | 3 | 2 | 2,65 × 1,80 m (2); 2,65 × 3,60 m (1) |
| Lengte | 3 | 3 | 30,5 cm (1); 73 cm (1) |
| Formaatdetails | 3 | 3 | Vierkante plaat (1); Rechthoekige tegel (1) |
| Beschikbare rolbreedtes | 2 | 1 | 4 m en 5 m (2) |
| Totaal gerecycleerd materiaal | 2 | 2 | 46,9 % (1); 46,2 % (1) |
| RTS emissieklasse | 2 | 1 | M1 (2) |
| Oppervlakte / doos | 2 | 2 | 1,00 m² (1); 2,22 m² (1) |
| Eenheden / doos | 2 | 2 | 11 (1); 12 (1) |
| Slijtlaagdikte | 2 | 2 | 0,08 mm (1); 0,20 mm (1) |
| Installatietype | 2 | 1 | Zelfklevende installatie (2) |
| Armatuurtype | 2 | 2 | Tafel Lampen (1); Staande Lampen (1) |
| Materiaal van de behuizing | 2 | 2 | Staal, Glas (1); Staal (1) |
| Kleur van de behuizing | 2 | 2 | Messing Mat (1); Zwart (1) |
| Fitting | 2 | 1 | E27 (2) |
| Soort verlichtingsmiddel | 2 | 1 | E27 (2) |
| Watt | 2 | 2 | 1x 25W (1); 1x 60W (1) |
| Lichtbronnen | 2 | 1 | Exclusief (2) |
| Netspanning | 2 | 2 | 230V (1); 220-240V,50/60Hz (1) |
| Type schakelaar | 2 | 2 | Touch (1); Voetschakelaar (1) |
| IP Waarde | 2 | 1 | IP20 (2) |
| Beschikbare hoogtes | 1 | 1 | 230 / 270 / 320 / 400 cm (1) |
| Fabricagemethode | 1 | 1 | Jacquard, vlakgeweven (1) |
| Akoestische isolatie | 1 | 1 | 3 dB (1) |
| Eenheid/doos | 1 | 1 | 7 (1) |
| Dikte van de slijtlaag | 1 | 1 | 0,55 mm (1) |
| Installatie systeem (bekleding) | 1 | 1 | Klik (1) |
| Akoestisch | 1 | 1 | 21 dB (1) |
| Oppervlakteafwerking | 1 | 1 | ZUIVER (1) |
| Akoestisch isolatie | 1 | 1 | 3dB (1) |
| Snoerlengte | 1 | 1 | 1500mm (1) |
| Diameter | 1 | 1 | 90mm (1) |
| Veiligheidsklasse | 1 | 1 | 2 (1) |
| Lichtbronnen geschikt voor | 1 | 1 | A++ -B (1) |
