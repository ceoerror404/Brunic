#!/usr/bin/env node
// set-ddept-prijzen.mjs — zet de adviesprijzen uit de artikeldatabank van The Design Department
// (ESTAhome, Origin Wallcoverings, Walls4You, Sanders & Sanders) op de Shopify-producten met
// tag "bron:ddept". Koppeling: variant-SKU = kolom "Product" (artikelnummer), EAN moet ook kloppen.
// Prijs = kolom "Advies verkoopprijs" (incl. btw, per rol / per stuk zoals in brunic.verkoop_eenheid).
// Zodra de prijs staat, verdwijnt de tag "prijs-ontbreekt". Met --verkoopbaar gaat brunic.etalage
// op false (prijs + koopknop zichtbaar) — enkel voor producten waarvan de prijs > 0 bevestigd is.
//
//   node packages/catalog/set-ddept-prijzen.mjs "<pad>/Artikel databank -The Design Department - NL.xlsx" [--verkoopbaar] [--go]
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";
import { admin, ROOT_DIR } from "./_shopify.mjs";

const argv = process.argv.slice(2);
const GO = argv.includes("--go");
const VERKOOPBAAR = argv.includes("--verkoopbaar");
const XLSX = argv.find((a) => !a.startsWith("--"));
if (!XLSX) {
  console.error('Gebruik: node set-ddept-prijzen.mjs "<databank.xlsx>" [--verkoopbaar] [--go]');
  process.exit(1);
}
const LOG = join(ROOT_DIR, "..", "Data", `DDEPT_PRIJZEN_SHOPIFY_PUSH_LOG_${new Date().toISOString().slice(0, 10)}.json`);

// --- xlsx lezen zonder dependency: zip (central directory) + sheet-XML ---
function unzip(buf, namen) {
  let eocd = buf.length - 22;
  while (buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  const uit = {};
  for (let p = buf.readUInt32LE(eocd + 16), n = buf.readUInt16LE(eocd + 10); n--; ) {
    const methode = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20);
    const nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32);
    const naam = buf.toString("utf8", p + 46, p + 46 + nl);
    if (namen.includes(naam)) {
      const lh = buf.readUInt32LE(p + 42);
      const start = lh + 30 + buf.readUInt16LE(lh + 26) + buf.readUInt16LE(lh + 28);
      const data = buf.subarray(start, start + size);
      uit[naam] = (methode === 8 ? inflateRawSync(data) : data).toString("utf8");
    }
    p += 46 + nl + el + cl;
  }
  return uit;
}

