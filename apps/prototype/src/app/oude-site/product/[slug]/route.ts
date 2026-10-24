import { NextResponse } from "next/server";
import { nieuweUrlVoorOudProduct } from "@/lib/site/oude-urls";
import { routes } from "@/lib/routes";

/**
 * Oude WooCommerce-product-URL (via src/proxy.ts herschreven naar hier) → nieuw product of
 * best passende categorie, permanent (308). Zie lib/site/oude-urls.ts.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const doel = (await nieuweUrlVoorOudProduct(decodeURIComponent((await params).slug))) ?? routes.catalog();
  return NextResponse.redirect(new URL(doel, req.url), 308);
}
