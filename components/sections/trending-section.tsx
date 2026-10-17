"use client";

import { motion } from "motion/react";
import { TrendingUp } from "lucide-react";
import type { Movie } from "@/types/movie";
import { MoviePosterGrid } from "@/components/ui/movie-poster-grid";

interface TrendingSectionProps {
  movies: Movie[];
}

export function TrendingSection({ movies }: TrendingSectionProps) {
  return (
    <section id="trending" className="cinema-section cinema-trending-section px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-[1440px]">
        <motion.div
          initial={{ y: 18, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="cinema-section-heading mb-8"
        >
          <div className="cinema-overline mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
            <TrendingUp size={14} /> Popular right now
          </div>
          <h2 className="cinema-section-title text-3xl font-semibold tracking-tight text-white sm:text-4xl">Trending this week</h2>
          <p className="cinema-section-description mt-2 max-w-xl text-sm leading-6 sm:text-base">A quick pulse on the films people are discovering and talking about.</p>
        </motion.div>
        <MoviePosterGrid movies={movies.slice(0, 10)} tone="gold" ariaLabel="Trending films" />
      </div>
    </section>
  );
}
