# Webshop-QA-audit Brunic: controle na de P2-oplossingen (vierde ronde)

- **Datum:** 02/11/2026 tot 03/11/2026, tests tussen 22:32 en 00:55 (CET)
- **Uitgevoerd door:** Claude (agent, alleen lezen en testen), in opdracht van Alexander
- **Opdracht:** `.agents/skills/webshop-qa-audit/SKILL.md`, volledige scope, getoetst aan `docs/filtersysteem.md` (§Gedrag en §Toonvariant). Controle op de punten uit `docs/audits/2026-10-31-webshop-qa-3/rapport.md`.
- **Map:** `docs/audits/2026-11-02-webshop-qa/`. Screenshots in `screenshots/` (gitignored, voorvoegsel `r4-`).

| Omgeving | Code | Catalogus | Hoe vastgesteld |
|---|---|---|---|
| **Productie** https://brunic.vercel.app, deployment `dpl_C3ofaUECgDuCuwErRaVTwqbkUGJ7` (bij het begin en aan het einde dezelfde) | `7484cc0` "Overdracht P2: link naar het labelvoorstel". Lokale `master`, `origin/master` en `git ls-remote` wijzen naar die commit. De site toont geen commit, dus dit is afgeleid. `git diff 6be782c 7484cc0` raakt enkel `docs/`, dus `6be782c` en `7484cc0` zijn op de site niet te onderscheiden. | `/api/status`: `{"ok":true,"shopify":true,"producten":4070,"catalogus":"Shopify-momentopname van 2026-11-02 21:27 · 4070 producten (4111 in Shopify, zelfde ontwerp samengevoegd) · 24 categorieën · 2 zonder gekoppelde collectie (niet getoond)"}`. Bij het begin en aan het einde identiek. | Alle 4.070 kaarten en variantprijzen op productie (`/api/producten`, zonder `live=1`) zijn identiek aan wat de code van `7484cc0` berekent op de lokale momentopname: **0 verschillen**. Ook de 174 producten die op een andere kleur openen zitten daarin, dus `6be782c` draait. |
| Lokaal (orakel) | Werkkopie `7484cc0`, enkel ingeladen in eigen scripts. Geen dev-server. | `apps/prototype/.data/shopify-catalogus.json` (02/11 19:35 UTC) | Zie hierboven. Het tijdstip verschilt van productie, de inhoud van kaarten en varianten niet. |

