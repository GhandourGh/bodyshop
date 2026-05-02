export default function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass rounded-2xl p-6 space-y-3">
      <div className="h-5 w-2/3 rounded-lg shimmer-bg" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-4 rounded-lg shimmer-bg`} style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  )
}
