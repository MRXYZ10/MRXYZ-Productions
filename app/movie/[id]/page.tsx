// =============================================================================
// MRXYZ Productions — Movie Detail Page (Server Component)
// Route: /movie/[id]
// =============================================================================

import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMovieDetails, getSimilarMovies } from "@/lib/tmdb";
import { MOCK_MOVIE_DETAILS } from "@/types/movie-details";
import { MOCK_GENRES, MOCK_MOVIES } from "@/types/movie";
import type { MovieDetail, Movie } from "@/types/movie";
import MovieDetailClient from "@/components/movie/movie-detail-client";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

const getMovie = cache(async (id: number): Promise<{ movie: MovieDetail; similar: Movie[] } | null> => {
  try {
    const [detail, similarRes] = await Promise.all([
      getMovieDetails(id),
      getSimilarMovies(id),
    ]);
    return { movie: detail, similar: similarRes.results.slice(0, 8) };
  } catch {
    // 1. Fallback to mock data
    const similar = MOCK_MOVIES.filter((m) => m.id !== id).slice(0, 8);
    const mock = MOCK_MOVIE_DETAILS[id];
    if (mock) return { movie: mock, similar };

    const catalogueMovie = MOCK_MOVIES.find((item) => item.id === id);
    if (!catalogueMovie) return null;

    return {
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
    };
  }
});

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getMovie(Number(id));

  if (!data) {
    return { title: "Movie Not Found — MRXYZ Productions" };
  }

  return {
    title: `${data.movie.title} — MRXYZ Productions`,
    description: data.movie.overview.slice(0, 160),
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movieId = Number(id);

  if (isNaN(movieId)) notFound();

  const data = await getMovie(movieId);
  if (!data) notFound();

  return (
    <MovieDetailClient
      movie={data.movie}
      similar={data.similar}
      backLabel="Back to discover"
      backUrl="/"
    />
  );
}
