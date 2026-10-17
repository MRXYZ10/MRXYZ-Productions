import { NextResponse } from "next/server";
import { getTrending } from "@/lib/tmdb";
import { MOCK_MOVIES } from "@/types/movie";

export async function GET() {
  try {
    return NextResponse.json(await getTrending());
  } catch (error) {
    console.warn("Trending movies using local catalogue fallback:", error instanceof Error ? error.message : error);
    return NextResponse.json({ page: 1, results: MOCK_MOVIES, total_pages: 1, total_results: MOCK_MOVIES.length, source: "local_fallback" });
  }
}
