import { Leaf } from '@/components/brand/Leaf'

type Props = {
  title: string
  description?: string
  className?: string
}

export function EmptyState({ title, description, className = '' }: Props) {
  return (
    <div
      className={`flex flex-col items-center gap-4 rounded-card border border-dashed border-line bg-white/60 px-6 py-14 text-center ${className}`}
    >
      <Leaf className="w-12 text-line-strong" />
      <div>
        <p className="text-lg font-bold text-navy">{title}</p>
        {description && (
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>
        )}
      </div>
    </div>
  )
}
