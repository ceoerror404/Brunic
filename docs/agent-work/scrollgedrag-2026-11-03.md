# Scrollgedrag — audit en oplossingen (03/11/2026)

**Toestand:** live op `brunic.vercel.app` via `493917a` (03/11/2026, 23:12), inclusief `b9285dd` (filter- en headerfix van een andere sessie). Route en vaste band zijn daarna ook op de live site gecontroleerd (39/39); de overige groepen enkel op de lokale build van dezelfde code.

**Verificatie:** lokale productiebuild (`next build`, bestaande momentopname) in headless Chrome 156 op desktop en mobiele emulatie, inclusief controles op de vaste zwarte band. Typecheck ok, lint 0 fouten (7 oude waarschuwingen), `test:filters` 537/537 (gedraaid vóór de bandwijziging, die de filterlogica niet raakt).

**Niet getest:** echte toestellen, Safari, Firefox, het gevoel met een echte hand of trackpad (de input was synthetisch).

## Hoe het nu werkt

| Onderwerp | Regeling | Waar |
|---|---|---|
| Paginawissel en Terug | Springen meteen. Geen `scroll-behavior: smooth` op `html`: in Next 16 animeert dat elke paginawissel en landt de pagina achter de header. | `globals.css` |
| Ankers op dezelfde pagina | Animeren via een tijdelijke stijl tijdens de klik; de browser regelt adres, geschiedenis en focus. Respecteert reduced motion. | `ui/vloeiende-ankers.tsx` |
| Landen onder de header | `scroll-margin-top` op inhoud en focusbare elementen; `.kleeft` zondert kleverige zones uit. In lijsten komt `--filterbalk-h` erbij. | `globals.css`, `product-listing.tsx` |
| Scroll-anchoring | Uit, op `body`. De oude regel op `html` had geen effect en werd verborgen door smooth. | `globals.css` |
| Header inklappen | De zwarte band en de logorij blijven altijd staan (106 px desktop, 94 px mobiel); enkel de navigatierij of het zoekveld klapt weg. Attribuut `data-header-ingeklapt` op `html` + klasse `.mee-met-header`, geen CSS-variabele: raakt ±40 elementen in plaats van de hele pagina. | `site-header.tsx`, `globals.css` |
| Positie in een lijst | Bewaard bij een klik op een kaart (`history.state.lijstY`) en bij vertrek (`sessionStorage`), eenmalig gebruikt. | `product-listing.tsx` |
| Pagina vergrendelen | `vergrendelPagina()` vangt de scrollbalk op met padding. | `lib/site/scroll.ts` |
| Inklappen, wiel in paneel | `useHoudInBeeld`, `useWielBinnen`. | `lib/site/scroll.ts` |

## Niet doen (getest, gaf nieuwe problemen)

- **`scroll-padding-top` op `html`:** focus in de kleverige header of filterbalk laat de pagina tot ±1000 px omhoog springen.
- **`history.replaceState` in `pagehide`:** Chrome negeert het, daarom `sessionStorage`.
- **`flex-wrap` op de stalen zonder breedtegrens:** "+N" springt op 390 px naar een eigen regel.

## Open punten

- **PageDown en spatie op lijstpagina's (desktop):** slaan ±99 px (900 px hoog) tot ±116 px (768 px hoog) over, door de kleverige stapel; 30 px meer dan vóór de vaste band. Chrome houdt daarvoor alleen rekening met `scroll-padding`, en dat kan hier niet (zie boven). De toetsen onderscheppen zou scrollkaping zijn. Oplossen kan door de balk lager te maken wanneer ze kleeft: ontwerpkeuze.
- **Bestelkolom op lage schermen:** de bestelknop blijft op alle gemeten schermen zichtbaar (tot 650 px hoog). Op producten met een lange kolom valt de laatste link tot aan het einde van de kolom onder de rand: 20–35 px op 720–730 px hoog, 43–105 px op 650 px hoog. Vanaf 768 px hoog past alles klikbaars.
- **Ontwerpkeuzes om te bevestigen:** de mobiele knop "Filters" bij omhoog scrollen, en de rij "Collectie … / Alles bekijken" die op desktop van de kleverige kolom naar onder de galerij verhuisde.

## Volgende actie

Op een echte iPhone en Android-toestel proberen, en in Safari en Firefox. De twee ontwerpkeuzes hierboven laten bevestigen.
