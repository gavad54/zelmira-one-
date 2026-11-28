import { NextRequest, NextResponse } from "next/server";
import { AI_ENGINE_KEYS, listAiBusinessCapabilities } from "@/lib/ai-business-suite.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CANONICAL_PRODUCTS = ["DANA", "ARIANA", "LEADORA", "ARMIN_MARKET", "ARIA"];
const LEGACY_MODULES = ["ARVAND", "CHARSU", "GANJINEH", "NEGAH", "SEPEHR", "NAMA", "PAYAM"];
const ACCEPTED_PRODUCTS = new Set([...CANONICAL_PRODUCTS, ...LEGACY_MODULES]);
const MODULES = new Set(LEGACY_MODULES);

export async function GET(request: NextRequest) {
  const product = request.nextUrl.searchParams.get("product") ?? undefined;
  const module = request.nextUrl.searchParams.get("module") ?? undefined;
  const engine = request.nextUrl.searchParams.get("engine") ?? undefined;
  const includePlannedParam = request.nextUrl.searchParams.get("includePlanned");
  if (product && !ACCEPTED_PRODUCTS.has(product)) {
    return NextResponse.json({ error: "invalid_product" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (module && !MODULES.has(module)) {
    return NextResponse.json({ error: "invalid_module" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (engine && !AI_ENGINE_KEYS.includes(engine)) {
    return NextResponse.json({ error: "invalid_engine" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (includePlannedParam && !["true", "false"].includes(includePlannedParam)) {
    return NextResponse.json({ error: "invalid_include_planned" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const includePlanned = includePlannedParam !== "false";
  const capabilities = listAiBusinessCapabilities({ product, module, engine, includePlanned });
  return NextResponse.json({
    total: capabilities.length,
    products: CANONICAL_PRODUCTS,
    modules: LEGACY_MODULES,
    engines: AI_ENGINE_KEYS,
    capabilities
  }, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
