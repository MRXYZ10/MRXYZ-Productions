// =============================================================================
// MRXYZ Productions — Movie Detail API Route
// GET /api/movies/[id] → returns MovieDetail + similar movies
// =============================================================================

import { getMovieDetails, getSimilarMovies } from "@/lib/tmdb";
import { MOCK_MOVIE_DETAILS } from "@/types/movie-details";
import { MOCK_GENRES, MOCK_MOVIES } from "@/types/movie";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const movieId = Number(id);

  if (isNaN(movieId)) {
    return Response.json({ error: "Invalid movie ID" }, { status: 400 });
  }

  try {
    // Try TMDB API first
    const [detail, similarRes] = await Promise.all([
      getMovieDetails(movieId),
      getSimilarMovies(movieId),
    ]);

    return Response.json({
      movie: detail,
      similar: similarRes.results.slice(0, 8),
    });
  } catch {
    // Fallback to mock data
    const similar = MOCK_MOVIES.filter((m) => m.id !== movieId).slice(0, 8);
    const mockDetail = MOCK_MOVIE_DETAILS[movieId];
    if (mockDetail) return Response.json({ movie: mockDetail, similar });

    const catalogueMovie = MOCK_MOVIES.find((item) => item.id === movieId);
    if (!catalogueMovie) return Response.json({ error: "Movie not found" }, { status: 404 });

    return Response.json({
      movie: {
        ...catalogueMovie,
        runtime: 0,
        tagline: null,
        genres: catalogueMovie.genre_ids.map((genreId) =>
          MOCK_GENRES.find((genre) => genre.id === genreId) || { id: genreId, name: "Film" },
        ),
        credits: { cast: [] },
        videos: { results: [] },
      },
      similar,
    });
  }
}
