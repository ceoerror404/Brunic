#!/usr/bin/env node
// set-tapijt-tags.mjs — zet de nagekeken tapijt-tags (foto-tagging + menselijke review) in Shopify.
// Bron: de export uit de reviewpagina (../Data/BRUNIC_TAPIJT_TAGS_<datum>.json).
//   brunic.kleurfamilie per variant    hoofdkleur van die kleurvariant, alle maten
//   brunic.accentkleuren per variant   0–2 accentkleuren (voor het kleurbolletje op de site)
//   brunic.kleurfamilie op product     veld met 1 waarde: meest voorkomende hoofdkleur
//   brunic.motief / brunic.stijl       lijstvelden (max. 2 waarden) met de vaste keuzelijst
// Ontbrekende definities worden aangemaakt. Idempotent: schrijft enkel wat verschilt.
// Schrijft een log met de oude waarden.
//
//   node packages/catalog/set-tapijt-tags.mjs <export.json> [--go]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { admin, DOMAIN } from "./_shopify.mjs";

const GO = process.argv.includes("--go");
const pad = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!pad) {
  console.error("Gebruik: node packages/catalog/set-tapijt-tags.mjs <export.json> [--go]");
  process.exit(1);
}

// Vaste lijsten = die van de reviewpagina. Uitbreiden (bv. voor behang) = hier + de keuzelijst
// van de definitie bijwerken. Kleuren = de keuzelijst van brunic.kleurfamilie in Shopify.
const MOTIEVEN = ["Effen", "Structuur", "Strepen", "Grafisch", "Ruiten", "Abstract", "Oosters", "Kelim", "Berber", "Bloemen", "Bladeren", "Marmer", "Betonlook", "Dierenhuid", "Dieren"];
const STIJLEN = ["Modern", "Klassiek", "Vintage", "Scandinavisch", "Japandi", "Landelijk", "Industrieel", "Retro", "Color blocking", "Etnisch", "Lief"];
const KLEUREN = ["Beige", "Taupe", "Bruin", "Ecru", "Naturel", "Wit", "Grijs", "Antraciet", "Zwart", "Blauw", "Turquoise", "Groen", "Geel", "Oranje", "Rood", "Roze", "Paars", "Multicolor", "Goud/metallic", "Zilver/metallic"];
const LIJST = "list.single_line_text_field";
const TEKST = "single_line_text_field";

const DEFINITIES = [
  { ownerType: "PRODUCT", key: "motief", naam: "Motief", keuzes: MOTIEVEN, uitleg: "Motief (max. 2). Vaste lijst; zie packages/catalog/set-tapijt-tags.mjs." },
  { ownerType: "PRODUCT", key: "stijl", naam: "Stijl", keuzes: STIJLEN, uitleg: "Stijl (max. 2). Vaste lijst; zie packages/catalog/set-tapijt-tags.mjs." },
  { ownerType: "PRODUCTVARIANT", key: "accentkleuren", naam: "Accentkleuren", keuzes: KLEUREN, uitleg: "0–2 accentkleuren naast brunic.kleurfamilie (hoofdkleur); voor het kleurbolletje." },
];

const exp = JSON.parse(readFileSync(pad, "utf8"));
const perHandle = new Map(exp.producten.map((p) => [p.handle, p]));
console.log(`winkel: ${DOMAIN} · export: ${exp.producten.length} producten`);

const bestaat = {};
for (const d of DEFINITIES) {
  const r = await admin(`{ metafieldDefinitions(first:1, ownerType: ${d.ownerType}, namespace:"brunic", key:"${d.key}"){ nodes{ id type{ name } } } }`);
  const def = r.metafieldDefinitions.nodes[0];
  if (def && def.type.name !== LIJST) {
    console.error(`brunic.${d.key} (${d.ownerType}) bestaat al als ${def.type.name}, niet als ${LIJST}. Eerst beslissen wat ermee moet.`);
    process.exit(1);
  }
  bestaat[d.key] = Boolean(def);
  console.log(`definitie brunic.${d.key} (${d.ownerType.toLowerCase()}): ${def ? "bestaat" : "wordt aangemaakt"}`);
}

// Huidige stand ophalen.
const shop = [];
let cursor = null;
do {
  const d = await admin(
    `query($c:String){ products(first:50, after:$c, query:"product_type:Vloerkleed"){
      nodes{ id handle
        kf: metafield(namespace:"brunic", key:"kleurfamilie"){ value }
        motief: metafield(namespace:"brunic", key:"motief"){ value }
        stijl: metafield(namespace:"brunic", key:"stijl"){ value }
        variants(first:100){ nodes{ id selectedOptions{ name value }
          kf: metafield(namespace:"brunic", key:"kleurfamilie"){ value }
          acc: metafield(namespace:"brunic", key:"accentkleuren"){ value } } } }
      pageInfo{ hasNextPage endCursor } } }`,
    { c: cursor },
  );
  shop.push(...d.products.nodes);
  cursor = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
} while (cursor);

const schrijven = [];
const log = [];
const tel = { nieuw: 0, anders: 0, gelijk: 0 };
const problemen = [];
const noteer = (ownerId, key, type, wat, oud, nieuw) => {
  if (oud === nieuw) { tel.gelijk++; return; }
  tel[oud ? "anders" : "nieuw"]++;
  schrijven.push({ ownerId, namespace: "brunic", key, type, value: nieuw });
  log.push({ ownerId, key, wat, oud: oud ?? null, nieuw });
};
// Lijstwaarden als JSON in vaste volgorde (zoals Shopify ze teruggeeft).
const lijstWaarde = (a) => JSON.stringify(a);
const buiten = (waarden, lijst) => waarden.filter((w) => !lijst.includes(w));

