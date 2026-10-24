#!/usr/bin/env node
// set-tapijt-fotos.mjs — eerste foto van elk vloerkleed = de productfoto, niet een interieurfoto.
//   1. Ragolle: fotolabels in de alt-tekst rechtzetten volgens de visuele indeling
//      ("– productfoto –", "– sfeerfoto –", "– detailfoto –"); bij Ragolle kloppen die vaak niet.
//   2. Alle vloerkleden: media herschikken — productfoto's eerst, dan overige, details, sfeerfoto's
//      (dezelfde volgorde als de site, zie fotoRang in apps/prototype/src/lib/catalog/shopify-adapter.ts).
//   3. Een ronde productfoto (uit de indeling) wordt de variantfoto van de ronde maten van die kleur.
// Idempotent; dry-run standaard; log met de oude waarden.
//
//   node packages/catalog/set-tapijt-fotos.mjs <indeling.json> [--go]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { admin, DOMAIN } from "./_shopify.mjs";

const GO = process.argv.includes("--go");
const pad = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!pad) {
  console.error("Gebruik: node packages/catalog/set-tapijt-fotos.mjs <indeling.json> [--go]");
  process.exit(1);
}
// [{ handle, fotos: [{ bestand: "<bestandsnaam op de CDN>", soort: product|sfeer|detail, vorm }] }]
const indeling = new Map(JSON.parse(readFileSync(pad, "utf8")).map((p) => [p.handle, new Map(p.fotos.map((f) => [f.bestand, f]))]));
const LABEL = { product: "productfoto", sfeer: "sfeerfoto", detail: "detailfoto" };
const VORM = { rond: "Rond", organisch: "Organisch", loper: "Loper" };

const bestandsnaam = (url) => url.split("?")[0].split("/").pop();
const LABEL_RE = /(\s[–-]\s*)(productfoto|foto|sfeerfoto|detailfoto|hoekfoto)(\s[–-]\s*)/i;

// Zelfde logica als de site.
function fotoRang(alt) {
  if (/\s[–-]\s*rolfoto/i.test(alt)) return 9;
  if (/\s[–-]\s*(productfoto|kleurstaal)/i.test(alt)) return 0;
  if (/\s[–-]\s*sfeerfoto/i.test(alt)) return 3;
  if (/\s[–-]\s*(detailfoto|hoekfoto)/i.test(alt)) return 2;
  return 1;
}
function vormVanMaat(maat) {
  if (/staal/i.test(maat)) return undefined;
  if (/^\s*rond\b|ø/i.test(maat)) return "Rond";
  if (/^\s*(organisch|ovaal|pebble|vrije vorm)/i.test(maat)) return "Organisch";
  if (/^\s*loper\b/i.test(maat)) return "Loper";
  const m = maat.match(/(\d+)\s*[×x]\s*(\d+)/);
  if (m) return m[1] === m[2] ? "Vierkant" : "Rechthoekig";
  return undefined;
}
const BIJZONDER = new Set(["Rond", "Organisch", "Loper"]);

const shop = [];
let cursor = null;
do {
  const d = await admin(
    `query($c:String){ products(first:20, after:$c, query:"product_type:Vloerkleed"){
      nodes{ id handle vendor
        media(first:250){ nodes{ id alt ... on MediaImage { image { url } } } }
        variants(first:100){ nodes{ id selectedOptions{ name value } media(first:1){ nodes{ id } } } } }
      pageInfo{ hasNextPage endCursor } } }`,
    { c: cursor },
  );
  shop.push(...d.products.nodes);
  cursor = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
} while (cursor);

const altWijzigingen = [];
const herschikken = [];
const variantFotos = [];
const problemen = [];

