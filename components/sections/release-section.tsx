import { CalendarClock, Clapperboard } from "lucide-react";
import type { Movie } from "@/types/movie";
import { MoviePosterGrid } from "@/components/ui/movie-poster-grid";
import { SectionHeading } from "@/components/ui/section-heading";

interface ReleaseSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  movies: Movie[];
  upcoming?: boolean;
}

export function ReleaseSection({ id, eyebrow, title, description, movies, upcoming = false }: ReleaseSectionProps) {
  if (!movies.length) return null;
  const Icon = upcoming ? CalendarClock : Clapperboard;

  return (
    <div id={id} className="cinema-section">
      <MoviePosterGrid
        movies={movies.slice(0, 8)}
        tone={upcoming ? "violet" : "ice"}
        ariaLabel={upcoming ? "Upcoming releases" : "Now playing in India"}
        header={<SectionHeading index={upcoming ? "03" : "02"} icon={<Icon size={13} />} eyebrow={eyebrow} title={title} description={description} />}
      />
    </div>
  );
}
