import { NextRequest, NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb";
import { MOCK_MOVIES } from "@/types/movie";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);

  if (!query) return NextResponse.json({ results: [], total_results: 0 });

  try {
    return NextResponse.json(await searchMovies(query, page));
  } catch (error) {
    console.warn("Movie search using local catalogue fallback:", error instanceof Error ? error.message : error);
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const results = MOCK_MOVIES.filter((movie) => {
      const content = `${movie.title} ${movie.overview}`.toLowerCase();
      return terms.some((term) => content.includes(term));
    });
    return NextResponse.json({ page: 1, results, total_pages: 1, total_results: results.length, source: "local_fallback" });
  }
}
