#!/usr/bin/env node
// set-boras-productfotos.mjs — brengt de productfoto's en sfeerfoto's die Brunic downloadde voor de
// Boråstapeter-producten zonder productfoto naar Shopify, en zet de afgekapte namen recht.
// Per product:
//   1. naam: titel, handle en omschrijving ("Olivtr d" → "Olivträd", met redirect in Shopify);
//   2. alt-teksten van de bestaande foto's: dezelfde naamcorrectie;
//   3. nieuwe foto's opladen uit <map>/<product>/<kleur>/ (kleur = de map, soort = de bestandsnaam;
//      oude bestanden heten NN_soort.ext en staan al in Shopify);
//   4. variantfoto: de productfoto van die kleur (zo tonen ook de kleurstalen het dessin);
//   5. een bestaande sfeerfoto waarvan nu een scherpere versie is, verwijderen (VERVANGT);
//   6. mediavolgorde: per kleur productfoto en dan sfeerfoto's, de rolfoto's achteraan. De kaart toont
//      het eerste beeld, dus de eerste kleur = de kleur waarop de productpagina opent.
// Idempotent: een foto die al in Shopify staat (hash in de bestandsnaam) wordt overgeslagen.
//
//   node packages/catalog/set-boras-productfotos.mjs "<Data>/Boråstapeter"                    # dry-run
//   node packages/catalog/set-boras-productfotos.mjs "<Data>/Boråstapeter" --handle <handle>  # één product
//   node packages/catalog/set-boras-productfotos.mjs "<Data>/Boråstapeter" --go               # schrijven
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { admin, DOMAIN } from "./_shopify.mjs";

const args = process.argv.slice(2);
const GO = args.includes("--go");
const BEPERK = args.includes("--handle") ? args[args.indexOf("--handle") + 1] : null;
const MAP = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--handle");
if (!MAP || !existsSync(MAP)) {
  console.error('Gebruik: node packages/catalog/set-boras-productfotos.mjs "<Data>/Boråstapeter" [--handle <handle>] [--go]');
  process.exit(1);
}

const PRODUCTEN = [
  { map: "Zen", handle: "behang-zen-borastapeter" },
  { map: "Curve", handle: "behang-curve-borastapeter" },
  { map: "Diamonds", handle: "behang-diamonds-borastapeter" },
  { map: "Cube", handle: "behang-cube-borastapeter" },
  { map: "Arch", handle: "behang-arch-borastapeter" },
  { map: "Prisma", handle: "behang-prisma-borastapeter" },
  { map: "Cosmopolitan", handle: "behang-cosmopolitan-borastapeter" },
  { map: "Citronträd", handle: "behang-citrontrad-borastapeter", oudeHandle: "behang-citrontr-d-borastapeter", oudeTitel: "Citrontr d" },
  { map: "Olivträd", handle: "behang-olivtrad-borastapeter", oudeHandle: "behang-olivtr-d-borastapeter", oudeTitel: "Olivtr d" },
  { map: "Blåregn", handle: "behang-blaregn-borastapeter", oudeHandle: "behang-bl-regn-borastapeter", oudeTitel: "Bl regn" },
  { map: "Dahliadröm", handle: "behang-dahliadrom-borastapeter", oudeHandle: "behang-dahliadr-m-borastapeter", oudeTitel: "Dahliadr m" },
  { map: "Myrten", handle: "behang-myrten-borastapeter" },
  { map: "Örtagård", handle: "behang-ortagard-borastapeter", oudeHandle: "behang-rtag-rd-borastapeter", oudeTitel: "rtag rd" },
  { map: "Hortensia", handle: "behang-hortensia-borastapeter" },
  { map: "Kamelia", handle: "behang-kamelia-borastapeter" },
  { map: "Shell Sand", handle: "behang-shell-sand-borastapeter" },
];

/** Nieuwe sfeerfoto → de bestaande foto waarvan ze de scherpere versie is (pixelvergelijking + visueel, 02/11/2026). */
const VERVANGT = {
  "Diamonds/4739/4739_sfeerfoto.webp": "02_sfeerfoto.jpg",
  "Myrten/5717/5717_sfeerfoto.webp": "01_sfeerfoto.jpg",
  "Citronträd/5701/5701_sfeerfoto.webp": "03_sfeerfoto.jpg",
  "Citronträd/5702/5702sfeerfoto.webp": "02_sfeerfoto.jpg",
  "Citronträd/5703/5703_sfeerfoto.webp": "03_sfeerfoto.jpg",
};

