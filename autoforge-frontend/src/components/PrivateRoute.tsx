import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('af_token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}
