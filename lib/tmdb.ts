// =============================================================================
// MRXYZ Productions — TMDB API Client
// Server-side only. Never import this in client components.
// =============================================================================

import type { Movie, MovieDetail, Genre } from "@/types/movie";
import https from "node:https";

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY ?? "";

// ---------------------------------------------------------------------------
// Generic fetcher
// ---------------------------------------------------------------------------

// Simple in-memory cache to guarantee fast (0ms) loads on repeated fetches
const fetchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache TTL

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const cacheKey = url.toString();
  const cached = fetchCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.data as T;
  }

  let data: unknown;
  try {
    // Prefer the normal Next.js fetch/cache path. Some ISP DNS resolvers return
    // unreachable addresses for api.themoviedb.org; in that case use the
    // alternate-DNS transport below rather than returning sample movies.
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // cache for 1 hour
      // Some networks stall rather than reject failed TMDB routes. Fail fast so
      // the known-good CDN retry can take over without blocking first render.
      signal: AbortSignal.timeout(2800),
    });

    if (!res.ok) {
      throw new TMDBHttpError(`TMDB API error: ${res.status} ${res.statusText}`, res.status);
    }
    data = await res.json();
  } catch (error) {
    if (error instanceof TMDBHttpError) throw error;
    console.warn("TMDB direct connection failed; trying alternate DNS route:", safeErrorMessage(error));
    data = await fetchThroughPublicDns(url);
  }

  fetchCache.set(cacheKey, { data, timestamp: now });
  return data as T;
}


class TMDBHttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "TMDBHttpError";
    this.status = status;
  }
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

type DNSAnswer = { type?: number; data?: string };
type DNSResponse = { Answer?: DNSAnswer[] };

let publicIpCache: { addresses: string[]; expiresAt: number } | null = null;

/**
 * Resolve TMDB through DNS-over-HTTPS and connect to the resulting CDN IP
 * while preserving the api.themoviedb.org hostname for TLS/SNI and HTTP Host.
 * This is a fallback for networks whose configured DNS returns unreachable IPs.
 */
async function getPublicTmdbIPv4(): Promise<string[]> {
  if (publicIpCache && publicIpCache.expiresAt > Date.now()) {
    return publicIpCache.addresses;
  }

  const resolvers = [
    "https://dns.google/resolve?name=api.themoviedb.org&type=A",
    "https://cloudflare-dns.com/dns-query?name=api.themoviedb.org&type=A",
  ];
  const resolved = await Promise.all(
    resolvers.map(async (resolverUrl) => {
      try {
        const response = await fetch(resolverUrl, {
          cache: "no-store",
          headers: { accept: "application/dns-json, application/json" },
          signal: AbortSignal.timeout(1800),
        });
        if (!response.ok) return [] as string[];
        const payload = (await response.json()) as DNSResponse;
        return (payload.Answer ?? [])
          .filter((answer) => answer.type === 1 && typeof answer.data === "string")
          .map((answer) => answer.data as string)
          .filter((address) => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(address));
      } catch {
        return [] as string[];
      }
    }),
  );

  // These CDN addresses were verified by the project owner with curl --resolve.
  // Keep them first, but allow DNS-over-HTTPS to append current CDN addresses.
  const knownWorking = ["18.172.213.43", "18.172.213.28", "18.172.213.119"];
  const addresses = [...new Set([...knownWorking, ...resolved.flat()])];
  publicIpCache = { addresses, expiresAt: Date.now() + 60 * 1000 };
  return addresses;
}

function httpsGetUsingIp(
  url: URL,
  ip: string,
  timeoutMs = 3800,
  signal?: AbortSignal,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        protocol: "https:",
        hostname: url.hostname,
        port: 443,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: { accept: "application/json" },
        timeout: timeoutMs,
        ...(signal ? { signal } : {}),
        // Keep hostname as api.themoviedb.org for TLS certificate validation,
        // but route the socket to the known reachable CDN IP.
        // Node may call custom DNS lookups with { all: true } internally.
        // In that mode the callback MUST receive an array of LookupAddress
        // objects. Returning a string in all-mode causes Node's
        // "Invalid IP address: undefined" error even when `ip` is valid.
        lookup: ((_hostname: string, options: { all?: boolean }, callback: (
          err: NodeJS.ErrnoException | null,
          address: string | Array<{ address: string; family: number }>,
          family?: number,
        ) => void) => {
          if (options?.all) {
            callback(null, [{ address: ip, family: 4 }]);
          } else {
            callback(null, ip, 4);
          }
        }) as never,
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk: string) => { body += chunk; });
        response.on("end", () => {
          const status = response.statusCode ?? 0;
          if (status < 200 || status >= 300) {
            reject(new TMDBHttpError(`TMDB API error: ${status} ${response.statusMessage ?? ""}`.trim(), status));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error("TMDB returned an invalid JSON response"));
          }
        });
      },
    );

    request.on("timeout", () => request.destroy(new Error(`TMDB connection timed out via ${ip}`)));
    request.on("error", reject);
    request.end();
  });
}