const ontsnap = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, "&");
const tekst = (xml) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => ontsnap(m[1])).join("");
const kolom = (ref) => [...ref.match(/^[A-Z]+/)[0]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;

function leesDatabank(pad) {
  const z = unzip(readFileSync(pad), ["xl/sharedStrings.xml", "xl/worksheets/sheet1.xml"]);
  const shared = [...(z["xl/sharedStrings.xml"] ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => tekst(m[1]));
  const rijen = [...z["xl/worksheets/sheet1.xml"].matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((rm) => {
    const rij = [];
    for (const cm of rm[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const t = (cm[1].match(/t="(\w+)"/) || [])[1];
      const v = ((cm[2] || "").match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      rij[kolom(cm[1].match(/r="([A-Z]+)\d+"/)[1])] =
        t === "s" ? shared[+v] : t === "inlineStr" ? tekst(cm[2]) : v == null ? null : t === "str" ? ontsnap(v) : Number(v);
    }
    return rij;
  });
  const kop = rijen[0].map((h) => String(h ?? "").trim());
  const i = (naam) => {
    const k = kop.indexOf(naam);
    if (k < 0) throw new Error(`Kolom "${naam}" niet gevonden in ${pad}`);
    return k;
  };
  const [iArt, iEan, iMerk, iPrijs] = [i("Product"), i("EAN"), i("merk"), i("Advies verkoopprijs")];
  return new Map(
    rijen.slice(1).filter((r) => r[iArt] != null).map((r) => [String(r[iArt]), { ean: String(r[iEan] ?? ""), merk: r[iMerk], prijs: r[iPrijs] }]),
  );
}

// --- Shopify ---
async function metRetry(query, vars) {
  for (let poging = 1; ; poging++) {
    try {
      return await admin(query, vars);
    } catch (e) {
      if (poging >= 8 || !/THROTTLED|fetch failed|ECONNRESET|HTTP 5|JSON/.test(e.message)) throw e;
      await new Promise((r) => setTimeout(r, 1000 * poging));
    }
  }
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) await fn(items[i++]); }));
}

const databank = leesDatabank(XLSX);
console.log(`Databank: ${databank.size} artikels`);

const producten = [];
for (let cursor = null; ; ) {
  const d = await metRetry(
    `query($c:String){ products(first:100, after:$c, query:"tag:'bron:ddept'"){
      nodes{ id handle title vendor tags etalage: metafield(namespace:"brunic", key:"etalage"){ value }
        variants(first:100){ nodes{ id sku barcode price } } }
      pageInfo{ hasNextPage endCursor } } }`,
    { c: cursor },
  );
  producten.push(...d.products.nodes);
  if (!d.products.pageInfo.hasNextPage) break;
  cursor = d.products.pageInfo.endCursor;
}
console.log(`Shopify: ${producten.length} producten met tag bron:ddept\n`);

const log = [];
const plan = [];
for (const p of producten) {
  const varianten = [];
  let allesGeprijsd = true;
  for (const v of p.variants.nodes) {
    const rij = databank.get(v.sku);
    const regel = { sku: v.sku, ean: v.barcode, handle: p.handle, vendor: p.vendor, oude_prijs: v.price, etalage_oud: p.etalage?.value ?? null };
    log.push(regel);
    if (!rij) regel.resultaat = "niet in databank";
    else if (rij.ean !== v.barcode) regel.resultaat = `EAN verschilt (databank ${rij.ean})`;
    else if (!(rij.prijs > 0)) regel.resultaat = "geen prijs in databank";
    if (regel.resultaat) { allesGeprijsd = false; continue; }
    regel.nieuwe_prijs = rij.prijs.toFixed(2);
    regel.resultaat = regel.nieuwe_prijs === v.price ? "prijs ongewijzigd" : Number(v.price) > 0 ? "prijs gecorrigeerd" : "prijs ingevuld";
    if (regel.nieuwe_prijs !== v.price) varianten.push({ id: v.id, price: regel.nieuwe_prijs, regel });
  }
  plan.push({ p, varianten, allesGeprijsd });
}

const tel = {};
for (const r of log) tel[r.resultaat] = (tel[r.resultaat] || 0) + 1;
console.log("Varianten:", tel);
for (const r of log.filter((r) => r.resultaat === "prijs gecorrigeerd")) console.log(`  gecorrigeerd: ${r.sku} ${r.handle}: ${r.oude_prijs} → ${r.nieuwe_prijs}`);
for (const r of log.filter((r) => /niet in|verschilt|geen prijs/.test(r.resultaat))) console.log(`  ! ${r.sku} ${r.handle}: ${r.resultaat}`);
const metTag = plan.filter((x) => x.allesGeprijsd && x.p.tags.includes("prijs-ontbreekt")).length;
const etalageUit = plan.filter((x) => x.allesGeprijsd && x.p.etalage?.value !== "false").length;
console.log(`Tag "prijs-ontbreekt" weg bij ${metTag} producten${VERKOOPBAAR ? ` · etalage → false bij ${etalageUit} producten` : " · etalage ongemoeid (geen --verkoopbaar)"}`);

if (!GO) {
  console.log("\nDRY-RUN — draai met --go om te schrijven.");
  process.exit(0);
}

writeFileSync(LOG, JSON.stringify(log, null, 1)); // vóór-toestand, mocht de run halverwege stoppen

// 1. prijzen
let klaar = 0;
await pool(plan.filter((x) => x.varianten.length), 4, async ({ p, varianten }) => {
  const d = await metRetry(
    `mutation($id:ID!,$v:[ProductVariantsBulkInput!]!){ productVariantsBulkUpdate(productId:$id, variants:$v){
      productVariants{ id price } userErrors{ field message } } }`,
    { id: p.id, v: varianten.map(({ id, price }) => ({ id, price })) },
  );
  const fout = d.productVariantsBulkUpdate.userErrors.map((e) => e.message).join("; ");
  const nu = new Map((d.productVariantsBulkUpdate.productVariants ?? []).map((v) => [v.id, v.price]));
  for (const { id, price, regel } of varianten) {
    if (nu.get(id) !== price) regel.fout = fout || `prijs na update: ${nu.get(id)}`;
  }
  if (++klaar % 250 === 0) console.log(`  prijzen: ${klaar}`);
});
const mislukt = new Set(log.filter((r) => r.fout).map((r) => r.handle));
const geprijsd = plan.filter((x) => x.allesGeprijsd && !mislukt.has(x.p.handle)).map((x) => x.p);
console.log(`Prijzen gezet · ${mislukt.size} producten met fout`);

// 2. tag "prijs-ontbreekt" weg
await pool(geprijsd.filter((p) => p.tags.includes("prijs-ontbreekt")), 4, async (p) => {
  const d = await metRetry(`mutation($id:ID!,$t:[String!]!){ tagsRemove(id:$id, tags:$t){ userErrors{ message } } }`, { id: p.id, t: ["prijs-ontbreekt"] });
  const e = d.tagsRemove.userErrors;
  if (e.length) console.log(`  ! tag ${p.handle}: ${e.map((x) => x.message).join("; ")}`);
});
console.log("Tag prijs-ontbreekt verwijderd");

// 3. etalage uit (alleen met --verkoopbaar)
if (VERKOOPBAAR) {
  const doel = geprijsd.filter((p) => p.etalage?.value !== "false");
  for (let i = 0; i < doel.length; i += 25) {
    const d = await metRetry(
      `mutation($m:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$m){ userErrors{ field message } } }`,
      { m: doel.slice(i, i + 25).map((p) => ({ ownerId: p.id, namespace: "brunic", key: "etalage", type: "boolean", value: "false" })) },
    );
    const e = d.metafieldsSet.userErrors;
    if (e.length) console.log(`  ! etalage: ${e.map((x) => x.message).join("; ")}`);
  }
  for (const r of log) if (doel.some((p) => p.handle === r.handle)) r.etalage_nieuw = "false";
  console.log(`Etalage uit bij ${doel.length} producten`);
}

writeFileSync(LOG, JSON.stringify(log, null, 1));
console.log(`\nKlaar · log: ${LOG}\nDe site pikt het op bij de volgende build (of draai pnpm prototype:sync lokaal).`);