Er is niets gewijzigd aan code, data, beelden, koppelingen of Shopify. Er is niets gecommit of gepusht. De winkelmand, de kassa en de formulieren zijn niet aangeraakt. Hulpscripts staan in de scratchpad van deze sessie (`scratchpad/r4/`), ruwe uitvoer in `%TEMP%\brunic-qa\r4\`.

**Let op bij de metingen:** de wifi van de testmachine viel die avond meermaals weg (DNS-fouten, `ERR_NETWORK_CHANGED`). Elke test die daardoor mislukte, is opnieuw gedraaid. Tijdsmetingen zijn daardoor weinig betrouwbaar.

---

## Oud tegenover nieuw

| Punt | 31/10 (vorig rapport) | 02/11 (zelf gemeten op productie) | Oordeel |
|---|---|---|---|
| R3-01 lade met Tab | 3 van 95 elementen bereikbaar | 94 van 94, op volgorde, heen en terug, desktop en mobiel | **Opgelost** |
| R3-02 tapijten € 100–250 / meer dan € 250 | 31 / 4 | 124 / 80, gelijk aan mijn eigen telling per variant | **Opgelost** |
| R3-03 lege filtergroepen na een keuze | 398 | 0 (348 enkelvoudige keuzes, 1.112 lijsten in totaal) | **Opgelost** |
| R3-04 hover in een andere of onbekende kleur | 66 + 189 | 0 op basis van de koppelingen. Eén zichtbaar geval door een fout in Shopify (Toscana, R4-10). | **Opgelost** |
| R3-05 kaart en pagina op een ander beeld | 27 | Zonder filter 0 van 4.070. **Met filter: 20 producten bij Maat, 3 bij Vorm Organisch.** | **Deels** (R4-02, R4-04) |
| R3-06 meer tonen springt terug | vanaf de 2e klik | 3 klikken: pagina blijft staan, focus juist, desktop en mobiel | **Opgelost** |
| R3-08 "Op maat" in de optielade | bij elke keuze | weg | **Opgelost** |
| R3-16 "Op voorraad" | 2.642 producten | 0. Geen `availability` in de structured data (354 pagina's). | **Opgelost**, met één vraag (R4-11) |
| R3-19 Desso | 3 producten met een afwijkend merk | Overal Tarkett. Zoeken op "desso" vindt 97 producten, 3 niet. | **Opgelost**, klein restpunt (R4-09) |
| R3-21 kaart volgt de kleurfilter (andere kleur op de eerste pagina) | stoffen rood 31/35 · vloer rood 23/48 · tapijt blauw 27/35 · tapijt grijs 39/48 · behang blauw 4/48 | 0/35 · 0/48 · 0/35 · 0/48 · 0/48 | **Opgelost** |
| Kaart begint met een sfeerfoto / rolfoto (gelabeld) | 22 / 4 | 0 / 0 | **Opgelost** |
| Kleuren die met een rolfoto of sfeerfoto beginnen | 35 producten | 6 producten: 8 kleuren die niets anders hebben, 0 rolfoto's | **Sterk verbeterd** |
| Producten met een hoverbeeld | 3.329 | 3.705 (5 verloren, 380 gewonnen). Sfeerfoto 3.133 → 3.128, de rest is een detail of andere foto in dezelfde kleur. | Verbeterd |
| `test:filters` | 505 geslaagd | 525 geslaagd, 0 mislukt | In orde |
| **Nieuw na deze wijzigingen** | – | **4 P2-fouten:** 2 ontstaan door de toonvariant (R4-01, R4-02), 2 bestonden al maar zijn nu vastgesteld (R4-03, R4-04). Plus 6 P3-fouten, waarvan 2 door de toonvariant (R4-05, R4-06). | **Na te kijken** |

---

## 1. Oordeel

**Van de tien nagekeken punten zijn er negen opgelost, R3-05 deels.** Filteren, tellen en sorteren kloppen volledig: op 1.112 productielijsten met 79.251 kaarten en 43.930 tellingen vond ik geen enkele afwijking van mijn eigen, los van de code gerekende uitkomst. De lade werkt met het toetsenbord, "meer tonen" blijft staan, en de sfeerfoto, de voorraadtekst en Desso volgen de regels van de opdrachtgever.

**Er zijn wel nieuwe fouten, allemaal op kaarten met een filter, vooral bij tapijten. De eerste twee ontstaan door de toonvariant, de andere twee bestonden al:**

1. **R4-01 (P2):** klikt u op een staal, dan blijft de oude prijs op de kaart staan, zonder "vanaf", terwijl de link op een andere prijs opent. Voorbeeld: Rampur 0600 toont € 79, de productpagina € 49. Geldt voor 44 tapijten.
2. **R4-02 (P2):** bij een Maat-filter opent de kaart soms op een ronde of organische maat, terwijl ze een rechthoekig tapijt toont. Bij 20 producten van Louis De Poortere is de eerste foto op de pagina dan ook een andere.
3. **R4-03 (P2):** een gekozen staal blijft hangen na een kleurfilter als de toonvariant de standaardvariant is. Papercut blijft groen onder "Kleur: Blauw".
4. **R4-04 (P2):** bij Vorm Organisch beginnen 3 Lalee-kaarten met een sfeerfoto, terwijl er een productfoto is. Dat botst met de regel van de opdrachtgever.

**Bruikbaarheid:** zonder filter is de winkel beter dan op 31/10: elke kaart komt overeen met de productpagina en Boråstapeter oogt verzorgd. De nieuwe fouten blokkeren niets, want de productpagina toont altijd de juiste prijs en maat. Ze zitten wel precies in de filters waarmee een klant een tapijt zoekt. Daarom raad ik aan R4-01 tot R4-04 op te lossen vóór de stap naar Shopify.

---

## 2. Controle per punt, met de reproductiestappen van het vorige rapport

| Punt | Reproductie | Resultaat | Bewijs | Oordeel |
|---|---|---|---|---|
| **R3-01** | `/catalogus/vloerbekleding?weergave=producten`, Tab tot "Alle filters", Enter, 12× Tab. Daarna alle groepen open en Tab tot rond. | Tab: Sluiten → Enkel aanbiedingen → Type → de vier vinkjes → Kleur → Look → … Met alle 12 groepen open: 94 van 94 elementen, oplopend, 0 buiten de lade, en terug bij het begin. Shift+Tab idem. Spatie op een vinkje filtert en de focus blijft staan. Escape geeft de focus terug aan "Alle filters". Zelfde op 390 px. | `screenshots/r4-desk-lade-tab-summary.jpg` (focusring zichtbaar op "Merk"), `r4-mob-lade-tab-summary.jpg`, `b3.json` | **Opgelost** |
| **R3-02** | `…/tapijten?weergave=producten&prijs=100-250`, `&prijs=250-plus`, `&maat=170-240&prijs=100-250`. | Tot € 25: 7 · € 25–50: 60 · € 50–100: 94 · **€ 100–250: 124** · **meer dan € 250: 80**. Allemaal gelijk aan mijn eigen telling per variant. Rampur 0600 staat nu bij "Meer dan € 250" (vanaf € 259). De kaartprijs valt altijd binnen de gekozen klasse. **Correctie op het vorige rapport:** Rampur 0600 hoort niet bij `170-240 + 100-250`. De 160 × 230 cm telt als 160 breed, dus 120–170 (§Normalisatie). De maten van 200 breed kosten € 259 of meer. In `120-170 + 100-250` staat hij wel ("vanaf € 129"). | `r4-r3-02-tapijten-250plus.jpg`, `p6-log.txt` | **Opgelost** |
| **R3-03** | `…/vloerbekleding?…&type=vinylvloer`, `…/behang?…&type=fotobehang-op-maat`, `…/gordijnen-en-stoffen?…&type=passement`, `…/tapijten?…&type=vasttapijt`, en elke waarde van elke filter apart in de 4 afdelingen. | Knoppen bij vinyl: Type, Look, Rolbreedte, Prijs, Merk, Materiaal (Kleur is weg). Fotobehang: Type, Prijs, Merk. Passement: Type, Kleur, Merk, Materiaal, Eigenschappen. Vasttapijt: Type, Kleur, Prijs, Merk, Materiaal, Eigenschappen. **0 lege groepen** in 348 enkelvoudige lijsten en 1.112 lijsten in totaal. | `r4-desk-vinyl-geen-lege-kleur.jpg`, `p3-fouten.json` | **Opgelost** |
| **R3-04** | Zoek Strada, Arien, Les Best, Malaika en beweeg over de kaart. | Strada: kaart Cedar 22 (groen), hover groen tapijt. Arien: kaart 110 (grijsblauw), hover grijsblauwe gordijnen. Les Best: kaart 470 (rood), hover rood tapijt. Malaika: kaart 684 (licht), hover lichte gordijnen. Over de catalogus en in alle filterlijsten: **0 hovers in een andere kleur, 0 kleurloze hovers bij meerdere kleuren, 0 rolfoto's**. Visuele steekproef van 40 paren: in orde. Enige uitzondering: Toscana (R4-10, fout in Shopify). | `r4-r3-04-hover-*.jpg`, `r4-contact-hover.jpg`, `r4-contact-r4.jpg` | **Opgelost** |
| **R3-05** | Open Myrten en Fairplay Aqua via de kaart. Daarna elke kaart en elke filterlijst narekenen. | Myrten: kaart en pagina op dezelfde vlakke foto (5712). Fairplay Aqua: kaart en pagina op hetzelfde waterdessin. Zonder filter **0 van 4.070 verschillen**. **Met filter niet overal:** zie R4-02 en R4-04. | `r4-r3-05-*.jpg`, `r4-bewijs-maat-*.jpg` | **Deels** |
| **R3-06** | `/catalogus/behang?weergave=producten&sorteer=naam`, 3× "48 meer tonen". Ook bij `kleur=beige` op tapijten. | Desktop: scroll 5.670 → 5.670, 10.207 → 10.207, 14.743 → 14.743. Focus op het eerste nieuwe product (kaart 49, 97, 145). Geen stap in de geschiedenis, geen dubbels. Mobiel idem (9.087, 16.081, 23.076). | `b3.json` | **Opgelost** |
| **R3-08** | Optielade van `behang-ida-borastapeter` en `vloerkleed-papercut-louis-de-poortere`. | "Kies: Kleur \| 8178 \| 8179 …": geen "Op maat", geen "Op voorraad". | `r4-r3-08-optielade-*.jpg` | **Opgelost** |
| **R3-16** | Kaart en pagina van ESTAhome-behang, en de hele catalogus. | Kaart: "Online te bestellen" of "Advies en offerte in de winkel". Pagina: geen tekst. Structured data: `Offer` zonder `availability`. Steekproef van 354 pagina's: 0 keer `availability`, `InStock` of "Op voorraad". Alle 15.960 varianten staan in Shopify op beschikbaar. | `r4-r3-16-*.jpg`, `p10.json` | **Opgelost**, zie R4-11 |
| **R3-19** | Merk van de 3 producten, `/merken/desso`, `?merk=desso`, zoeken op "desso". | Kaart, kenmerken, meta-titel en structured data zeggen Tarkett. `/merken/desso` geeft 308 naar `/merken/tarkett`. `?merk=desso` selecteert Tarkett (chip "Merk: Tarkett", 159 producten). Zoeken op "desso": 97 producten, allemaal met merk Tarkett. Alle 100 Desso-producten: merk, kenmerk en filter = Tarkett. De beschrijving in Shopify zegt wel nog "… van Desso uit de collectie …", en `?merk=desso` blijft in de adresbalk staan tot de volgende filterklik (zoals R3-29). | `r4-desso-zoeken.jpg`, `p4.json` | **Opgelost**, zie R4-09 |
| **R3-21** | `/catalogus/gordijnen-en-stoffen?weergave=producten&kleur=rood` + de 4 andere lijsten uit het vorige rapport. Zelfde meting, nu op de kaarten die productie stuurt. | Telkens **0 kaarten in een andere kleurfamilie**. Bij stoffen rood zijn de kaarten ook echt rood (bekeken). De link opent op die kleur, de gekozen kleuren staan vooraan bij de stalen. | `r4-r3-21-stoffen-kleur-rood.jpg`, `p6-log.txt` | **Opgelost** |

---

## 3. Regels van de opdrachtgever

### Een sfeerfoto komt nooit eerst, tenzij er niets anders is

- **Zonder filter:** 0 kaarten met een gelabelde sfeer- of rolfoto vooraan (4.070 nagerekend). Op de 354 productpagina's staat er ook in de structured data en de og:image geen sfeerfoto vooraan.
- **Kleuren die niets anders hebben (toegelaten):** 8 kleuren in 6 producten beginnen met een sfeerfoto: Arien 193, Naran FR 200, Java Silver 90 en Marble 93, Sonrisa Beige 04 en Moss 28, Samira 38742, Indigo Garden 3133. Bij Sonrisa Beige 04 komt dat door een verkeerde koppeling in Shopify (R4-10).
- **Niet in orde:** bij Vorm Organisch beginnen 3 Lalee-producten met een sfeerfoto terwijl de kleur een productfoto heeft (R4-04).
- **Ongelabelde foto's visueel bekeken:** alle 235 kaarten met soort "overig" (`r4-contact-vinyl.jpg`, `r4-contact-borasov.jpg`). De 139 van Boråstapeter zijn allemaal dessins of muurprints. Van de 96 vinylkaarten (Beauflor, Tarkett, Gerflor) beginnen er **28 met een kamer**. Dat is het bekende geval (zie §4.4). De steekproef van gelabelde kaarten per merk (128 beelden, `r4-contact-gelabeld.jpg`) bevat geen enkele kamer.

### Nergens een voorraadbelofte

- **"Op voorraad" en `availability`:** 0 keer in de zichtbare tekst en de structured data (19 vaste pagina's, 354 productpagina's). `/aanbiedingen` zegt "zolang de voorraad strekt". Dat is een actievoorwaarde en bewust zo gelaten (`docs/agent-work/p2-audit-2026-10-31.md`).
- **Winkelmand:** niet getest in de browser. In de code is de tekst weg (`cart-view.tsx`, commit `ca53c01`).
- **Wel nog in de Shopify-data, zichtbaar op de pagina:** "Levertijd: 3 – 5 werkdagen" bij 31 vinylproducten en meer. Dat is geen voorraadtekst, maar wel een belofte (R4-11).
- **Enkel in de broncode van de pagina, niet zichtbaar:** de waarde `"availability":"op-voorraad"` in de pagina-data en in `/api/producten` (R4-19).

### Desso valt onder Tarkett en blijft vindbaar

- **Merk:** nergens nog "Desso" als merk: kaart, kenmerken, meta-titel, structured data, filter, `/merken` (geen tegel, geen link), sitemap. De slugs bevatten "desso" nog. Dat is afgesproken.
- **Vindbaar:** zoeken op "desso" geeft 97 producten en de suggesties werken. **3 Desso-tapijten worden niet gevonden** (Soft Sense II, Asteranne, Paradiso): in Shopify staan ze al op vendor Tarkett (R4-09).
- **Bekend:** teksten noemen "Desso en Tarkett" nog naast elkaar (`content.ts`, `categorie-teksten.ts`, `seo-text.tsx`). Bewust zo gelaten, zie `docs/agent-work/p2-audit-2026-10-31.md`.

---

## 4. Bevindingen

Legende. Soort: **F** = bevestigde fout · **T** = te verifiëren · **V** = verbeterpunt. Prioriteit: **P1** blokkeert kopen of vinden of toont foute informatie · **P2** duidelijk storend · **P3** afwerking. Pagina-URL's zijn relatief tot https://brunic.vercel.app. Logbestanden (`*.json`, `*-log.txt`) staan in `%TEMP%\brunic-qa\r4\`. Geen enkele bevinding is P1: de productpagina toont altijd de juiste prijs en maat vóór de klant bestelt.

### 4.1 Bevestigde fouten

| Prioriteit | Pagina/product/variant | Probleem | Verwacht gedrag | Vastgesteld gedrag | Bewijs en reproductiestappen | Voorgestelde oplossing |
|---|---|---|---|---|---|---|
| **P2** · R4-01 · nieuw | Tapijten met Kleur, Maat of Prijs: 44 producten (Lalee 36, Ragolle 8). Bv. `/catalogus/tapijten?weergave=producten&maat=tot-120&merk=ragolle`, Rampur 0600 | Na een klik op een staal blijft de prijs van de oude kleur staan. De kaart zegt niet "vanaf" en de link opent op een andere prijs. | Prijs, stalen en link komen uit één variant (§Toonvariant). Na een staal hoort de kaart de prijs van dat staal te tonen. | Rampur 0600: kaart "€ 79,00" (kleur 4747, 80 × 150). Staal 7272 aan: beeld en link wisselen, de kaart blijft "€ 79,00", de pagina opent op 67 × 140 cm **€ 49,00**. Omgekeerd kan ook: Ripley 0226 toont € 49, staal 6362 opent 133 × 195 cm **€ 119**, en dat is meteen buiten de gekozen Maat. 1.006 keer in de geteste lijsten, gemiddeld € 129 verschil, tot € 1.104. Ook het staal van de kaartkleur zelf kan een andere maat openen dan de kaart (7 Ragolle-producten): Rampur 0600 bij `maat=240-plus`: kaart "vanaf € 349" op Rond Ø 240, staal 4747 opent 240 × 300 cm € 369. Op mobiel hetzelfde: € 79 op de kaart, € 49 op de pagina. Zonder filter speelt het niet: de kaart zegt dan "vanaf". | `screenshots/r4-bewijs-staal-prijs-kaart.jpg`, `r4-bewijs-staal-prijs-pdp.jpg`, `r4-mob-staal-prijs.jpg`. Log `b5.json`, `p3-fouten.json` (e7, e8). Reproductie: open de URL, noteer de prijs, klik het tweede staal, klik de kaart. | **Code** `src/lib/catalog/listing.ts:104,115-118` en `src/components/catalog/product-card.tsx:60`: per staal ook prijs en "vanaf" meegeven en tonen als dat staal gekozen is. `eerste()` hoort dezelfde keuze te maken als de toonvariant (goedkoopste, niet de eerste). |
| **P2** · R4-02 · nieuw | Tapijten met een Maat-filter: 25 producten (Louis De Poortere 20, Ragolle 5). Bv. `/catalogus/tapijten?weergave=producten&maat=120-170`, Papercut | De kaart toont een rechthoekig tapijt, de link opent op een ronde of organische maat | Kaart en pagina tonen hetzelfde beeld (§Toonvariant). Wie geen vorm kiest, verwacht een gewone rechthoekige maat als die bestaat. | Papercut: kaart rechthoekig, pagina opent op "Maat: Rond Ø 140 cm" met de ronde foto, terwijl 140 × 200 cm ook aan de filter voldoet. Bij de 20 van Louis De Poortere verschilt de eerste foto (Rond of Organisch, volgens de klasse). Bij Ragolle is er geen ronde foto: Rampur 0600 bij `maat=240-plus` toont een rechthoek, "vanaf € 349", en opent op Rond Ø 240 cm met de rechthoekige foto. Bevestigd in de browser op desktop en mobiel. | `screenshots/r4-bewijs-maat-kaart-papercut.jpg`, `r4-bewijs-maat-pdp-papercut.jpg`, `r4-mob-maat-kaart-papercut.jpg`, `r4-mob-maat-pdp-papercut.jpg`, `r4-bewijs-maat-kaart-rampur.jpg`, `r4-bewijs-maat-pdp-rampur.jpg`. Lijst: §5.2. | **Code** `listing.ts:91-93`: de keuze kijkt niet naar de vorm. Bij op aanvraag is `bedrag` overal `Infinity`, dus wint de eerste variant in Shopify, en daar staat de ronde vóór 140 × 200. `listing.ts:99,109` neemt het beeld van de kleur (`view.ts:79-81`) in plaats van `imagesForVariant(toon)`. Zonder vormfilter rechthoekige varianten voorrang geven, en het beeld uit de toonvariant zelf halen. |
| **P2** · R4-03 · bestond al, oplossing dekt dit geval niet | Elke lijst met stalen, als de toonvariant ongewijzigd blijft. Bv. `/catalogus/tapijten?weergave=producten&merk=louis-de-poortere`, Papercut | Een gekozen staal blijft hangen na een kleurfilter | Een gekozen staal van de vorige filter blijft niet hangen (commentaar in `product-listing.tsx:242`). Onder "Kleur: Blauw" hoort de blauwe kaart. | Staal Sea Spray (groen) aan, daarna Kleur → Blauw: de kaart blijft groen, het staal blijft aan, de link opent op Sea Spray. Vers geladen toont dezelfde URL de blauwe Campanula. Oorzaak: blauw is de standaardkleur, dus `variantId` blijft leeg en de kaart wordt niet opnieuw opgebouwd. Bij Lorn GAL 300 en Rampur 0600, waar de toonvariant wel wisselt, gaat het goed. Verwijderen van een chip gaat ook goed. Na sorteren blijft het staal staan (geen tegenspraak, wel een keuze). | `screenshots/r4-bewijs-staal-hangt-1-gekozen.jpg`, `r4-bewijs-staal-hangt-2-na-filter-blauw.jpg`, `r4-desk-staal-blijft-hangen-d-papercut-louis-de-p.jpg`, `b2-desktop.json`, `b5b.json`. Reproductie: open de URL, klik het tweede staal, kies via "Alle filters" Kleur → Blauw. | **Code** `src/components/catalog/product-listing.tsx:243`: de sleutel van de kaart ook laten afhangen van de gekozen variantfilters, of `color` in `product-card.tsx:21` wissen zodra die filters wijzigen. |
| **P2** · R4-04 · bestond al, nu getoetst aan de regel | Vorm Organisch: Lech HEA 900, Lamego LNO 701, Lamego LNO 702 (Lalee). `/catalogus/tapijten?weergave=producten&vorm=organisch` | De kaart begint met een sfeerfoto terwijl de kleur een productfoto heeft | Een sfeerfoto komt nooit eerst, tenzij er niets anders is (§Beeldvolgorde). | Lech HEA 900 Amber: kaart = woonkamer, pagina begint op de productfoto. De productfoto toont al de organische vorm, dus er is geen reden om terug te vallen. Ook de staalbolletjes zijn dan miniatuurkamers, en het hoverbeeld is dezelfde foto (geen wissel). 20 keer in de geteste lijsten. Zonder de filter is de kaart in orde. | `screenshots/r4-bewijs-organisch-sfeer-kaart.jpg`, `r4-bewijs-organisch-sfeer-pdp.jpg`, `r4-contact-r4.jpg` (#13–#18) | **Code** `src/lib/catalog/view.ts:110-114` en `listing.ts:99`: bij `perKleur` sfeerfoto's overslaan als de kleur een andere foto heeft. **Shopify (alternatief):** de variantfoto van de Pebble-maat op de productfoto zetten, dan krijgt die het vormlabel. |
| **P3** · R4-05 · deels nieuw | Lijst over één vorm met een extra filter: 19 producten. `/catalogus/tapijten/rond?weergave=producten&maat=120-170` (POP), en de stalen buiten de filter bij `/catalogus/tapijten/rond?…&kleur=grijs` | De kaart toont de foto in die vorm, de link opent op een andere vorm | "Lijst over één vorm: de kaart toont de foto in die vorm en linkt naar een maat in die vorm" (§Toonvariant) | POP bestaat rond enkel in Ø 240 (maten 100 × 140 tot 280 × 390, plus Rond Ø 240). Bij 120–170 toont de kaart de ronde tijger, de pagina opent op 140 × 200 cm met de rechthoekige tijger. Stalen in een kleur buiten de filter: ronde foto op de kaart, de link gaat naar een rechthoekige maat. | `screenshots/r4-bewijs-rondlijst-maat-kaart.jpg`, `r4-bewijs-rondlijst-maat-pdp.jpg`, `p3-fouten.json` (c, e6) | **Code** `listing.ts:73-74,84,99,116-117`: de vormfoto enkel gebruiken als de toonvariant echt die vorm heeft. Stalen buiten de filter naar een maat in die vorm laten wijzen. Of het product uit de lijst laten als het die vorm niet heeft in die maat. |
| **P3** · R4-06 · nieuw | Kaarten met "+N" onder een filter. Bv. `…/gordijnen-en-stoffen?weergave=producten&kleur=rood`, Koren | "+N" opent op de standaardkleur, de kaart op de gekozen kleur | Beide openen op dezelfde kleur | Koren: titel → `?variant=59006014783820` (rood), "+42" → zonder variant (kleur 00). | `b5.json` (+N-link) | **Code** `product-card.tsx:86`: `routes.product(product.slug, chosen?.variantId ?? product.variantId)`. |
| **P3** · R4-07 · nieuw | Filterlade, uitvinken van een gekozen waarde met aantal 0. Bv. `/catalogus/tapijten?weergave=producten&kleur=roze&vorm=loper` | De focus valt weg uit de lade | "Verdwijnt het element met de focus, dan gaat de focus naar …" (§Toegankelijkheid). In een open lade hoort ze in de lade te blijven. | Spatie op Loper (0): de waarde verdwijnt, `activeElement` is `BODY`, de lade blijft open. De volgende Tab gaat naar "Sluiten", dus de klant verliest zijn plaats. Niet erg, wel storend met een schermlezer. | `b7.json` | **Code** `src/components/catalog/product-listing.tsx:117-122` geldt enkel voor de filterbalk. In de lade de focus op de summary van die groep zetten. |
| **P3** · R4-08 · nieuw | Oude Boråstapeter-URL's: `/product/behang-olivtr-d-borastapeter`, `behang-citrontr-d-…`, `behang-bl-regn-…`, `behang-dahliadr-m-…`, `behang-rtag-rd-…` | 404 in plaats van een doorverwijzing | Een hernoemd product blijft bereikbaar via de oude link | Alle 5: HTTP 404, de nette pagina "Deze pagina bestaat niet (meer)". De nieuwe URL's geven 200, staan in de sitemap, de oude niet. De redirect in Shopify geldt niet voor deze site. Er zijn geen interne links en geen koppeling in `oude-urls.json` die er nog naar verwijzen. De site is niet live, dus enkel gedeelde links op het prototype raken. | `screenshots/r4-boras-oude-url-404.jpg`, `p4.json` | **Code** `next.config.ts` (`redirects()`): 5 regels met `permanent: true`. Vóór livegang doen, of bewust laten. |
| **P3** · R4-09 · bekend (overdracht) · regel opdrachtgever | Soft Sense II AC27, Asteranne A411, Paradiso AB69 | Niet vindbaar op "desso" | "Zoeken op Desso blijft werken" (§Submerken) | `/zoeken?q=desso`: 97 producten, zonder deze 3. `Paradiso desso` geeft 0 producten. De eigen naam vindt ze wel. In Shopify staat de vendor al op Tarkett, dus `merkBron` is leeg. | `screenshots/r4-desso-zoeken.jpg`, `p4.json`. Telling: 100 Desso-producten, 97 gevonden. | **Shopify:** vendor van deze 3 terug op Desso (dan loopt alles automatisch). Of **code** `shopify-adapter.ts:386`: `merkBron` ook zetten als de slug op `-desso` eindigt. |
| **P3** · R4-10 · nieuw (zelfde soort als R3-18) · data | 15 producten waar de foto aan een andere kleur hangt dan de alt-tekst zegt. Bv. `vasttapijt-toscana-b592-desso` | De variantfoto in Shopify wijst naar de foto van een andere kleur | Elke kleur toont haar eigen foto | Toscana B592: de site zet de foto met alt "kleur 710" (rood) bij kleur 729, en de echte foto van 729 is blauw. De kaart opent op 729: **rood op de kaart, blauw bij hover**. Kleur 710 heeft geen foto. Sonrisa Beige 04: de productfoto hangt aan Bric 87, daardoor begint Beige 04 met een sfeerfoto. Volledige lijst: §5.3. | `screenshots/r4-bewijs-toscana-kaart.jpg`, `r4-bewijs-toscana-hover.jpg`, `r4-contact-twijfel.jpg` (#1, #3), `altkleur.json` | **Shopify:** de variantfoto van deze kleuren rechtzetten. De code volgt dan vanzelf. |

### 4.2 Te verifiëren

| Prioriteit | Pagina/product/variant | Probleem | Verwacht gedrag | Vastgesteld gedrag | Bewijs en reproductiestappen | Voorgestelde oplossing |
|---|---|---|---|---|---|---|
| **P2** · R4-11 · nieuw · regel opdrachtgever | 31 vinylproducten (Beauflor 15, Tarkett 16). Bv. `/product/vinyl-bacopa-moonlight-cobble-beauflor` | "Levertijd: 3 – 5 werkdagen" (of "7 werkdagen") in de kenmerken en in de beschrijving | Geen belofte die de data niet waarmaakt. Er is geen ERP gekoppeld. | De tekst staat twee keer op de pagina. Komt uit `brunic.specificaties` en de beschrijving in Shopify. Ook: Goodnight (Artelux) "heeft een korte levertijd", en 9 Boråstapeter-producten (Nordic Folk) "Leverbaar tot (volgens leverancier): 12/26". Of Brunic dit mag beloven, kan ik uit de data niet afleiden. | `screenshots/r4-levertijd-pdp.jpg`, lijst in §5.4, `b7.json` | Navragen bij Brunic. Mag het niet: in Shopify uit de specificaties en de beschrijving halen. Of **code** in de adapter het label "Levertijd" overslaan. |
| **P3** · R4-12 · nieuw · data | Mehari 0474 (Rond Ø 200 cm **€ 80**, terwijl 120 × 170 cm € 129 kost). Rampur 0600 (Rond Ø 120 € 86,99, Rond Ø 160 € 159,60, terwijl alle andere prijzen van Ragolle en Lalee ronde bedragen zijn). | Prijzen die uit de toon vallen | Correcte prijzen | Geen doorstreepte prijs erbij. Door de toonvariant vallen ze meer op: Mehari staat "vanaf € 80" in lijsten en opent bij `kleur=beige` op die ronde maat. | `p6-log.txt`, `p12-klein-log.txt` | Prijs nakijken in Shopify. Mehari is de enige in de catalogus waar een veel grotere maat duidelijk goedkoper is. |
| **P3** · R4-13 · nieuw · data | Boråstapeter: Noras ang, Skogsstjarna, Solangen, Tradgardsfrojd, Poeme d'amour | Namen die Zweedse of Franse tekens lijken te missen | Zelfde lijn als Citronträd, Örtagård | Niet afgekapt zoals de vijf die rechtgezet zijn, maar "Noras ang" lijkt "Noras äng", "Skogsstjarna" "Skogsstjärna". Niet met de leverancier gecontroleerd. | `p14-namen-log.txt` | Nakijken met de leverancier. |
| **P3** · R4-14 · nieuw | Samira (`behang-samira-borastapeter`): kaart 38743 is bijna wit, geen hover | Kaart oogt leeg | Kleur en structuur herkenbaar | De kaart toont een bijna witte vlakke foto. De sfeerfoto hangt aan 38742, dus geen hoverbeeld. Volgens het script klopt de koppeling ("kleur 38743 is bijna wit"). Standaardvariant 38743 is gekozen omdat 38742 enkel een sfeerfoto heeft. | `screenshots/r4-contact-opener.jpg` (#76–#78) | Beoordelen of een vlakke foto van 38742 of een sfeerfoto van 38743 bestaat. |

### 4.3 Verbeterpunten

| Prioriteit | Pagina/product/variant | Probleem | Verwacht gedrag | Vastgesteld gedrag | Bewijs en reproductiestappen | Voorgestelde oplossing |
|---|---|---|---|---|---|---|
| **P3** · R4-15 · nieuw | Elke gedeelde link of harde herlading met `?variant=`. Bv. `/product/vloerkleed-papercut-louis-de-poortere?variant=59007608521036` | De pagina toont eerst de standaardkleur en wisselt pas na het laden | Meteen de gevraagde kleur | Papercut: eerst foto `…9b0a90fcd4` (blauw), dan `…8c2e4cbf3f` (groen). Mobiel, CPU 4× trager: 370–460 ms. Bij het trage netwerk van die avond op desktop 2,2–2,4 s. Vanuit de lijst (client-navigatie) geen flits: de eerste foto is meteen die van de kaart. Enkel als die navigatie op een harde herlading uitdraait, zoals tijdens de netwerkstoring (Koren en Hidden op mobiel), blijft de standaardkleur langer staan. Omdat filterkaarten nu altijd zulke links hebben, zien meer klanten dit bij delen of herladen. | `b6.json`. Oorzaak: `src/components/product/product-view.tsx:82-85`, en de opmerking bovenaan dat bestand (bewuste keuze, B02). | De server de variant laten renderen via `searchParams`, zonder de hele pagina dynamisch te maken. Of de galerij pas tonen als de variant bekend is, enkel als er `?variant=` in de URL staat. |
| **P3** · R4-16 · nieuw | Vloerbekleding, Rolbreedte. Bv. `/catalogus/vloerbekleding?weergave=producten&rolbreedte=400-cm` | Rolbreedte valt buiten de toonvariant | De link opent bij voorkeur op de gekozen breedte | Rolbreedte is een productfilter (dat staat zo in de specificatie, enkel Kleur, Maat, Vorm en Prijs gelden per variant). In 616 gevallen (product × breedte) opent de pagina op een andere breedte. 9 van de 610 combinaties kleur × breedte bestaan niet als variant, bv. Florida Groen + 300 cm. | `p11-vorm-log.txt` | Rolbreedte toevoegen aan `VARIANT_FACETS` (`filters.ts:180`), of laten zoals het is en opnemen bij §Beperkingen. |
| **P3** · R4-17 · nieuw | Productpagina: og:image en eerste foto in de structured data | Niet hetzelfde beeld als de kaart | Eerste beeld = standaardvariant | In de steekproef 52 van de 354: een andere kleur dan de kaart (geen sfeerfoto). Bv. Fjord (Artelux). | `p10.json`. `src/app/(winkel)/product/[slug]/page.tsx:36`, `src/lib/site/seo.ts:176` | `imagesForVariant(p, standaardVariant(p))` gebruiken. |
| **P3** · R4-18 · nieuw | Hover van soort "overig" bij stoffen: 25 kaarten (Artelux 18, Loft79 7). Bv. Vlier, Populier (Artelux), portland (Loft79) | In de steekproef is het hoverbeeld een smalle strook stof op wit, geen interieur | Hover = interieur, anders blijft de foto staan (kader §3 van de opdracht) | §Hoverbeeld in de specificatie laat het toe ("liefst een sfeerfoto"). Oogt wel minder verzorgd dan de gordijnfoto's van ADO (`detail`), die goed werken. Bij vinyl (40 kaarten "overig") is dat geen probleem. 3 van de 25 bekeken. | `screenshots/r4-contact-hover.jpg` (#58, #70, #72), `r4-contact-ado.jpg` | In `hoverVoor` (`product.ts:97-107`) die stroken overslaan, of ze in Shopify een eigen label geven. |
| **P3** · R4-19 · nieuw | Broncode van elke lijst en productpagina, `/api/producten` | De interne waarde `availability: "op-voorraad"` staat in de pagina-data | Geen belofte die een machine kan lezen | Niet zichtbaar voor de klant en geen schema.org. Een scraper of AI-overzicht kan het wel lezen. 354 van 354 pagina's in de steekproef. | `p10.json`. `shopify-adapter.ts:336`. | Waarde hernoemen naar bv. `beschikbaar`. |

### 4.4 Bekend, niet als nieuwe bevinding geteld

- **Vinyl, 117 ongelabelde interieurfoto's:** nog niet in Shopify, dus **28 vinylkaarten beginnen nog met een kamer**. Zelf geteld op `r4-contact-vinyl.jpg`: ook 28. Bv. Bacopa Moonlight Cobble, Bennet Spectrum Solid, Tia Cosmo Clay, Trude.
- **P3-punten uit het vorige rapport, niet aangepakt en nog aanwezig:** R3-07 ("1 van 1 producten"), R3-09 (Art.nr. bij Lalee en Ragolle), R3-10 (header bij 1280 px: 7 px overflow), R3-11 ("Totaal voor 1 rollen"), R3-12 (kleverige hover op touch), R3-13 (`kleur=Multicolor` geeft 0), R3-14 (zoekkop 382, lijst 333), R3-18, R3-20, R3-23, R3-24, R3-25, R3-26, R3-27, R3-28 (groep met één waarde: 1.683 keer in de 1.112 lijsten), R3-29.
- **P3-punten die door dit werk wel verbeterden:** R3-15 (Boråstapeter is rechtgezet, Loft79 nog 45 van de 66 titels in kleine letters), R3-17 (35 → 6 producten), R3-22 (26 → 0).

---

## 5. Fotoproblemen per product

Beelden zelf bekeken: contactbladen `screenshots/r4-contact-*.jpg` en de bewijs-screenshots. Alle beeld-URL's beginnen met `https://cdn.shopify.com/s/files/1/1072/8662/6636/files/`, hieronder `…/`.

