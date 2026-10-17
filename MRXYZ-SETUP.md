# MRXYZ Productions — Setup

MRXYZ Productions is a movie discovery site with trending films, mood-based picks, a personal watchlist, movie detail pages, and an optional Groq-powered AI movie concierge.

## Run locally on Windows

1. Extract the ZIP and open PowerShell in the folder that contains `package.json`.
2. Install packages:

   ```powershell
   npm install
   ```

3. Create your local environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

4. Start the site:

   ```powershell
   npm run dev -- --webpack
   ```

5. Visit http://localhost:3000.

The UI has local sample movies, so you can explore the basic experience before making any API keys. Live sections for trending, latest theatrical releases in India, upcoming releases and top-rated films load from TMDB after `TMDB_API_KEY` is configured.

## Signature 3D experience

The 3D poster carousel is a core part of the design and has intentionally been retained. Rotate it with mouse/touch drag, the left/right on-screen controls, or the keyboard arrow keys when the carousel is focused. The cleanup removes side-demo features and large unused assets, not the 3D identity.

## Optional API keys

- `TMDB_API_KEY` — live movie catalogue, search, posters and full details. Get a key at https://www.themoviedb.org/settings/api.
- `GROQ_API_KEY` — AI movie concierge. Get a key at https://console.groq.com/keys. `GROQ_MODEL` can be changed if needed; the default is `openai/gpt-oss-120b` (the previous Llama 3.3 default was deprecated on Groq in August 2026).
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — optional cloud sign-in and synced watchlists. Keep these blank for a local browser watchlist.

Never commit `.env.local` or put private keys in client-side code. For public release, use an approved TMDB logo in the Credits area as required by TMDB, alongside the notice already shown in the footer: “This product uses the TMDB API but is not endorsed or certified by TMDB.” Official logo files: https://www.themoviedb.org/about/logos-attribution. TMDB API access is for non-commercial use with attribution; if the project becomes revenue-generating, check TMDB commercial licensing first.

## Deployment notes

Deploy the Next.js app to Vercel or another Node.js host and configure the environment variables in the host's project settings. The Python search microservice in `backend/` is optional; the main site should not require it to start.

Before production deployment, run `npm run typecheck`, `npm run lint`, and `npm run build` locally.
