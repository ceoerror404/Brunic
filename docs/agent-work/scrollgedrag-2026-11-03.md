# Scrollgedrag — audit en oplossingen (03/11/2026)

**Toestand:** klaar op `master` in de werkmap, **niet gecommit en niet gepusht**. Productie (`brunic.vercel.app`) draait dit nog niet. Ook `b9285dd` (filter- en headerfix van een andere sessie) staat nog niet op `origin`.

**Verificatie:** lokale productiebuild (`next build`, bestaande momentopname) in headless Chrome 156 op desktop en mobiele emulatie: 143/143 scrollcontroles. Typecheck ok, lint 0 fouten (7 oude waarschuwingen), `test:filters` 537/537.

**Niet getest:** echte toestellen, Safari, Firefox, het gevoel met een echte hand of trackpad (de input was synthetisch).

## Hoe het nu werkt

| Onderwerp | Regeling | Waar |
|---|---|---|
| Paginawissel en Terug | Springen meteen. Geen `scroll-behavior: smooth` op `html`: in Next 16 animeert dat elke paginawissel en landt de pagina achter de header. | `globals.css` |
| Ankers op dezelfde pagina | Animeren via een tijdelijke stijl tijdens de klik; de browser regelt adres, geschiedenis en focus. Respecteert reduced motion. | `ui/vloeiende-ankers.tsx` |
| Landen onder de header | `scroll-margin-top` op inhoud en focusbare elementen; `.kleeft` zondert kleverige zones uit. In lijsten komt `--filterbalk-h` erbij. | `globals.css`, `product-listing.tsx` |
| Scroll-anchoring | Uit, op `body`. De oude regel op `html` had geen effect en werd verborgen door smooth. | `globals.css` |
| Header inklappen | Attribuut `data-header-ingeklapt` op `html` + klasse `.mee-met-header`, geen CSS-variabele: raakt ±40 elementen in plaats van de hele pagina. | `site-header.tsx`, `globals.css` |
| Positie in een lijst | Bewaard bij een klik op een kaart (`history.state.lijstY`) en bij vertrek (`sessionStorage`), eenmalig gebruikt. | `product-listing.tsx` |
| Pagina vergrendelen | `vergrendelPagina()` vangt de scrollbalk op met padding. | `lib/site/scroll.ts` |
| Inklappen, wiel in paneel | `useHoudInBeeld`, `useWielBinnen`. | `lib/site/scroll.ts` |

## Niet doen (getest, gaf nieuwe problemen)

- **`scroll-padding-top` op `html`:** focus in de kleverige header of filterbalk laat de pagina tot ±1000 px omhoog springen.
- **`history.replaceState` in `pagehide`:** Chrome negeert het, daarom `sessionStorage`.
- **`flex-wrap` op de stalen zonder breedtegrens:** "+N" springt op 390 px naar een eigen regel.

## Open punten

- **PageDown en spatie op lijstpagina's (desktop):** slaan ±69 px (900 px hoog) tot ±86 px (768 px hoog) over, door de kleverige stapel. Chrome houdt daarvoor alleen rekening met `scroll-padding`, en dat kan hier niet (zie boven). De toetsen onderscheppen zou scrollkaping zijn. Oplossen kan door de balk lager te maken wanneer ze kleeft: ontwerpkeuze.
- **Bestelkolom op lage schermen:** de bestelknop blijft zichtbaar en vanaf 730 px hoog past alles klikbaars. Daaronder valt de laatste link 5 tot 75 px onder de rand tot aan het einde van de kolom (gemeten op 720 en 650 px hoog). `Art.nr.` kan ook op 768 px en 730 px wegvallen.
- **Ontwerpkeuzes om te bevestigen:** de mobiele knop "Filters" bij omhoog scrollen, en de rij "Collectie … / Alles bekijken" die op desktop van de kleverige kolom naar onder de galerij verhuisde.

## Volgende actie

Commit en push na akkoord (elke push naar `master` = productie), dan op `brunic.vercel.app` hertesten en op een echte iPhone en Android-toestel proberen.
