# Filtersysteem — één systeem voor de hele winkel

> Stand 24/10/2026 (audit + herwerking, Alexander met Claude). Code: `apps/prototype`. Cijfers: catalogus-momentopname van 22/10/2026 (4.070 producten op de site).
> Beslissingen over de filtertaxonomie per afdeling: `architectuur.md` §Filters & facetten. Dit document beschrijft de bouw.

## Principe

Eén filtersysteem, één component, één gedrag. Per afdeling verschilt enkel **welke** filters er staan en in welke volgorde, en dat staat in één configuratiebestand. Een filter verschijnt alleen als de productdata hem echt kan waarmaken; er bestaan geen verzonnen waarden.

## Architectuur

```
Shopify (metafields · productopties · brunic.specificaties)
   │  scripts/sync-shopify.mjs (Storefront API, alleen lezen) → .data/shopify-catalogus.json
   ▼
lib/catalog/shopify-adapter.ts ──► lib/catalog/facet-normalisatie.ts   ruwe waarden → filterwaarden
   │                                  (product.facets[key] = nette labels)
   ▼
lib/catalog/listing.ts  buildListing(items, searchParams, …, profiel)   server: filteren, tellen, sorteren, pagineren
   │   ▲ src/data/filterprofielen.ts   welke filters per afdeling, in welke volgorde
   │   ▲ lib/catalog/filters.ts        register (FACETS), logica, URL ⇄ toestand
   ▼
components/catalog/product-listing.tsx  desktop: filterknoppen + "Alle filters" · mobiel: lade
```

| Bestand | Rol |
|---|---|
| `src/lib/catalog/filters.ts` | **Register** `FACETS`: sleutel (= URL-parameter), label, weergave (`swatch`/`list`/`bucket`), volgorde van de waarden, logica (`of`/`en`). Filterlogica, tellingen, sortering, URL ⇄ toestand. |
| `src/lib/catalog/facet-normalisatie.ts` | **Normalisatielaag**: Shopify-waarden → één schrijfwijze per waarde, Nederlandse termen, eenheden, klassen. Puur, raakt de Shopify-data niet. |
| `src/data/filterprofielen.ts` | **Configuratie per afdeling**: welke filters, in welke volgorde. Subcategorieën volgen hun hoofdcategorie. Gemengde lijsten (zoeken, aanbiedingen, nieuw binnen, merken) krijgen het gemengde profiel, of het profiel van de afdeling als de hele lijst in één afdeling zit. |
| `src/lib/catalog/listing.ts` | `buildListing`: past het profiel toe. Filters buiten het profiel worden genegeerd, ook als ze in de URL staan. De browser krijgt alleen de kaarten, zonder filterdata. |
| `src/components/catalog/product-listing.tsx` | De enige filter-UI, gebruikt door elke lijstpagina. |
| `scripts/test-filters/` | `pnpm --filter @brunic/prototype test:filters`: test op de echte catalogus en drukt de dekkingsmatrix af. |

Filteren gebeurt **op de server, op de volledige catalogus** (niet op de geladen pagina), op de momentopname die bij elke Shopify-wijziging herbouwd wordt (webhook, `herbouw.ts`). Search & Discovery wordt door de front niet gebruikt; zie §Shopify.

## Gedrag — overal identiek

- **OF binnen een filter, EN tussen filters.** Uitzondering: **Eigenschappen** gebruikt EN (wasbaar + brandvertragend = beide). Eigenschappen zijn geen alternatieven maar eisen.
- **Aantallen** per waarde houden rekening met de andere actieve filters: u ziet wat een extra keuze oplevert. Waarden zonder resultaat verdwijnen. **Gekozen waarden verdwijnen nooit** (desnoods met aantal 0), dus u kunt ze altijd uitvinken.
- **Een filter verschijnt alleen als hij de lijst kan verkleinen.** Een filter met één waarde die elk product heeft, verschijnt niet. Zo valt Type weg op `/catalogus/vloerbekleding/vinyl`.
- **Volgorde van waarden is stabiel.** Ze verspringt niet bij het filteren: vaste reeksen (kleurspectrum, lichtdoorlatendheid, klassen), anders meest voorkomend over de hele lijst of alfabetisch.
- **Lange vrije lijsten** (meer dan 10 waarden: motief, stijl, merk…) krijgen een zoekveld en tonen eerst 8 waarden plus "Toon alle". Gekozen waarden blijven altijd zichtbaar. Vaste reeksen (kleur, klassen) staan altijd volledig.
- **Actieve filters** staan als chips "Filter: waarde ×" boven de lijst, met "Alle filters wissen". In de lade staan "Alles wissen" en "Toon N producten".
- **URL**: stabiele ID's, geen labels (`?kleur=grijs,goud-metallic&maat=170-240&sorteer=prijs-op`). Hoofdletters, accenten en leestekens tellen niet. Oude links met labels (`?kleur=Grijs`) werken dus nog. Vervallen parameters (`beschikbaarheid`, `eenheid`) worden uit de URL gehaald. Gefilterde URL's zijn `noindex` met een canonical naar het kale pad.
- **Geschiedenis**: elke filter- of sorteerkeuze is een stap (de terugknop maakt hem ongedaan). "Meer tonen" niet. Sorteren of filteren zet de paginering terug op 1.
- **Desktop**: de eerste zes filters van het profiel als knop, alle filters in "Alle filters". **Mobiel**: dezelfde filters in de lade, met dezelfde componenten en dezelfde logica.
- **Lege lijst**: uitleg, "Filters aanpassen" (opent de lade) en "Alle filters wissen".
- **Toegankelijkheid**: echte checkboxen met label, aantallen voor schermlezers ("12 producten"), focus terug naar de filterknop na Escape of "Klaar", lade met focusval. Lijststatus via `role=status`.