const OUD_BESTAND = /^\d{2}_/;
const nfc = (s) => s.normalize("NFC");
const cdnNaam = (url) => url.split("?")[0].split("/").pop();
const kleurUitAlt = (alt) => alt?.match(/\s[–-]\s*kleur\s+(.+)$/i)?.[1]?.trim();

function bestandstype(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) return { mime: "image/jpeg", ext: ".jpg" };
  if (buf.toString("latin1", 0, 4) === "RIFF" && buf.toString("latin1", 8, 12) === "WEBP") return { mime: "image/webp", ext: ".webp" };
  throw new Error("onbekend bestandstype");
}

/** fotos-index.csv (naast de merkmappen): lokaal pad → CDN-bestandsnaam. Bevat nog de oude mapnamen. */
function leesIndex() {
  const pad = join(dirname(MAP), "fotos-index.csv");
  const out = new Map();
  for (const regel of readFileSync(pad, "utf8").split(/\r?\n/)) {
    const k = regel.replace(/^\uFEFF/, "").split('";"').map((x) => x.replace(/^"|"$/g, ""));
    if (k.length < 12 || !/^Bor.?stapeter\\/.test(k[0])) continue;
    out.set(nfc(k[0].split("\\").slice(1).join("/")), cdnNaam(k[11]));
  }
  return out;
}

function nieuweFotos(product) {
  const pmap = join(MAP, readdirSync(MAP).find((x) => nfc(x) === nfc(product.map)));
  const uit = [];
  for (const kleur of readdirSync(pmap)) {
    const kmap = join(pmap, kleur);
    if (!statSync(kmap).isDirectory()) continue;
    for (const f of readdirSync(kmap).sort()) {
      if (OUD_BESTAND.test(f)) continue;
      const soort = /sfeer/i.test(f) ? "sfeerfoto" : /prod/i.test(f) ? "productfoto" : null;
      if (!soort) throw new Error(`${product.map}/${kleur}/${f}: soort onbekend`);
      const buf = readFileSync(join(kmap, f));
      uit.push({ kleur, f, soort, buf, hash: createHash("md5").update(buf).digest("hex").slice(0, 10), ...bestandstype(buf), sleutel: nfc(`${product.map}/${kleur}/${f}`) });
    }
  }
  return uit;
}

const PRODUCT = `query($h:String!){ productByHandle(handle:$h){ id title handle status descriptionHtml
  media(first:100){ nodes{ id alt status ... on MediaImage{ image{ url width height } } } }
  variants(first:100){ nodes{ id selectedOptions{ name value } media(first:1){ nodes{ id } } } } } }`;

async function haal(p) {
  const nieuw = (await admin(PRODUCT, { h: p.handle })).productByHandle;
  if (nieuw) return nieuw;
  return p.oudeHandle ? (await admin(PRODUCT, { h: p.oudeHandle })).productByHandle : null;
}

const kleurVan = (v) => v.selectedOptions.find((o) => /kleur/i.test(o.name))?.value;

/** Per kleur: productfoto, nieuwe sfeerfoto's, bestaande sfeerfoto's, de rest; rolfoto's helemaal achteraan. */
function gewensteVolgorde(media, varianten, nieuwIds) {
  const kleuren = [...new Set(varianten.map(kleurVan))];
  const isRol = (m) => /\s[–-]\s*rolfoto/i.test(m.alt ?? "");
  const rang = (m) => (/\s[–-]\s*productfoto/i.test(m.alt ?? "") ? 0 : /\s[–-]\s*sfeerfoto/i.test(m.alt ?? "") ? (nieuwIds.has(m.id) ? 1 : 2) : 3);
  const volgens = (lijst) => lijst.map((m, i) => [m, i]).sort(([a, i], [b, j]) => rang(a) - rang(b) || i - j).map(([m]) => m);
  const uit = [];
  for (const k of kleuren) uit.push(...volgens(media.filter((m) => !isRol(m) && kleurUitAlt(m.alt) === k)));
  uit.push(...volgens(media.filter((m) => !isRol(m) && !kleuren.includes(kleurUitAlt(m.alt)))));
  for (const k of kleuren) uit.push(...media.filter((m) => isRol(m) && kleurUitAlt(m.alt) === k));
  uit.push(...media.filter((m) => isRol(m) && !kleuren.includes(kleurUitAlt(m.alt))));
  return uit;
}

