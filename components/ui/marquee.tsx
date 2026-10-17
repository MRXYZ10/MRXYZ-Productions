const WORDS = ["Now showing", "Trending", "Coming soon", "Mood picks", "Critics' picks", "Your watchlist"];

/** Pure-CSS ticker (transform only) — zero JS, zero layout cost. */
export function Marquee() {
  const row = [...WORDS, ...WORDS];
  return (
    <div className="cinema-marquee" aria-hidden="true">
      <div className="cinema-marquee-track">
        {[0, 1].map((n) => (
          <div key={n} className="cinema-marquee-group">
            {row.map((word, i) => (
              <span key={`${word}-${i}`}>
                {word} <b>✦</b>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
