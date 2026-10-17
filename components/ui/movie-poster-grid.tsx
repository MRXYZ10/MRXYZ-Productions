"use client";

import type { ReactNode } from "react";
import { ScrollCoverflow, type CoverflowTone } from "@/components/ui/scroll-coverflow";
import type { Movie } from "@/types/movie";

interface MoviePosterGridProps {
  movies: Movie[];
  emptyMessage?: string;
  actionMode?: "save" | "remove";
  tone?: CoverflowTone;
  ariaLabel?: string;
  header?: ReactNode;
}

/**
 * Every movie collection on the site is a scroll-driven 3D coverflow:
 * wheel / trackpad / touch scrolling rotates the films, no buttons needed.
 */
export function MoviePosterGrid({
  movies,
  emptyMessage,
  actionMode = "save",
  tone = "gold",
  ariaLabel = "3D movie coverflow",
  header,
}: MoviePosterGridProps) {
  return (
    <ScrollCoverflow
      movies={movies}
      header={header}
      tone={tone}
      actionMode={actionMode}
      ariaLabel={ariaLabel}
      emptyMessage={emptyMessage}
    />
  );
}