### 5.1 Steekproef per product

| Product (titel + slug) | Variant/kleur | Pagina-URL | Standaardbeeld-URL | Hoverbeeld-URL | Screenshot | Oordeel | Voorstel |
|---|---|---|---|---|---|---|---|
| Toscana B592 (`vasttapijt-toscana-b592-desso`) | kaart 729, foto is volgens de alt-tekst 710 (rood), hover is de echte 729 (blauw) | /product/vasttapijt-toscana-b592-desso | …/vasttapijt-toscana-b592-desso-a275158a63.jpg | …/vasttapijt-toscana-b592-desso-caa208aed4.jpg | r4-bewijs-toscana-*.jpg, r4-contact-twijfel.jpg | fout (visueel bevestigd) | Shopify: variantfoto 710 → a275158a63, 729 → caa208aed4 |
| Lech HEA 900 (`vloerkleed-lech-hea-900-lalee`) | Amber, bij Vorm Organisch | /catalogus/tapijten?weergave=producten&vorm=organisch | …/lech-hea-900-amber-01-sfeerfoto.jpg (pagina: …/lech-hea-900-amber-05-productfoto.jpg) | gelijk aan de kaart | r4-bewijs-organisch-sfeer-*.jpg | fout (regel opdrachtgever) | R4-04 |
| Lamego LNO 701 (`vloerkleed-lamego-lno-701-lalee`) | Beige, bij Vorm Organisch | idem | …/lamego-lno-701-beige-01-sfeerfoto.jpg (pagina: …/lamego-lno-701-beige-04-productfoto.jpg) | gelijk aan de kaart | r4-contact-r4.jpg #15–16 | fout | R4-04 |
| Lamego LNO 702 (`vloerkleed-lamego-lno-702-lalee`) | Ivoor-zilver, bij Vorm Organisch | idem | …/lamego-lno-702-ivoor-zilver-01-sfeerfoto.jpg (pagina: …/lamego-lno-702-ivoor-zilver-05-productfoto.jpg) | gelijk aan de kaart | r4-contact-r4.jpg #17–18 | fout | R4-04 |
| Papercut (`vloerkleed-papercut-louis-de-poortere`) | Campanula 9358, bij Maat 120–170 | /catalogus/tapijten?weergave=producten&maat=120-170 | …/vloerkleed-papercut-louis-de-poortere-9b0a90fcd4.webp (pagina: …-2725b53366.webp, rond) | …-31b1763ddc.webp | r4-bewijs-maat-*-papercut.jpg | fout | R4-02 |
| POP (`vloerkleed-pop-louis-de-poortere`) | Green On Fire, bij Rond + 120–170 | /catalogus/tapijten/rond?weergave=producten&maat=120-170 | …-7c71bc32d3.webp (rond; pagina: …-656276a84f.webp, rechthoekig) | – | r4-bewijs-rondlijst-maat-*.jpg | fout | R4-05 |
| Samira (`behang-samira-borastapeter`) | kaart 38743, geen hover | /product/behang-samira-borastapeter | …/behang-samira-borastapeter-df59b04296.jpg | geen | r4-contact-opener.jpg #76–78 | te verifiëren | R4-14 |
| Sonrisa (`vasttapijt-sonrisa-associated-weavers`) | Beige 04 begint met een sfeerfoto, de productfoto hangt aan Bric 87 | /product/vasttapijt-sonrisa-associated-weavers | …/vasttapijt-sonrisa-associated-weavers-ef570f0264.jpg (kaart: Moonbean 05, in orde) | …-b0985a9406.jpg | r4-contact-opener.jpg #70–72 | te verifiëren (koppeling) | Shopify: …-d17c807b25.jpg aan Beige 04 |
| Vlier (`gordijnstof-vlier-artelux`) | 01, hover = smalle strook | /product/gordijnstof-vlier-artelux | …/gordijnstof-vlier-artelux-b793a7a2b3.jpg | …/gordijnstof-vlier-artelux-127d592856.jpg | r4-contact-hover.jpg #71–72 | te verifiëren (kwaliteit) | R4-18 |
| Populier (`gordijnstof-populier-artelux`) | 01, hover = smalle strook | /product/gordijnstof-populier-artelux | …/gordijnstof-populier-artelux-ce5aa02bbe.jpg | …/gordijnstof-populier-artelux-5a2f114092.jpg | r4-contact-hover.jpg #69–70 | te verifiëren (kwaliteit) | R4-18 |

