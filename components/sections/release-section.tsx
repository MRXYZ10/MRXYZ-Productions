"use client";

import { motion } from "motion/react";
import { CalendarClock, Clapperboard } from "lucide-react";
import type { Movie } from "@/types/movie";
import { MoviePosterGrid } from "@/components/ui/movie-poster-grid";

interface ReleaseSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  movies: Movie[];
  upcoming?: boolean;
}

export function ReleaseSection({
  id,
  eyebrow,
  title,
  description,
  movies,
  upcoming = false,
}: ReleaseSectionProps) {
  if (!movies.length) return null;
  const Icon = upcoming ? CalendarClock : Clapperboard;

  return (
    <section id={id} className="cinema-section cinema-release-section px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-[1440px]">
        <motion.div
          initial={{ y: 18, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="cinema-section-heading mb-8"
        >
          <div className="cinema-overline mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
            <Icon size={14} /> {eyebrow}
          </div>
          <h2 className="cinema-section-title text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
          <p className="cinema-section-description mt-2 max-w-xl text-sm leading-6 sm:text-base">{description}</p>
        </motion.div>
        <MoviePosterGrid movies={movies.slice(0, 10)} tone={upcoming ? "violet" : "ice"} ariaLabel={upcoming ? "Upcoming releases" : "Now playing in India"} />
      </div>
    </section>
  );
}