for (const p of shop) {
  const media = p.media.nodes.filter((m) => m.image?.url);
  const ind = indeling.get(p.handle);
  const kleurVan = (alt) => alt?.match(/\s[–-]\s*kleur\s+(.+)$/i)?.[1]?.trim();

  // 1. Labels (enkel waar een indeling bestaat).
  const alt = new Map(media.map((m) => [m.id, m.alt ?? ""]));
  const vormUitIndeling = new Map();
  if (ind) {
    for (const m of media) {
      const f = ind.get(bestandsnaam(m.image.url));
      if (!f) { problemen.push(`${p.handle}: foto ${bestandsnaam(m.image.url)} niet in de indeling`); continue; }
      if (VORM[f.vorm] && f.soort === "product") vormUitIndeling.set(m.id, VORM[f.vorm]);
      const oud = alt.get(m.id);
      if (!LABEL_RE.test(oud)) continue;
      const nieuw = oud.replace(LABEL_RE, `$1${LABEL[f.soort]}$3`);
      if (nieuw !== oud) { altWijzigingen.push({ id: m.id, wat: p.handle, oud, nieuw }); alt.set(m.id, nieuw); }
    }
  }

  // Vorm per foto: variantfoto die enkel bij één bijzondere vorm hoort, of de indeling.
  const maatNaam = (v) => v.selectedOptions.find((o) => !/kleur|color|colour/i.test(o.name) && o.name !== "Title");
  const vormVanVariant = (v) => { const o = maatNaam(v); return o ? vormVanMaat(o.value) : undefined; };
  const perMedia = new Map();
  for (const v of p.variants.nodes) {
    const id = v.media.nodes[0]?.id;
    if (!id) continue;
    if (!perMedia.has(id)) perMedia.set(id, new Set());
    perMedia.get(id).add(vormVanVariant(v) ?? "?");
  }
  const vormVanMedia = (id) => { const s = perMedia.get(id); const e = s?.size === 1 ? [...s][0] : undefined; return BIJZONDER.has(e) ? e : vormUitIndeling.get(id); };
  const vormen = [...new Set(p.variants.nodes.map(vormVanVariant).filter(Boolean))];
  const eigenVorm = vormen.length === 1 && BIJZONDER.has(vormen[0]) ? vormen[0] : undefined;

  // 3. Ronde productfoto uit de indeling → variantfoto van de ronde maten van die kleur.
  for (const [mediaId, vorm] of vormUitIndeling) {
    const kleur = kleurVan(alt.get(mediaId));
    for (const v of p.variants.nodes) {
      const k = v.selectedOptions.find((o) => /kleur|color|colour/i.test(o.name))?.value;
      if (vormVanVariant(v) !== vorm || (kleur && k && k !== kleur)) continue;
      if (v.media.nodes[0]?.id === mediaId) continue;
      variantFotos.push({ productId: p.id, wat: `${p.handle} [${v.selectedOptions.map((o) => o.value).join(" / ")}]`, variantId: v.id, oud: v.media.nodes[0]?.id ?? null, nieuw: mediaId });
    }
  }

  // 2. Herschikken.
  const rang = (m) => fotoRang(alt.get(m.id)) + (vormVanMedia(m.id) && vormVanMedia(m.id) !== eigenVorm ? 0.5 : 0);
  const gewenst = [...media].sort((a, b) => rang(a) - rang(b));
  // Shopify voert de moves na elkaar uit: altijd de volledige volgorde sturen, anders schuiven de rest mee.
  if (gewenst.some((m, i) => media[i].id !== m.id)) {
    const moves = gewenst.map((m, i) => ({ id: m.id, newPosition: String(i) }));
    herschikken.push({ id: p.id, wat: p.handle, voor: media.map((m) => m.id), moves, eerstNu: alt.get(media[0].id), eerstStraks: alt.get(gewenst[0].id) });
  }
}

console.log(`winkel: ${DOMAIN} · ${shop.length} vloerkleden`);
console.log(`alt-labels te wijzigen: ${altWijzigingen.length}`);
altWijzigingen.slice(0, 5).forEach((x) => console.log(`  ${x.oud}  →  ${x.nieuw}`));
console.log(`producten te herschikken: ${herschikken.length} (eerste foto wordt een productfoto bij ${herschikken.filter((h) => fotoRang(h.eerstStraks) === 0 && fotoRang(h.eerstNu) !== 0).length})`);
console.log(`ronde/organische variantfoto's te koppelen: ${variantFotos.length}`);
const zonderProduct = shop.filter((p) => !p.media.nodes.some((m) => fotoRang((altWijzigingen.find((a) => a.id === m.id)?.nieuw ?? m.alt) ?? "") === 0)).map((p) => p.handle);
console.log(`vloerkleden zonder enige productfoto (sfeerfoto blijft eerst): ${zonderProduct.length}${zonderProduct.length ? " — " + zonderProduct.slice(0, 8).join(", ") : ""}`);
if (problemen.length) { console.log(`problemen (${problemen.length}):`); problemen.slice(0, 10).forEach((x) => console.log("  " + x)); }

if (!GO) {
  console.log("\nDRY-RUN — draai met --go om te schrijven.");
  process.exit(0);
}

const fouten = [];
for (let i = 0; i < altWijzigingen.length; i += 25) {
  const r = await admin(`mutation($f:[FileUpdateInput!]!){ fileUpdate(files:$f){ userErrors{ field message } } }`, {
    f: altWijzigingen.slice(i, i + 25).map((a) => ({ id: a.id, alt: a.nieuw })),
  });
  fouten.push(...r.fileUpdate.userErrors.map((e) => `alt: ${e.message}`));
}
const perProduct = variantFotos.reduce((a, v) => ((a[v.productId] ??= []).push(v), a), {});
for (const [productId, lijst] of Object.entries(perProduct)) {
  const r = await admin(`mutation($p:ID!, $v:[ProductVariantsBulkInput!]!){ productVariantsBulkUpdate(productId:$p, variants:$v){ userErrors{ field message } } }`, {
    p: productId, v: lijst.map((x) => ({ id: x.variantId, mediaId: x.nieuw })),
  });
  fouten.push(...r.productVariantsBulkUpdate.userErrors.map((e) => `variantfoto ${lijst[0].wat}: ${e.message}`));
}
for (const h of herschikken) {
  const r = await admin(`mutation($id:ID!, $m:[MoveInput!]!){ productReorderMedia(id:$id, moves:$m){ mediaUserErrors{ field message } } }`, { id: h.id, m: h.moves });
  fouten.push(...r.productReorderMedia.mediaUserErrors.map((e) => `herschikken ${h.wat}: ${e.message}`));
}
const stempel = new Date().toISOString();
const logPad = join(dirname(pad), `BRUNIC_TAPIJT_FOTOS_SHOPIFY_PUSH_LOG_${stempel.slice(0, 19).replace(/[:T]/g, "-")}.json`);
writeFileSync(logPad, JSON.stringify({ winkel: DOMAIN, op: stempel, fouten, altWijzigingen, variantFotos, herschikken }, null, 2));
console.log(`\nKlaar · alt ${altWijzigingen.length} · variantfoto's ${variantFotos.length} · herschikt ${herschikken.length}${fouten.length ? ` · fouten: ${fouten.length}` : ""}`);
fouten.slice(0, 20).forEach((f) => console.log("! " + f));
console.log(`Log met oude waarden en volgorde: ${logPad}`);
