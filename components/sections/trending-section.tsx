import { TrendingUp } from "lucide-react";
import type { Movie } from "@/types/movie";
import { MoviePosterGrid } from "@/components/ui/movie-poster-grid";
import { SectionHeading } from "@/components/ui/section-heading";

interface TrendingSectionProps {
  movies: Movie[];
}

export function TrendingSection({ movies }: TrendingSectionProps) {
  return (
    <div id="trending" className="cinema-section">
      <MoviePosterGrid
        movies={movies.slice(0, 8)}
        tone="gold"
        ariaLabel="Trending films"
        header={
          <SectionHeading
            index="01"
            icon={<TrendingUp size={13} />}
            eyebrow="Popular right now"
            title="Trending this week"
            description="The films everyone is discovering and talking about."
          />
        }
      />
    </div>
  );
}
