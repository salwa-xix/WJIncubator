import { cn } from '@/lib/cn'
import { Leaf } from './Leaf'

/**
 * The texture inside every navy band in the reference.
 *
 * Read off the PDFs rather than invented: the bands carry a handful of *large*
 * leaf outlines — several times the band's height, cropped by its edges — at
 * roughly 6–8% white, not a repeating tile. That scale is the whole effect. The
 * previous implementation tiled small solid leaves in a grid, which reads as
 * wallpaper and is visibly not what the reference does.
 *
 * Decorative only: hidden from assistive tech, never takes pointer events.
 */
export function BandPattern({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {/* Sizes are in `em`-free absolute units so the shapes stay large and
          cropped regardless of band height — matching the reference, where the
          curves run off the top and bottom edges. */}
      <Leaf
        strokeW={1.1}
        className="absolute -top-[70%] start-[6%] h-[240%] w-auto text-white/[0.07]"
      />
      <Leaf
        strokeW={1.1}
        className="absolute -bottom-[90%] start-[26%] h-[220%] w-auto -rotate-[18deg] text-white/[0.05]"
      />
      <Leaf
        strokeW={1.2}
        className="absolute -top-[40%] end-[18%] h-[180%] w-auto rotate-[8deg] text-white/[0.06]"
      />
      <Leaf
        strokeW={1.1}
        className="absolute -bottom-[60%] end-[2%] h-[200%] w-auto -rotate-[6deg] text-white/[0.04]"
      />
    </div>
  )
}
