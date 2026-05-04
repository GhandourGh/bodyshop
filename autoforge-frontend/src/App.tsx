import { AnimatePresence } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import AiDemo from '@/pages/AiDemo'
import Dashboard from '@/pages/admin/Dashboard'
import Jobs from '@/pages/admin/Jobs'
import Customers from '@/pages/admin/Customers'
import QuoteRequests from '@/pages/admin/QuoteRequests'
import Vehicles from '@/pages/admin/Vehicles'
import Mechanics from '@/pages/admin/Mechanics'
import Inventory from '@/pages/admin/Inventory'
import AILab from '@/pages/admin/AILab'
import AIJob from '@/pages/admin/AIJob'
import AIFeedback from '@/pages/admin/AIFeedback'
import Analytics from '@/pages/admin/Analytics'
import Backup from '@/pages/admin/Backup'
import Messages from '@/pages/admin/Messages'
import Settings from '@/pages/admin/Settings'
import Finance from '@/pages/admin/Finance'
import AuditLog from '@/pages/admin/AuditLog'
import Integrations from '@/pages/admin/Integrations'
import DamageRepairGuide from '@/pages/admin/DamageRepairGuide'
import Vault from '@/pages/admin/Vault'
import PageTransition from '@/components/shared/PageTransition'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import { ToastProvider } from '@/components/shared/Toast'
import { PrivateRoute, StaffOnly, AdminOnly, CustomerOnly } from '@/components/auth'
import PortalLayout from '@/components/layout/PortalLayout'
import PortalQuote from '@/pages/portal/PortalQuote'
import PortalDashboard from '@/pages/portal/PortalDashboard'
import PortalJobs from '@/pages/portal/PortalJobs'
import PortalJobDetail from '@/pages/portal/PortalJobDetail'
import PortalProfile from '@/pages/portal/PortalProfile'
import Register from '@/pages/Register'
import JobDetail from '@/pages/admin/JobDetail'

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoute>
      <StaffOnly>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </StaffOnly>
    </PrivateRoute>
  )
}

function CustomerPortalRoute({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoute>
      <CustomerOnly>{children}</CustomerOnly>
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
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/ai-demo" element={<PageTransition><AiDemo /></PageTransition>} />
        <Route path="/register" element={<Register />} />

        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<PortalQuote />} />
          <Route path="dashboard" element={<CustomerPortalRoute><PortalDashboard /></CustomerPortalRoute>} />
          <Route path="jobs" element={<CustomerPortalRoute><PortalJobs /></CustomerPortalRoute>} />
          <Route path="jobs/:jobId" element={<CustomerPortalRoute><PortalJobDetail /></CustomerPortalRoute>} />
          <Route path="profile" element={<CustomerPortalRoute><PortalProfile /></CustomerPortalRoute>} />
        </Route>

        {/* Protected admin routes */}
        <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/jobs/:jobId" element={<AdminRoute><JobDetail /></AdminRoute>} />
        <Route path="/admin/jobs" element={<AdminRoute><Jobs /></AdminRoute>} />
        <Route path="/admin/customers" element={<AdminRoute><Customers /></AdminRoute>} />
        <Route path="/admin/quote-requests" element={<AdminRoute><QuoteRequests /></AdminRoute>} />
        <Route path="/admin/vehicles" element={<AdminRoute><Vehicles /></AdminRoute>} />
        <Route path="/admin/mechanics" element={<AdminRoute><Mechanics /></AdminRoute>} />
        <Route path="/admin/inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
        <Route path="/admin/ai-job"      element={<AdminRoute><AIJob /></AdminRoute>} />
        <Route path="/admin/ai"          element={<AdminRoute><AILab /></AdminRoute>} />
        <Route path="/admin/ai-feedback" element={<AdminRoute><AIFeedback /></AdminRoute>} />
        <Route path="/admin/analytics"   element={<AdminRoute><Analytics /></AdminRoute>} />
        <Route path="/admin/backup"      element={<AdminRoute><Backup /></AdminRoute>} />
        <Route path="/admin/messages" element={<AdminRoute><Messages /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/admin/finance" element={<AdminRoute><Finance /></AdminRoute>} />
        <Route path="/admin/audit" element={<AdminRoute><AuditLog /></AdminRoute>} />
        <Route path="/admin/integrations" element={<AdminRoute><Integrations /></AdminRoute>} />
        <Route path="/admin/vault" element={<AdminRoute><AdminOnly><Vault /></AdminOnly></AdminRoute>} />
        <Route path="/admin/damage-guide" element={<AdminRoute><DamageRepairGuide /></AdminRoute>} />
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
