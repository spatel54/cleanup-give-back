import { NextResponse } from "next/server";
import { biasFromViewbox, searchPlacesFree } from "@/lib/place-search";

/**
 * Free place search for heatmap fullscreen search (Photon → Nominatim).
 * Keeps Nominatim User-Agent / CORS on the server so the UI works without Google.
 *
 * GET /api/place-search?q=...&limit=6&minLng=&minLat=&maxLng=&maxLat=
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ hits: [], source: "none" });
  }

  const limitRaw = Number(searchParams.get("limit") ?? "6");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 10) : 6;

  const minLng = Number(searchParams.get("minLng"));
  const minLat = Number(searchParams.get("minLat"));
  const maxLng = Number(searchParams.get("maxLng"));
  const maxLat = Number(searchParams.get("maxLat"));
  const viewboxBounds =
    [minLng, minLat, maxLng, maxLat].every((n) => Number.isFinite(n))
      ? ([minLng, minLat, maxLng, maxLat] as [number, number, number, number])
      : undefined;

  try {
    const result = await searchPlacesFree(q, {
      limit,
      viewboxBounds,
      bias: biasFromViewbox(viewboxBounds),
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=30" },
    });
  } catch (err) {
    console.error("[api/place-search] unhandled:", err instanceof Error ? err.message : err);
    return NextResponse.json({ hits: [], source: "none" }, { status: 502 });
  }
}
