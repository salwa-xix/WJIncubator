import { cn } from '@/lib/cn'

/**
 * The الحاضنة mark, as it appears on the reference login screen: a navy leaf
 * drawn as a single hairline stroke, with the word الحاضنة set in maroon across
 * it so the letters overlap the curve.
 *
 * Rebuilt as vector rather than cropped from the PDF. The mark is two flat
 * colours and one stroke, so SVG stays crisp at any size, recolours from tokens,
 * and costs no image request — a raster crop would be soft on the large card the
 * reference places it on.
 *
 * The word is an SVG <text> in the same viewBox as the leaf, so the two scale
 * together and their overlap is fixed. Doing it with an HTML span meant sizing
 * the type against the container instead, which needs container queries and
 * drifts the moment the box changes shape.
 */
export function HadhinaMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label="الحاضنة"
      className={cn(className)}
    >
      <g transform="translate(15 17) scale(0.60)">
        <path
          d="M5.1 22C5.1 12.2 11.2 7.7 24.2 6C46 3.5 76.4 3.2 96.5 4.2C99.4 4.4 100.3 6.2 98.1 8.6C93 38 39 67 13.6 96.4C9.6 100.2 5.2 98.7 4.9 93.2C3.7 70 3.9 41.2 5.1 22Z"
          stroke="#1D254F"
          strokeWidth="3.0"
          strokeLinejoin="round"
        />
      </g>
      <text
        x="50"
        y="64"
        textAnchor="middle"
        direction="rtl"
        fill="#8D1F2C"
        fontSize="19.5"
        fontWeight="700"
        fontFamily="inherit"
      >
        الحاضنة
      </text>
    </svg>
  )
}
