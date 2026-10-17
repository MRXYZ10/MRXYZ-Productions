# MRXYZ Productions — Smooth + Visual Polish Update

This update keeps the scroll-driven 3D coverflow, TMDB movie loading, movie detail routes, watchlist actions, and Groq chat architecture intact.

## Motion and performance refinements
- Reduced the vertical scroll distance per film (13vh desktop / 10vh mobile) to make each coverflow feel less strenuous while preserving the scroll-driven 3D roll.
- Tuned easing to follow the scroll target with less perceived lag while maintaining interpolation.
- Reduced side-card rotation and depth changes for a calmer, less jittery perspective.
- Only rewrites card stacking order when the discrete stack level actually changes.
- Uses smaller TMDB image variants for the blurred ambient background layer; the visible movie posters retain their regular image sizes.
- Lowered full-frame blur/grain costs and reduced navbar backdrop blur.
- Promoted GPU layers remain limited to nearby cards rather than every poster.

## Visual polish
- Added a richer ink/indigo background wash, restrained gold and lilac accents, refined section eyebrow treatments, a clearer heading hierarchy, and a subtle stage spotlight.
- Turned the movie HUD into a floating glass-like information panel with a refined progress rail and action controls.
- Refined poster borders, active-card focus, button states, responsive spacing, and focus-visible outlines.
- Slowed the decorative marquee so it reads as atmosphere rather than competing with the movies.
- Preserves reduced-motion preferences.

## Validation
- Modified TSX file syntax was checked with the global TypeScript transpiler.
- CSS brace balance and archive integrity were checked.
- A full Next.js production build could not be run in the packaging environment because the available `node_modules` tree was incomplete (TypeScript and type packages were present as empty directories). Please run `npm ci`, `npm run typecheck`, and `npm run build` on the development PC before pushing this update.

---

# v3 — Silky scrolling pass

**Why it lagged**
- Every film change re-rendered the whole coverflow in React and re-mounted two full-screen *blurred* background layers (new decode + blur + fade each time).
- Each frame the loop forced a layout (`getBoundingClientRect`) and wrote CSS variables that cascaded into every poster, repainting them.
- 14+ live `backdrop-filter` badges, a blurred navbar and mood buttons were re-blurred every frame over moving 3D content.
- Nested `preserve-3d` + per-card opacity forced extra offscreen render surfaces.
- Mouse-move wrote CSS variables on the stage → style recalculation for every card.

**What changed**
- `components/ui/scroll-coverflow.tsx`: memoised cards, scroll geometry cached (zero layout reads per frame), overlay opacities written straight to their own compositor layers, active-index update runs in `startTransition`, hover-tilt batched into one write on the active card only, posters never unmount, ambient glow = 3 persistent layers cross-faded with opacity, rendered at ¼ size (≈4× cheaper blur).
- `components/providers/smooth-scroll.tsx` (new): dependency-free inertial wheel scrolling. Mouse wheel travels ~1.9× further per notch and glides; trackpads/touch stay native; chat/search/dialog scrollers and locked pages are untouched; anchor links and "click a poster" glide. Disabled for reduced-motion.
- Scroll distance per film: 13vh → 8vh (desktop), 10vh → 6vh (mobile). Tune `STEP_VH_*` in the coverflow and `WHEEL_SPEED` / `EASE` in the smooth scroller.
- Removed the live backdrop blur from navbar, badges and mood buttons (replaced with near-opaque backgrounds).
- Add `data-native-scroll` to any new scrollable panel that should keep the browser's own wheel handling.
