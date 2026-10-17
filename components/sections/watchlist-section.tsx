"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, Check, Search, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { getPosterUrl, MOCK_GENRES } from "@/types/movie";
import type { Movie } from "@/types/movie";

export function WatchlistSection() {
  const { watchlist, clearWatchlist, toggleWatchlist, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All genres");
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "title">("recent");

  const availableGenres = useMemo(() => {
    const genreIds = new Set(watchlist.flatMap((movie) => movie.genre_ids || []));
    return MOCK_GENRES.filter((genre) => genreIds.has(genre.id));
  }, [watchlist]);

  const filteredMovies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = watchlist.filter((movie) => {
      const matchesQuery = !query || `${movie.title} ${movie.overview || ""}`.toLowerCase().includes(query);
      const matchesGenre = selectedGenre === "All genres" || (movie.genre_ids || []).some(
        (id) => MOCK_GENRES.find((genre) => genre.id === id)?.name === selectedGenre,
      );
      return matchesQuery && matchesGenre;
    });

    if (sortBy === "rating") filtered.sort((a, b) => b.vote_average - a.vote_average);
    if (sortBy === "title") filtered.sort((a, b) => a.title.localeCompare(b.title));
    return filtered;
  }, [watchlist, searchQuery, selectedGenre, sortBy]);

  const handleClear = async () => {
    if (watchlist.length && window.confirm("Remove every movie from your watchlist? This cannot be undone.")) {
      await clearWatchlist();
    }
  };

  return (
    <section id="watchlist" className="px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/65">
              <Bookmark size={14} /> Your personal collection
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Your watchlist</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">Keep the films you want to come back to, all in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/60">
              {watchlist.length} {watchlist.length === 1 ? "film" : "films"} saved
            </span>
            {watchlist.length > 0 && (
              <button onClick={handleClear} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-white/45 transition hover:bg-red-400/10 hover:text-red-200">
                <Trash2 size={13} /> Clear list
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-6 py-12 text-center text-sm text-white/45">Loading your collection…</div>
        ) : watchlist.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.14] bg-white/[0.02] px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/55"><Bookmark size={20} /></div>
            <h3 className="mt-4 text-base font-semibold text-white">Your list starts here</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">Save films as you explore and they&apos;ll be waiting for you here. No account is required for a local watchlist.</p>
            <Link href="#trending" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-100">Explore films</Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 sm:flex-row sm:items-center">
              <label className="relative min-w-0 flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search your saved films"
                  className="h-10 w-full rounded-lg border border-white/[0.08] bg-black/20 pl-9 pr-9 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-200/35"
                />
                {searchQuery && <button onClick={() => setSearchQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"><X size={14} /></button>}
              </label>
              <div className="flex gap-2">
                <select value={selectedGenre} onChange={(event) => setSelectedGenre(event.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#11141a] px-3 text-sm text-white/75 outline-none focus:border-cyan-200/35 sm:flex-none">
                  <option>All genres</option>
                  {availableGenres.map((genre) => <option key={genre.id}>{genre.name}</option>)}
                </select>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as "recent" | "rating" | "title")} className="h-10 min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#11141a] px-3 text-sm text-white/75 outline-none focus:border-cyan-200/35 sm:flex-none">
                  <option value="recent">Recently saved</option>
                  <option value="rating">Highest rated</option>
                  <option value="title">Title A–Z</option>
                </select>
              </div>
            </div>

            {filteredMovies.length ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5">
                {filteredMovies.map((movie: Movie) => (
                  <article key={movie.id} className="group min-w-0">
                    <Link href={`/movie/${movie.id}`} className="relative block aspect-[2/3] overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] transition duration-300 group-hover:-translate-y-1 group-hover:border-cyan-200/30">
                      <Image src={getPosterUrl(movie.poster_path, "w500")} alt={`${movie.title} poster`} fill unoptimized sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 18vw" className="object-cover transition duration-500 group-hover:scale-[1.035]" />
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 to-transparent" />
                      <span className="absolute bottom-3 left-3 right-3 line-clamp-2 text-sm font-semibold text-white">{movie.title}</span>
                    </Link>
                    <div className="mt-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/movie/${movie.id}`} className="block truncate text-sm font-medium text-white/90 hover:text-cyan-200">{movie.title}</Link>
                        <p className="mt-1 text-xs text-white/45">{movie.release_date?.slice(0, 4) || "—"}</p>
                      </div>
                      <button onClick={() => void toggleWatchlist(movie)} title="Remove from watchlist" aria-label={`Remove ${movie.title} from watchlist`} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 transition hover:border-red-300/25 hover:bg-red-300/10 hover:text-red-200"><Check size={15} /></button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center">
                <p className="text-sm text-white/55">No saved films match these filters.</p>
                <button onClick={() => { setSearchQuery(""); setSelectedGenre("All genres"); setSortBy("recent"); }} className="mt-3 text-sm font-medium text-cyan-200 hover:text-white">Reset filters</button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
