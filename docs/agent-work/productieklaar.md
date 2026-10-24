# Taak: productieklaar maken na de audit van 20/10/2026

**Eigenaar:** Alexander (met Claude) · gestart 20/10/2026 · bouwt verder op de niet-gecommitte metaobject-wijzigingen van `inhoud-metaobjects.md` (niets daarvan teruggedraaid).

**Buiten scope (beslissing Alexander 20/10):** juridische teksten (`data/content.ts` INFO_PAGES) en de verkoopeenheid / "per stuk"-terugval (`shopify-adapter.ts`). Prijsweergave valt buiten de audit.

## Bestanden in bewerking
- `apps/prototype/src/components/seo/json-ld.tsx` — escape van `<`
- `apps/prototype/src/components/product/product-view.tsx`, `app/(winkel)/product/[slug]/page.tsx` — PDP server-side, variantkeuze
- `apps/prototype/src/lib/leads/*` — klantfiches niet overschrijven, rate limiting, spamcheck
- `apps/prototype/src/components/commerce/cart-view.tsx`, `cart-ui.tsx`, `lib/store/*`, `app/api/kassa/route.ts` — winkelmand leeg na bestelling
- `apps/prototype/src/app/api/webhooks/shopify/route.ts`, nieuwe `app/api/catalogus/*`, `packages/catalog/register-webhooks.mjs` — catalogus actueel houden
- `apps/prototype/src/lib/melding.ts`, `src/instrumentation.ts`, `app/api/status/route.ts` — monitoring
- redirects van brunic.be (WooCommerce) → nieuwe URL's
- `apps/prototype/scripts/sync-shopify.mjs` — foto's doorbladeren
- `lib/inhoud/home.ts` — links in tegels valideren
- `.env.example`, `apps/prototype/README.md`, `apps/prototype/TODO.md`

## Status 20/10/2026 — code klaar, niets gecommit of gedeployd

Opgelost in code: PDP server-side (B02) · JSON-LD-escape · formulieren (B03: geen overschrijving, rate limit, `_t` verplicht) · winkelmand leeg na betaling + bfcache-knop · kassa geeft 400 i.p.v. stille val/502 · live beschikbaarheid (winkelmand, PDP) · catalogus herbouwt vanzelf (webhook + deploy hook, dagelijkse cron) · monitoring (`[ALERT]`, `ALERT_WEBHOOK_URL`, `instrumentation.ts`, `/api/status`) · homepage-links gevalideerd · foto's niet meer afgekapt (B07) · variantwissel zichtbaar (B09) · 2.061 oude brunic.be-URL's → 308 · `/api/producten` 100 i.p.v. 60 · ESLint (0 errors).

## Verificatie
- `tsc` ✅ · `eslint` ✅ (0 errors, 7 bewuste warnings `set-state-in-effect`) · `next build` ✅ (zonder prebuild-sync; momentopname 20/10 15:52).
- Lokale productiebuild: PDP-HTML met h1/bestelknop; crawl 300 pagina's = 300× 200, 0 PDP's zonder h1; alle 2.061 oude URL's eindigen op 200 (765 product, 846 categorie, 412 catalogus, 38 pagina); kassa-validatie (400/409) + 1 echte testcart (status "open", geen bestelling); formulieren in dry-run: spam, validatie, rate limit, nieuwsbrief; `/api/catalogus/vernieuwen` vergelijkt met Shopify (geen verschil); webhook 401 zonder HMAC; `[ALERT]` bij een serverfout; headless Chrome: `?variant=` wordt na het laden toegepast, 404 toont layout na hydratatie.
- Sync-query met 100 foto's getest op Shopify (alleen lezen).

## Niet getest (manueel / testwinkel)
- Afgeronde betaling → winkelmand leeg (aanname: Storefront `cart(id)` geeft `null` na checkout — verifiëren in de testbestelling).
- `bewaarKlant` tegen de Admin API (bestaande klant, telefoonnummer al in gebruik): niet uitgevoerd om geen klantfiches te wijzigen.
- Deploy hook + Shopify-webhooks `--producten` (bestaan pas na configuratie op Vercel/Shopify).
- Vercel Cron (enkel op Vercel).

## Open punten
- ✅ 20/10: demobestanden verwijderd (`git rm`), plus ongebruikte iconen `user`/`sparkle` en `routes.categoryProducts`. Dode-code-analyse (TypeScript): 0 onbereikbare bestanden, 0 ongebruikte exports in `src/`.
- ✅ 20/10: `apps/web` (oude storefront) verwijderd door Alexander; verwijdering gestaged, `pnpm-lock.yaml` opgeschoond, verwijzingen in code en levende docs (architectuur.md, packages/catalog) bijgewerkt. Gedateerde verslagen (overdracht, bouwstart, ADR) bewust ongewijzigd.
- `website_algemeen` / `website_header_footer` koppelen → spoor `inhoud-metaobjects.md`.
- 404 van dynamische routes (onbekende categorie/merk) heeft pas na hydratatie layout (Next 16; status 404 klopt).
- Performance: Lighthouse/PageSpeed opnieuw meten op de preview; 21 MB-momentopname per serverfunctie (cold start) — later opsplitsen of live queries.

## Volgende actie
Alexander/Jeroen: diff nakijken, committen, preview-deploy, Vercel-variabelen + deploy hook, `register-webhooks.mjs --producten`, testbestelling.
