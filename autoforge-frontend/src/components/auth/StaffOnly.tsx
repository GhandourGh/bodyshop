import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { isCustomerRole } from '@/lib/auth'

/** Blocks `customer` from admin UI — sends them to the portal dashboard. */
export default function StaffOnly({ children }: { children: ReactNode }) {
  if (isCustomerRole()) return <Navigate to="/portal/dashboard" replace />
  return <>{children}</>
}
