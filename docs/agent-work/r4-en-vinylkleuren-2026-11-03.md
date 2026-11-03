# Audit 02/11 (R4), stalen op foto en vinylkleuren

Overdracht van 03/11/2026. Het rapport staat in `docs/audits/2026-11-02-webshop-qa/rapport.md`.

## Wat er veranderd is in de code

- **R4-01, -02, -04, -05 (`listing.ts`, `view.ts`):** elke variant kent nu haar eerste beeld en hoverbeeld, gelijk aan de productpagina. Kaart en staal halen beeld, prijs en link uit dezelfde variant. De aparte vormfoto's (`vormen`) zijn weg.
- **R4-02:** zonder vormkeuze krijgt de klant liefst een gewone maat. Daardoor kan een kaart "vanaf € 369" zeggen terwijl een ronde maat € 349 kost. Dat is een bewuste keuze: prijs en link blijven zo uit één variant komen.
- **R4-03 (`product-listing.tsx`):** elke wijziging van een Kleur-, Maat-, Vorm- of Prijsfilter zet het gekozen staal uit.
- **R4-06 (`product-card.tsx`):** "+N" opent op dezelfde variant als de kaart.
- **Stalen (`shopify-adapter.ts`):** in elke afdeling de vlakke foto van die kleur. Bolletje enkel zonder vlakke foto: 11 van de 11.751 kleuren.
- **Levertermijnen (`shopify-adapter.ts`):** "Levertijd" en "Levertermijn" staan niet meer op de site, als kenmerk noch in de beschrijving. Het gaat om 276 producten: 274 vinyl en 2 verlichting. De data staat nog in Shopify.

## Verificatie

- `test:filters`: 535 geslaagd, 0 mislukt.
- De lijstcontrole van de audit op een lokale productiebuild, met de nieuwe regels in het model: 1.112 lijsten, 79.251 kaarten, 43.930 tellingen. Enkel de 29 meldingen van R4-10 blijven over (zie open punten).

  | Controle | Audit 02/11 | Nu |
  |---|---|---|
  | Prijs na een klik op een staal wijkt af van de pagina | 1.006 | 0 |
  | Staalbeeld wijkt af van de eerste foto op de pagina | 1.015 | 0 |
  | Kaartbeeld wijkt af van de eerste foto op de pagina | 354 | 0 |
  | Staal van de kaartkleur opent een andere variant | 73 | 0 |
  | Sfeerfoto vooraan terwijl er iets anders is | 20 | 0 |
  | Hover is hetzelfde beeld als de kaart | 20 | 0 |

- Browser (desktop en geëmuleerd mobiel, lokale productiebuild): de voorbeelden uit de audit (Rampur, Papercut, Lech, Lamego, POP, Koren), fotostalen op kaart en productpagina, geen levertermijn, hover, "meer tonen", geen consolefouten.
- Niet getest: echte toestellen, schermlezers, winkelmand, kassa en formulieren.

## Vinylkleuren

Alexander keurde op 02/11 alle voorstellen in de tagreview goed (273 goedgekeurd, 4 aangepast): https://claude.ai/artifact/1b5jvMDydp1ZBgBdZvrS3g

- Export, buiten de repo: `../Data/BRUNIC_VINYL_TAGS_2026-11-02.json`.
- Proefrun: 1.924 lege velden (1.745 kleurfamilies, 179 accentkleuren), 0 problemen.
- Wegschrijven pas nadat deze code op `master` staat, anders geeft de volgende build bolletjes in plaats van foto's:

  ```
  node packages/catalog/set-tapijt-tags.mjs ../Data/BRUNIC_VINYL_TAGS_2026-11-02.json --type Vinylvloer --go
  ```

- De velden komen pas op de site na een nieuwe build, omdat de webhooks nog niet aan staan.

## Open punten

- **Fotolabels vinyl:** https://claude.ai/artifact/FsFhsr7cCKXpLiHDGbQcUS wacht op de klaarmelding van Alexander. Daarna: keuzes uitlezen, script schrijven, proefrun, go, wegschrijven. Tot dan beginnen 28 vinylkaarten met een kamerfoto.
- **R4-10, Shopify-data:** bij 15 producten hangt de foto volgens de data aan een andere kleur. Toscana B592 is bekeken en klopt niet. Toscana en 3 passementen raken de kaart.
- **Levertermijnen:** navragen bij Brunic of ze mogen terugkomen. Goodnight (Artelux) zegt nog "korte levertijd" in de lopende tekst, en 9 Nordic Folk-producten tonen "Leverbaar tot (volgens leverancier): 12/26". Die twee zijn niet aangepast.
- **Andere restpunten uit de audit:** R4-07, R4-08, R4-09, R4-12 tot en met R4-19.
- **Dossier:** Jeroen logt in J.A.R.V.I.S "geen voorraad tonen", "geen levertermijnen tonen", "stalen op foto" en "Desso onder Tarkett".

## Volgende actie

Na de push van deze commit: de vinylkleuren wegschrijven. Neem de fotolabels mee als ze klaar zijn, en lever daarna een nieuwe build op om beide op de site te krijgen.