**In orde in de steekproef:**
- **De 174 producten die op een andere kleur openen** (Artelux 43, Lano 37, Loft79 36, Beauflor 19, Balsan 17, Boråstapeter 11, ADO 6, AW 4, Tarkett 1). Geteld: 174. Steekproef van 40 bekeken op `r4-contact-opener.jpg`: kaart en hover in dezelfde kleur, op Toscana na. Prijs niet gewijzigd: bij 0 van de 174 opent de pagina op een andere prijs dan de eerste kleur. Bij Java en Sonrisa is de kaart nu vlak, vroeger een kamer. Ook Strada en Les Best tonen nu meteen hun kleur met de passende hover. Enig nadeel: de eerste kleur is soms minder neutraal (Les Best opent op rood), en dat is een smaakkeuze.
- **Hover:** 36 kaarten in 6 lijsten: wisselt en keert terug, hoogteverschil 0. `Hidden` bij kleur rood heeft geen hover in die kleur en blijft staan, correct.
- **ADO met kleurloze sfeerfoto:** hover is nu de gordijnfoto in dezelfde kleur (`r4-contact-ado.jpg`). Dat werkt goed.
- **Gelabelde eerste beelden per merk:** 128 bekeken, allemaal vlakke foto's.

### 5.2 Producten bij R4-02 (kaart rechthoekig, pagina rond of organisch)

