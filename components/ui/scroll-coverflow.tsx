"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
    useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookmarkPlus, Check, Star } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { getBackdropUrl, getPosterUrl, MOCK_GENRES } from "@/types/movie";
import type { Movie } from "@/types/movie";

export type CoverflowTone = "gold" | "violet" | "ice";
type ActionMode = "save" | "remove";

export interface ScrollCoverflowProps {
  movies: Movie[];
  /** Content pinned above the stage (section heading, hero title…). */
  header?: ReactNode;
  tone?: CoverflowTone;
  variant?: "hero" | "section";
  actionMode?: ActionMode;
  ariaLabel?: string;
  emptyMessage?: string;
  id?: string;
}

/* -------------------------------------------------------------------------- */
/* helpers                                                                    */
/* -------------------------------------------------------------------------- */

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function genreOf(movie: Movie) {
  return (
    (movie.genre_ids || [])
      .map((id) => MOCK_GENRES.find((g) => g.id === id)?.name)
      .find(Boolean) || "Featured"
  );
}

function yearOf(movie: Movie) {
  return movie.release_date?.slice(0, 4) || "Soon";
}

/** Vertical scroll distance (in vh) that moves the flow by one film. */
const STEP_VH_DESKTOP = 13;
const STEP_VH_MOBILE = 10;

