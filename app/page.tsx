import { Navbar } from "@/components/sections/navbar";
import { Hero } from "@/components/ui/hero";
import { MoodSelector } from "@/components/sections/mood-selector";
import { DiscoverSection } from "@/components/sections/discover-section";
import { TrendingSection } from "@/components/sections/trending-section";
import { ReleaseSection } from "@/components/sections/release-section";
import { WatchlistSection } from "@/components/sections/watchlist-section";
import { Marquee } from "@/components/ui/marquee";
import { Footer } from "@/components/sections/footer";
import { getTrending, getTopRated, getNowPlaying, getUpcoming } from "@/lib/tmdb";
import { MOCK_MOVIES } from "@/types/movie";
import type { Movie } from "@/types/movie";

async function fetchPageData(): Promise<{ trending: Movie[]; topRated: Movie[]; nowPlaying: Movie[]; upcoming: Movie[] }> {
  const [trendingResult, topRatedResult, nowPlayingResult, upcomingResult] = await Promise.allSettled([
    getTrending(),
    getTopRated(),
    getNowPlaying(),
    getUpcoming(),
  ]);

  const trending = trendingResult.status === "fulfilled" ? trendingResult.value.results : [];
  const topRated = topRatedResult.status === "fulfilled" ? topRatedResult.value.results : [];
  const nowPlaying = nowPlayingResult.status === "fulfilled" ? nowPlayingResult.value.results : [];
  const upcoming = upcomingResult.status === "fulfilled" ? upcomingResult.value.results : [];

  // Keep core discovery useful before the owner configures TMDB. Only show
  // live release sections when TMDB successfully returns live catalogue data.
  const liveTrending = trending.length ? trending : MOCK_MOVIES;
  const liveTopRated = topRated.length ? topRated : [...MOCK_MOVIES].sort((a, b) => b.vote_average - a.vote_average);

  return {
    trending: liveTrending,
    topRated: liveTopRated,
    nowPlaying,
    upcoming,
  };
}

export default async function Home() {
  const { trending, topRated, nowPlaying, upcoming } = await fetchPageData();
  // Feed the coverflow with real TMDB results when available. De-duplicate IDs
  // while keeping the trending feed at the front and retain the mock fallback.
  const spotlight = [...trending, ...nowPlaying, ...upcoming, ...topRated]
    .filter((movie, index, all) => all.findIndex((candidate) => candidate.id === movie.id) === index)
    .slice(0, 15);

  return (
    <>
      <Navbar />
      <main id="top">
        <Hero movies={spotlight} />
        <Marquee />
        <TrendingSection movies={trending} />
        <ReleaseSection
          id="latest-releases"
          eyebrow="On the big screen"
          title="Now playing in India"
          description="Recent theatrical releases, refreshed from the live movie catalogue."
          movies={nowPlaying}
        />
        <ReleaseSection
          id="coming-soon"
          eyebrow="Coming soon"
          title="Upcoming releases"
          description="A first look at films scheduled to arrive in Indian theatres. Release dates can change."
          movies={upcoming}
          upcoming
        />
        <div id="recommendations">
          <MoodSelector />
        </div>
        <DiscoverSection movies={topRated} />
        <WatchlistSection />
      </main>
      <Footer />
    </>
  );
}