Louis De Poortere, 20 producten met een ander eerste beeld: Ribbon, Coral, Baobab, Sakura, Berber, Kanji, Papercut, Virgin Land, Jacob's Ladder, Griff, Cracks, Streaks, Lagoon, Drop, Sol, POP, Module, Shapes, Fresque, Sendai. Bij 120–170 en vanaf 240 opent "Rond". Bij 170–240 opent "Organisch 170 × 235 cm" als het product die maat heeft (Ribbon, Coral, Baobab, Sakura, Berber, Kanji).

Ragolle, 5 producten met dezelfde foto maar een ronde maat: Rampur 0600, Rampur 0098, Rampur 0477, Mehari 0474, Ripley 0034.

### 5.3 Foto hangt aan een andere kleur dan de alt-tekst (R4-10)

Berekend op de data. Enkel Toscana is visueel bevestigd. De andere zijn te verifiëren.

| Product (slug) | Bestand | Alt-tekst zegt | Hangt aan |
|---|---|---|---|
| `vasttapijt-toscana-b592-desso` | …-a275158a63.jpg | 710 | 729 |
| `vasttapijt-sonrisa-associated-weavers` | …-d17c807b25.jpg | Beige 04 | Bric 87 |
| `vasttapijt-soft-distinction-lano` | …-73b3e056d8.jpg | Teal Grey 0874 | Greystone 0842 |
| `vasttapijt-zen-lano` | …-6eadd915bb.jpg | Heather 1 061 | Muscat 4 164 |
| `gordijnstof-moonglaze-blackout-fr-ado` | …-fbdbcafa1e.jpg | 575 | 775 |
| `gordijnstof-largo-ado` | …-c4783dbc5e.jpg | 110 | 112 |
| `gordijnstof-waterlily-ado` | …-5e00f5e751.jpg | 383 | 995 |
| `gordijnstof-pigmentdruk-ado` | …-cd1f447277.jpg | 200 | 381 |
| `gordijnstof-vitrage-3033-ado` | …-7c9a8aad24.jpg | 11 | 13 |
| `gordijnstof-uni-3173-ado` | …-a6214043e8.jpg | 20 | 92 |
| `gordijnstof-uni-3174-ado` | …-8c7ae048ec.jpg | 20 | 75 |
| `passement-macrame-onderrand-4623-ado` | …-ab52635f6b.jpg | 12 | 13 |
| `passement-boord-4625-ado` | …-84bcc35d6a.jpg | 12 | 13 |
| `passement-macrame-inzetstuk-4624-ado` | …-81c13716e7.jpg | 12 | 13 |
| `passement-macrame-boord-4794-ado` | …-a7b2986763.jpg | 12 | 13 |

