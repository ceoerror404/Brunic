import { NextResponse } from "next/server";
import { nieuweUrlVoorOudeCategorie } from "@/lib/site/oude-urls";

/**
 * Categorie-URL's van de oude WooCommerce-site (/product-categorie/tapijten/moderne-tapijten/)
 * → de best passende nieuwe categorie, permanent (308). Zie lib/site/oude-urls.ts.
 */
export async function GET(req: Request, { params }: { params: Promise<{ pad: string[] }> }) {
  const doel = await nieuweUrlVoorOudeCategorie((await params).pad.map((s) => decodeURIComponent(s).toLowerCase()));
  return NextResponse.redirect(new URL(doel, req.url), 308);
}
