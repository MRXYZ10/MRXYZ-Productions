# MRXYZ Productions

A polished, dark-first movie discovery experience for finding what to watch next. The site includes a curated cinematic landing page, trending and highly rated films, mood-based discovery, movie details with trailers and streaming options, a personal watchlist, and an optional AI movie concierge powered by Groq.

## Quick start (Windows PowerShell)

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev -- --webpack
```

Open http://localhost:3000.

The site includes a local sample catalogue, so you can explore the UI before configuring API keys.

## Optional configuration

Edit `.env.local`:

```env
TMDB_API_KEY=
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- **TMDB** supplies live movie discovery, posters, search, detail pages and provider data: https://www.themoviedb.org/settings/api
- **Groq** powers the AI Movie Concierge: https://console.groq.com/keys
- **Supabase** is optional for accounts and cloud-synced watchlists. Without it, the watchlist uses local browser storage.

For further setup and deployment notes, see [`MRXYZ-SETUP.md`](./MRXYZ-SETUP.md).

## Main experience

- Signature live-movie 3D coverflow roll with auto-rotation, pointer/touch drag, arrow controls, keyboard support, cinematic backdrops and depth-layered poster cards; a refreshed noir, champagne-gold and ultraviolet visual system throughout
- Trending movies, latest theatrical releases in India, upcoming releases, and highly rated picks
- Mood-based discovery
- Movie detail pages, trailers and where-to-watch information
- Saved watchlist with search, genre filtering and sorting
- AI Movie Concierge with movie suggestions; Groq requires `GROQ_API_KEY`

## Before production

```powershell
npm run typecheck
npm run lint
npm run build
```

Movie catalogue data and artwork are provided by TMDB. This independent project is not affiliated with TMDB.

### Section-wide 3D movie coverflow

Trending, current releases, upcoming titles, critics' picks, AI mood results, and the saved watchlist now use interactive 3D rolling carousels. Each section has a different accent treatment; use the arrows, drag/swipe, or keyboard arrows to navigate. Autoplay only runs while the carousel is in view and respects reduced-motion settings.
