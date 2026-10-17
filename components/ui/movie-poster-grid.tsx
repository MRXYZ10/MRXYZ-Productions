"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookmarkPlus, Check, ChevronLeft, ChevronRight, MoveHorizontal, Star } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { getPosterUrl, MOCK_GENRES } from "@/types/movie";
import type { Movie } from "@/types/movie";

type RollTone = "gold" | "violet" | "ice";
type ActionMode = "save" | "remove";

interface MoviePosterGridProps {
  movies: Movie[];
  emptyMessage?: string;
  actionMode?: ActionMode;
  tone?: RollTone;
  ariaLabel?: string;
}

function getOffset(index: number, activeIndex: number, length: number) {
  const raw = index - activeIndex;
  if (raw > length / 2) return raw - length;
  if (raw < -length / 2) return raw + length;
  return raw;
}

function getMovieGenre(movie: Movie) {
  return (movie.genre_ids || [])
    .map((id) => MOCK_GENRES.find((genre) => genre.id === id)?.name)
    .find(Boolean) || "FEATURED FILM";
}

export function MoviePosterGrid({
  movies,
  emptyMessage = "Movies will appear here when the catalogue is available.",
  actionMode = "save",
  tone = "gold",
  ariaLabel = "3D movie carousel",
}: MoviePosterGridProps) {
  const { isInWatchlist, toggleWatchlist } = useAuth();
  const films = movies;
  const filmCount = films.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const moved = useRef(false);

  const step = useCallback((direction: number) => {
    if (!filmCount) return;
    setActiveIndex((current) => (current + direction + filmCount) % filmCount);
  }, [filmCount]);

  useEffect(() => {
    const node = stageRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "120px 0px", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || paused || dragging || filmCount < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % filmCount);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [isVisible, paused, dragging, filmCount]);

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
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer may already have been released */ }
    }
    if (moved.current) setDragOffset(delta);
  };

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const delta = event.clientX - startX.current;
    if (moved.current && Math.abs(delta) > 44) {
      const amount = Math.max(1, Math.min(3, Math.round(Math.abs(delta) / 170)));
      step(delta < 0 ? amount : -amount);
    }
    setDragging(false);
    setDragOffset(0);
    if (moved.current) window.setTimeout(() => { moved.current = false; }, 0);
  };

  const cancelDrag = () => {
    setDragging(false);
    setDragOffset(0);
  };

  if (!films.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-6 py-12 text-center text-sm text-white/50">
        {emptyMessage}
      </div>
    );
  }

  const safeActiveIndex = filmCount ? activeIndex % filmCount : 0;
  const active = films[safeActiveIndex];

  return (
    <div className="cinema-section-roll-wrap" data-tone={tone}>
      <div
        ref={stageRef}
        className={`cinema-section-roll-stage ${dragging ? "is-dragging" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={cancelDrag}
        onLostPointerCapture={cancelDrag}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") step(-1);
          if (event.key === "ArrowRight") step(1);
        }}
        role="group"
        tabIndex={0}
        aria-label={`${ariaLabel}. Drag or use arrow keys to browse.`}
      >
        <div className="cinema-section-roll-halo" aria-hidden="true" />
        <div className="cinema-section-roll-line" aria-hidden="true" />

        {films.map((movie, index) => {
          const offset = getOffset(index, safeActiveIndex, films.length);
          const distance = Math.abs(offset);
          if (distance > 2) return null;

          const isActive = offset === 0;
          const desktopX = offset * 202 + dragOffset * 0.24;
          const mobileX = offset * 122 + dragOffset * 0.24;
          const scale = distance === 0 ? 1 : distance === 1 ? 0.84 : 0.67;
          const opacity = distance === 0 ? 1 : distance === 1 ? 0.88 : 0.43;
          const saved = isInWatchlist(movie.id);
          const year = movie.release_date?.slice(0, 4) || "COMING SOON";

          return (
            <article
              key={movie.id}
              className={`cinema-section-roll-card ${isActive ? "is-active" : ""}`}
              style={{
                "--section-roll-x": `${desktopX}px`,
                "--section-roll-x-mobile": `${mobileX}px`,
                zIndex: 30 - distance * 6,
                opacity,
                transform: `translate(-50%, -50%) rotateY(${offset * -23}deg) rotateZ(${offset * -1.1}deg) translateZ(${-distance * 58}px) scale(${scale})`,
                pointerEvents: distance > 1 ? "none" : "auto",
              } as CSSProperties}
            >
              <Link
                href={`/movie/${movie.id}`}
                draggable={false}
                onClick={(event) => { if (moved.current) event.preventDefault(); }}
                className="cinema-section-roll-poster"
                aria-label={`View ${movie.title}, rating ${Number(movie.vote_average || 0).toFixed(1)}`}
                tabIndex={distance <= 1 ? 0 : -1}
              >
                <Image
                  src={getPosterUrl(movie.poster_path, "w500")}
                  alt={`${movie.title} poster`}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 58vw, (max-width: 1024px) 30vw, 18vw"
                  draggable={false}
                  className="cinema-section-roll-image"
                />
                <div className="cinema-section-roll-vignette" />
                <div className="cinema-section-roll-topline">
                  <span className="cinema-section-roll-genre">{getMovieGenre(movie)}</span>
                  <span className="cinema-section-roll-rating"><Star size={11} fill="currentColor" /> {Number(movie.vote_average || 0).toFixed(1)}</span>
                </div>
                <div className="cinema-section-roll-copy">
                  <span className="cinema-section-roll-year">{year}</span>
                  <h3>{movie.title}</h3>
                  <p>{movie.overview || "A story waiting to be discovered."}</p>
                  <span className="cinema-section-roll-cta">Explore film <ChevronRight size={13} /></span>
                </div>
                {isActive && <span className="cinema-section-roll-active-line" />}
              </Link>

              <div className="cinema-section-roll-meta">
                <div className="cinema-section-roll-meta-copy">
                  <Link href={`/movie/${movie.id}`} className="cinema-section-roll-title">{movie.title}</Link>
                  <span>{year} <span aria-hidden="true">·</span> {getMovieGenre(movie)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleWatchlist(movie)}
                  aria-label={actionMode === "remove" ? `Remove ${movie.title} from watchlist` : saved ? `Remove ${movie.title} from watchlist` : `Add ${movie.title} to watchlist`}
                  title={actionMode === "remove" ? "Remove from watchlist" : saved ? "Saved to watchlist" : "Add to watchlist"}
                  className={`cinema-section-roll-save ${saved ? "is-saved" : ""} ${actionMode === "remove" ? "is-remove-mode" : ""}`}
                >
                  {saved || actionMode === "remove" ? <Check size={14} /> : <BookmarkPlus size={14} />}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="cinema-section-roll-footer">
        <button type="button" className="cinema-section-roll-control" onClick={() => step(-1)} aria-label="Previous movie"><ChevronLeft size={17} /></button>
        <div className="cinema-section-roll-progress" aria-live="polite">
          <span>{String(safeActiveIndex + 1).padStart(2, "0")}</span>
          <span className="cinema-section-roll-track"><span style={{ width: `${((safeActiveIndex + 1) / films.length) * 100}%` }} /></span>
          <span>{String(films.length).padStart(2, "0")}</span>
        </div>
        <button type="button" className="cinema-section-roll-control" onClick={() => step(1)} aria-label="Next movie"><ChevronRight size={17} /></button>
        <span className="cinema-section-roll-hint"><MoveHorizontal size={13} /> ROLL TO EXPLORE</span>
      </div>

      <div className="cinema-section-roll-focus">
        <span className="cinema-section-roll-focus-dot" />
        <span>IN FOCUS</span>
        <strong>{active?.title}</strong>
        <span className="cinema-section-roll-focus-year">{active?.release_date?.slice(0, 4) || "COMING SOON"}</span>
      </div>
    </div>
  );
}