for (const p of shop) {
  const e = perHandle.get(p.handle);
  if (!e) { problemen.push(`${p.handle}: niet in de export`); continue; }
  perHandle.delete(p.handle);
  noteer(p.id, "kleurfamilie", TEKST, `${p.handle} (product)`, p.kf?.value, e.kleurfamilie_product);
  for (const [key, lijst] of [["motief", MOTIEVEN], ["stijl", STIJLEN]]) {
    const waarden = e[key] ?? [];
    const vreemd = buiten(waarden, lijst);
    if (vreemd.length) { problemen.push(`${p.handle}: ${key} '${vreemd.join(", ")}' staat niet in de lijst`); continue; }
    if (waarden.length) noteer(p.id, key, LIJST, `${p.handle} (${key})`, p[key]?.value, lijstWaarde(waarden));
  }
  const perKleur = new Map(e.kleuren.map((k) => [k.kleur, k]));
  for (const v of p.variants.nodes) {
    const optie = v.selectedOptions.find((o) => /kleur|color|colour/i.test(o.name));
    // Eén kleur in de export: die geldt voor alle varianten (ook zonder kleuroptie).
    const k = e.kleuren.length === 1 ? e.kleuren[0] : perKleur.get(optie?.value);
    const naam = `${p.handle} [${v.selectedOptions.map((o) => o.value).join(" / ")}]`;
    if (!k?.hoofd) { problemen.push(`${naam}: geen kleur`); continue; }
    noteer(v.id, "kleurfamilie", TEKST, naam, v.kf?.value, k.hoofd);
    const accenten = (k.accenten ?? []).filter((a) => a && a !== k.hoofd);
    const vreemd = buiten(accenten, KLEUREN);
    if (vreemd.length) { problemen.push(`${naam}: accent '${vreemd.join(", ")}' staat niet in de lijst`); continue; }
    if (accenten.length) noteer(v.id, "accentkleuren", LIJST, `${naam} (accenten)`, v.acc?.value, lijstWaarde(accenten));
  }
}
for (const h of perHandle.keys()) problemen.push(`${h}: staat in de export maar niet in Shopify`);

const perKey = log.reduce((a, l) => ((a[l.key] = (a[l.key] ?? 0) + 1), a), {});
console.log(`\nte schrijven: ${schrijven.length} (nieuw ${tel.nieuw}, anders ${tel.anders}) · ongewijzigd ${tel.gelijk}`);
console.log("  per veld: " + (Object.entries(perKey).map(([k, n]) => `${k} ${n}`).join(", ") || "niets"));
if (problemen.length) { console.log(`problemen (${problemen.length}):`); problemen.slice(0, 20).forEach((x) => console.log("  " + x)); }
for (const x of log.filter((l) => l.oud).slice(0, 5)) console.log(`  ${x.wat}: ${x.oud} → ${x.nieuw}`);

if (!GO) {
  console.log("\nDRY-RUN — draai met --go om te schrijven.");
  process.exit(0);
}

for (const d of DEFINITIES) {
  if (bestaat[d.key]) continue;
  const r = await admin(
    `mutation($d: MetafieldDefinitionInput!){ metafieldDefinitionCreate(definition: $d){ createdDefinition{ id } userErrors{ field message } } }`,
    { d: {
      name: d.naam, namespace: "brunic", key: d.key, ownerType: d.ownerType, type: LIJST, description: d.uitleg,
      validations: [{ name: "choices", value: JSON.stringify(d.keuzes) }],
      access: { storefront: "PUBLIC_READ" },
    } },
  );
  const errs = r.metafieldDefinitionCreate.userErrors;
  if (errs.length) { console.error(`definitie brunic.${d.key} aanmaken mislukt: ${errs.map((e) => e.message).join("; ")}`); process.exit(1); }
  console.log(`definitie brunic.${d.key} aangemaakt`);
}

const SET = `mutation($mfs:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$mfs){ userErrors{ field message } } }`;
const fouten = [];
for (let i = 0; i < schrijven.length; i += 25) {
  const r = await admin(SET, { mfs: schrijven.slice(i, i + 25) });
  for (const e of r.metafieldsSet.userErrors) {
    const j = Number(e.field?.[1]);
    fouten.push(`${Number.isInteger(j) ? log[i + j]?.wat : e.field?.join(".")}: ${e.message}`);
  }
}
const stempel = new Date().toISOString();
const logPad = join(dirname(pad), `BRUNIC_TAPIJT_TAGS_SHOPIFY_PUSH_LOG_${stempel.slice(0, 19).replace(/[:T]/g, "-")}.json`);
writeFileSync(logPad, JSON.stringify({ winkel: DOMAIN, op: stempel, geschreven: schrijven.length, fouten, wijzigingen: log }, null, 2));
console.log(`\nGeschreven: ${schrijven.length - fouten.length} van ${schrijven.length}${fouten.length ? ` · fouten: ${fouten.length}` : ""}`);
fouten.slice(0, 20).forEach((f) => console.log("! " + f));
console.log(`Log met oude waarden: ${logPad}`);
