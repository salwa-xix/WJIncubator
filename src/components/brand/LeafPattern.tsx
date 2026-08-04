import { Leaf } from './Leaf'

type Props = {
  /** Rows of leaves to draw. */
  rows?: number
  /** Leaves per row. */
  cols?: number
  className?: string
}

/**
 * The repeating leaf field used as a background motif in the source decks.
 * Rendered as outlined leaves at low opacity so it reads as texture, never as
 * content. Purely decorative — hidden from assistive tech.
 */
export function LeafPattern({ rows = 4, cols = 8, className = '' }: Props) {
  return (
    <div aria-hidden="true" className={`pointer-events-none select-none ${className}`}>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: rows * cols }, (_, i) => (
          <Leaf key={i} className="h-full w-full" />
        ))}
      </div>
    </div>
  )
}

/**
 * The multi-colour leaf mosaic from the login screen — the one place the brand
 * uses the motif as a focal element rather than texture.
 */
const MOSAIC_TONES = [
  'text-maroon',
  'text-navy',
  'text-sky',
  'text-sand',
  'text-navy-soft',
  'text-sky-deep',
  'text-maroon-soft',
  'text-sky-wash',
] as const

export function LeafMosaic({ count = 12, className = '' }: { count?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`grid grid-cols-4 gap-2 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <Leaf key={i} className={`h-full w-full ${MOSAIC_TONES[i % MOSAIC_TONES.length]}`} />
      ))}
    </div>
  )
}