function controleer(fouten, label, errs) {
  for (const e of errs ?? []) fouten.push(`${label}: ${e.message}`);
}

async function laadOp(handle, fotos) {
  const r = await admin(
    `mutation($i:[StagedUploadInput!]!){ stagedUploadsCreate(input:$i){ stagedTargets{ url resourceUrl parameters{ name value } } userErrors{ field message } } }`,
    { i: fotos.map((x) => ({ filename: `${handle}-${x.hash}${x.ext}`, mimeType: x.mime, resource: "IMAGE", httpMethod: "POST", fileSize: String(x.buf.length) })) },
  );
  if (r.stagedUploadsCreate.userErrors.length) throw new Error(`staged: ${JSON.stringify(r.stagedUploadsCreate.userErrors)}`);
  const doelen = r.stagedUploadsCreate.stagedTargets;
  const bronnen = [];
  for (let i = 0; i < fotos.length; i++) {
    const form = new FormData();
    for (const p of doelen[i].parameters) form.append(p.name, p.value);
    form.append("file", new Blob([fotos[i].buf], { type: fotos[i].mime }), `${handle}-${fotos[i].hash}${fotos[i].ext}`);
    const res = await fetch(doelen[i].url, { method: "POST", body: form });
    if (!res.ok) throw new Error(`upload ${fotos[i].sleutel}: HTTP ${res.status}`);
    bronnen.push(doelen[i].resourceUrl);
  }
  return bronnen;
}

