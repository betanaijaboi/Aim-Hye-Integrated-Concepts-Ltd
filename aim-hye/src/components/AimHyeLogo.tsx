interface AimHyeLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AIM-HYE wordmark — monoline geometric SVG.
 * Uses currentColor so you can control stroke color via text-white, text-[#0A0F1A], etc.
 * Scale via h-* w-auto or explicit width/height.
 */
export function AimHyeLogo({ className = "", style }: AimHyeLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 61"
      fill="none"
      stroke="currentColor"
      strokeWidth="10"
      strokeLinecap="round"
      strokeLinejoin="miter"
      aria-label="AIM-HYE"
      role="img"
      className={className}
      style={style}
    >
      {/* A — open triangular, no crossbar */}
      <path d="M3.5 57.5L20.5 3.5L37.5 57.5" />

      {/* I */}
      <path d="M50 3.5V57.5" />

      {/* M — deep centered V apex */}
      <path d="M62.5 57.5V3.5L82.5 40L102.5 3.5V57.5" />

      {/* hyphen */}
      <path d="M114.5 30.5H124.5" />

      {/* H */}
      <path d="M136.5 3.5V57.5M170.5 3.5V57.5M136.5 30.5H170.5" />

      {/* Y */}
      <path d="M179.5 3.5L196.5 28M213.5 3.5L196.5 28V57.5" />

      {/* E — miter joins on left spine keep corners sharp; round linecap rounds right-side tips */}
      <path d="M252.5 3.5H222.5V57.5H252.5M222.5 30.5H246.5" />
    </svg>
  );
}
