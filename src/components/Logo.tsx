/** Mada logo (wordmark with two leaves). Colours are the logo's own, separate from the UI palette. */
const NAVY = "#1B1A3A";

function Leaves() {
  return (
    <g>
      <path d="M220 44 Q248 26 272 48 Q254 76 220 44Z" fill="#7B83C9" />
      <path d="M246 72 Q246 28 289 4 Q293 50 246 72Z" fill="#8BB43C" opacity="0.85" />
    </g>
  );
}

export function Logo({
  tagline = true,
  invert = false,
  className = "",
}: {
  tagline?: boolean;
  invert?: boolean;
  className?: string;
}) {
  const ink = invert ? "#FFFFFF" : NAVY;
  return (
    <svg
      viewBox={tagline ? "0 0 300 192" : "0 0 300 166"}
      className={className}
      role="img"
      aria-label="Mada BISB"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Leaves />
      <g fontFamily="Montserrat, system-ui, sans-serif" fill={ink}>
        <text x="8" y="132" fontWeight="800" fontSize="100" letterSpacing="-3">
          Mada
        </text>
        <text x="286" y="160" textAnchor="end" fontWeight="700" fontSize="24" letterSpacing="7">
          BISB
        </text>
        {tagline && (
          <text x="10" y="188" fontWeight="500" fontSize="18.6" opacity="0.85">
            Save Today · Invest Tomorrow
          </text>
        )}
      </g>
    </svg>
  );
}
