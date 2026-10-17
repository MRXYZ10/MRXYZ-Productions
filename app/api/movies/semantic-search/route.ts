import { NextRequest, NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb";
import { MOCK_MOVIES } from "@/types/movie";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000/search";

export async function GET(req: NextRequest) {
  const query = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!query) return NextResponse.json({ results: [] });

  try {
    const pythonRes = await fetch(`${PYTHON_BACKEND_URL}?query=${encodeURIComponent(query)}`, {
      method: "GET",
      signal: AbortSignal.timeout(1200),
    });
    if (pythonRes.ok) {
      const data = await pythonRes.json();
      if (Array.isArray(data?.results) && data.results.length) return NextResponse.json({ results: data.results, source: "local_vector_search" });
    }
  } catch {
    // The Python search service is optional; continue to a catalogue search.
  }

  try {
    const data = await searchMovies(query);
    return NextResponse.json({ results: data.results, source: "tmdb_keyword_fallback" });
  } catch {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const results = MOCK_MOVIES.filter((movie) => {
      const content = `${movie.title} ${movie.overview}`.toLowerCase();
      return terms.some((term) => content.includes(term));
    });
    return NextResponse.json({ results, source: "local_fallback" });
  }
}
