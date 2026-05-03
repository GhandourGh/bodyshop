import { AnimatePresence } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import ForgotPassword from '@/pages/ForgotPassword'
import AiDemo from '@/pages/AiDemo'
import Dashboard from '@/pages/admin/Dashboard'
import Jobs from '@/pages/admin/Jobs'
import Customers from '@/pages/admin/Customers'
import Vehicles from '@/pages/admin/Vehicles'
import Mechanics from '@/pages/admin/Mechanics'
import Inventory from '@/pages/admin/Inventory'
import AILab from '@/pages/admin/AILab'
import AIJob from '@/pages/admin/AIJob'
import Messages from '@/pages/admin/Messages'
import Settings from '@/pages/admin/Settings'
import Finance from '@/pages/admin/Finance'
import AuditLog from '@/pages/admin/AuditLog'
import Integrations from '@/pages/admin/Integrations'
import PageTransition from '@/components/shared/PageTransition'
import { ToastProvider } from '@/components/shared/Toast'
import PrivateRoute from '@/components/PrivateRoute'
import ErrorBoundary from '@/components/ErrorBoundary'

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoute>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </PrivateRoute>
  )
}

function AppRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/ai-demo" element={<PageTransition><AiDemo /></PageTransition>} />

        {/* Protected admin routes */}
        <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/jobs" element={<AdminRoute><Jobs /></AdminRoute>} />
        <Route path="/admin/customers" element={<AdminRoute><Customers /></AdminRoute>} />
        <Route path="/admin/vehicles" element={<AdminRoute><Vehicles /></AdminRoute>} />
        <Route path="/admin/mechanics" element={<AdminRoute><Mechanics /></AdminRoute>} />
        <Route path="/admin/inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
        <Route path="/admin/ai-job" element={<AdminRoute><AIJob /></AdminRoute>} />
        <Route path="/admin/ai" element={<AdminRoute><AILab /></AdminRoute>} />
        <Route path="/admin/messages" element={<AdminRoute><Messages /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/admin/finance" element={<AdminRoute><Finance /></AdminRoute>} />
        <Route path="/admin/audit" element={<AdminRoute><AuditLog /></AdminRoute>} />
        <Route path="/admin/integrations" element={<AdminRoute><Integrations /></AdminRoute>} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ToastProvider>
  )
}
