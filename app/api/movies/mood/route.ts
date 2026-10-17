import { NextRequest, NextResponse } from "next/server";
import { getMoviesByMood } from "@/lib/tmdb";
import { MOCK_MOVIES } from "@/types/movie";

const MOOD_GENRES: Record<string, number[]> = {
  funny: [35],
  emotional: [18],
  thrilled: [53, 28, 27],
  "mind-blown": [878, 9648, 14],
  romantic: [10749, 18],
  adventurous: [12, 14, 28],
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mood = (searchParams.get("mood") || "thrilled").toLowerCase().trim();
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);

  try {
    const data = await getMoviesByMood(mood, page);
    if (data.results?.length) return NextResponse.json({ results: data.results, source: "tmdb" });
  } catch (error) {
    console.warn("Mood discovery using local catalogue fallback:", error instanceof Error ? error.message : error);
  }

  const allowedGenres = MOOD_GENRES[mood] || [];
  const localResults = MOCK_MOVIES.filter((movie) => movie.genre_ids.some((id) => allowedGenres.includes(id)));
  return NextResponse.json({ results: localResults.length ? localResults : MOCK_MOVIES, source: "local_fallback" });
}
