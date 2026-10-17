import { NextRequest, NextResponse } from "next/server";
import { discoverByGenres } from "@/lib/tmdb";
import { MOCK_MOVIES } from "@/types/movie";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const genreStr = searchParams.get("genres") || "28";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const genreIds = genreStr.split(",").map(Number).filter(Number.isFinite);

  try {
    return NextResponse.json(await discoverByGenres(genreIds, page));
  } catch (error) {
    console.warn("Discovery using local catalogue fallback:", error instanceof Error ? error.message : error);
    const results = MOCK_MOVIES.filter((movie) => movie.genre_ids.some((id) => genreIds.includes(id)));
    return NextResponse.json({ page: 1, results: results.length ? results : MOCK_MOVIES, total_pages: 1, total_results: results.length || MOCK_MOVIES.length, source: "local_fallback" });
  }
}
