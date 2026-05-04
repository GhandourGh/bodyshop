import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { isCustomerRole } from '@/lib/auth'

/** Customer-only pages (e.g. portal dashboard). */
export default function CustomerOnly({ children }: { children: ReactNode }) {
  if (!isCustomerRole()) return <Navigate to="/portal" replace />
  return <>{children}</>
}
