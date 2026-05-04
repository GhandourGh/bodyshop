import { Link, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, User, ClipboardList, Sparkles, Briefcase } from 'lucide-react'
import { clearAuth, getStoredToken, isCustomerRole } from '@/lib/auth'

export default function PortalLayout() {
  const navigate = useNavigate()
  const token = getStoredToken()
  const isCustomer = isCustomerRole()

  function logout() {
    clearAuth()
    navigate('/portal')
  }

  return (
    <div className="min-h-screen bg-forge-bg">
      <header className="sticky top-0 z-40 glass border-b border-forge-border/50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/portal" className="flex items-center">
            <span className="font-display font-bold text-base">
              Auto<span className="text-forge-orange">Forge</span>
              <span className="text-forge-muted font-normal text-xs ml-2 font-sans">Customer</span>
            </span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/portal" className="text-forge-muted hover:text-forge-text flex items-center gap-1">
              <Sparkles size={14} /> Get a quote
            </Link>
            {token && isCustomer && (
              <>
                <Link to="/portal/jobs" className="text-forge-muted hover:text-forge-text flex items-center gap-1">
                  <Briefcase size={14} /> My jobs
                </Link>
                <Link to="/portal/dashboard" className="text-forge-muted hover:text-forge-text flex items-center gap-1">
                  <ClipboardList size={14} /> My requests
                </Link>
                <Link to="/portal/profile" className="text-forge-muted hover:text-forge-text flex items-center gap-1">
                  <User size={14} /> Profile
                </Link>
              </>
            )}
            {!token && (
              <>
                <Link to="/register" className="text-forge-blue-light hover:underline">Create account</Link>
                <Link to="/login" className="text-forge-muted hover:text-forge-text flex items-center gap-1">
                  <User size={14} /> Sign in
                </Link>
              </>
            )}
            {token && (
              <button type="button" onClick={logout} className="text-forge-muted hover:text-forge-text flex items-center gap-1">
                <LogOut size={14} /> Sign out
              </button>
            )}
            <Link to="/" className="text-forge-muted hover:text-forge-text text-xs">Main site</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
