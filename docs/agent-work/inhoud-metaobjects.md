# Taak: inhoud beheerbaar via Shopify-metaobjects

**Eigenaar:** Alexander (met Claude) · gestart 13/10/2026 (oude pc, enkel Shopify-kant), code vanaf 19/10/2026.

## Doel
Brunic past zelf teksten en foto's van de site aan in de Shopify-admin (**Inhoud › Metaobjects**), zonder ons en zonder deploy. Geen extra CMS of account: het zit in het Basic-plan en op Bruno's naam (eigendomsprincipe).

## Hoe het werkt
- `apps/prototype/src/lib/inhoud/shopify.ts` leest metaobjects via de Storefront API (alle definities staan op `PUBLIC_READ`), gecachet met tag `inhoud`.
- Wijziging in de admin → webhook `metaobjects/*` of `collections/update` → `/api/webhooks/shopify` → `revalidateTag("inhoud")` → meteen live. Zonder webhook: na hoogstens 5 min.
- Shopify onbereikbaar of metaobject weg → de standaardteksten uit `src/data/` (nooit een lege pagina).
- Velden: titels, knoppen, links en hoofdfoto's vallen terug op de standaard als ze leeg zijn; optionele velden (labels, ondertitels, 2e knop) verdwijnen als ze leeg zijn; een lege tegellijst verbergt die rij.

## Status per metaobject-type (dev-store brunic-3: alle 21 bestaan en zijn gevuld)

| Type | Admin-naam | Gekoppeld in code |
|---|---|---|
| `pagina_home` + `onderdeel_tegel` | Pagina \| Home, Onderdeel \| Tegel | ✅ 19/10 (`lib/inhoud/home.ts`) |
| `categorie_inhoud` | Categorie \| Tekst en foto | ✅ 19/10 (`lib/inhoud/categorie.ts`): ondertitel, intro, foto (banner + tegels + menu) |
| `website_algemeen` | Website \| Algemeen | ⬜ (vervangt `SITE` in `lib/site/config.ts`: adres, uren, telefoon, socials, logo) |
| `website_header_footer` + `onderdeel_servicebericht`, `onderdeel_pluspunt` | Website \| Header en footer | ⬜ (servicebalk, USP-band, footer) |
| `pagina_catalogus`, `pagina_merken`, `pagina_nieuw_binnen`, `pagina_aanbiedingen` | Pagina \| … | ⬜ (titel + intro, eenvoudig) |
| `merk` | Merk \| Logo en foto | ⬜ (`data/merken.ts`) |
| `dienst`, `pagina_op_maat` | Dienst, Pagina \| Op maat & plaatsing | ⬜ (`data/content.ts` SERVICES, WERKWIJZE) |
| `artikel`, `pagina_inspiratie` | Inspiratie-artikel | ⬜ (rich text → renderer nodig; `artikel` is publiceerbaar: enkel `ACTIVE` tonen) |
| `infopagina` + `onderdeel_faq` | Infopagina | ⬜ (rich text; juridische pagina's: wijzigingen blijven door ons te valideren) |
| `pagina_winkel_contact` | Pagina \| Winkel & contact | ⬜ |
| `pagina_product` | Pagina \| Product | ⬜ (accordeons op elke PDP; retourtekst = TODO B17) |
| `onderdeel_adviesblok` | Onderdeel \| Adviesblok per afdeling | ⬜ (categorie-landing) |

## Open punten
- **Webhooks registreren ná de deploy** die de route bevat: `node packages/catalog/register-webhooks.mjs https://brunic.vercel.app` (eerst `--dry-run`). Niet vóór de deploy: falende leveringen laten Shopify de webhook uitschakelen.
- Op Vercel moet `SHOPIFY_CLIENT_SECRET` (of `SHOPIFY_WEBHOOK_SECRET`) gezet zijn, anders weigert de route elke webhook (401).
- Bij de overdracht naar Bruno's Basic-store: metaobject-definities + inhoud meeverhuizen (script nodig; de definities zijn niet in de repo vastgelegd, enkel in de dev-store).
- Interne links in tegels zijn vrije tekst (`/catalogus/behang`). Sinds 20/10 gevalideerd (`lib/site/doel.ts` → `bestaatLink`): een link naar een onbestaande pagina wordt overgeslagen met een waarschuwing in de log. **Nu in de dev-store:** trends-tegel "Grafisch & speels" → `/product/behang-nastri-arte` bestaat niet (meer) — aanpassen in de admin.

## Verificatie 19/10
- typecheck ✅, `next build` ✅ (home statisch + 5 min verversing).
- End-to-end op de dev-server: ondertitel Behang gewijzigd via Admin API → pagina toont nog de cache → webhook met fout secret 401 → met juist secret 200 → pagina toont de nieuwe tekst → teruggezet. ✅
- Niet getest: terugval bij een Shopify-storing (codepad: `null` → standaard), webhooks vanuit Shopify zelf (pas na deploy + registratie).
- In de dev-store hersteld: `pagina_home.hero_ondertitel` stond op "TEST 20:26:46 tekstwijziging", `inspiratie_tegels` was leeg.
