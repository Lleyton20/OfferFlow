/** Shimmering placeholder blocks shown while a page's first data load is in flight. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="card space-y-3 p-5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      ))}
    </div>
  )
}

export function BoardSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden" role="status" aria-label="Loading">
      {Array.from({ length: 4 }, (_, col) => (
        <div key={col} className="w-72 flex-shrink-0 space-y-2 rounded-xl bg-subtle/70 p-2">
          <Skeleton className="mx-2 my-2 h-3 w-24 bg-line" />
          {Array.from({ length: col === 0 ? 3 : 2 - (col % 2) }, (_, i) => (
            <div key={i} className="card space-y-2.5 p-3.5">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
