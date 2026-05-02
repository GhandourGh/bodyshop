import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface Props {
  target: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

export default function AnimatedCounter({ target, duration = 1800, prefix = '', suffix = '', decimals = 0, className = '' }: Props) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const start = 0
    const increment = target / (duration / 16)
    let current = start
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(parseFloat(current.toFixed(decimals)))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration, decimals])

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  )
}
