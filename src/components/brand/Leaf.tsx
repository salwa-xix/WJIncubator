import { cn } from '@/lib/cn'

type Props = React.SVGProps<SVGSVGElement> & {
  /**
   * The reference uses the leaf two ways: as a hairline outline (the الحاضنة
   * mark, and the sweeping shapes in the navy bands) and as a solid silhouette.
   * Outline is the default because that is how the mark itself is drawn.
   */
  variant?: 'outline' | 'solid'
  /**
   * Stroke width in viewBox units; outline variant only.
   * Named `strokeW`, not `stroke`, because SVGProps already declares `stroke`
   * as a colour string — reusing the name makes the numeric type unassignable.
   */
  strokeW?: number
}

/**
 * The WJIncubator / Wadi Jeddah leaf.
 *
 * Traced as a single vector path so it recolours from `currentColor` and scales
 * without a raster request — the source PDFs ship it flattened, which would
 * mean one image per repetition and no theming.
 */
export function Leaf({ variant = 'outline', strokeW = 3, className = '', ...props }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn(className)}
      {...props}
    >
      <path
        d="M5.1 22C5.1 12.2 11.2 7.7 24.2 6C46 3.5 76.4 3.2 96.5 4.2C99.4 4.4 100.3 6.2 98.1 8.6C93 38 39 67 13.6 96.4C9.6 100.2 5.2 98.7 4.9 93.2C3.7 70 3.9 41.2 5.1 22Z"
        fill={variant === 'solid' ? 'currentColor' : 'none'}
        stroke={variant === 'outline' ? 'currentColor' : undefined}
        strokeWidth={variant === 'outline' ? strokeW : undefined}
        strokeLinejoin="round"
      />
    </svg>
  )
}