Bij de drie passementen (Boord 4625, Inzetstuk 4624, Boord 4794) en Toscana raakt het de kaart. Dat verklaart ook R3-18.

### 5.4 Levertijd in de kenmerken (R4-11)

31 productpagina's met het kenmerk "Levertijd" (Beauflor 15, Tarkett 16, waarden "3 – 5 werkdagen" en "7 werkdagen"): vinyl-bacopa-moonlight-cobble-beauflor · vinyl-bacopa-moonlight-daisies-beauflor · vinyl-bacopa-moonlight-street-beauflor · vinyl-barinas-inspire-modena-beauflor · vinyl-beau-liana-beauflor · vinyl-bennet-spectrum-solid-beauflor · vinyl-bente-turbo-lancaster-beauflor · vinyl-birgit-supreme-montreal-beauflor · vinyl-birgit-supreme-zurich-beauflor · vinyl-bonita-blacktex-col-oak-beauflor · vinyl-bonita-cosytex-spanish-oak-beauflor · vinyl-bonita-massif-iris-beauflor · vinyl-bonita-quintex-havana-oak-beauflor · vinyl-bonita-texstyle-havana-oak-beauflor · vinyl-bonita-texstyle-water-oak-beauflor · vinyl-dj-black-uni-tarkett · vinyl-gebroken-steen-tarkett · vinyl-kindervinyl-trude-tarkett · vinyl-light-grey-uni-tarkett · vinyl-rock-grey-black-uni-tarkett · vinyl-ster-zaragoza-tegel-tarkett · vinyl-stylish-concrete-grey-tarkett · vinyl-tara-arcadia-middle-grey-tarkett · vinyl-tia-cosmo-clay-tarkett · vinyl-tia-legacy-oak-grey-tarkett · vinyl-tia-selene-light-grey-tarkett · vinyl-tila-derby-grege-tarkett · vinyl-tila-tegel-34cm-x-34cm-grijs-tarkett · vinyl-trude-tarkett · vinyl-trude-kinder-vinylvloer-tarkett · vinyl-visgraat-parket-tarkett.

