import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { getStoredToken } from '@/lib/auth'

/** Requires any signed-in user. Redirects to /login otherwise. */
export default function PrivateRoute({ children }: { children: ReactNode }) {
  if (!getStoredToken()) return <Navigate to="/login" replace />
  return <>{children}</>
}