async function wachtTotKlaar(productId, ids) {
  for (let i = 0; i < 90; i++) {
    const d = await admin(`query($id:ID!){ product(id:$id){ media(first:100){ nodes{ id status } } } }`, { id: productId });
    const st = d.product.media.nodes.filter((m) => ids.has(m.id));
    const mislukt = st.filter((m) => m.status === "FAILED");
    if (mislukt.length) throw new Error(`verwerking mislukt: ${mislukt.map((m) => m.id).join(", ")}`);
    if (st.length === ids.size && st.every((m) => m.status === "READY")) return;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("foto's niet klaar na 3 minuten");
}

const index = leesIndex();
const stempel = new Date().toISOString();
const logPad = join(dirname(MAP), `BRUNIC_BORAS_FOTOS_SHOPIFY_PUSH_LOG_${stempel.slice(0, 19).replace(/[:T]/g, "-")}.json`);
const log = { winkel: DOMAIN, op: stempel, producten: [] };
const schrijfLog = () => GO && writeFileSync(logPad, JSON.stringify(log, null, 2));

console.log(`winkel: ${DOMAIN} · ${GO ? "SCHRIJFT" : "DRY-RUN"}`);
const totaal = { naam: 0, alt: 0, op: 0, varianten: 0, weg: 0, volgorde: 0 };
const fouten = [];

for (const product of PRODUCTEN) {
  if (BEPERK && BEPERK !== product.handle && BEPERK !== product.oudeHandle) continue;
  const p = await haal(product);
  if (!p) { fouten.push(`${product.map}: niet gevonden`); continue; }
  const media = p.media.nodes.filter((m) => m.image?.url || m.status !== "READY");
  const fotos = nieuweFotos(product);
  const kleuren = new Set(p.variants.nodes.map(kleurVan));
  for (const x of fotos) if (!kleuren.has(x.kleur)) throw new Error(`${x.sleutel}: kleur bestaat niet op ${p.handle}`);

  // Plan
  const titel = product.oudeTitel ? product.map : p.title;
  const naamWijziging = product.oudeTitel && (p.title !== titel || p.handle !== product.handle || p.descriptionHtml.includes(product.oudeTitel))
    ? { id: p.id, title: titel, handle: product.handle, descriptionHtml: p.descriptionHtml.split(product.oudeTitel).join(titel), redirectNewHandle: p.handle !== product.handle }
    : null;
  const altWijzigingen = product.oudeTitel ? media.filter((m) => (m.alt ?? "").includes(product.oudeTitel)).map((m) => ({ id: m.id, alt: m.alt.split(product.oudeTitel).join(titel) })) : [];
  const alBestaand = (x) => media.find((m) => m.image?.url && cdnNaam(m.image.url).includes(`-${x.hash}`));
  const opTeLaden = fotos.filter((x) => !alBestaand(x));
  const weg = [];
  for (const x of fotos) {
    const oud = VERVANGT[x.sleutel];
    if (!oud) continue;
    const indexPad = nfc(`${product.oudeTitel ?? product.map}/${x.kleur}/${oud}`);
    const naam = index.get(indexPad);
    if (!naam) throw new Error(`${indexPad} niet in fotos-index.csv`);
    const m = media.find((y) => y.image?.url && cdnNaam(y.image.url) === naam);
    if (m) {
      if (kleurUitAlt(m.alt) !== x.kleur || !/sfeerfoto/i.test(m.alt ?? "")) throw new Error(`${indexPad}: alt klopt niet: ${m.alt}`);
      weg.push(m);
    }
  }
  console.log(`\n${titel} [${p.handle}${naamWijziging && p.handle !== product.handle ? ` → ${product.handle}` : ""}] status ${p.status}`);
  console.log(`  ${media.length} foto's nu · op te laden ${opTeLaden.length} (${opTeLaden.filter((x) => x.soort === "productfoto").length} product, ${opTeLaden.filter((x) => x.soort === "sfeerfoto").length} sfeer) · te verwijderen ${weg.length}${naamWijziging ? " · naam wijzigt" : ""}${altWijzigingen.length ? ` · ${altWijzigingen.length} alt` : ""}`);
  totaal.naam += naamWijziging ? 1 : 0;
  totaal.alt += altWijzigingen.length;
  totaal.op += opTeLaden.length;
  totaal.weg += weg.length;

  const rij = { map: product.map, id: p.id, oud: { title: p.title, handle: p.handle, descriptionHtml: p.descriptionHtml, media: media.map((m) => ({ id: m.id, alt: m.alt, url: m.image?.url })), varianten: p.variants.nodes.map((v) => ({ id: v.id, kleur: kleurVan(v), media: v.media.nodes[0]?.id ?? null })) }, nieuw: [], verwijderd: weg.map((m) => ({ id: m.id, alt: m.alt, url: m.image.url })) };

  if (!GO) {
    const virtueel = [
      ...media.filter((m) => !weg.includes(m)).map((m) => ({ ...m, alt: altWijzigingen.find((a) => a.id === m.id)?.alt ?? m.alt })),
      ...opTeLaden.map((x) => ({ id: `nieuw:${x.f}`, alt: `${titel} – ${x.soort} – kleur ${x.kleur}` })),
    ];
    const ids = new Set([...opTeLaden.map((x) => `nieuw:${x.f}`), ...fotos.map((x) => alBestaand(x)?.id).filter(Boolean)]);
    const volg = gewensteVolgorde(virtueel, p.variants.nodes, ids);
    if (fotos.length) console.log(`  volgorde: ${volg.map((m) => `${kleurUitAlt(m.alt) ?? "?"}:${(m.alt ?? "?").match(/[–-]\s*(\w+?)(foto|staal)\b/i)?.[1] ?? "?"}${ids.has(m.id) ? "*" : ""}`).join(" ")}`);
    continue;
  }

  log.producten.push(rij);
  schrijfLog();
  try {
    // 1 + 2. Naam
    if (naamWijziging) {
      const r = await admin(`mutation($p:ProductUpdateInput!){ productUpdate(product:$p){ product{ id handle title } userErrors{ field message } } }`, { p: naamWijziging });
      if (r.productUpdate.userErrors.length) throw new Error(`naam: ${JSON.stringify(r.productUpdate.userErrors)}`);
    }
    for (let i = 0; i < altWijzigingen.length; i += 25) {
      const r = await admin(`mutation($f:[FileUpdateInput!]!){ fileUpdate(files:$f){ userErrors{ field message } } }`, { f: altWijzigingen.slice(i, i + 25) });
      if (r.fileUpdate.userErrors.length) throw new Error(`alt: ${JSON.stringify(r.fileUpdate.userErrors)}`);
    }

    // 3. Opladen
    const nieuweIds = new Map(); // sleutel → media-id
    for (const x of fotos) if (alBestaand(x)) nieuweIds.set(x.sleutel, alBestaand(x).id);
    if (opTeLaden.length) {
      const bronnen = await laadOp(product.handle, opTeLaden);
      const r = await admin(
        `mutation($id:ID!, $m:[CreateMediaInput!]!){ productCreateMedia(productId:$id, media:$m){ media{ id status } mediaUserErrors{ field message } } }`,
        { id: p.id, m: opTeLaden.map((x, i) => ({ originalSource: bronnen[i], mediaContentType: "IMAGE", alt: `${titel} – ${x.soort} – kleur ${x.kleur}` })) },
      );
      if (r.productCreateMedia.mediaUserErrors.length) throw new Error(`media: ${JSON.stringify(r.productCreateMedia.mediaUserErrors)}`);
      r.productCreateMedia.media.forEach((m, i) => {
        nieuweIds.set(opTeLaden[i].sleutel, m.id);
        rij.nieuw.push({ id: m.id, sleutel: opTeLaden[i].sleutel, soort: opTeLaden[i].soort, kleur: opTeLaden[i].kleur });
      });
      schrijfLog();
      await wachtTotKlaar(p.id, new Set(r.productCreateMedia.media.map((m) => m.id)));
    }

    // 4. Variantfoto = de productfoto van die kleur
    if (fotos.length) {
      const productfoto = new Map(fotos.filter((x) => x.soort === "productfoto").map((x) => [x.kleur, nieuweIds.get(x.sleutel)]));
      const lijst = p.variants.nodes.filter((v) => productfoto.get(kleurVan(v)) && v.media.nodes[0]?.id !== productfoto.get(kleurVan(v))).map((v) => ({ id: v.id, mediaId: productfoto.get(kleurVan(v)) }));
      if (lijst.length) {
        const r = await admin(`mutation($p:ID!, $v:[ProductVariantsBulkInput!]!){ productVariantsBulkUpdate(productId:$p, variants:$v){ userErrors{ field message } } }`, { p: p.id, v: lijst });
        if (r.productVariantsBulkUpdate.userErrors.length) throw new Error(`variant: ${JSON.stringify(r.productVariantsBulkUpdate.userErrors)}`);
        totaal.varianten += lijst.length;
      }
    }

    // 5. Bestaande versie van een vervangen sfeerfoto weg
    if (weg.length) {
      const r = await admin(`mutation($id:ID!, $m:[ID!]!){ productDeleteMedia(productId:$id, mediaIds:$m){ deletedMediaIds mediaUserErrors{ field message } } }`, { id: p.id, m: weg.map((m) => m.id) });
      if (r.productDeleteMedia.mediaUserErrors.length) throw new Error(`verwijderen: ${JSON.stringify(r.productDeleteMedia.mediaUserErrors)}`);
    }

    // 6. Volgorde
    if (fotos.length) {
      const nu = (await admin(`query($id:ID!){ product(id:$id){ media(first:100){ nodes{ id alt } } } }`, { id: p.id })).product.media.nodes;
      const gewenst = gewensteVolgorde(nu, p.variants.nodes, new Set(nieuweIds.values()));
      if (gewenst.length !== nu.length) throw new Error(`volgorde: ${gewenst.length} i.p.v. ${nu.length} foto's`);
      if (gewenst.some((m, i) => m.id !== nu[i].id)) {
        const r = await admin(`mutation($id:ID!, $m:[MoveInput!]!){ productReorderMedia(id:$id, moves:$m){ mediaUserErrors{ field message } } }`, { id: p.id, m: gewenst.map((m, i) => ({ id: m.id, newPosition: String(i) })) });
        if (r.productReorderMedia.mediaUserErrors.length) throw new Error(`volgorde: ${JSON.stringify(r.productReorderMedia.mediaUserErrors)}`);
        totaal.volgorde++;
      }
    }
    console.log("  ✓ klaar");
  } catch (e) {
    fouten.push(`${product.map}: ${e.message}`);
    rij.fout = e.message;
    schrijfLog();
    console.log(`  ✖ ${e.message}`);
    break; // niet doorgaan: eerst nakijken, opnieuw draaien slaat over wat al gebeurd is
  }
  schrijfLog();
}

console.log(`\nTotaal · namen ${totaal.naam} · alt ${totaal.alt} · op te laden ${totaal.op} · te verwijderen ${totaal.weg}${GO ? ` · variantfoto's ${totaal.varianten} · volgorde ${totaal.volgorde}` : ""}`);
fouten.forEach((f) => console.log("! " + f));
if (GO) console.log(`Log met de oude waarden: ${logPad}\nDaarna: pnpm prototype:sync, en een nieuwe build voor de site.`);
else console.log("\nDRY-RUN — draai met --go om te schrijven.");
process.exit(fouten.length ? 1 : 0);
