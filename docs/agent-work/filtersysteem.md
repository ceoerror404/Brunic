# Taak: filtersysteem — audit en optimalisatie (alle hoofdcategorieën)

**Eigenaar:** Alexander (met Claude) · 24/10/2026 · bouwt verder op commit `8806232` ("Verfijning filters").
Raakt niet aan de niet-gecommitte wijzigingen van `inhoud-metaobjects.md` (README, merken, beelden, categorie-teksten, content, home, seo-text).

## Toestand
Klaar en getest, **niet gecommit en niet gepusht** (push naar master = productie; Jeroen pusht of geeft go). Ontwerp, matrix, normalisatieregels en wat Shopify mist: `docs/filtersysteem.md`.

## Gewijzigde bestanden
- `apps/prototype/src/lib/catalog/filters.ts`: register, OF/EN, waarde-ID's, geen Beschikbaarheid/Verkocht per
- `apps/prototype/src/lib/catalog/facet-normalisatie.ts` (nieuw)
- `apps/prototype/src/data/filterprofielen.ts` (nieuw)
- `apps/prototype/src/lib/catalog/listing.ts`: profiel, geen filterdata naar de browser
- `apps/prototype/src/lib/catalog/shopify-adapter.ts`: facetten via de normalisatielaag
- `apps/prototype/src/components/catalog/product-listing.tsx`
- `apps/prototype/src/app/(winkel)/catalogus/[...pad]/page.tsx`
- `apps/prototype/scripts/test-filters/` (nieuw) + `package.json` → `test:filters`
- `docs/filtersysteem.md` (nieuw), `docs/architectuur.md` §Filters

## Verificatie
- typecheck en lint schoon, `next build` geslaagd
- `test:filters`: 453/453
- HTTP-rooktest: 22/22 (dev en productie)
- headless Chrome: 17/17 (dev en productie), geen consolefouten

## Vervolg 25/10: gordijnstoffen taggen (kleur, motief, stijl)
Beslist met Alexander: Type blijft Gordijnstof/Passement; kleur, motief en stijl uit de foto's; eerst een reviewpagina, dan pas Shopify.
- **Lichtdoorlatendheid** leest nu ook "Dichtheid" (Artelux, Loft79): dekking stoffen 60% → 85%. Code + test in `facet-normalisatie.ts`.
- **Fototags** voor 594 stoffen / 4.001 kleurvarianten: fotobladen uit de Shopify-CDN (headless Chrome), 8 parallelle taggers met één taggids (20 kleurfamilies met definities, motief- en stijllijst = die van de tapijten), controlescript per batch, ADO-kleurcodecontrole (zelfde code = meestal zelfde kleur → 95 afwijkers gemarkeerd).
- **Reviewpagina**: https://claude.ai/artifact/Wqk5QNGMJ5WDS7LFSbGch3 (privé; delen via het Share-menu). Per stof goedkeuren of aanpassen; "Per kleur" toont alle stalen van één kleurfamilie naast elkaar. 434 stoffen hebben een twijfelnotitie.
- **Push**: `packages/catalog/export-tagreview.mjs` (db-dump → export) en `set-tapijt-tags.mjs --type Gordijnstof,Passement` (nieuw: `--type`, lognaam per export). Dry-run op 25/10: 6.258 metafields (kleurfamilie 4.595, motief 576, stijl 576, accentkleuren 511), 17 Shopify-producten van dat type staan niet op de site en blijven ongemoeid. **Nog niets geschreven.**
- Werkbestanden (bladen, tags, voorstellen) staan enkel in de sessie-scratchpad; de tags zitten ook in de opslag van de reviewpagina.

Databevindingen voor de opschoning:
- Loft79 6949 = Artelux Zilver (zelfde foto's en kleuren): dubbel ingevoerd?
- Verschillende kleuren met dezelfde foto: Uni 3173 (20/55/92), Waterlily (383/995), vermoedelijk Uni 3174 (20/75).
- Prado 200 oogt lavendel, terwijl code 200 elders wit is. Naran 200 heeft enkel een sfeerfoto.
- Witte voiles staan vaak op een grijze achtergrond gefotografeerd, waardoor ze grijs ogen.
- `portland` (Loft79) is een print, maar staat niet in `stoffen-tekening`.

## 28/10: review afgewerkt en in Shopify gezet
- Review door Alexander: 594/594 beoordeeld (562 goedgekeurd, 32 aangepast).
- Export: `../Data/BRUNIC_STOFFEN_TAGS_2026-10-28.json`, gecontroleerd tegen de keuzelijsten (0 ongeldig).
- Push naar `brunic-3`: 6.263 metafields, alle nieuw, 0 overschreven (kleurfamilie 4.595, motief 576, stijl 576, accentkleuren 516). Controle-dry-run achteraf: 0 te schrijven.
  - De eerste twee runs liepen vast op de Admin API-snelheidslimiet (THROTTLED). `_shopify.mjs` probeert sindsdien opnieuw met oplopende wachttijd.
  - De log van de laatste run (463 waarden): `../Data/BRUNIC_STOFFEN_TAGS_SHOPIFY_PUSH_LOG_2026-10-28-14-49-25.json`. De vroegere runs schreven geen log, maar alle velden waren vooraf leeg.
- Momentopname opnieuw gesynct (4.113 producten). Gordijnen & stoffen: Kleur 100%, Motief 97%, Stijl 97% (passementen zonder motief/stijl). `test:filters` 505/505.
- Filterprofiel stoffen: Motief op plaats 4 (na Lichtdoorlatendheid), Materiaal en Stofbreedte naar het technische blok.
- Bij livegang: dezelfde export met `set-tapijt-tags.mjs` tegen Bruno's store.

## Open
- Shopify-data aanvullen: `docs/filtersysteem.md` §Wat er in Shopify ontbreekt (kleur voor vinyl, motief/stijl van behang naar metafields, lichtdoorlatendheid voor de 86 stoffen zonder data).
- Volgorde van de filters herzien zodra GA4 filtergebruik meet.
- Echte toestellen en schermlezers niet getest.
