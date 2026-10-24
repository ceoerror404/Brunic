# Taak: tapijt-tags (motief, stijl, kleurfamilie) uit foto's → Shopify → site

**Eigenaar:** Alexander (met Claude) · 21–22/10/2026 · bouwt verder op de niet-gecommitte wijzigingen van `productieklaar.md`, `seo-groei.md` en `inhoud-metaobjects.md` (niets teruggedraaid).

## Wat er gebeurd is
- Alle 172 vloerkleden (387 kleurvarianten) getagd op basis van de productfoto's en één voor één nagekeken op een reviewpagina (claude.ai-artifact). Proef van 20: 16 ongewijzigd; volledige run: 144/152 ongewijzigd, 9 van 669 velden aangepast.
- Export van de eindwaarden: `../Data/BRUNIC_TAPIJT_TAGS_2026-10-22.json` (buiten de repo, bij de andere pipeline-bestanden).
- In de dev-store `brunic-3` gezet met `packages/catalog/set-tapijt-tags.mjs` (idempotent, dry-run standaard, `--go` om te schrijven, log met oude waarden in `../Data/BRUNIC_TAPIJT_TAGS_SHOPIFY_PUSH_LOG_*.json`):
  - `brunic.kleurfamilie` per **variant** (hoofdkleur van de kleurvariant, alle maten) — 257 automatisch afgeleide waarden vervangen.
  - `brunic.kleurfamilie` op het **product** (1 waarde: meest voorkomende hoofdkleur).
  - Nieuwe definities `brunic.motief` en `brunic.stijl`: `list.single_line_text_field`, keuzelijst als validatie, `PUBLIC_READ`. Lijsten in het script.
  - Nieuwe variant-definitie `brunic.accentkleuren` (lijst, keuzelijst = kleurfamilie): 1.833 varianten.

## Foto's (22/10)
- Eerste foto van elk vloerkleed én van elke kleur = productfoto (172/172, 387/387). Ragolle-labels visueel nagekeken (420 foto's, indeling in `../Data/BRUNIC_RAGOLLE_FOTO_INDELING_2026-10-22.json`); 387 alt-labels rechtgezet en media herschikt met `packages/catalog/set-tapijt-fotos.mjs` (log in `../Data/BRUNIC_TAPIJT_FOTOS_SHOPIFY_PUSH_LOG_*.json`).
- Site: `fotoRang` in de adapter zet bij tapijten de productfoto vooraan; foto's krijgen een `vorm` als ze de variantfoto van ronde/organische/loper-maten zijn; facet `vorm` uit de maten (Pebble = Organisch). In Rond / Speciale vormen en bij een vormfilter toont de kaart de foto in die vorm (`VORM_VAN_CATEGORIE` in view.ts, `inVorm` in listing.ts).
- Ragolle heeft geen ronde of Pebble-foto's (Ripley 0034, Mehari 0474, Rampur 0098/0477/0600): daar blijft de rechthoekige foto. Aan Ragolle vragen.

## Schemakeuze
`patroon` en `stijl_design` bestaan als velden met één waarde (README zegt "lijst" voor `stijl_design`). 41 tapijten hebben 2 motieven en 91 hebben 2 stijlen, dus nieuwe lijstvelden. `patroon`/`stijl_design` blijven ongemoeid (gordijnstoffen). Behang kan later naar dezelfde velden, na het opschonen van zijn 78 waarden.

## Bestanden in bewerking (apps/prototype)
- `scripts/sync-shopify.mjs` — leest `motief`, `stijl` (product) en `kleurfamilie` (variant)
- `src/lib/catalog/shopify-adapter.ts` — facetten `motief`, `stijl`; `kleur` = product + alle varianten; Motief/Stijl bij de kenmerken
- `src/lib/catalog/filters.ts` — filters Motief en Stijl; ontbrekende kleurstalen (Turquoise, Geel, Paars, Multicolor, Goud/metallic, Zilver/metallic); `kleurStaal()` bouwt het kleurbolletje (1 kleur effen, 2+ kleuren verdeeld: hoofdkleur links, accenten rechts)
- Kleurbolletjes i.p.v. foto-uitsnede: enkel als élke kleur van het product een bolletje heeft en ze allemaal verschillen (anders blijft de foto). Vloerkleden: 79 met bolletjes (69 meerkleurig), 10 houden de foto.

- `src/lib/catalog/types.ts` (`ProductImage.vorm`), `src/lib/catalog/view.ts`, `src/lib/catalog/listing.ts`, `src/app/(winkel)/catalogus/[...pad]/page.tsx` — vormfoto's in de lijst

## Open
- Niet gecommit of gedeployd (git ontbreekt in het pad op deze pc; GitHub Desktop wel).
- Search & Discovery-filters (enkel nodig voor Shopify's eigen zoek/filters) handmatig aanzetten.
- Bij livegang: dezelfde run tegen Bruno's store (`set-tapijt-tags.mjs` met de export).
