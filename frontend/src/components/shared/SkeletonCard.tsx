export function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl p-5 border shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-24 skeleton rounded mb-3" />
          <div className="h-8 w-32 skeleton rounded" />
        </div>
        <div className="w-10 h-10 skeleton rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="p-4 space-y-3">
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="w-9 h-9 skeleton rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 skeleton rounded w-3/4" />
            <div className="h-3 skeleton rounded w-1/2" />
          </div>
          <div className="h-4 skeleton rounded w-16" />
          <div className="h-4 skeleton rounded w-16" />
          <div className="h-6 skeleton rounded-full w-20" />
        </div>
      ))}
    </div>
  );
}
