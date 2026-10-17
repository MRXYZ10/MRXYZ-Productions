"use client";

import { Clapperboard, Compass } from "lucide-react";
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
      header={
        <div className="hero-head">
          <div className="hero-kicker">
            <span className="hero-kicker-dot" />
            <Clapperboard size={12} /> MRXYZ Productions <i /> Live movie radar
          </div>
          <h1 className="hero-title">
            <span className="hero-title-line">Cinema,</span>
            <span className="hero-title-line hero-title-accent">in motion.</span>
          </h1>
          <p className="hero-sub">Scroll to roll through what&apos;s trending right now. Let the night choose the film.</p>
        </div>
      }
    />
  );
}