const MOBILE_QUERY = "(max-width: 720px)";
function subscribeMobile(callback: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
const getMobile = () => window.matchMedia(MOBILE_QUERY).matches;
const getMobileServer = () => false;

/* -------------------------------------------------------------------------- */
/* component                                                                  */
/* -------------------------------------------------------------------------- */

export function ScrollCoverflow({
  movies,
  header,
  tone = "gold",
  variant = "section",
  actionMode = "save",
  ariaLabel = "3D movie coverflow",
  emptyMessage = "Movies will appear here when the catalogue is available.",
  id,
}: ScrollCoverflowProps) {
  const { isInWatchlist, toggleWatchlist } = useAuth();
  const films = movies;
  const count = films.length;

  const trackRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  // `focus.cur` is the film nearest the centre; `focus.prev` feeds the ambient cross-fade.
  const [focus, setFocus] = useState({ prev: -1, cur: 0 });
  const active = focus.cur;
  const isMobile = useSyncExternalStore(subscribeMobile, getMobile, getMobileServer);

  // Mutable animation state — kept out of React so scrolling never re-renders.
  const sim = useRef({
    pos: 0,
    target: 0,
    last: -1,
    lastActive: 0,
    visible: false,
    w: 0,
    h: 0,
    cardW: 0,
    raf: 0,
    prevT: 0,
    reduced: false,
  });
  const drag = useRef({ id: -1, x: 0, y: 0, mode: "idle" as "idle" | "pending" | "drag", moved: false });

  const stepVh = isMobile ? STEP_VH_MOBILE : STEP_VH_DESKTOP;
  const pinned = count > 1;

  /* ---- layout the cards for a given (float) position ---------------------- */
  const layout = useCallback(
    (pos: number) => {
      const s = sim.current;
      const nodes = cardRefs.current;
      const cardW = s.cardW || 240;
      const near = cardW * 0.72;
      const far = cardW * (s.w < 720 ? 0.2 : 0.3);

      for (let i = 0; i < nodes.length; i += 1) {
        const el = nodes[i];
        if (!el) continue;
        const d = i - pos;
        const ad = Math.abs(d);

        if (ad > 4.2) {
          if (el.dataset.hidden !== "1") {
            el.style.visibility = "hidden";
            el.dataset.hidden = "1";
          }
          if (el.dataset.near === "1") {
            el.classList.remove("is-near");
            el.dataset.near = "0";
          }
          continue;
        }
        if (el.dataset.hidden === "1") {
          el.style.visibility = "visible";
          el.dataset.hidden = "0";
        }
        // Keep only the active card and its closest neighbours promoted to
        // their own compositor layers. Promoting every poster wastes GPU memory.
        const isNear = ad <= 3.1;
        const nearFlag = isNear ? "1" : "0";
        if (el.dataset.near !== nearFlag) {
          el.classList.toggle("is-near", isNear);
          el.dataset.near = nearFlag;
        }

        const sign = d < 0 ? -1 : 1;
        const x = sign * (Math.min(ad, 1) * near + Math.max(ad - 1, 0) * far);
        // Rotation eases in over the first card so the hero card stays flat.
        const rot = -sign * Math.min(ad, 1) ** 0.86 * 42 - sign * Math.max(Math.min(ad - 1, 1.5), 0) * 5;
        const z = -Math.min(ad, 1) * 132 - Math.max(ad - 1, 0) * 76 + (1 - Math.min(ad, 1)) * 68;
        const scale = 1 - Math.min(ad, 3) * 0.07;
        const opacity = ad < 2.2 ? 1 : clamp(1 - (ad - 2.2) / 1.9, 0, 1);
        const shade = clamp(ad * 0.52, 0, 0.82);

        el.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), -50%, ${z.toFixed(1)}px) rotateY(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        el.style.opacity = opacity.toFixed(3);
        // z-index changes are discrete; avoid invalidating paint order on every animation frame.
        const stack = String(200 - Math.round(ad * 20));
        if (el.dataset.stack !== stack) {
          el.style.zIndex = stack;
          el.dataset.stack = stack;
        }
        el.style.setProperty("--shade", shade.toFixed(3));
        el.style.setProperty("--focus", clamp(1 - ad, 0, 1).toFixed(3));
      }

      if (progressRef.current && count > 1) {
        progressRef.current.style.transform = `scaleX(${clamp(pos / (count - 1), 0, 1).toFixed(4)})`;
      }

      const nearest = clamp(Math.round(pos), 0, Math.max(count - 1, 0));
      if (nearest !== s.lastActive) {
        s.lastActive = nearest;
        setFocus((f) => ({ prev: f.cur, cur: nearest }));
      }
    },
    [count],
  );

  /* ---- measure stage ------------------------------------------------------ */
  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const s = sim.current;
    const rect = stage.getBoundingClientRect();
    s.w = rect.width;
    s.h = rect.height;
    const cardH = Math.min(rect.height * 0.9, rect.width * (rect.width < 720 ? 0.68 : 0.4) * 1.5);
    s.cardW = cardH / 1.5;
    stage.style.setProperty("--card-h", `${cardH.toFixed(0)}px`);
    s.last = -1; // force a repaint
  }, []);

  useLayoutEffect(() => {
    measure();
    layout(sim.current.pos);
  }, [measure, layout, count, isMobile]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(stage);
    return () => ro.disconnect();
  }, [measure]);

  /* ---- event-driven animation (only while moving and near the viewport) --- */
  useEffect(() => {
    const track = trackRef.current;
    if (!track || count === 0) return;
    const s = sim.current;
    s.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const readTarget = () => {
      if (!pinned) return 0;
      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - (pinRef.current?.offsetHeight || window.innerHeight);
      if (scrollable <= 0) return 0;
      return clamp(-rect.top / scrollable, 0, 1) * (count - 1);
    };

    const frame = (t: number) => {
      // Clear the frame id first so scroll/resize handlers can safely schedule
      // another frame. The loop continues only while easing to a new position.
      s.raf = 0;
      if (!s.visible) return;

      s.target = readTarget();
      const dt = Math.min(0.05, (t - (s.prevT || t)) / 1000);
      s.prevT = t;
      const diff = s.target - s.pos;
      if (s.reduced || Math.abs(diff) < 0.0008) s.pos = s.target;
      else s.pos += diff * (1 - Math.exp(-dt * 14));

      if (Math.abs(s.pos - s.last) > 0.0005) {
        s.last = s.pos;
        layout(s.pos);
      }

      // Unlike a permanent RAF loop, idle carousels consume no animation frames.
      if (!s.reduced && Math.abs(s.target - s.pos) > 0.0008) {
        s.raf = requestAnimationFrame(frame);
      }
    };

    const schedule = () => {
      if (s.visible && !s.raf) {
        s.prevT = 0;
        s.raf = requestAnimationFrame(frame);
      }
    };

    const onScroll = () => schedule();
    const onResize = () => {
      measure();
      schedule();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        s.visible = entry.isIntersecting;
        if (s.visible) {
          s.last = -1;
          schedule();
        } else if (s.raf) {
          cancelAnimationFrame(s.raf);
          s.raf = 0;
        }
      },
      { rootMargin: "80px 0px 80px 0px" },
    );
    io.observe(track);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, [count, layout, measure, pinned]);

  /* ---- horizontal wheel (trackpads) → drives the vertical scroll ---------- */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.15) {
        event.preventDefault();
        window.scrollBy({ top: event.deltaX * 1.1, behavior: "instant" });
      }
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, []);

  /* ---- pointer drag (touch swipe / mouse drag) → scroll ------------------- */
  const pxPerCard = useCallback(() => (window.innerHeight * stepVh) / 100, [stepVh]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, mode: "pending", moved: false };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (event.pointerType === "mouse" && stageRef.current) {
      const r = stageRef.current.getBoundingClientRect();
      stageRef.current.style.setProperty("--mx", `${((event.clientX - r.left) / r.width - 0.5).toFixed(3)}`);
      stageRef.current.style.setProperty("--my", `${((event.clientY - r.top) / r.height - 0.5).toFixed(3)}`);
    }
    if (d.id !== event.pointerId || d.mode === "idle") return;
    const dx = event.clientX - d.x;
    const dy = event.clientY - d.y;
    if (d.mode === "pending") {
      if (Math.abs(dx) > 9 && Math.abs(dx) > Math.abs(dy)) {
        d.mode = "drag";
        d.moved = true;
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          /* pointer already released */
        }
      } else if (Math.abs(dy) > 9) {
        d.mode = "idle"; // vertical gesture: the browser scrolls the page natively
        return;
      } else return;
    }
    // 1 card ≈ 0.62 card-widths of finger travel feels natural.
    const fingerPerCard = Math.max(110, sim.current.cardW * 0.62);
    window.scrollBy({ top: (-(event.clientX - d.x) / fingerPerCard) * pxPerCard(), behavior: "instant" });
    d.x = event.clientX;
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current.id !== event.pointerId) return;
    const wasMoved = drag.current.moved;
    drag.current.mode = "idle";
    drag.current.id = -1;
    if (wasMoved) window.setTimeout(() => (drag.current.moved = false), 0);
  };

  const scrollToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track || !pinned) return;
      const pinH = pinRef.current?.offsetHeight || window.innerHeight;
      const scrollable = track.offsetHeight - pinH;
      const trackTop = track.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: trackTop + (index / (count - 1)) * scrollable, behavior: "smooth" });
    },
    [count, pinned],
  );

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      scrollToIndex(clamp(sim.current.lastActive + 1, 0, count - 1));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      scrollToIndex(clamp(sim.current.lastActive - 1, 0, count - 1));
    }
  };

  /* ---- ambient light that follows the focused film ------------------------ */
  const activeMovie = films[clamp(active, 0, Math.max(count - 1, 0))];
  const ambientFor = (movie: Movie | undefined) => {
    if (!movie) return "";
    if (variant === "hero" && movie.backdrop_path) return getBackdropUrl(movie.backdrop_path, "w300");
    return getPosterUrl(movie.poster_path, "w185");
  };
  const ambientCur = ambientFor(activeMovie);
  const ambientPrev = focus.prev >= 0 && focus.prev !== active ? ambientFor(films[focus.prev]) : "";

  if (!count) {
    return (
      <div className="sc-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const saved = activeMovie ? isInWatchlist(activeMovie.id) : false;
  const trackStyle: CSSProperties | undefined = pinned
    ? { height: `calc(var(--pin-h) + ${(count - 1) * stepVh}vh)` }
    : undefined;

  return (
    <section
      id={id}
      ref={trackRef}
      className={`sc-track sc-${variant}`}
      data-tone={tone}
      data-pinned={pinned ? "1" : "0"}
      style={trackStyle}
    >
      <div ref={pinRef} className="sc-pin">
        <div className="sc-ambient" aria-hidden="true">
          {ambientPrev && <span key={`p-${ambientPrev}`} className="sc-ambient-layer is-prev" style={{ backgroundImage: `url("${ambientPrev}")` }} />}
          {ambientCur && <span key={`c-${ambientCur}`} className="sc-ambient-layer is-cur" style={{ backgroundImage: `url("${ambientCur}")` }} />}
          <span className="sc-ambient-wash" />
        </div>
        <div className="sc-grain" aria-hidden="true" />

        {header && <div className="sc-header">{header}</div>}

        <div
          ref={stageRef}
          className="sc-stage"
          role="group"
          tabIndex={0}
          aria-roledescription="carousel"
          aria-label={`${ariaLabel}. Scroll or swipe to browse.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse" && stageRef.current) {
              stageRef.current.style.setProperty("--mx", "0");
              stageRef.current.style.setProperty("--my", "0");
            }
          }}
          onKeyDown={onKeyDown}
        >
          <div className="sc-floor" aria-hidden="true" />
          {films.map((movie, index) => {
            const isActive = index === active;
            const near = Math.abs(index - active) <= 2;
            return (
              <article
                key={movie.id}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                className={`sc-card ${isActive ? "is-active" : ""}`}
                aria-hidden={!near}
                style={{ visibility: "hidden" }}
                data-hidden="1"
              >
                <div className="sc-card-tilt">
                  <Link
                    href={`/movie/${movie.id}`}
                    draggable={false}
                    tabIndex={isActive ? 0 : -1}
                    className="sc-poster"
                    aria-label={`Open ${movie.title}, rated ${Number(movie.vote_average || 0).toFixed(1)}`}
                    onClick={(event) => {
                      if (drag.current.moved) {
                        event.preventDefault();
                        return;
                      }
                      if (!isActive) {
                        event.preventDefault();
                        scrollToIndex(index);
                      }
                    }}
                  >
                    {Math.abs(index - active) <= 3.1 && (
                      <Image
                        src={getPosterUrl(movie.poster_path, "w500")}
                        alt={`${movie.title} poster`}
                        fill
                        unoptimized
                        sizes="(max-width: 720px) 70vw, 28vw"
                        loading={variant === "hero" && index === 0 ? "eager" : "lazy"}
                        fetchPriority={variant === "hero" && index === 0 ? "high" : "auto"}
                        decoding="async"
                        draggable={false}
                        className="sc-img"
                      />
                    )}
                    <span className="sc-shade" />
                    <span className="sc-sheen" />
                    <span className="sc-badges">
                      <span className="sc-genre">{genreOf(movie)}</span>
                      <span className="sc-rating">
                        <Star size={11} fill="currentColor" /> {Number(movie.vote_average || 0).toFixed(1)}
                      </span>
                    </span>
                    <span className="sc-edge" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="sc-hud">
          <div className="sc-hud-count" aria-live="polite">
            <span className="sc-hud-now">{String(active + 1).padStart(2, "0")}</span>
            <span className="sc-hud-sep" />
            <span className="sc-hud-total">{String(count).padStart(2, "0")}</span>
          </div>

          <div key={activeMovie?.id} className="sc-hud-info">
            <span className="sc-hud-meta">
              {yearOf(activeMovie)} <i /> {genreOf(activeMovie)} <i />
              <span className="sc-hud-rate"><Star size={11} fill="currentColor" /> {Number(activeMovie.vote_average || 0).toFixed(1)}</span>
            </span>
            <h3 className="sc-hud-title">{activeMovie.title}</h3>
            <p className="sc-hud-overview">{activeMovie.overview || "A story waiting to be discovered."}</p>
          </div>

          <div className="sc-hud-actions">
            <Link href={`/movie/${activeMovie.id}`} className="sc-cta">
              Explore film <ArrowUpRight size={15} />
            </Link>
            <button
              type="button"
              onClick={() => void toggleWatchlist(activeMovie)}
              className={`sc-save ${saved ? "is-saved" : ""} ${actionMode === "remove" ? "is-remove" : ""}`}
              aria-label={
                actionMode === "remove" || saved
                  ? `Remove ${activeMovie.title} from watchlist`
                  : `Add ${activeMovie.title} to watchlist`
              }
              title={actionMode === "remove" || saved ? "Remove from watchlist" : "Add to watchlist"}
            >
              {saved || actionMode === "remove" ? <Check size={16} /> : <BookmarkPlus size={16} />}
            </button>
          </div>

          <div className="sc-hud-rail" aria-hidden="true">
            <span ref={progressRef} className="sc-hud-fill" />
          </div>
          {pinned && (
            <span className="sc-hint" aria-hidden="true">
              <span className="sc-mouse"><span /></span>
              <span className="sc-hint-text">{isMobile ? "Swipe or scroll" : "Scroll to rotate"}</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
