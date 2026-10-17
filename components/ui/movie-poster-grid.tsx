"use client";

import Image from "next/image";
import Link from "next/link";
import { BookmarkPlus, Check, Star } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { getPosterUrl, MOCK_GENRES } from "@/types/movie";
import type { Movie } from "@/types/movie";

interface MoviePosterGridProps {
  movies: Movie[];
  emptyMessage?: string;
}

export function MoviePosterGrid({ movies, emptyMessage = "Movies will appear here when the catalogue is available." }: MoviePosterGridProps) {
  const { isInWatchlist, toggleWatchlist } = useAuth();

  if (!movies.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-6 py-12 text-center text-sm text-white/50">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5">
      {movies.map((movie) => {
        const saved = isInWatchlist(movie.id);
        const year = movie.release_date?.slice(0, 4);
        const genre = movie.genre_ids
          .map((id) => MOCK_GENRES.find((item) => item.id === id)?.name)
          .find(Boolean);

        return (
          <article key={movie.id} className="group min-w-0">
            <Link href={`/movie/${movie.id}`} className="relative block aspect-[2/3] overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] shadow-lg shadow-black/10 transition duration-300 group-hover:-translate-y-1 group-hover:border-cyan-200/30 group-hover:shadow-xl group-hover:shadow-cyan-950/20">
              <Image
                src={getPosterUrl(movie.poster_path, "w500")}
                alt={`${movie.title} poster`}
                fill
                unoptimized
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 18vw"
                className="object-cover transition duration-500 group-hover:scale-[1.035]"
              />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 to-transparent" />
              <div className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md border border-black/20 bg-black/65 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <Star size={11} className="fill-amber-300 text-amber-300" />
                {Number(movie.vote_average || 0).toFixed(1)}
              </div>
              <span className="absolute bottom-3 left-3 right-3 line-clamp-2 text-sm font-semibold leading-snug text-white">{movie.title}</span>
            </Link>

            <div className="mt-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/movie/${movie.id}`} className="block truncate text-sm font-medium text-white/90 transition hover:text-cyan-200">
                  {movie.title}
                </Link>
                <p className="mt-1 truncate text-xs text-white/45">
                  {[year, genre].filter(Boolean).join(" · ") || "Film"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void toggleWatchlist(movie)}
                aria-label={saved ? `Remove ${movie.title} from watchlist` : `Add ${movie.title} to watchlist`}
                title={saved ? "Saved to watchlist" : "Add to watchlist"}
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${saved ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-200" : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"}`}
              >
                {saved ? <Check size={15} /> : <BookmarkPlus size={15} />}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
