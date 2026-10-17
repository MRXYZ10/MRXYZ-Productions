import type { ReactNode } from "react";

interface SectionHeadingProps {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  icon?: ReactNode;
}

/** Editorial heading: giant outlined numeral + eyebrow + title. */
export function SectionHeading({ index, eyebrow, title, description, icon }: SectionHeadingProps) {
  return (
    <div className="sec-head">
      <span className="sec-index" aria-hidden="true">{index}</span>
      <div className="sec-copy">
        <div className="sec-eyebrow">{icon} {eyebrow}</div>
        <h2 className="sec-title">{title}</h2>
        <p className="sec-desc">{description}</p>
      </div>
    </div>
  );
}