async function fetchThroughPublicDns(url: URL): Promise<unknown> {
  const errors: string[] = [];
  const knownPrimary = "18.172.213.43";

  // The owner verified this address manually. Try it before requesting public DNS,
  // because blocked DoH routes can otherwise add several seconds of latency.
  try {
    return await httpsGetUsingIp(url, knownPrimary, 3800);
  } catch (error) {
    if (error instanceof TMDBHttpError) throw error;
    errors.push(`${knownPrimary}: ${safeErrorMessage(error)}`);
  }

  const addresses = (await getPublicTmdbIPv4()).filter((address) => address !== knownPrimary);
  if (addresses.length) {
    // Try alternate CDN IPs concurrently, so one stale/unreachable edge doesn't
    // block every other address for its full timeout. Abort remaining sockets as
    // soon as the first valid HTTPS response arrives.
    const controller = new AbortController();
    const attempts = addresses.slice(0, 5).map(async (address) => {
      try {
        const data = await httpsGetUsingIp(url, address, 3800, controller.signal);
        return { address, data };
      } catch (error) {
        errors.push(`${address}: ${safeErrorMessage(error)}`);
        throw error;
      }
    });

    try {
      const winner = await Promise.any(attempts);
      controller.abort();
      return winner.data;
    } catch {
      controller.abort();
    }
  }

  throw new Error(`TMDB connection failed via alternate DNS. ${errors.join("; ")}`);
}

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

interface TMDBListResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/** Trending movies this week */
export async function getTrending(page = 1): Promise<TMDBListResponse<Movie>> {
  return tmdbFetch<TMDBListResponse<Movie>>("/trending/movie/week", {
    page: String(page),
  });
}

/** Popular movies */
export async function getPopular(page = 1): Promise<TMDBListResponse<Movie>> {
  return tmdbFetch<TMDBListResponse<Movie>>("/movie/popular", {
    page: String(page),
  });
}

/** Top rated movies */
export async function getTopRated(page = 1): Promise<TMDBListResponse<Movie>> {
  return tmdbFetch<TMDBListResponse<Movie>>("/movie/top_rated", {
    page: String(page),
  });
}

/** Now playing in theaters */
export async function getNowPlaying(page = 1): Promise<TMDBListResponse<Movie>> {
  return tmdbFetch<TMDBListResponse<Movie>>("/movie/now_playing", {
    region: "IN",
    page: String(page),
  });
}

/** Upcoming theatrical releases in India */
export async function getUpcoming(page = 1): Promise<TMDBListResponse<Movie>> {
  return tmdbFetch<TMDBListResponse<Movie>>("/movie/upcoming", {
    region: "IN",
    page: String(page),
  });
}

/** Discover movies by genre IDs */
export async function discoverByGenres(
  genreIds: number[],
  page = 1,
  sortBy = "popularity.desc"
): Promise<TMDBListResponse<Movie>> {
  return tmdbFetch<TMDBListResponse<Movie>>("/discover/movie", {
    with_genres: genreIds.join(","),
    sort_by: sortBy,
    page: String(page),
    "vote_count.gte": "50",
  });
}

/** Search movies by query */
export async function searchMovies(
  query: string,
  page = 1
): Promise<TMDBListResponse<Movie>> {
  return tmdbFetch<TMDBListResponse<Movie>>("/search/movie", {
    query,
    page: String(page),
  });
}

/** Get full movie details (with credits + videos + watch providers) */
export async function getMovieDetails(id: number): Promise<MovieDetail> {
  const data = await tmdbFetch<any>(`/movie/${id}`, {
//     #TODO:TMDB returns a structured JSON payload of every country in the world, categorized into:
        // flatrate: Subscription streaming (e.g. Netflix, Hotstar, Prime).
        // rent: 48-hour rental (e.g. YouTube Movies, Google Play).
        // buy: Digital purchase (e.g. Apple TV Store).
        // free / ads: Ad-supported platforms (e.g. Tubi, Freevee).

    append_to_response: "credits,videos,watch/providers", 
  });
  if (data["watch/providers"]) {
    data.watch_providers = data["watch/providers"];
  }
  return data as MovieDetail;
}

/** Get watch providers directly for a movie */
export async function getMovieWatchProviders(id: number): Promise<any> {
  return tmdbFetch<any>(`/movie/${id}/watch/providers`);
}

/** Get the official genre list */
export async function getGenres(): Promise<Genre[]> {
  const data = await tmdbFetch<{ genres: Genre[] }>("/genre/movie/list");
  return data.genres;
}

/** Get similar movies */
export async function getSimilarMovies(
  id: number,
  page = 1
): Promise<TMDBListResponse<Movie>> {
  return tmdbFetch<TMDBListResponse<Movie>>(`/movie/${id}/similar`, {
    page: String(page),
  });
}

/** Get movies by a "mood" — maps moods to genre combinations */
export async function getMoviesByMood(mood: string, page = 1): Promise<TMDBListResponse<Movie>> {
  const moodGenreMap: Record<string, number[]> = {
    funny: [35],           // Comedy
    emotional: [18],       // Drama
    thrilled: [53, 28],    // Thriller + Action
    "mind-blown": [878, 9648], // Sci-Fi + Mystery
    romantic: [10749],     // Romance
    adventurous: [12, 14], // Adventure + Fantasy
  };

  const genreIds = moodGenreMap[mood.toLowerCase()] ?? [28]; // default to Action
  return discoverByGenres(genreIds, page);
}
