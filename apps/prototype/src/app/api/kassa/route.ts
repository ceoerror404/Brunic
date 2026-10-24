import { NextResponse } from "next/server";
import { storefront } from "@/lib/shopify/storefront";
import { meld } from "@/lib/melding";

/**
 * Winkelmand → Shopify-kassa. De winkelmand leeft lokaal in de browser; bij "Afrekenen"
 * maken we hier een Shopify-cart aan en sturen we de klant naar de beveiligde, door
 * Shopify gehoste kassa (levering/afhalen, betaling, bevestiging).
 *
 * Bewaking (de enige afscherming van etalageproducten, zie packages/catalog/README.md): Shopify zelf beschermt niet tegen
 * een etalageproduct met prijs € 0. Daarom controleren we LIVE per variant: niet
 * `brunic.etalage = true`, prijs > 0 en `availableForSale`. Faalt één regel, dan geen kassa.
 *
 * GET ?cart=<id>: is die Shopify-cart afgerekend? Een afgeronde (of vervallen) cart geeft
 * Shopify niet meer terug; de browser maakt dan de lokale winkelmand leeg (kassa-opvolging.tsx).
 */

type Regel = { variantId: string; quantity: number };

const CONTROLE = /* GraphQL */ `
  query Controle($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        availableForSale
        price { amount }
        product { title etalage: metafield(namespace: "brunic", key: "etalage") { value } }
      }
    }
  }
`;

const MAAK_CART = /* GraphQL */ `
  mutation MaakCart($input: CartInput!) {
    cartCreate(input: $input) {
      cart { id checkoutUrl }
      userErrors { message }
    }
  }
`;

const CART_STATUS = /* GraphQL */ `
  query CartStatus($id: ID!) {
    cart(id: $id) { id }
  }
`;

type Node = { id: string; availableForSale: boolean; price: { amount: string }; product: { title: string; etalage: { value: string } | null } } | null;

/** Variant-ID's komen als kort nummer of als volledige GID van een ProductVariant. */
const GELDIG_ID = /^(\d+|gid:\/\/shopify\/ProductVariant\/\d+)$/;
const gid = (id: string) => (id.startsWith("gid://") ? id : `gid://shopify/ProductVariant/${id}`);

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { lines?: unknown } | null;
  const ruw = Array.isArray(body?.lines) ? (body.lines as Partial<Regel>[]) : [];
  if (ruw.length === 0) return NextResponse.json({ error: "Uw winkelmand is leeg." }, { status: 400 });
  if (ruw.length > 100) return NextResponse.json({ error: "Uw winkelmand telt meer dan 100 regels. Reken in twee keer af of bel ons." }, { status: 400 });

  // Een ongeldige regel nooit stil laten vallen: dan zou de klant minder afrekenen dan hij denkt.
  const ongeldig = ruw.filter(
    (l) => typeof l?.variantId !== "string" || !GELDIG_ID.test(l.variantId) || !Number.isInteger(l.quantity) || l.quantity! < 1 || l.quantity! > 500,
  );
  if (ongeldig.length > 0) {
    return NextResponse.json(
      { error: "Eén of meer regels in uw winkelmand hebben een ongeldige hoeveelheid. Pas de hoeveelheid aan (hele aantallen, max. 500) en probeer opnieuw." },
      { status: 400 },
    );
  }
  const lines = ruw as Regel[];

  try {
    const { nodes } = await storefront<{ nodes: Node[] }>(CONTROLE, { ids: lines.map((l) => gid(l.variantId)) });
    const geweigerd = nodes
      .map((n, i) => ({ n, regel: lines[i] }))
      .filter(({ n }) => !n || !n.availableForSale || !(Number(n.price.amount) > 0) || n.product.etalage?.value === "true");
    if (geweigerd.length > 0) {
      const namen = geweigerd.map(({ n }) => n?.product.title ?? "een product").join(", ");
      return NextResponse.json(
        { error: `Niet online te koop of intussen niet meer beschikbaar: ${namen}. Verwijder het uit uw winkelmand of vraag er een offerte voor aan.` },
        { status: 409 },
      );
    }

    const data = await storefront<{ cartCreate: { cart: { id: string; checkoutUrl: string } | null; userErrors: { message: string }[] } }>(MAAK_CART, {
      input: {
        lines: lines.map((l) => ({ merchandiseId: gid(l.variantId), quantity: l.quantity })),
        buyerIdentity: { countryCode: "BE" },
      },
    });
    const cart = data.cartCreate.cart;
    if (!cart?.checkoutUrl) throw new Error(data.cartCreate.userErrors.map((e) => e.message).join("; ") || "Geen kassa-URL");
    return NextResponse.json({ checkoutUrl: cart.checkoutUrl, cartId: cart.id });
  } catch (e) {
    meld("kassa", "Shopify-cart aanmaken mislukt — klanten kunnen niet afrekenen", { regels: lines.length, fout: (e as Error).message });
    return NextResponse.json({ error: "De kassa is even niet bereikbaar. Probeer het zo meteen opnieuw of bel ons." }, { status: 502 });
  }
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("cart") ?? "";
  if (!/^gid:\/\/shopify\/Cart\/[A-Za-z0-9?=&_-]+$/.test(id)) return NextResponse.json({ error: "Ongeldig cart-ID." }, { status: 400 });
  try {
    const { cart } = await storefront<{ cart: { id: string } | null }>(CART_STATUS, { id });
    return NextResponse.json({ status: cart ? "open" : "afgerond" }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.warn("[kassa] cart-status niet op te vragen:", (e as Error).message);
    return NextResponse.json({ status: "onbekend" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