Ook: `gordijnstof-goodnight-artelux` ("Deze stof heeft een korte levertijd") en 9 Boråstapeter-producten uit Nordic Folk ("Leverbaar tot (volgens leverancier): 12/26"): Noras ang, Skogsstjarna, Nyponros, Isolde, Hedda, Idun, Tuva, Solangen, Arboretum.

---

## 6. Boråstapeter: nieuwe foto's en namen

| Naam | Nieuwe URL | Oude URL | Kaart en pagina | Zoeken |
|---|---|---|---|---|
| Citronträd | /product/behang-citrontrad-borastapeter: 200 | /product/behang-citrontr-d-borastapeter: **404** | titel, h1, meta-titel en structured data correct, kaart = eerste foto | "Citronträd" en "citrontrad": gevonden |
| Olivträd | /product/behang-olivtrad-borastapeter: 200 | /product/behang-olivtr-d-borastapeter: **404** | idem | "Olivträd", "Olivtrad", ook "Olivtr d": gevonden |
| Blåregn | /product/behang-blaregn-borastapeter: 200 | /product/behang-bl-regn-borastapeter: **404** | idem | "Blåregn", "blaregn", "blå regn": gevonden |
| Dahliadröm | /product/behang-dahliadrom-borastapeter: 200 | /product/behang-dahliadr-m-borastapeter: **404** | idem | "Dahliadröm", "dahliadrom": gevonden |
| Örtagård | /product/behang-ortagard-borastapeter: 200 | /product/behang-rtag-rd-borastapeter: **404** | idem | "Örtagård", "ortagard": gevonden |

- **Namen:** geen enkele rest van de oude schrijfwijze in titel, handle, beschrijving, specificaties of alt-tekst (`p14`). Enkel oude bestandsnamen in de CDN-URL's, onzichtbaar voor de klant.
- **Foto's (25 producten uit de fotoronde, per kleur eerste beeld en sfeerfoto bekeken op `r4-contact-boras.jpg`):**
  - Elke kleur begint nu met een vlakke foto, met 2 uitzonderingen zonder andere foto: Samira 38742, Indigo Garden 3133.
  - De sfeerfoto hoort telkens zichtbaar bij dat dessin en die kleur. Bv. Citronträd 5703 (donkerblauw) met donkere muur.
  - Geen rolfoto meer vooraan, geen dubbele foto's.
  - Enkel Zen 4731 en Samira 38743 ogen bijna leeg, omdat het dessin zo licht is (R4-14).
