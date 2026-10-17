import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-white/[0.08] px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src="/mrxyz-mark.svg" alt="MRXYZ Productions" width={34} height={34} unoptimized />
            <span className="text-sm font-semibold tracking-[0.08em] text-white">MRXYZ <span className="font-normal text-white/65">PRODUCTIONS</span></span>
          </Link>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/45">A considered space for discovering great films, finding your next favourite, and keeping the ones you want to watch.</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/55">
          <Link href="#latest-releases" className="transition hover:text-white">Latest releases</Link>
          <Link href="#coming-soon" className="transition hover:text-white">Coming soon</Link>
          <Link href="#trending" className="transition hover:text-white">Trending</Link>
          <Link href="#recommendations" className="transition hover:text-white">Find your mood</Link>
          <Link href="#discover" className="transition hover:text-white">Critics&apos; picks</Link>
          <Link href="#watchlist" className="transition hover:text-white">Watchlist</Link>
          <Link href="#top" className="inline-flex items-center gap-1 transition hover:text-white">Back to top <ArrowUpRight size={14} /></Link>
        </div>
      </div>
      <div id="credits" className="mx-auto mt-8 flex max-w-[1440px] flex-col gap-3 border-t border-white/[0.06] pt-5 text-xs text-white/40 sm:flex-row sm:items-start sm:justify-between">
        <span>© {new Date().getFullYear()} MRXYZ Productions</span>
        <div className="max-w-2xl sm:text-right">
          <p>Movie data and artwork are provided by <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-white">TMDB</a>.</p>
          <p className="mt-1">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        </div>
      </div>
    </footer>
  );
}