## Filtermatrix

Positie in het profiel · dekking = aandeel producten met minstens één waarde. "verborgen" = staat in het profiel maar er is geen bruikbare data, dus hij verschijnt vanzelf zodra Shopify die heeft.

| Filter | Behang (2.724) | Vloerbekleding (582) | Tapijten (226) | Gordijnen & stoffen (592) |
|---|---|---|---|---|
| **Type** (gedeeld) | 1 · 100% | 1 · 100% | 1 · 100% | 1 · 100% |
| **Kleur** (gedeeld) | 2 · 54% | 2 · 47% | 2 · 92% | 2 · 100% (fototags, 28/10) |
| Motief | 3 · 79% | — | 4 · 76% | 4 · 97% (fototags; passement heeft geen motief) |
| Stijl | 4 · 76% | — | 7 · 76% | 7 · 97% (fototags) |
| Look | — | 3 · 74% | — | — |
| Rolbreedte | — | 4 · 65% | — | — |
| Maat (breedte) | — | — | 3 · 76% | — |
| Lichtdoorlatendheid | — | — | — | 3 · 85% |
| **Prijs** (gedeeld) | 5 · verborgen (alles op aanvraag) | 5 · 100% | 5 · 100% | 5 · verborgen (alles op aanvraag) |
| **Merk** (gedeeld) | 6 · 100% | 6 · 100% | 6 · 100% | 6 · 100% |
| Ruimte | 7 · 82% | — | — | — |
| **Materiaal** (gedeeld) | 8 · 82% | 7 · 89% | 9 · 92% | 8 · 89% |
| Slijtlaag | — | 8 · 48% (vinyl) | — | — |
| Gebruiksklasse | — | 9 · 17% | — | — |
| Plaatsing | — | 10 · 23% | — | — |
| Vorm | — | — | 8 · 76% | — |
| Poolhoogte | — | 11 · 24% | 10 · 59% | — |
| Stofbreedte | — | — | — | 9 · 97% |
| **Eigenschappen** (gedeeld) | 9 · 8% | 12 · 56% | 11 · 35% | 10 · 87% |

Raamdecoratie heeft een profiel (Type, Kleur, Lichtdoorlatendheid, Materiaal, Prijs, Merk, Eigenschappen) maar nog geen producten. Gemengde lijsten: Categorie, Type, Kleur, Prijs, Merk, Materiaal, Motief, Stijl.

**Volgorde (overal dezelfde regel):** Type en Kleur → de twee filters waarmee klanten van die afdeling het vaakst beginnen (behang: motief, stijl · vloer: look, rolbreedte · tapijt: maat, motief · stoffen: lichtdoorlatendheid, motief) → Prijs en Merk → technische filters → Eigenschappen als laatste. De keuze van de "eerste twee" is een inschatting. Herzien zodra GA4 filtergebruik meet.

**Bewust geen filter:**
- *Beschikbaarheid*: Shopify volgt geen voorraad, elke variant staat op "beschikbaar" (TODO B01). Etalageproducten heetten in de oude filter "Op maat", wat niet klopt.
- *Verkocht per*: de eenheid valt bij 374 producten terug op "Per stuk" (TODO B08), en het onderscheid zit al in Type.
- *Patroonaansluiting*, *dikte*, *onderhoudsvoorschriften*: wel op de productpagina, te technisch voor een filter.

## Normalisatieregels (`facet-normalisatie.ts`)

