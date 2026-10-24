/**
 * Redactionele inhoud uit Shopify-metaobjects (Inhoud > Metaobjects in de admin): de klant
 * past daar teksten en foto's aan, de site leest ze via de Storefront API.
 *
 * - Gecachet met de tag `inhoud`: de webhook (/api/webhooks/shopify) ververst die meteen bij
 *   een wijziging in de admin; zonder webhook na hoogstens VERVERS seconden.
 * - Faalt Shopify of bestaat het metaobject niet, dan geeft dit `null` en tonen de pagina's
 *   de teksten uit src/data/ (nooit een lege of kapotte pagina).
 * - Verwijzingen worden twee niveaus diep opgehaald: een pagina → haar tegels → hun foto.
 */
import { cache } from "react";
import type { ImageRef } from "@/lib/catalog/types";

const VERSION = process.env.SHOPIFY_API_VERSION ?? "2025-10";
export const INHOUD_TAG = "inhoud";
/** Vangnet zonder webhook: zo lang (s) kan een admin-wijziging hoogstens op zich laten wachten. */
const VERVERS = 300;

type RawRef = {
  __typename?: string;
  image?: { url: string; altText: string | null; width?: number; height?: number } | null;
  handle?: string;
  type?: string;
  fields?: RawVeld[];
} | null;
type RawVeld = { key: string; type: string; value: string | null; reference?: RawRef; references?: { nodes: RawRef[] } | null };
type RawObject = { handle: string; type: string; fields: RawVeld[] };

const REF = /* GraphQL */ `
  fragment Ref on MetafieldReference {
    __typename
    ... on MediaImage { image { url altText width height } }
    ... on Collection { handle }
    ... on Product { handle }
  }
  fragment Veld on MetaobjectField {
    key type value
    reference { ...Ref }
    references(first: 50) { nodes { ...Ref } }
  }
  fragment Object on Metaobject {
    handle type
    fields {
      ...Veld
      reference { ... on Metaobject { handle type fields { ...Veld } } }
      references(first: 50) { nodes { ... on Metaobject { handle type fields { ...Veld } } } }
    }
  }
`;

async function storefront<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_API_TOKEN;
  if (!domain || !token) return null;
  const header = token.startsWith("shpat_") ? "Shopify-Storefront-Private-Token" : "X-Shopify-Storefront-Access-Token";
  try {
    const res = await fetch(`https://${domain}/api/${VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", [header]: token },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: VERVERS, tags: [INHOUD_TAG] },
    });
    const json = (await res.json().catch(() => ({}))) as { data?: T; errors?: { message: string }[] };
    if (!res.ok || json.errors?.length || !json.data) throw new Error(`HTTP ${res.status} ${json.errors?.map((e) => e.message).join("; ") ?? ""}`);
    return json.data;
  } catch (e) {
    console.warn(`[inhoud] Shopify-metaobjects niet bereikbaar, de site toont de standaardteksten: ${(e as Error).message}`);
    return null;
  }
}

/** Eén metaobject, met leeshulpjes per veld. Lege tekstvelden gelden als "niet ingevuld". */
export class Inhoud {
  private velden: Map<string, RawVeld>;
  constructor(
    readonly handle: string,
    readonly type: string,
    velden: RawVeld[],
  ) {
    this.velden = new Map(velden.map((v) => [v.key, v]));
  }

  /** Tekst, of undefined als het veld leeg is. */
  tekst(key: string): string | undefined {
    const v = this.velden.get(key)?.value?.trim();
    return v ? v : undefined;
  }

  /** Lijst van teksten (list.single_line_text_field), lege waarden eruit. */
  teksten(key: string): string[] {
    return parseLijst(this.velden.get(key)?.value).filter((t) => t.trim());
  }

  getal(key: string): number | undefined {
    const t = this.tekst(key);
    const n = Number(t);
    return t !== undefined && Number.isFinite(n) ? n : undefined;
  }

  waar(key: string): boolean | undefined {
    const v = this.tekst(key);
    return v === undefined ? undefined : v === "true";
  }

  /** Foto uit een bestandsveld; zonder alt-tekst in Shopify wordt `alt` gebruikt. */
  beeld(key: string, alt = ""): ImageRef | undefined {
    return naarBeeld(this.velden.get(key)?.reference, alt);
  }

  /** Handle van een gekoppelde collectie (collection_reference). */
  collectie(key: string): string | undefined {
    return this.velden.get(key)?.reference?.handle;
  }

  collecties(key: string): string[] {
    return (this.velden.get(key)?.references?.nodes ?? []).flatMap((n) => (n?.handle ? [n.handle] : []));
  }

  /** Gekoppelde metaobjects (list.metaobject_reference), in de volgorde van de admin. */
  lijst(key: string): Inhoud[] {
    return (this.velden.get(key)?.references?.nodes ?? []).flatMap((n) => (n?.handle && n.fields ? [new Inhoud(n.handle, n.type ?? "", n.fields)] : []));
  }

  /** Ruwe waarde, bv. de JSON van een rich_text_field. */
  ruw(key: string): string | undefined {
    return this.velden.get(key)?.value ?? undefined;
  }
}

function parseLijst(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const v = JSON.parse(value);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function naarBeeld(ref: RawRef | undefined, alt: string): ImageRef | undefined {
  const img = ref?.image;
  return img?.url ? { src: img.url, alt: img.altText?.trim() || alt } : undefined;
}

/** Het metaobject `handle` van `type`, of null (niet gevonden of Shopify onbereikbaar). */
export const metaobject = cache(async (type: string, handle: string): Promise<Inhoud | null> => {
  const data = await storefront<{ metaobject: RawObject | null }>(
    `${REF} query Inhoud($type: String!, $handle: String!) { metaobject(handle: { type: $type, handle: $handle }) { ...Object } }`,
    { type, handle },
  );
  const o = data?.metaobject;
  return o ? new Inhoud(o.handle, o.type, o.fields) : null;
});

/** Alle metaobjects van `type` (max. 250), of null als Shopify onbereikbaar is. */
export const metaobjecten = cache(async (type: string): Promise<Inhoud[] | null> => {
  const data = await storefront<{ metaobjects: { nodes: RawObject[] } }>(
    `${REF} query Inhouden($type: String!) { metaobjects(type: $type, first: 250) { nodes { ...Object } } }`,
    { type },
  );
  return data ? data.metaobjects.nodes.map((o) => new Inhoud(o.handle, o.type, o.fields)) : null;
});

/** Vult plaatshouders als {gemeente} in teksten uit de admin in. */
export function vulIn(tekst: string, waarden: Record<string, string>): string {
  return tekst.replace(/\{(\w+)\}/g, (m, k: string) => waarden[k] ?? m);
}
