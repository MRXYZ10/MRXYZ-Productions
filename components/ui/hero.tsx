"use client";

import { Compass } from "lucide-react";
import type { Movie } from "@/types/movie";
import { ScrollCoverflow } from "@/components/ui/scroll-coverflow";

type HeroProps = { movies: Movie[] };

export function Hero({ movies }: HeroProps) {
  const films = movies.filter((movie) => Boolean(movie.poster_path)).slice(0, 8);

  if (!films.length) {
    return (
      <section id="spotlight" className="cinema-hero-empty">
        <div className="sc-empty">
          <Compass size={22} />
          <p>Movies are loading. Please refresh in a moment.</p>
        </div>
      </section>
    );
  }

  return (
    <ScrollCoverflow
      id="spotlight"
      variant="hero"
      tone="gold"
      movies={films}
      ariaLabel="Trending films"
    />
  );
}