- **Schrijfwijze**: spaties opgeschoond, hoofdletter vooraan (`bloemen` → `Bloemen`), vaste uitzonderingen (`3d` → `3D`, `Toile de Jouy`). Merknamen blijven zoals ze zijn (`ESTAhome`). Dubbels worden samengevoegd op ID: `Grijs`/`grijs` is één waarde.
- **Kleur**: Engelse termen en synoniemen → de kleurfamilie (`Grey`/`gray` → Grijs, `Multicolor` → **Meerkleurig**, `gold` → Goud/metallic). Elke kleur heeft een staal in `SWATCH_COLORS` (de test bewaakt dat).
- **Waarde in het metafield wint** van de leveranciersspecificatie. De specificaties zijn de terugval tot de pipeline de metafields vult.
- **Leveranciersspecificaties → filters**:
  - Motief, Stijl, Ruimte (behang): kommalijsten, enkel kamers bij Ruimte. "Overig" en "Overige prints" vallen weg.
  - Materiaal: uit Samenstelling of Poolmateriaal, enkel het hoofdweefsel (een coating na ";" telt niet). Behang: vlies/vinyl/papier.
  - Lichtdoorlatendheid: Transparantie (ADO) of Dichtheid (Artelux, Loft79), plus dim-out/black-out uit Eigenschappen. Dim-out en black-out tellen ook als Gesloten. "Inbetween/Transparant" laat de leverancier open, dus krijgt de stof allebei (Semi-transparant en Transparant).
  - Eigenschappen: één term per eigenschap. "Niet wasbaar" is géén Wasbaar. **Wasbaar (stof) ≠ Afwasbaar (behang)**: andere betekenis, dus bewust apart.
  - Vloerverwarming: "Ja", "Geschikt (max. 27 °C)" → Geschikt voor vloerverwarming. "Niet geschikt" → niets.
  - Gebruiksklasse: de code volgens EN 685 (`23 Zwaar` → "23 – Wonen, intensief").
  - Slijtlaag: één notatie (`0,25mm`, `0,25 mm` → "0,25 mm").
  - Look: plank- of tegelafmeting en Dessin/Uitzicht/Patroontype → Planken, Tegels, Steen / beton, Effen / gespikkeld, Structuur / dessin.
- **Klassen voor getallen** (Storefront kent geen ranges, `architectuur.md` §Datamodel):
  - Maat: breedte = kleinste zijde of diameter, < 120 · 120–170 · 170–240 · ≥ 240 cm. Stalen tellen niet.
  - Poolhoogte: < 10 · 10–20 · ≥ 20 mm.
  - Stofbreedte: < 160 · 160–280 · ≥ 280 cm.
  - Rolbreedte: exacte breedtes in cm (`4 m` → 400 cm).
- **Liever geen waarde dan een gegokte.** Wat niet herkend wordt, valt weg. Kleur wordt nooit afgeleid uit kleurcodes ("110", "01") of uit foto's in de front.

## Wat er in Shopify ontbreekt (concreet)

Niets hiervan is in Shopify aangepast. Het zijn voorstellen voor de pipeline (`packages/catalog`) en de dev-store.

| # | Wat | Gevolg nu | Aanpassing |
|---|---|---|---|
| 1 | `brunic.kleurfamilie` ontbreekt bij **alle gordijnstoffen** (0/592) en bij **vinyl** (0/277). Behang 54%. | Geen kleurfilter bij stoffen. Bij vinyl alleen in vasttapijt. | Per **kleurvariant** `kleurfamilie` vullen. Kleurcodes zijn geen kleuren, dus via leveranciersfeed of fotolabeling zoals bij tapijten (`set-tapijt-tags.mjs`). **Gordijnstoffen: opgelost 28/10**: fototags nagekeken (562 goedgekeurd, 32 aangepast) en in Shopify gezet, zie `agent-work/filtersysteem.md`. Vinyl blijft open. |
| 2 | Behang: motief en stijl staan enkel in `brunic.specificaties`, niet in `brunic.motief`/`brunic.stijl`. | De front leidt ze af (werkt). Shopify zelf (S&D, Google-feed) ziet ze niet. | Pipeline schrijft ze naar de lijstvelden `motief`/`stijl` (keuzelijst), na het opschonen van de 53 motieven en 27 stijlen. De front gebruikt dan automatisch het metafield. |
| 3 | Lichtdoorlatendheid: ADO via "Transparantie", Artelux en Loft79 via "Dichtheid" (sinds 25/10 gelezen). 85 ADO-stoffen en 1 van Loft79 hebben geen van beide. | Lichtdoorlatendheid dekt 85%. | De 86 aanvullen in de pipeline. Op termijn een eigen metafield `brunic.lichtdoorlatendheid` (keuzelijst), zodat Artelux' "Inbetween/Transparant" ondubbelzinnig wordt. |
| 4 | Behang-eigenschappen (afwasbaar, nat verwijderbaar) enkel bij Boråstapeter. | Eigenschappen dekt 8% bij behang. | Uit de ESTAhome- en Origin-feeds halen indien beschikbaar. |
| 5 | Gebruiksklasse, plaatsing en poolhoogte enkel bij een deel van de vloerleveranciers. | Dekking 17–24%. | Leveranciersfeeds Beauflor/Lano/Balsan aanvullen. |
| 6 | Geen prijzen voor behang en stoffen (etalage). | Prijsfilter verborgen in die afdelingen. | Commerciële data (TODO B06). Verschijnt vanzelf. |
| 7 | Voorraad niet gevolgd. | Geen filter Beschikbaarheid. | Voorraad volgen in Shopify (TODO B01). Dan pas de filter terug. |
| 8 | Raamdecoratie: geen producten. | Afdeling onzichtbaar. | Bij de eerste producten: metafields `type`, `lichtdoorlatendheid`, `bediening` (ketting/veer/motor), `montage` (in/op de dag), maatwerk breedte × hoogte (offerteflow). Dan profiel `c01` aanvullen. |
| 9 | Search & Discovery-filters. | Niet nodig: de front filtert zelf. | Pas nodig als de front ooit via de Storefront API filtert (`productFilters`). Dan per metafield "filterable" + filter aanzetten in de S&D-app (handmatig, kan niet via API). |

