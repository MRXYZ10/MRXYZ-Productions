"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDownRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Compass,
  Play,
  Sparkles,
  Star,
} from "lucide-react";
import type { Movie } from "@/types/movie";
import { getBackdropUrl, getPosterUrl, MOCK_GENRES } from "@/types/movie";

type HeroProps = { movies: Movie[] };

function getMovieYear(movie: Movie) {
  return movie.release_date?.slice(0, 4) || "Coming soon";
}

function getMovieGenre(movie: Movie) {
  return movie.genre_ids
    ?.map((id) => MOCK_GENRES.find((genre) => genre.id === id)?.name)
    .find(Boolean) || "FEATURED FILM";
}

function getOffset(index: number, activeIndex: number, length: number) {
  const raw = index - activeIndex;
  if (raw > length / 2) return raw - length;
  if (raw < -length / 2) return raw + length;
  return raw;
}

export function Hero({ movies }: HeroProps) {
  const films = movies.filter((movie) => Boolean(movie.poster_path)).slice(0, 15);
  const filmCount = films.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef(0);
  const moved = useRef(false);

  const step = useCallback((direction: number) => {
    if (!filmCount) return;
    setActiveIndex((current) => (current + direction + filmCount) % filmCount);
  }, [filmCount]);

  useEffect(() => {
    if (paused || dragging || filmCount < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % filmCount);
    }, 5600);
    return () => window.clearInterval(timer);
  }, [paused, dragging, filmCount]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    startX.current = event.clientX;
    moved.current = false;
    setDragging(true);
    setDragOffset(0);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const delta = event.clientX - startX.current;
    if (Math.abs(delta) > 7 && !moved.current) {
      moved.current = true;
      // Capture only after an actual drag begins so a normal poster click still
      // follows its link, while an in-progress drag can leave the stage safely.
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setDragOffset(delta);
  };

  const onPointerUp = () => {
    if (!dragging) return;
    const delta = dragOffset;
    if (Math.abs(delta) > 42) {
      const amount = Math.max(1, Math.min(3, Math.round(Math.abs(delta) / 150)));
      step(delta < 0 ? amount : -amount);
    }
    setDragging(false);
    setDragOffset(0);
  };

  const active = films[activeIndex];
  const activeBackdrop = active?.backdrop_path ? getBackdropUrl(active.backdrop_path, "w1280") : "";

  return (
    <section
      id="spotlight"
      className="cinema-hero relative isolate overflow-hidden px-4 pb-12 pt-24 sm:px-6 sm:pb-14 sm:pt-24 lg:px-10 lg:pt-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="cinema-hero-backdrop" style={activeBackdrop ? { backgroundImage: `url("${activeBackdrop}")` } : undefined} />
      <div className="cinema-hero-grain" aria-hidden="true" />
      <div className="cinema-hero-spot cinema-hero-spot-left" aria-hidden="true" />
      <div className="cinema-hero-spot cinema-hero-spot-right" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-[1600px]">
        <div className="cinema-hero-heading mx-auto max-w-4xl text-center">
          <div className="cinema-kicker mx-auto mb-5 inline-flex items-center gap-2">
            <span className="cinema-kicker-dot" />
            <Clapperboard size={13} /> THE MOVIE RADAR <span className="cinema-kicker-divider">/</span> LIVE DISCOVERY
          </div>
          <h1 className="cinema-hero-title">
            Trending <span>Now.</span>
          </h1>
          <p className="cinema-hero-subtitle mx-auto mt-4 max-w-2xl">
            Every frame has a story. Roll through what&apos;s moving, find your next obsession, and let the night choose the film.
          </p>
          <div className="cinema-hero-meta mt-6 flex flex-wrap items-center justify-center gap-3">
            <span><span className="cinema-meta-live" /> Movie radar</span>
            <span className="cinema-meta-divider" />
            <span>{films.length ? `${films.length} films in rotation` : "Curated cinema"}</span>
            <span className="cinema-meta-divider" />
            <span>Built for the big screen</span>
          </div>
        </div>

        {films.length > 0 ? (
          <div className="cinema-roll-wrap mx-auto mt-8 max-w-[1500px] sm:mt-10">
            <div
              className={`cinema-roll-stage ${dragging ? "is-dragging" : ""}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onLostPointerCapture={onPointerUp}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") step(-1);
                if (event.key === "ArrowRight") step(1);
              }}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              role="group"
              tabIndex={0}
              aria-label="Interactive 3D movie roll. Drag or use the arrow keys to browse films."
            >
              <div className="cinema-roll-light" aria-hidden="true" />
              {films.map((movie, index) => {
                const offset = getOffset(index, activeIndex, films.length);
                const distance = Math.abs(offset);
                if (distance > 3) return null;

                const desktopX = offset * 250 + dragOffset * 0.28;
                const mobileX = offset * 145 + dragOffset * 0.28;
                const scale = distance === 0 ? 1 : distance === 1 ? 0.86 : distance === 2 ? 0.7 : 0.56;
                const opacity = distance === 0 ? 1 : distance === 1 ? 0.9 : distance === 2 ? 0.55 : 0.26;
                const genre = getMovieGenre(movie);
                const isActive = offset === 0;

                return (
                  <Link
                    key={movie.id}
                    href={`/movie/${movie.id}`}
                    draggable={false}
                    onClick={(event) => { if (moved.current) event.preventDefault(); }}
                    className={`cinema-roll-card ${isActive ? "is-active" : ""}`}
                    style={{
                      "--roll-x-desktop": `${desktopX}px`,
                      "--roll-x-mobile": `${mobileX}px`,
                      zIndex: 40 - distance * 6,
                      opacity,
                      transform: `translate(-50%, -50%) rotateY(${offset * -23}deg) translateZ(${-distance * 64}px) scale(${scale})`,
                      pointerEvents: distance > 2 ? "none" : "auto",
                    } as CSSProperties}
                    aria-label={`View ${movie.title}, rating ${Number(movie.vote_average || 0).toFixed(1)}`}
                    tabIndex={distance <= 1 ? 0 : -1}
                  >
                    <Image
                      src={getPosterUrl(movie.poster_path, "w500")}
                      alt={`${movie.title} poster`}
                      width={680}
                      height={1020}
                      sizes="(max-width: 640px) 57vw, (max-width: 1024px) 35vw, 24vw"
                      unoptimized
                      draggable={false}
                    />
                    <div className="cinema-roll-vignette" />
                    <div className="cinema-roll-topline">
                      <span className="cinema-roll-genre">{genre}</span>
                      <span className="cinema-roll-rating"><Star size={12} fill="currentColor" /> {Number(movie.vote_average || 0).toFixed(1)}</span>
                    </div>
                    <div className="cinema-roll-card-info">
                      <span className="cinema-roll-year"><span className="cinema-year-dot" /> {getMovieYear(movie)}</span>
                      <h2>{movie.title}</h2>
                      <p>{movie.overview || "A story waiting to be discovered."}</p>
                      <span className="cinema-roll-open"><Play size={12} fill="currentColor" /> Explore film <ArrowRight size={13} /></span>
                    </div>
                    {isActive && <span className="cinema-roll-active-line" />}
                  </Link>
                );
              })}
            </div>

            <button type="button" className="cinema-roll-arrow cinema-roll-prev" onClick={() => step(-1)} aria-label="Previous movie">
              <ChevronLeft size={20} />
            </button>
            <button type="button" className="cinema-roll-arrow cinema-roll-next" onClick={() => step(1)} aria-label="Next movie">
              <ChevronRight size={20} />
            </button>

            <div className="cinema-roll-controls">
              <button type="button" className="cinema-roll-control" onClick={() => step(-1)} aria-label="Previous film"><ChevronLeft size={16} /></button>
              <div className="cinema-roll-progress" aria-live="polite">
                <span className="cinema-roll-current">{String(activeIndex + 1).padStart(2, "0")}</span>
                <span className="cinema-roll-progress-track"><span style={{ width: `${((activeIndex + 1) / films.length) * 100}%` }} /></span>
                <span className="cinema-roll-total">{String(films.length).padStart(2, "0")}</span>
              </div>
              <button type="button" className="cinema-roll-control" onClick={() => step(1)} aria-label="Next film"><ChevronRight size={16} /></button>
              <span className="cinema-roll-hint"><span className="cinema-hint-drag">↔</span> DRAG TO EXPLORE</span>
            </div>

            {active && (
              <div className="cinema-selected-movie mx-auto mt-7 flex max-w-2xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:text-left">
                <div className="cinema-selected-mark"><Sparkles size={15} /></div>
                <div className="min-w-0">
                  <p className="cinema-selected-label">CURRENTLY IN FOCUS</p>
                  <p className="cinema-selected-title">{active.title} <span>· {getMovieYear(active)}</span></p>
                </div>
                <Link href={`/movie/${active.id}`} className="cinema-selected-link">View film <ArrowDownRight size={15} /></Link>
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/60">
            <Compass className="mx-auto mb-3" /> Movies are loading. Please refresh in a moment.
          </div>
        )}

        <div className="cinema-hero-bottom mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
          <Link href="#discover" className="cinema-bottom-link">Explore the library <ArrowDownRight size={14} /></Link>
          <span className="cinema-bottom-separator" />
          <Link href="#recommendations" className="cinema-bottom-link"><Sparkles size={14} /> Let AI find your vibe <ArrowRight size={14} /></Link>
        </div>
      </div>
    </section>
  );
}
