import { Award } from "lucide-react";
import type { Movie } from "@/types/movie";
import { MoviePosterGrid } from "@/components/ui/movie-poster-grid";
import { SectionHeading } from "@/components/ui/section-heading";

interface DiscoverSectionProps {
  movies: Movie[];
}

export function DiscoverSection({ movies }: DiscoverSectionProps) {
  return (
    <div id="discover" className="cinema-section">
      <MoviePosterGrid
        movies={movies.slice(0, 8)}
        tone="violet"
        ariaLabel="Critics picks"
        header={
          <SectionHeading
            index="05"
            icon={<Award size={13} />}
            eyebrow="Worth your time"
            title="Critics' picks"
            description="Highly rated films, from all-time favourites to modern classics."
          />
        }
      />
    </div>
  );
}
