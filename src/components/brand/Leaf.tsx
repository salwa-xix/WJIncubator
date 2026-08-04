/**
 * The WJIncubator / Wadi Jeddah leaf motif.
 *
 * Traced as a single vector path from the brand assets so it can be recoloured
 * from CSS (`currentColor`) and repeated cheaply as a background pattern —
 * the source decks ship it as raster, which would mean one image request per
 * repetition and no theming.
 */
export function Leaf({ className = '', ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <path
        d="M5.1 22C5.1 12.2 11.2 7.7 24.2 6C46 3.5 76.4 3.2 96.5 4.2C99.4 4.4 100.3 6.2 98.1 8.6C93 38 39 67 13.6 96.4C9.6 100.2 5.2 98.7 4.9 93.2C3.7 70 3.9 41.2 5.1 22Z"
        fill="currentColor"
      />
    </svg>
  )
}
