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
import Messages from '@/pages/admin/Messages'
import Settings from '@/pages/admin/Settings'
import Finance from '@/pages/admin/Finance'
import AuditLog from '@/pages/admin/AuditLog'
import Integrations from '@/pages/admin/Integrations'
import PageTransition from '@/components/shared/PageTransition'
import { ToastProvider } from '@/components/shared/Toast'

function AppRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/ai-demo" element={<PageTransition><AiDemo /></PageTransition>} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/jobs" element={<Jobs />} />
        <Route path="/admin/customers" element={<Customers />} />
        <Route path="/admin/vehicles" element={<Vehicles />} />
        <Route path="/admin/mechanics" element={<Mechanics />} />
        <Route path="/admin/inventory" element={<Inventory />} />
        <Route path="/admin/ai" element={<AILab />} />
        <Route path="/admin/messages" element={<Messages />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/finance" element={<Finance />} />
        <Route path="/admin/audit" element={<AuditLog />} />
        <Route path="/admin/integrations" element={<Integrations />} />
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
