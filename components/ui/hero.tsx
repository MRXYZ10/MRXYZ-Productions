"use client";

import { useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, Clapperboard, Play, Sparkles, Star } from "lucide-react";

const FEATURED = [
  { id: 157336, title: "Interstellar", genre: "SCI-FI · ADVENTURE", year: "2014", rating: "8.7", poster: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
  { id: 693134, title: "Dune: Part Two", genre: "SCI-FI · EPIC", year: "2024", rating: "8.2", poster: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg" },
  { id: 27205, title: "Inception", genre: "SCI-FI · THRILLER", year: "2010", rating: "8.4", poster: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg" },
  { id: 155, title: "The Dark Knight", genre: "ACTION · CRIME", year: "2008", rating: "9.0", poster: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
  { id: 438631, title: "Dune", genre: "SCI-FI · DRAMA", year: "2021", rating: "7.8", poster: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg" },
  { id: 299536, title: "Avengers: Infinity War", genre: "ACTION · FANTASY", year: "2018", rating: "8.2", poster: "/7WsyChQLEftFiDOVTGqqus9oxwS.jpg" },
  { id: 823464, title: "Godzilla Minus One", genre: "ACTION · DRAMA", year: "2023", rating: "7.7", poster: "/hkxxMIGaiCTmrEArK7J56JTKUlB.jpg" },
];

const imageUrl = (path: string) => `https://image.tmdb.org/t/p/w500${path}`;

export function Hero() {
  const [rotation, setRotation] = useState(-12);
  const [dragging, setDragging] = useState(false);
  const lastX = useRef(0);
  const moved = useRef(false);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // Capture the pointer so the carousel keeps tracking a drag even when the
    // cursor/finger briefly moves beyond the scene bounds.
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    lastX.current = event.clientX;
    moved.current = false;
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const delta = event.clientX - lastX.current;
    if (Math.abs(delta) > 1) moved.current = true;
    setRotation((value) => value + delta * 0.42);
    lastX.current = event.clientX;
  };
  const onPointerUp = () => setDragging(false);

  return (
    <section className="mr-hero relative isolate min-h-[760px] overflow-hidden px-5 pb-16 pt-28 sm:px-8 lg:min-h-[820px] lg:px-14 lg:pt-32">
      <div className="mr-hero-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="mr-orb mr-orb-one pointer-events-none absolute -right-24 top-10 -z-10" />
      <div className="mr-orb mr-orb-two pointer-events-none absolute bottom-0 left-[20%] -z-10" />
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-4 lg:grid-cols-[0.86fr_1.14fr] lg:gap-0">
        <div className="relative z-10 mx-auto w-full max-w-[600px] text-center lg:mx-0 lg:text-left">
          <div className="mr-eyebrow mx-auto mb-7 inline-flex items-center gap-2 lg:mx-0">
            <span className="mr-live-dot" />
            <Sparkles size={13} /> A BETTER WAY TO DISCOVER FILM
          </div>
          <h1 className="mr-display text-5xl font-semibold leading-[0.94] tracking-[-0.065em] text-white sm:text-7xl lg:text-[clamp(4.5rem,7.2vw,7.5rem)]">
            Find your
            <span className="mr-title-gradient block">next obsession.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-[480px] text-base leading-7 text-white/60 sm:text-lg lg:mx-0">
            Thoughtful recommendations, standout films, and a better way to decide what to watch next.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link href="#discover" className="mr-primary-button inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white">
              <Play size={16} fill="currentColor" /> Explore movies <ArrowUpRight size={16} />
            </Link>
            <Link href="#recommendations" className="mr-secondary-button inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white/85">
              <Sparkles size={16} /> Find my vibe
            </Link>
          </div>
          <div className="mt-10 flex items-center justify-center gap-6 lg:justify-start">
            <div className="flex -space-x-2">
              {FEATURED.slice(0, 4).map((movie) => <img key={movie.id} src={imageUrl(movie.poster)} alt="" className="h-9 w-7 rounded-md border border-[#10131c] object-cover shadow-lg" />)}
            </div>
            <div className="text-left"><div className="flex items-center gap-1 text-xs font-semibold text-white"><Star size={12} fill="#a5f3fc" className="text-cyan-200" /> Curated for curious minds</div><p className="mt-1 text-[11px] tracking-wide text-white/40">YOUR NEXT GREAT FILM STARTS HERE</p></div>
          </div>
        </div>

        <div className="relative mx-auto mt-6 h-[390px] w-full max-w-[680px] sm:h-[500px] lg:mt-0 lg:h-[620px]" aria-label="Interactive 3D movie carousel">
          <div className="mr-carousel-label absolute left-1/2 top-0 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-100/80">
            <Clapperboard size={13} /> Rotate the collection <span className="text-white/30">↔</span>
          </div>
          <div
            className={`mr-carousel-stage absolute inset-0 ${dragging ? "is-dragging" : ""}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onLostPointerCapture={onPointerUp}
            role="group"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") setRotation((value) => value - 18);
              if (event.key === "ArrowRight") setRotation((value) => value + 18);
            }}
            aria-label="Interactive 3D movie carousel. Drag or use the left and right arrow keys to rotate."
          >
            <div className="mr-carousel-floor" />
            <div className="mr-carousel-wheel" style={{ transform: `translateZ(-260px) rotateY(${rotation}deg)` }}>
              {FEATURED.map((movie, index) => {
                const angle = index * (360 / FEATURED.length);
                return (
                  <Link
                    href={`/movie/${movie.id}`}
                    key={movie.id}
                    draggable={false}
                    onClick={(event) => { if (moved.current) event.preventDefault(); }}
                    className="mr-movie-card group"
                    style={{ transform: `rotateY(${angle}deg) translateZ(clamp(180px, 27vw, 285px))` }}
                    aria-label={`View ${movie.title}, rated ${movie.rating}`}
                  >
                    <img src={imageUrl(movie.poster)} alt={`${movie.title} poster`} draggable={false} />
                    <div className="mr-card-shade" />
                    <div className="mr-card-info"><span className="mr-card-genre">{movie.genre}</span><h2>{movie.title}</h2><div className="flex items-center justify-between text-xs text-white/65"><span>{movie.year}</span><span className="flex items-center gap-1"><Star size={11} fill="#a5f3fc" className="text-cyan-200" /> {movie.rating}</span></div></div>
                  </Link>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            className="mr-carousel-control absolute left-0 top-1/2 z-30 -translate-y-1/2"
            aria-label="Rotate movie carousel left"
            onClick={() => setRotation((value) => value - 360 / FEATURED.length)}
          ><ChevronLeft size={19} /></button>
          <button
            type="button"
            className="mr-carousel-control absolute right-0 top-1/2 z-30 -translate-y-1/2"
            aria-label="Rotate movie carousel right"
            onClick={() => setRotation((value) => value + 360 / FEATURED.length)}
          ><ChevronRight size={19} /></button>
          <div className="pointer-events-none absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-white/35"><span className="h-px w-8 bg-white/15" /> HANDPICKED WORLDS <span className="h-px w-8 bg-white/15" /></div>
        </div>
      </div>
      <a href="#recommendations" className="mr-scroll-cue absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-white/40 transition hover:text-cyan-100 sm:flex">Scroll to explore <ArrowDown size={13} /></a>
    </section>
  );
}