## Beperkingen

- **Kleur en maat gelden per product, niet per variant-combinatie.** "Grijs + 170–240 cm" vindt ook een tapijt dat grijs is in 160 × 230 en beige in 200 × 290. Per variant filteren vraagt variantniveau in de lijst (latere stap). De tellingen zijn wel exact voor de gekozen definitie.
- **Prijsklassen mengen eenheden in gemengde lijsten** (m² vinyl naast vloerkleed per stuk). Binnen één afdeling speelt dat niet.
- **Schaal**: filteren in het geheugen op de server haalt 75–150 ms per gefilterde lijst (productiebuild, 2.724 producten behang). Ruim voldoende tot tienduizenden producten. Daarboven: zoekindex (Meilisearch/Typesense), zoals voorzien in `architectuur.md`.
- **Meertaligheid**: ID's in de URL zijn taalonafhankelijk. Labels staan nu in het Nederlands in het register en de normalisatie en moeten bij een tweede taal naar een woordenboek.

## Een filter toevoegen

1. De waarde moet in Shopify bestaan: liefst een metafield (lees het in `scripts/sync-shopify.mjs`), anders een specificatie.
2. `facet-normalisatie.ts`: zet de ruwe waarde om naar `product.facets[<sleutel>]` (via `facettenUitSpecs` of in de adapter), met één schrijfwijze.
3. `filters.ts`: één regel in `FACETS` (sleutel, label, weergave, volgorde, logica).
4. `src/data/filterprofielen.ts`: de sleutel in het profiel van de afdeling(en), op de plek volgens de volgorderegel.
5. `pnpm --filter @brunic/prototype test:filters`: de matrix toont dekking en waarden, de tests controleren elke waarde.

Een nieuwe afdeling: hoofdcategorie in `src/data/categories.ts` en een profiel met haar ID. Zonder profiel krijgt ze het gemengde.

## Getest op 24/10/2026

- `test:filters` (453 controles, echte catalogus, alle vier de afdelingen):
  - normalisatie-eenheden;
  - URL heen en terug;
  - elke getoonde waarde (aantal = lijst = handmatige telling);
  - OF binnen, EN tussen filters, EN in Eigenschappen;
  - lege combinaties (keuzes blijven staan);
  - sorteren met filter, paginering (geen dubbels of gaten);
  - oude links, vervallen en verborgen filters;
  - gemengde lijsten en automatische profielkeuze.
- HTTP-rooktest van 22 lijst-URL's (alle afdelingen, subcategorieën, zoeken, aanbiedingen, nieuw binnen, lege combinatie), op de dev-server en op een productiebuild: alle 200, aantallen in de server-HTML.
- Interactietest in headless Chrome, desktop 1366 px en mobiel 390 px, dev en productie (17 scenario's):
  - één filter, meerdere waarden, combinatie;
  - chip verwijderen, terug/vooruit;
  - sorteren met behoud van filters, meer tonen;
  - herladen, alles wissen, lege staat;
  - zoeken in een lange lijst, Escape geeft de focus terug;
  - mobiele lade: zelfde filters, groep blijft open, keuze bewaard na heropenen;
  - geen horizontale scroll, geen consolefouten.
- Niet getest: echte toestellen (iOS Safari, Android), schermlezers (NVDA/VoiceOver), grote catalogi boven 5.000 producten per afdeling.
