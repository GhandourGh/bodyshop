import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { isAdminRole } from '@/lib/auth'

/** Admin-only routes (e.g. credential vault). */
export default function AdminOnly({ children }: { children: ReactNode }) {
  if (!isAdminRole()) return <Navigate to="/admin/dashboard" replace />
  return <>{children}</>
}