- **Oude staalbolletjes:** de stalen op de kaart tonen nu het dessin in plaats van een rol.
- **Alle 495 Boråstapeter-producten:** kaart met label "detail" 258, "product" 98, "overig" 139. Alle 139 "overig" bekeken: dessins of muurprints, geen kamer. Kleuren met een rolfoto vooraan: 0.
- **Resolutie:** de nieuwe foto's zijn 700–1.000 px breed. De oudere sfeerfoto's zijn vaak 450–600 px (882 van de 3.574 Boråstapeter-foto's onder 600 px). Op de grote foto van de productpagina (±790 px) is dat zichtbaar. Geen fout, wel iets om te onthouden als er scherpere versies bestaan.

---

## 7. Geteste onderdelen

### 7.1 Volledig uitgevoerd (hele catalogus)

- **Kaarten productie tegenover de code:** 4.070 producten via `/api/producten`, 0 verschillen.
- **Eigen model tegenover 1.112 productielijsten** (GET, `pagina=999`, alle kaarten): elke waarde van elke filter in de 4 afdelingen (348), alle paren kleur × maat, kleur × prijs, maat × prijs, vorm × kleur, vorm × maat, vorm × prijs bij tapijten, kleur × prijs bij vloer en behang (436), 60 keer drie filters, 40 keer vier filters, 76 keer meerdere waarden, 20 gemengd, 26 sorteringen op prijs, 48 op subcategorieën en vormlijsten, 60 op zoeken, aanbiedingen, nieuw binnen en merken.
  - **Het model staat los van de code van de filters:** het rekent zelf per variant (OF binnen, EN tussen), maatklasse uit de maattekst (0 verschillen met de site), prijsklasse uit de prijs. Enkel de eerste foto op de pagina komt uit `imagesForVariant`, dezelfde functie als de pagina, en die is in de browser nagekeken.
  - **79.251 kaarten:** toonvariant voldoet aan de filter, kaartprijs = prijs achter de link, de laagste in die kleur, "vanaf" klopt, prijs in de gekozen klasse, hover in de kleur van de kaart, eerste staal = kleur van de kaart, staal-link in de juiste kleur, gekozen kleuren vooraan: **0 fouten**. Enkel de fouten in §4 (kaartbeeld, staalprijs, staal-link).
  - **43.930 tellingen in de filters: 0 afwijkingen**, ook bij combinaties. Totaal en leden van de lijst: 0 afwijkingen. Sortering op prijs: 26 lijsten oplopend en aflopend, 0 fouten, op aanvraag altijd achteraan.
  - Geen lege groepen, geen labels die een ID zijn, gekozen waarden blijven altijd staan.
- **Beeld-URL's:** 20.975 unieke kaart-, hover-, staal- en vormbeelden, plus alle Boråstapeter-foto's, met HEAD, max. 8 tegelijk: **0 problemen** (1.088 mislukten door de netwerkonderbreking en zijn daarna opnieuw geslaagd).
- **`test:filters`:** 525 geslaagd, 0 mislukt (`%TEMP%\brunic-qa\r4\test-filters.txt`).
- **Voorraadwoorden in de Shopify-data, koppelingen foto ↔ kleur, prijzen per vorm, hoverbeelden, standaardvariant:** alle producten.

### 7.2 In de browser (headless Chrome 156 via CDP, productie)

Desktop 1366×900, mobiel 390×844 met touch.

- **Kaart → productpagina → terug:** 18 lijsten: kleur, maat, vorm en prijs apart en samen, meerdere waarden, sortering op prijs, vormlijst, vinyl, behang, vasttapijt, zonder filter. Telkens kaarten aangeklikt, de pagina gelezen en teruggegaan. **Desktop 95 kaarten, mobiel 63.** Titel, link en prijs: 158 van 158 gelijk (bij "vanaf" opent de pagina op die prijs). Eerste foto: 8 verschillen door R4-02. Daarnaast 2 keer op mobiel (Koren, Hidden) de standaardkleur tijdens een netwerkstoring. Opnieuw getest in orde, dat is het gedrag van R4-15. Na "terug": URL, filters en aantal kaarten behouden.
- **Na "meer tonen":** kaart 56 van 3 lijsten, op desktop en mobiel: beeld, prijs en maat kloppen. Na terug staat `pagina=2` in de URL, de 96 kaarten staan er nog, de kaart is ongewijzigd.
- **Toetsenbord:** R3-01, focus op chip, Escape, spatie, op desktop en mobiel (§2).
- **Staal, sorteren, filter, terug:** het hangende staal (R4-03) is gereproduceerd op desktop en mobiel. Staal → pagina → terug: het staal is weg, de kaart toont weer de toonvariant. Staal + sorteren: het staal blijft. Staal + chip weg: het staal is weg.
- **Hover:** 36 kaarten in 6 lijsten (geen filter, kleurfilter, behang, vinyl, vasttapijt): wisselt, keert terug, Δh = 0. Geen consolefouten, geen mislukte verzoeken buiten het netwerkprobleem.
- **Herhaling van de scenario's uit het vorige rapport:**
  - **S1:** 39 lijstpagina's op desktop, 18 op mobiel. Totaal, volgorde van de kaarten en de 6 filterknoppen zijn gelijk aan de code. Geen overflow, geen consolefouten (behalve de bekende preload-waarschuwing, R3-27), geen mislukte verzoeken. Raamdecoratie, Verf en Slapen & wonen geven 404 en staan niet in het menu.
  - **S2:** 40 van de 40 filterstappen zijn identiek: OF, EN, Eigenschappen-EN, zoeken in een lange lijst, sorteren, meer tonen, chip weg, terug, vooruit, herladen, alles wissen, lege combinatie, snel klikken, oude links, gemengde lijst.
  - **S4 en S4b (mobiel):** lade openen, vegen, kiezen, "Toon N producten", chips, alles wissen. Staal tikken navigeert niet. Galerij vegen, lightbox met knoppen, variantlade, maatlade, menu. Geen regressie, geen overflow. Vegen in de lightbox blijft niet werken (R3-24).
- **Productpagina's in de HTML:** 354 pagina's (per merk 18 tot 40, plus alle aanbiedingen): status 200, merk, structured data, tekst.

### 7.3 Steekproef

- Visueel: 128 gelabelde eerste beelden, alle 235 "overig", 137 Boråstapeter-tegels, 40 van de 174 openers, 80 hoverbeelden in 40 paren.
- Oude P3-punten: enkel kort nagekeken (code ongewijzigd, plus R3-10, -13, -14, -15 gemeten).

---

## 8. Beperkingen en niet getest

- **Geen echte toestellen** (iOS Safari, Android) en **geen schermlezer**. Touch is geëmuleerd in Chrome.
- **Niet aangeraakt, zoals gevraagd:** winkelmand, kassa, formulieren. De voorraadtekst in de winkelmand is enkel in de code nagekeken. De verlanglijst is niet aangeklikt.
- **Geen toegang tot Shopify-admin of Vercel.** De exacte commit op productie is afgeleid (zie bovenaan).
- **Niet elke galerijfoto:** 41.951 unieke beelden, 20.975 met HEAD. Niet elke foto bekeken: het oordeel "juiste kleur op de foto" steunt op de koppelingen en een steekproef.
- **Netwerk:** de wifi viel meermaals weg. Getroffen tests zijn herhaald. Tijdsmetingen zijn enkel indicatief, snelheid is niet beoordeeld.
- **Stabiliteit:** productie is tijdens de test niet herbouwd (zelfde deployment en zelfde momentopname bij begin en einde).

---

## 9. Prioriteitenlijst voor herstel

1. **R4-01 (P2):** prijs op de kaart na een staal, en `eerste()` gelijk aan de toonvariant (`listing.ts:104,115-118`, `product-card.tsx:60`).
2. **R4-02 (P2):** zonder vormfilter rechthoekig eerst, en het kaartbeeld uit de toonvariant zelf (`listing.ts:91-93,99,109`). Neem R4-05 (P3) meteen mee: zelfde plek.
3. **R4-03 (P2):** sleutel van de kaart (`product-listing.tsx:243`).
4. **R4-04 (P2):** geen sfeerfoto als vormfoto (`view.ts:110-114`). Neem R4-06 (P3, `product-card.tsx:86`) mee.
5. **R4-11 (P2, te verifiëren):** beslissen over "Levertijd" in de kenmerken.
6. **Daarna stap 3 uit de overdracht:** de 117 labels en kleurkoppelingen in Shopify. Neem R4-10 (foto ↔ kleur) en R4-12 (prijzen) in dezelfde ronde mee. R4-09 (vendor van 3 Desso-producten) kan daar ook bij.
7. **R4-08 (P3):** redirects voor de 5 oude URL's, vóór livegang.
8. **Afwerking (P3):** R4-07, R4-13, R4-14, R4-15, R4-16, R4-17, R4-18, R4-19. Daarna de overgebleven P3's uit het vorige rapport.

**Telling (nummering R4):** 19 bevindingen. Bevestigde fouten 10 (P2: 4 · P3: 6). Te verifiëren 4 (P2: 1 · P3: 3). Verbeterpunten 5 (P3: 5). Geen P1. Ontstaan door `ca53c01`/`6be782c`: R4-01, R4-02, R4-06 en een deel van R4-05. Door dezelfde wijzigingen meer zichtbaar: R4-12, R4-15. De rest bestond al of komt uit de data.
