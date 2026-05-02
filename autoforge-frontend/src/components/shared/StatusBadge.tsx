interface Props {
  status: string
  className?: string
}

export default function StatusBadge({ status, className = '' }: Props) {
  const key = status.toLowerCase().replace(' ', '_')
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium font-mono tracking-wide status-${key} ${className}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  )
}
