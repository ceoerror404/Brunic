# Webshop-QA-heraudit Brunic op productie: filters, beelden, kaarten, navigatie

- **Datum:** 31/10/2026, tests tussen 20:15 en 20:50 (CET)
- **Uitgevoerd door:** Claude (agent, alleen lezen en testen), in opdracht van Alexander
- **Opdracht:** `.agents/skills/webshop-qa-audit/SKILL.md`, volledige scope (filters, productfoto's en hoverbeelden, productkaarten en productnavigatie, desktop en mobiel). De filters zijn getoetst aan `docs/filtersysteem.md`. Checklist: §4 van het vorige rapport `docs/audits/2026-10-31-webshop-qa/rapport.md`.
- **Soort:** heraudit, rechtstreeks op productie, na de deploy van het filtersysteem.

| Omgeving | Code | Catalogus-momentopname | Hoe vastgesteld |
|---|---|---|---|
| **Productie** https://brunic.vercel.app | **vermoedelijk `82ba1b0`** ("update", 31/10 20:03 CET). De app-code is identiek aan `5fa16a5` "filtering update": `82ba1b0` wijzigt alleen de skill, de agentdefinitie, `.gitignore` en het vorige rapport. **Er zijn dus geen codefixes.** | **31/10/2026 19:04 UTC** (20:04 CET), 4.070 producten (4.111 in Shopify) | `/api/status`, om 20:47 nog altijd dezelfde momentopname. De momentopname ontstond 1 minuut na de commit van `82ba1b0`, dus bij de build van die deploy. Het gedrag klopt met de code: 199 van de 205 lijst-URL's zijn in de server-HTML identiek aan een orakel dat de code van `82ba1b0` draait (de 6 andere zijn verwachte 404's, een 308 en lege zoekopdrachten). Git: `master` = `origin/master` = `82ba1b0`, werkkopie clean. De deploy-ID zelf is niet uit te lezen. |
| Lokaal | Geen dev-server. De code van de werkkopie (`82ba1b0`) is alleen gebruikt als orakel in eigen Node-scripts en voor `test:filters`. | 28/10/2026 14:51 UTC (`apps/prototype/.data/shopify-catalogus.json`) | — |

> **Catalogus op productie tegenover 28/10.** De kaartgegevens van alle 4.070 producten (`/api/producten?slugs=…`, zonder `live=1`, dus zonder Shopify-aanroep) zijn identiek aan de lokale momentopname van 28/10: beeld, hoverbeeld, stalen, varianten, prijzen, titels en badges. Ook 199 volledige productobjecten uit de productpagina's zijn identiek, inclusief alle beelden, kleurkoppelingen en filterwaarden. Het gaat om alle producten uit de vorige fotogroepen A–E, 60 willekeurige producten en de 3 gewijzigde. **Enige verschil:** 3 Desso-vasttapijten staan sinds 31/10 (00:17–00:48 UTC) onder vendor Tarkett (zie N3). Voor het orakel zijn die 3 producten in het geheugen vervangen door hun productieobject.
>
> Er is niets gewijzigd aan code, data, beelden, koppelingen of Shopify. Er is niets gecommit of gepusht. Hulpscripts en ruwe uitvoer staan in de scratchpad van deze sessie (`r2-*.mjs`, `r2-*.json`, `s1`–`s10` met omgeving `prod2`). Screenshots staan in `screenshots/` (gitignored).

---

## 1. Oordeel

**Productie draait nu het filtersysteem uit de specificatie, en dat werkt betrouwbaar.** Het gaat om 199 identieke HTTP-controles (totaal, kaartvolgorde en elke filtergroep met aantallen) en 73 van de 73 browserwaarnemingen. Ook chips, geschiedenis, mobiele lade, toetsenbord, lege staat en oude links werken. Daarmee zijn **F1 en F2 opgelost**.

De beeld- en kaartproblemen blijven, zoals verwacht zonder codefixes en zonder fotowijzigingen in Shopify:
- de hover toont een andere kleur (F3), en bij nader inzien ook bij sfeerfoto's zonder kleurkoppeling (N4);
- kaart en productpagina lopen uiteen bij vinyl en Boråstapeter (F4);
- "meer tonen" springt terug (F5);
- na een kleurfilter toont de kaart de standaardkleur (V1).

Nieuw zijn vier kleinere punten:
- oude links met `kleur=Multicolor` geven 0 producten (N1);
- 1.908 behangpagina's tonen "Totaal voor 1 rollen" (N2);
- 3 Desso-tapijten staan plots onder Tarkett (N3);
- de automatische herbouw startte niet, ook niet na echte productwijzigingen in Shopify (T2, sterker bewijs).

**Bruikbaarheid:** zoeken, filteren en navigeren werken vlot en correct op desktop, tablet en mobiel. De server antwoordt in 0,3 tot 1,2 s, zonder horizontale overflow of consolefouten. Wat de klant misleidt, is visueel: hoverbeelden in een andere kleur, en de standaardkleur op de kaart na een kleurfilter.

---

## 2. Status van de vorige bevindingen (checklist §4)

Status: **opgelost** · **blijft** (zelfde gedrag, opnieuw vastgesteld op productie) · **veranderd** · **n.v.t.** (niet van toepassing op productie).

| Code (vorig) | Onderwerp | Status | Bewijs op productie |
|---|---|---|---|
| **F1** P1 | Productie draait niet het gespecificeerde filtersysteem | **Opgelost** | Profielen per afdeling zoals in de matrix. Stoffen: Type · Kleur · Lichtdoorlatendheid · Motief · Merk · Stijl, plus Materiaal, Stofbreedte en Eigenschappen in "Alle filters". Tapijten mét Maat, vloer mét Look en Rolbreedte (`s1-prod2.json`, `prod2-desk-catalogus-*-weergave-producten.jpg`). Geen "Verkocht per" of "Beschikbaarheid" (205 URL's). Behangkleuren in spectrumvolgorde met "Meerkleurig". Zoeken "bloemen": Motief "Bloemen (373)" van 382. Chips "Kleur: Beige ×" (`prod2-filter-chips.jpg`). Elke filterkeuze is een stap in de geschiedenis (`history.length` 2→3→4→5) en "meer tonen" niet. Escape geeft de focus terug op de filterknop (zichtbare ring). Een link in het nieuwe formaat met vervallen parameters geeft 148 producten (`s2-prod2.json`). |
| **F2** P2 | Productie toont catalogus van 24/10 | **Opgelost** | Momentopname van 31/10 19:04. `behang-hexagon-donkergroen-en-goud-estahome`: "€ 47,95 / rol" en "In winkelmand" (`prod2-pdp-behang-hexagon-donkergroen-en-goud-estahome.jpg`). Kaartdata = Shopify-stand van 28/10 + 3 wijzigingen van 31/10. |
| **F3** P2 | Hover toont een sfeerfoto van een andere kleur (66) | **Blijft**, met aanvulling (N4) | Opnieuw berekend op de productieobjecten: dezelfde 66 producten. Code `view.ts:71` is ongewijzigd. Kaart en hover in de echte lijst: `prod2-bewijs-diva-*`, `-strada-*`, `-urbanite-*`, `-bergamo-*`, `-euphoria-*`, `-java-*`, `-toile-de-jouy-*`, `-arien-*`. **Correctie:** Les Best, het voorbeeld in F3, zit niet in deze 66. Zijn sfeerfoto hangt aan geen kleur, en de voorgestelde codefix zou hem dus niet oplossen. Zie N4. |
| **F4** P2 | Kaartbeeld niet (vooraan) op de productpagina (27) | **Blijft** | Dezelfde 27 producten. Fairplay Aqua opent op "Breedte: 2 m" met een turquoise bolletje en alleen de badkamerfoto (`prod2-pdp-vinyl-fairplay-aqua-beauflor.jpg`). Zen (Boråstapeter) opent op 4731 met 1 foto, terwijl de kaart 4733 toont. Code `shopify-adapter.ts:240`, `:312-314`, `view.ts:69` en `product-view.tsx:81` is ongewijzigd. |
| **F5** P2 | "Meer tonen" springt vanaf de 2e klik terug | **Blijft** | `/catalogus/behang?weergave=producten&sorteer=naam`: 2e klik −4.378 px, 3e klik −4.387 px, terug bij kaart #48 en #96. Met kleurfilter: na de 3e klik staat de focus op kaart #48 in plaats van #96 (`s7-prod2.json`, `s6-prod2.json`, `prod2-meer-tonen-2e-klik.jpg`). Code `product-listing.tsx:101-108`, `:224`, `:246-249` is ongewijzigd. |
| **F6** P3 | Kleverige hover op touch | **Blijft** | Mobiel, Les Best: staal aan en uit → de sfeerfoto blijft staan tot u elders tikt (`s8-prod2.json` `kleverigeHover: true`, `prod2-mob-kaart-na-staal-uit.jpg`). Code `product-card.tsx:31-32` is ongewijzigd. |
| **F7** P3 | Zoekkop en lijst tonen een ander aantal | **Blijft** | `/zoeken?q=bloemen&categorie=behang&kleur=roze`: kop "382 producten en 1 categorie gevonden.", lijst "46 producten". Ook `/zoeken?q=linnen&categorie=gordijnen-en-stoffen`: 76 tegenover 10 (`r2-http.json`). Code `zoeken/page.tsx:42` is ongewijzigd. |
| **F8** P2 | 5 Boråstapeter-titels met verloren Zweedse tekens | **Blijft** | Titels identiek ("Citrontr d", "Olivtr d", "Bl regn", "Dahliadr m", "rtag rd"). `/zoeken?q=citronträd` → "0 producten gevonden". |
| **T1** P2 | Gedeeld variantbeeld (16) | **Blijft** | Beelden en kleurkoppeling van alle 16 zijn identiek op de productiepagina's (`r2-pdp-vergelijk.json`). |
| **T2** P2 | Waarom herbouwt productie niet automatisch? | **Veranderd**: symptoom weg, oorzaak met sterker bewijs nog open | De catalogus is nu actueel, maar alleen door de build van de deploy. **Nieuw bewijs:** de 3 Desso-producten kregen op 31/10 tussen 00:17 en 00:48 UTC een nieuwe `updatedAt` (vendor gewijzigd). Noch de Shopify-webhook (meteen), noch de cron van 04:00 UTC (`vercel.json`, vingerafdruk op `updatedAt`, `herbouw.ts:43-54`) leidde tot een nieuwe build. De vorige audit zag om ±17:00 CET nog de momentopname van 24/10. Ook de wijzigingen van 28/10 bleven 3 dagen weg. Te verifiëren in Vercel. `/api/catalogus/vernieuwen` is bewust **niet** aangeroepen. |
| **T3** P3 | Kaartbeeld is een sfeerfoto (22) | **Blijft** | Dezelfde 22 producten (groep B). |
| **T4** P3 | Vinyl met interieur als kaartbeeld | **Blijft** | `prod2-bewijs-tia-cosmo-clay-*` (kaart `5827242-scaled.jpg` = keuken, hover = dessin). |
| **T5** P3 | Strada en Urbanite delen dezelfde sfeerfoto | **Blijft** | Beide hovers `…-17ed1bb86d.jpg` (`s10-prod2.json`). |
| **T6** P3 | Witte stoffen onherkenbaar op de kaart | **Blijft** | Data identiek. `prod2-bewijs-chester-standaard.jpg`. |
| **T7** P3 | Vloer en tapijt deels op aanvraag | **Blijft** | Prijzen en `pricing` identiek voor alle 4.070 producten. Prijsfilter vloer "Prijs op aanvraag (305)", tapijten "(90)". "Aanbevolen" in Tapijten opent met Louis De Poortere op aanvraag (`prod2-filter-chips.jpg`). |
| **T8** P3 | Stoffen › Effen: 4 producten | **Blijft** | `/catalogus/gordijnen-en-stoffen/effen`: 4 producten, terwijl "Motief: Effen" er 132 telt. |
| **V1** P2 | Kaart toont de gefilterde kleur niet | **Blijft** | Stoffen Rood: 31 van 35 kaarten tonen een andere kleur. Vloer Rood: 61/98. Tapijten Blauw: 28/35. Behang Blauw: 5/167. Bij "Kleur: Rood" zijn de eerste kaarten lila, grijs, lichtgroen en blauw (`prod2-visueel-stoffen-kleur-rood.jpg`). Code `listing.ts:40-52` is ongewijzigd. |
| **V2** P3 | Hoverbeeld laadt pas bij de hover | **Blijft** (code) | Nog altijd pas bij de hover gevraagd. Gemeten 117–255 ms bij een warme CDN-cache (vorige keer ongecachet 540–880 ms). Geen flikkering, geen hoogteverschil (20 kaarten, `s3-prod2.json`). |
| **V3** P3 | Uitsnede van staande hoverbeelden | **Blijft** | `prod2-bewijs-bergamo-hover.jpg`, `prod2-bewijs-diva-hover.jpg`. |
| **V4** P3 | 7 tabstops per kaart | **Blijft** | Hart → link → 4 stalen → "Nog 42 kleuren bekijken" → volgende kaart. Focus is overal zichtbaar, en Enter opent het product (`s8-prod2.json`, `prod2-kaart-focus.jpg`). |
| **V5** P3 | `filtersysteem.md` loopt achter (prijs behang) | **Blijft** | Het document is ongewijzigd ("Stand 24/10", matrix "Prijs · verborgen" voor behang). Productie toont bij behang Prijs als 5e knop met 6 klassen, die "per rol" en "per stuk" mengen. |
| **V6** P3 | `image-slot.tsx:44`: `failed` wordt niet gereset | **Blijft** (latent) | Code ongewijzigd. Nu breekt er geen enkel beeld (12.370 URL's). |
| **V7** P3 | Dev-waarschuwing `scroll-behavior` | **N.v.t. op productie** | Alleen in `next dev`. `globals.css:85` is ongewijzigd. Op productie geen waarschuwing. |
| **V8** P3 | Preload-waarschuwingen voor merklogo's | **Blijft** | 11 × "preloaded but not used" (`/merken/*.svg`) enkele seconden na het laden (`r2-extra-prod2.json`, `s4-prod2.json`). |
| **V9** P3 | Loft79-titels in kleine letters | **Blijft** | Titels identiek ("chester", "london"…). |
| **Groep A** | Hover in een andere kleur | **Blijft**: 66 van 66 | Opnieuw berekend op de productieobjecten (`r2-pdp-vergelijk.json`). |
| **Groep B** | Kaartbeeld is een sfeerfoto | **Blijft**: 22 van 22 | idem |
| **Groep C** | Kaartbeeld ontbreekt of staat niet vooraan op de productpagina | **Blijft**: 27 van 27 | idem. Ook "breedte als kleur" blijft 27 van 27. |
| **Groep D** | Gedeeld variantbeeld | **Blijft**: 16 van 16 | Beelden en kleurkoppeling identiek |
| **Groep E** | Enkel een rolfoto | **Blijft**: 4 van 4 | idem |
| K1 | Kleur en maat per product | Blijft (bekend) | Tapijten 6 kleuren × 4 maten: 1 van de 789 treffers zonder passende variant (Ripley 0226). |
| K2 | Vinyl zonder kleurfamilie | Blijft (bekend) | `/catalogus/vloerbekleding/vinyl` zonder Kleur, correct verborgen. |
| K3 | Motief en stijl behang niet opgeschoond | Blijft (bekend) | Data identiek. |
| K4 | Geen Beschikbaarheid of Verkocht per | **Nu ook op productie correct** | 205 URL's, geen van beide. |

**Kort:** opgelost 2 (F1, F2) · veranderd 1 (T2) · n.v.t. 1 (V7) · blijft: 21 bevindingen en de 5 fotogroepen.

---

## 3. Nieuwe bevindingen

Legende: **N** = nieuw in deze heraudit. Soort: F = bevestigde fout · T = te verifiëren · V = verbeterpunt. Prioriteit: **P1** blokkeert kopen of vinden of toont foute informatie · **P2** duidelijk storend · **P3** afwerking.

N1 en N2 zijn door de nieuwe deploy en catalogus zichtbaar geworden. N3 is ontstaan door een Shopify-wijziging op 31/10. N4 en N5 bestonden al, maar zaten niet in de vorige telling (vorige keer verkeerd ingedeeld onder F3).

### 3.1 Bevestigde fouten

| Prioriteit | Pagina/product/variant | Probleem | Verwacht gedrag | Vastgesteld gedrag | Bewijs en reproductiestappen | Voorgestelde oplossing |
|---|---|---|---|---|---|---|
| **P2** · N4 (F) | Meerkleurige producten waarvan het hoverbeeld een sfeerfoto **zonder kleurkoppeling** is: **189 producten** (ADO 177, Balsan 10, Lano 1, Associated Weavers 1). Visueel bevestigd: `vasttapijt-les-best-balsan`, `vasttapijt-les-greens-confort-balsan`, `vasttapijt-majestic-balsan`, `vasttapijt-fame-enso-lano`, `gordijnstof-malaika-ado`, `vasttapijt-aztec-associated-weavers` | Hover toont een andere kleur dan de kaart, of geen interieur | Hover = interieur van hetzelfde product in dezelfde kleur. Anders blijft de productfoto staan. | Les Best: grijs staal 007 → rood tapijt in een slaapkamer. Les Greens Confort+: crème → fuchsia. Majestic: lichtblauw → beige. Fame Enso: antraciet → lichtgrijs. Malaika: lichte 684 → donkere variant (lijkt 957). Aztec: hover = foto van een stalenrek met 6 kleuren. Steekproef van 20 (alle 12 vasttapijten en tegels + 8 ADO-stoffen): 6 fout, 6 te verifiëren, 8 passend. | `screenshots/contact-kleurloze-sfeer-01.jpg` en `-02.jpg`. Lijst: `r2-kleurloos-alle.json` (scratchpad). Reproductie: muis over de eerste kaart van `/catalogus/vloerbekleding/vasttapijt` (Les Best). Per product: §4.2. | **Shopify:** de sfeerfoto koppelen aan de kleur die ze toont (alt "… – sfeerfoto – kleur X", zoals bij de kleurstalen). Bij Aztec het label "sfeerfoto" weghalen. **Code** `view.ts:71`: bij meer dan één kleur een sfeerfoto alleen als hover gebruiken als ze aan de kleur van het kaartbeeld hangt. Een kleurloze sfeerfoto dan alleen bij producten met één kleur, of als ze expliciet als "alle kleuren" gelabeld is. Samen met de fix van F3. |
| **P3** · N1 (F) | Oude links met `kleur=Multicolor`: `/catalogus/behang?weergave=producten&kleur=Multicolor`, idem `vloerbekleding`, `tapijten` en `/zoeken?q=bloemen&kleur=Multicolor` | Een oud label geeft een lege lijst | Specificatie: "Oude links met labels (`?kleur=Grijs`) werken dus nog." Multicolor heet nu Meerkleurig. | **0 producten** in plaats van 5 / 13 / 20 / 3 (vorige productieversie). Chip "Kleur: multicolor" en paneelwaarde "multicolor 0 producten" met de ruwe ID in kleine letters. Uitvinken en "Alle filters wissen" werken wel. Van de 172 filterwaarden van de vorige productieversie werken er 168 als link. | `r2-oudelinks.json`, `screenshots/prod2-oude-link-multicolor-tapijten.jpg`, `-behang.jpg`. Reproductie: open `/catalogus/tapijten?weergave=producten&kleur=Multicolor` (0) tegenover `&kleur=meerkleurig` (20). | **Code** `filters.ts:342` (`parseListState`) zet URL-waarden alleen om met `waardeId`. De synoniemen uit `facet-normalisatie.ts:29-30` (multicolor/multicolour/multi → Meerkleurig) gelden niet voor de URL. Oplossing: dezelfde kleurnormalisatie toepassen op de waarden van `kleur` in `parseListState`, of een aliaslijst per filter. |
| **P3** · N2 (F) | Productpagina van elk behang met prijs: **1.908 producten** (ESTAhome 1.304, Origin 566, Walls4You 21, Sanders & Sanders 17), bv. `/product/behang-hexagon-donkergroen-en-goud-estahome` | Meervoud bij 1 rol | "Totaal voor 1 rol: € 47,95" | "Totaal voor **1 rollen**: € 47,95" (standaardhoeveelheid 1) | `screenshots/prod2-pdp-behang-hexagon-donkergroen-en-goud-estahome.jpg` | **Code** `product-view.tsx:267` gebruikt altijd `UNIT_NAME[unit].many`. Bij hoeveelheid 1 `UNIT_NAME[unit].one` gebruiken (`product.ts:26` heeft "rol"/"rollen"). |

### 3.2 Te verifiëren

| Prioriteit | Pagina/product/variant | Probleem | Verwacht gedrag | Vastgesteld gedrag | Bewijs en reproductiestappen | Voorgestelde oplossing |
|---|---|---|---|---|---|---|
| **P3** · N3 (T) | `vasttapijt-paradiso-ab69-desso`, `vasttapijt-asteranne-a411-desso`, `vasttapijt-soft-sense-ii-ac27-desso` | 3 van de 99 Desso-producten staan sinds 31/10 onder merk Tarkett | Eén lijn voor Desso: ofwel alle onder Desso (met samenvoeging onder Tarkett zoals op de merkpagina's), ofwel alle onder Tarkett | Shopify-vendor gewijzigd op 31/10 (00:17–00:48 UTC). Gevolgen: kaart en productpagina "Tarkett · Vasttapijt" en kenmerk "Merk: Tarkett", terwijl titel en slug Desso zeggen. Merkfilter Vloerbekleding: Desso 96 en Tarkett 63 (was 99/60). Tapijten: 44/10 (was 47/7). **Zoeken op "desso" vindt ze niet meer** (97 in plaats van 100). Op `/merken/tarkett` blijven ze staan (Desso → Tarkett via `MERK_ONDER`). | `r2-pdp-vergelijk.json` (veld `specs` Merk Desso → Tarkett), `screenshots/prod2-vloer-merkfilter.jpg`, `prod2-kaart-paradiso-ab69.jpg`, `prod2-pdp-paradiso-ab69-desso.jpg`. Reproductie: `/zoeken?q=desso` en `/zoeken?q=paradiso`. | Navragen of dit een bewuste (gedeeltelijke) migratie is. Zo niet: vendor terug op Desso. Zo wel: de 96 andere ook omzetten, "Desso" als lijn of collectie bewaren zodat zoeken het vindt, en de merkfilter dezelfde samenvoeging laten gebruiken als de merkpagina's (`merkVan`, `brands.ts:15`). |
| **P3** · N5 (T) | De overige meerkleurige producten met een kleurloze sfeerfoto als hover: 175, vooral ADO-stoffen (169 niet bekeken). Uit de steekproef te verifiëren: `tapijttegel-dolce-vita-balsan`, `vasttapijt-signature-confort-balsan`, `tapijttegel-sky-balsan`, `tapijttegel-skyscraper-balsan`, `gordijnstof-cordon-fr-ado`, `gordijnstof-easy-ado` | Kleur van de sfeerfoto niet uit de data af te leiden | Hover in dezelfde kleur als de kaart | Steekproef van 8 ADO-stoffen: 5 passend, 1 fout (Malaika, zie N4), 2 te verifiëren. Bij stoffen toont de sfeerfoto meestal één kleur van de reeks. | `screenshots/contact-kleurloze-sfeer-01.jpg` en `-02.jpg` | Per product in Shopify de kleur van de sfeerfoto vastleggen (zie N4). Tot dan: de codefix van N4 laat de productfoto staan. |

### 3.3 Verbeterpunten

Geen nieuwe. De bestaande V1–V9 staan in §2.

---

## 4. Fotoproblemen per product

### 4.1 Vorige groepen A–E: ongewijzigd

De tabel in §3 van het vorige rapport (`docs/audits/2026-10-31-webshop-qa/rapport.md`, 135 regels) **geldt ongewijzigd voor productie**. Voor elk product uit die tabel is de productiepagina opgehaald. Het `Product`-object (alle beelden met URL, alt-tekst en kleurkoppeling, opties, varianten en filterwaarden) is identiek aan de momentopname waarop die tabel gebaseerd is. Ook de kaartbeelden en hoverbeelden van alle 4.070 kaarten zijn identiek. Zo kunt u per product beoordelen wat aangepast moet worden, zonder twee tabellen naast elkaar te leggen.

| Groep | Vorig | Nu op productie | Bewijs |
|---|---|---|---|
| A hover andere kleur | 66 | 66 (dezelfde) | `r2-pdp-vergelijk.json`, `prod2-bewijs-*-standaard/-hover.jpg` (8 producten) |
| B kaartbeeld is sfeerfoto | 22 | 22 (dezelfde) | idem, `prod2-bewijs-zen-*` |
| C kaartbeeld niet vooraan op de productpagina | 27 | 27 (dezelfde) | idem, `prod2-pdp-vinyl-fairplay-aqua-beauflor.jpg`, `prod2-pdp-behang-zen-borastapeter.jpg` |
| D gedeeld variantbeeld | 16 | 16 (dezelfde) | beelden en kleurkoppeling identiek |
| E enkel rolfoto | 4 | 4 (dezelfde) | idem |

**Correctie op het vorige rapport:** Les Best (`vasttapijt-les-best-balsan`) staat in F3 als voorbeeld, maar hoort bij N4. De sfeerfoto hangt aan geen kleur.

**Gecontroleerd en in orde:** 11 Ragolle-tapijten (bv. `vloerkleed-rampur-0056-ragolle`, `vloerkleed-ripley-0204-ragolle`) hebben als kaartbeeld een bestand `…-sfeerfoto.jpg` met alt "productfoto", en als hover een bestand `…-productfoto.jpg`. Visueel is het kaartbeeld een productfoto van het tapijt op een betonvloer en het hoverbeeld een interieur. De alt-teksten kloppen, alleen de bestandsnamen zijn misleidend. Geen actie nodig.

### 4.2 Nieuw: hover met een kleurloze sfeerfoto (N4, N5)

Steekproef van 20 van de 189: alle 12 vloer- en tapijtproducten en 8 ADO-stoffen (gelijk verdeeld over de lijst). Pagina-URL's zijn relatief tot https://brunic.vercel.app.

| Groep | Product (titel + slug) | Variant/kleur | Pagina-URL | Standaardbeeld-URL | Hoverbeeld-URL | Screenshot | Oordeel | Voorstel |
|---|---|---|---|---|---|---|---|---|
| N4 | Les Best (`vasttapijt-les-best-balsan`) | kaart 007 (grijs) · hover: rood tapijt in slaapkamer | /product/vasttapijt-les-best-balsan | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/vasttapijt-les-best-balsan-580f5677a9.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/vasttapijt-les-best-balsan-39abcdc75b.jpg | screenshots/contact-kleurloze-sfeer-01.jpg (#1) | fout (visueel bevestigd) | Shopify: sfeerfoto aan de getoonde kleur koppelen (alt "– sfeerfoto – kleur X" + variantbeeld) |
| N4 | Aztec (`vasttapijt-aztec-associated-weavers`) | kaart Endive 29 · hover: stalenrek met 6 kleuren (geen interieur) | /product/vasttapijt-aztec-associated-weavers | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/vasttapijt-aztec-associated-weavers-e660307a15.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/vasttapijt-aztec-associated-weavers-f09c2204aa.jpg | screenshots/contact-kleurloze-sfeer-01.jpg (#2) | fout (hover is geen interieurfoto) | Shopify: alt-label "sfeerfoto" weghalen of een echte interieurfoto toevoegen |
| — | Natural look (`vasttapijt-natural-look-balsan`) | kaart Nomade 610 · hover: licht tapijt in woonkamer | /product/vasttapijt-natural-look-balsan | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/vasttapijt-natural-look-balsan-522b21b2f8.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/vasttapijt-natural-look-balsan-759006faee.jpg | screenshots/contact-kleurloze-sfeer-01.jpg (#3) | passend | — |
| N5 | Dolce Vita (`tapijttegel-dolce-vita-balsan`) | kaart 640 (taupe) · hover: slaapkamer met blauwe en grijze tegels | /product/tapijttegel-dolce-vita-balsan | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/tapijttegel-dolce-vita-balsan-b97051de0a.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/tapijttegel-dolce-vita-balsan-9e39a4a8cd.jpg | screenshots/contact-kleurloze-sfeer-01.jpg (#4) | te verifiëren | Nagaan welke kleuren de foto toont; koppelen of als "alle kleuren" labelen |
| N4 | Les Greens Confort+ (`vasttapijt-les-greens-confort-balsan`) | kaart Nacre 003 (crème) · hover: fuchsia tapijt | /product/vasttapijt-les-greens-confort-balsan | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/vasttapijt-les-greens-confort-balsan-2f4b9b5fce.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/vasttapijt-les-greens-confort-balsan-14ea9b1ffe.jpg | screenshots/contact-kleurloze-sfeer-01.jpg (#5) | fout (visueel bevestigd) | Shopify: sfeerfoto aan de getoonde kleur koppelen |
| N5 | Signature Confort+ (`vasttapijt-signature-confort-balsan`) | kaart Prusse 192 (marineblauw) · hover: antraciet tapijt | /product/vasttapijt-signature-confort-balsan | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/vasttapijt-signature-confort-balsan-5945bce0d1.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/vasttapijt-signature-confort-balsan-f6c6543d59.jpg | screenshots/contact-kleurloze-sfeer-01.jpg (#6) | te verifiëren (waarschijnlijk andere kleur) | Kleur van de sfeerfoto nagaan en koppelen |
| N5 | Sky (`tapijttegel-sky-balsan`) | kaart 160 (donkerblauw) · hover: grijze tegels | /product/tapijttegel-sky-balsan | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/tapijttegel-sky-balsan-c98a994215.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/tapijttegel-sky-balsan-76b611dde3.jpg | screenshots/contact-kleurloze-sfeer-01.jpg (#7) | te verifiëren | Kleur van de sfeerfoto nagaan en koppelen |
| N5 | Skyscraper (`tapijttegel-skyscraper-balsan`) | kaart 160 (donkerblauw) · hover: donkergrijs kantoor | /product/tapijttegel-skyscraper-balsan | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/tapijttegel-skyscraper-balsan-4a199073c7.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/tapijttegel-skyscraper-balsan-b60389f9fa.jpg | screenshots/contact-kleurloze-sfeer-01.jpg (#8) | te verifiëren | Kleur van de sfeerfoto nagaan en koppelen |
| N4 | Majestic (`vasttapijt-majestic-balsan`) | kaart Fremissant 110 (lichtblauw) · hover: beige tapijt | /product/vasttapijt-majestic-balsan | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/vasttapijt-majestic-balsan-b898d42c7c.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/vasttapijt-majestic-balsan-a12afc1d78.jpg | screenshots/contact-kleurloze-sfeer-01.jpg (#9) | fout (visueel bevestigd) | Shopify: sfeerfoto aan de getoonde kleur koppelen |
| — | Skyline (`tapijttegel-skyline-balsan`) | kaart 964 · hover: grijze streeptegels | /product/tapijttegel-skyline-balsan | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/tapijttegel-skyline-balsan-0871779293.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/tapijttegel-skyline-balsan-f73092c079.jpg | screenshots/contact-kleurloze-sfeer-01.jpg (#10) | passend | — |
| — | Ultrasoft (`vasttapijt-ultrasoft-balsan`) | kaart Nacre 010 · hover: beige tapijt in slaapkamer | /product/vasttapijt-ultrasoft-balsan | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/vasttapijt-ultrasoft-balsan-1e77d8ccaa.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/vasttapijt-ultrasoft-balsan-38edd17c10.jpg | screenshots/contact-kleurloze-sfeer-02.jpg (#11) | passend | — |
| N4 | Fame Enso (`vasttapijt-fame-enso-lano`) | kaart Coffee 400 (antraciet) · hover: lichtgrijs tapijtstaal op parket | /product/vasttapijt-fame-enso-lano | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/vasttapijt-fame-enso-lano-1eb0a13c76.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/vasttapijt-fame-enso-lano-c5e10a3a30.jpg | screenshots/contact-kleurloze-sfeer-02.jpg (#12) | fout (visueel bevestigd) | Shopify: sfeerfoto aan de getoonde kleur koppelen |
| N5 | Cordon FR (`gordijnstof-cordon-fr-ado`) | kaart 10 (wit) · hover: grijze draadgordijnen | /product/gordijnstof-cordon-fr-ado | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/gordijnstof-cordon-fr-ado-8b52d1cd90.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/gordijnstof-cordon-fr-ado-0d7344eaaf.jpg | screenshots/contact-kleurloze-sfeer-02.jpg (#13) | te verifiëren | Kleur van de sfeerfoto nagaan en koppelen |
| N5 | Easy (`gordijnstof-easy-ado`) | kaart 554 (terracotta) · hover: woonkamer, stof niet duidelijk herkenbaar | /product/gordijnstof-easy-ado | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/gordijnstof-easy-ado-24230d806a.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/gordijnstof-easy-ado-3e509eacea.jpg | screenshots/contact-kleurloze-sfeer-02.jpg (#14) | te verifiëren | Kleur van de sfeerfoto nagaan en koppelen |
| — | Kay (`gordijnstof-kay-ado`) | kaart 131 · hover: lichte bloemengordijnen | /product/gordijnstof-kay-ado | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/gordijnstof-kay-ado-4c363f2dbe.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/gordijnstof-kay-ado-8fde50a20b.jpg | screenshots/contact-kleurloze-sfeer-02.jpg (#15) | passend | — |
| N4 | Malaika (`gordijnstof-malaika-ado`) | kaart 684 (licht) · hover: gordijnen in de donkere variant (lijkt 957) | /product/gordijnstof-malaika-ado | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/gordijnstof-malaika-ado-f53dfd2f9b.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/gordijnstof-malaika-ado-d4ffdabf14.jpg | screenshots/contact-kleurloze-sfeer-02.jpg (#16) | fout (visueel bevestigd) | Shopify: sfeerfoto aan kleur 957 koppelen |
| — | Isla (`gordijnstof-isla-ado`) | kaart 312 · hover: interieur met meubelstof in crème en zwart-wit | /product/gordijnstof-isla-ado | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/gordijnstof-isla-ado-fec3542b15.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/gordijnstof-isla-ado-44ef21df9e.jpg | screenshots/contact-kleurloze-sfeer-02.jpg (#17) | passend | — |
| — | Cone (`gordijnstof-cone-ado`) | kaart 665 · hover: vouwgordijn in hetzelfde dessin en dezelfde kleur | /product/gordijnstof-cone-ado | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/gordijnstof-cone-ado-d6802aebdb.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/gordijnstof-cone-ado-103ffc08ec.jpg | screenshots/contact-kleurloze-sfeer-02.jpg (#18) | passend | — |
| — | Pippa (`gordijnstof-pippa-ado`) | kaart 131 · hover: witte vitrage | /product/gordijnstof-pippa-ado | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/gordijnstof-pippa-ado-00520a17e0.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/gordijnstof-pippa-ado-4de23f07c9.jpg | screenshots/contact-kleurloze-sfeer-02.jpg (#19) | passend | — |
| — | Blumenwiese FR (`gordijnstof-blumenwiese-fr-ado`) | kaart 132 · hover: vitrage met bloemen | /product/gordijnstof-blumenwiese-fr-ado | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/gordijnstof-blumenwiese-fr-ado-6955ffe5e4.jpg | https://cdn.shopify.com/s/files/1/1072/8662/6636/files/gordijnstof-blumenwiese-fr-ado-bcc45793bd.jpg | screenshots/contact-kleurloze-sfeer-02.jpg (#20) | passend | — |

Verdeling van de 189: ADO 177, Balsan 10, Lano 1 en AW 1. Bekeken: 20. Niet bekeken: 169 ADO-stoffen. Volledige lijst: `r2-kleurloos-alle.json` (scratchpad).

---

## 5. Geteste onderdelen

### 5.1 Volledig uitgevoerd (hele catalogus, productie)

- **Kaartgegevens van alle 4.070 producten** (`/api/producten?slugs=…`, 41 aanroepen van 100, zonder `live=1`) tegenover de momentopname van 28/10, met dezelfde `toCard`. Identiek, op het merk van 3 producten na. Sitemap: 4.070 productpagina's. `updatedAt` verschilt alleen bij die 3.
- **Beeld-URL's van productie:** 12.370 unieke URL's met HEAD gecontroleerd, max. 8 tegelijk. Het gaat om alle kaartbeelden (4.070), hoverbeelden (3.329) en staalbeelden (3.180), en alle beelden van 199 productpagina's (1.791). Resultaat: **0 problemen**. Geen kaart zonder beeld.
- **Fotogroepen A, B, C, E en "breedte als kleur"** opnieuw berekend op de productieobjecten (zelfde regels en code als vorige keer). Groep D via identieke beelden en kleurkoppeling.
- **Kleurloze sfeerfoto als hover:** volledige telling (189), visueel op een steekproef van 20.
- `pnpm --filter @brunic/prototype test:filters` (lokale data = productiedata op 3 merkvelden na): **505 geslaagd, 0 mislukt**.
- **Oude links:** alle 172 filterwaarden die de vorige productieversie toonde, als URL op de nieuwe productie. 168 werken, de 4 × Multicolor niet (N1).

### 5.2 Server-HTML van productie tegenover het orakel (HTTP, alleen GET)

205 URL's:
- alle afdelingen en 24 categoriepagina's;
- 16 merkpagina's;
- elke filtergroep per afdeling met 1 en met 2 waarden (OF);
- EN-combinaties en Eigenschappen met EN;
- 4 sorteringen, `pagina=2` en `pagina=3`;
- 10 zoekopdrachten, 3 × aanbiedingen, 2 × nieuw binnen;
- oude labels, vervallen parameters, filters buiten het profiel (genegeerd) en onzin in `pagina`/`sorteer`;
- een lege combinatie en de lege afdelingen.

Vergeleken zijn het totaal, de volgorde van de getoonde kaarten en alle filtergroepen met hun aantallen. **199 identiek**, 6 verwacht anders:
- de lege afdelingen geven 404: Raamdecoratie, Verf en Slapen & wonen zitten niet in het menu (correct);
- `/merken/desso` → 308 naar `/merken/tarkett`;
- 2 zoekopdrachten zonder resultaat.

Gefilterde lijsten: `noindex, follow` + canonical naar het kale pad. Ongefilterde pagina's: `noindex, nofollow`, site-breed via `SITE_INDEXEREN`, bewust zolang de site niet live is. Server: mediaan 0,43 s, p90 0,62 s, max. 1,17 s.

### 5.3 In de browser (headless Chrome via CDP)

Desktop 1366×900, tablet 768×1024 en 1024×768, mobiel 390×844 met touch.

- **Overzicht (s1):** 27 lijst-URL's + 16 merkpagina's op desktop, 10 op mobiel. Filterknoppen en lade per profiel. Geen horizontale overflow. Geen consolefouten (alleen V8).
- **Filterbediening (s2):**
  - Tapijten: Kleur Beige (103) → + Wit (146, OF) → + Maat 170–240 (111, EN) → sorteren op prijs → meer tonen → chip weg → terug, terug, vooruit → herladen → alles wissen (sortering blijft).
  - 4 motieven snel na elkaar: alle 4 in URL en lijst.
  - Lege combinatie: uitleg, "Filters aanpassen" (lade met Roze, Loper en 240+ op 0) en "Alle filters wissen".
  - Gedeelde URL met labels en vervallen parameters.
  - Lange lijst Motief behang: zoekveld, 8 waarden + "Toon alle 53".
  - Eigenschappen met EN (438 → 74).
  - Toetsenbord: Tab, Enter, Tab, Spatie, Escape (focus terug op de knop) en lade met focusval (60 × Tab blijft binnen).
- **Meer tonen (s6, s7):**
  - Met filter en sortering: 4 pagina's zonder dubbels, A–Z klopt over alle pagina's, geen stap in de geschiedenis.
  - `?pagina=3` rechtstreeks werkt, en een filter weghalen zet de lijst terug op pagina 1.
  - Scrollsprong (F5).
- **Kaarten en productpagina (s3, s10):**
  - Hover op 20 kaarten in 5 lijsten: wissel, terugkeer, geen hoogteverschil.
  - Stalen op 3 lijsten: beeld en link `?variant=` wisselen, de productpagina opent op die kleur met het staalbeeld vooraan.
  - 10 productpagina's: prijs + eenheid, opties, lightbox (pijl, Escape → focus terug), variantlade, `?variant=` blijft na herladen.
  - 13 kaart- en hoverparen als bewijs.
- **Mobiel (s4, galerijtest):**
  - Lade schermvullend, pagina vergrendeld, focus erin. Kleur Wit + Transparant (112), groepen blijven open, scrollen tot de laatste groep.
  - "Toon 112 producten" sluit met de focus op "Alle filters 2 actief". Keuzes blijven bewaard bij heropenen. "Alles wissen" en sluiten met × werken.
  - Een staal aantikken navigeert niet. Tikken op de kaart opent de gekozen variant, en terug herstelt de scrollpositie.
  - **Galerij:** swipen, scrollgebaar en trackpad schuiven elk één foto op en de stippen volgen (3 producten). De eerdere metingen met scrollLeft 0 waren te vroeg, vóór de hydratatie (testartefact, geen bevinding).
  - De kleverige bestelbalk verschijnt na het scrollen.
- **Toetsenbord op de kaart (s8):** focusvolgorde, zichtbare focus, Enter opent het product. Kleverige hover op touch (F6).
- **Visuele steekproef van filterwaarden (s5, 12 lijsten):** blackout, strepen (stof en behang), rond (filter en categorie identiek: 25), look planken en tegels, en kleur blauw behang kloppen visueel. Kleurfilters bij stoffen, vloer en tapijt tonen andere kleuren op de kaart (V1).
- **Extra (r2-extra):**
  - Oude Multicolor-link (N1) en merkfilter Desso/Tarkett (N3).
  - Tablet 768 px: lade in plaats van knoppen, 3 kaarten per rij, geen overflow.
  - Tablet 1024 px: 6 knoppen, 3 kaarten per rij, geen overflow. De horizontale stroken (subcategorieën, galerij) scrollen binnen hun eigen container.
- **Browser tegenover het orakel:** **73 van 73** waarnemingen kloppen (totaal en volgorde van de getoonde kaarten), desktop en mobiel.

### 5.4 Visuele beeldcontrole (steekproef)

- Contactblad met 20 producten (kleurloze sfeerfoto).
- 13 kaart- en hoverparen in de echte productielijsten (`prod2-bewijs-*`).
- 9 losse beelden zelf bekeken: Les Best, Ragolle Rampur en Ripley, Aztec, Isla en Malaika.
- De beoordeling van groepen A–E uit de vorige audit blijft geldig (zelfde beeld-URL's). Die contactbladen staan in `docs/audits/2026-10-31-webshop-qa/screenshots/`.

---

## 6. Beperkingen

- **De productie-commit is niet rechtstreeks uit te lezen.** Afgeleid uit git, het tijdstip van de momentopname en het gedrag. Omdat `82ba1b0` geen app-code wijzigt, zou een deploy van `5fa16a5` zich identiek gedragen.
- **De filterwaarden van productie zijn niet voor elk product afzonderlijk opgehaald** (199 productpagina's, geen 4.070). Dat 199 van 205 lijsten inclusief alle filteraantallen identiek zijn aan het orakel, toont wel aan dat de filterdata van productie overeenkomt.
- **Alleen headless Chrome.** Geen echte toestellen (iOS Safari, Android), geen schermlezer (NVDA, VoiceOver), geen zoom 200 % en geen meting van het kleurcontrast.
- **Hoversnelheid** gemeten met een warme CDN-cache. Koude laadtijden staan in het vorige rapport.
- **Beeld-URL's:** 12.370 kaart- en productpagina-URL's gecontroleerd, niet opnieuw alle 41.828 beelden van de catalogus. Die zijn identiek en vier uur eerder allemaal OK bevonden.
- **De kleur van sfeerfoto's** is beoordeeld op verkleinde beelden. Waar het niet zeker was, staat "te verifiëren".
- **Niet getest (buiten de grenzen):** winkelmand, kassa, offerte-, opmeting- en contactformulieren, `/api/catalogus/vernieuwen`, de Shopify-webhook, en de Vercel-logs en -instellingen (oorzaak T2).

---

## 7. Prioriteitenlijst voor herstel

1. **T2 (P2):** in Vercel nagaan waarom er geen automatische herbouw kwam. Controleer `CRON_SECRET`, `VERCEL_DEPLOY_HOOK_URL`, de Shopify-webhookregistratie en de cronlog van 31/10 04:00 UTC. Zonder herbouw bereikt elke Shopify-wijziging de site pas bij een volgende code-push.
2. **F3 + N4 (P2):** hoverkeuze in `view.ts:71`: alleen een sfeerfoto van dezelfde kleur, anders de productfoto. In Shopify de sfeerfoto's aan hun kleur koppelen, eerst de 12 vasttapijten en tegels van Balsan, Lano en AW, en het label van Aztec rechtzetten.
3. **F5 (P2):** focus- en scrollsprong bij "meer tonen" (`product-listing.tsx`).
4. **F4 + T1 (P2):** breedte niet als kleur behandelen (`shopify-adapter.ts:240`), kaartlink naar de variant van het kaartbeeld, en 16 gedeelde variantbeelden nakijken.
5. **V1 (P2):** bij een actieve kleurfilter het passende staal, beeld en de passende variant op de kaart.
6. **F8 (P2, Shopify):** 5 Boråstapeter-titels.
7. **N3 (P3):** beslissen over Desso tegenover Tarkett, en de merkfilter en het zoeken daarop afstemmen.
8. **Kleine codefixes (P3):** N1 (kleursynoniemen in `parseListState`), N2 (enkelvoud bij 1 rol), F6 (hover enkel met muis), F7 (zoekkop).
9. **Data en afwerking (P3):** N5, T3–T8, groep E, V2–V6, V8 en V9. V5: `docs/filtersysteem.md` bijwerken (prijs behang, stand van de catalogus).

*Einde van de heraudit. Er is niets gewijzigd aan code, data, beelden of Shopify. De voorgestelde oplossingen worden pas uitgevoerd na een expliciete vervolgopdracht.*
