/** Hero illustration: a flatbed tow truck carrying a car, drawn with brand tokens. */
export function TruckArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 340" className={className} role="img" aria-label="Flatbed tow truck carrying a car">
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="var(--brand)" stopOpacity=".85" />
          <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* road */}
      <rect x="0" y="290" width="640" height="50" fill="#0c0d10" />
      <g stroke="var(--brand)" strokeWidth="5" strokeDasharray="38 30" opacity=".7">
        <path d="M0 318H640" />
      </g>
      {/* beacon glow */}
      <circle cx="528" cy="64" r="64" fill="url(#glow)" />
      {/* flatbed deck */}
      <g>
        <path d="M30 236 L350 236 L350 262 L30 262 Z" fill="#2a2e36" />
        <path d="M22 224 L350 224 L350 240 L18 252 Z" fill="var(--brand)" />
        <rect x="46" y="262" width="296" height="10" fill="#14161a" />
        {/* hazard stripes on deck edge */}
        <g fill="var(--ink)" opacity=".85">
          <path d="M60 224 l14 0 -12 15 -14 0z M96 224 l14 0 -12 15 -14 0z M132 224 l14 0 -12 15 -14 0z M168 224 l14 0 -12 15 -14 0z M204 224 l14 0 -12 15 -14 0z M240 224 l14 0 -12 15 -14 0z M276 224 l14 0 -12 15 -14 0z M312 224 l14 0 -12 15 -14 0z" />
        </g>
      </g>
      {/* carried car */}
      <g transform="translate(58 140)">
        <path d="M0 78 q0-22 20-26 l40-6 q24-34 66-34 h60 q34 0 56 36 l30 8 q16 4 16 22 v0 H0z" fill="#e9e6da" />
        <path d="M70 48 q18-26 54-26 h52 q28 0 46 26z" fill="#9fb4c7" />
        <path d="M118 22 v26 M168 22 v26" stroke="#e9e6da" strokeWidth="5" />
        <rect x="236" y="56" width="22" height="10" rx="4" fill="#ffd54a" />
        <rect x="2" y="56" width="12" height="9" rx="3" fill="#e5484d" />
        <circle cx="62" cy="80" r="17" fill="#14161a" />
        <circle cx="62" cy="80" r="8" fill="#8a8f98" />
        <circle cx="216" cy="80" r="17" fill="#14161a" />
        <circle cx="216" cy="80" r="8" fill="#8a8f98" />
      </g>
      {/* cab */}
      <g>
        <path d="M356 262 V176 q0-18 16-22 l54-14 q14-4 24 8 l36 44 h40 q22 0 22 22 v48 z" fill="var(--brand)" />
        <path d="M382 176 l38-10 q8-2 14 5 l26 31 h-78z" fill="#9fd0e8" />
        <rect x="360" y="206" width="14" height="12" rx="3" fill="#14161a" opacity=".25" />
        <rect x="528" y="226" width="30" height="14" rx="4" fill="#fff6c9" />
        <rect x="556" y="250" width="14" height="14" rx="3" fill="#14161a" />
        {/* beacon */}
        <rect x="506" y="82" width="46" height="14" rx="6" fill="#14161a" />
        <rect x="514" y="64" width="30" height="22" rx="8" fill="#ffe27a" />
        {/* hook arm */}
        <path d="M358 238 h-12" stroke="#14161a" strokeWidth="6" />
      </g>
      {/* chassis & wheels */}
      <rect x="40" y="272" width="530" height="14" rx="4" fill="#14161a" />
      {[96, 176, 440, 524].map((x) => (
        <g key={x}>
          <circle cx={x} cy="288" r="28" fill="#0c0d10" />
          <circle cx={x} cy="288" r="28" fill="none" stroke="#2a2e36" strokeWidth="4" />
          <circle cx={x} cy="288" r="13" fill="#8a8f98" />
          <circle cx={x} cy="288" r="5" fill="#14161a" />
        </g>
      ))}
    </svg>
  );
}
