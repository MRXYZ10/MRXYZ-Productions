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
