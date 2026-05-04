import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Settings, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react'
import { clearAuth, getStoredToken, getStoredUser } from '@/lib/auth'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'AI Demo', to: '/ai-demo' },
]

function getSession(): { role: string; name: string; initials: string } | null {
  if (!getStoredToken()) return null
  const u = getStoredUser() || {}
  const name = u.name || 'User'
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return { role: (u.role || '').toLowerCase(), name, initials }
}

function signOut() {
  clearAuth()
  window.location.href = '/login'
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const location  = useLocation()
  const navigate  = useNavigate()
  const dropRef   = useRef<HTMLDivElement>(null)
  const session   = getSession()
  const isCustomer = session?.role === 'customer'
  const isStaff    = session && !isCustomer
  const dashDest   = isStaff ? '/admin/dashboard' : '/portal/dashboard'
  const settingsDest = isStaff ? '/admin/settings' : '/portal/profile'

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-forge-border/50"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Wordmark */}
        <Link to="/" className="flex items-center group shrink-0">
          <span className="font-display font-bold text-lg tracking-tight">
            Auto<span className="text-gradient-orange">Forge</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === link.to
                  ? 'text-forge-blue-light bg-forge-blue/10'
                  : 'text-forge-muted hover:text-forge-text hover:bg-white/4'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              {/* Dashboard shortcut */}
              <Link
                to={dashDest}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-forge-orange hover:bg-forge-orange-light text-white transition-colors glow-orange"
              >
                <LayoutDashboard size={15} />
                {isStaff ? 'Dashboard' : 'My Portal'}
              </Link>

              {/* User menu */}
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl glass border border-forge-border/60 hover:border-forge-blue/40 transition-all group"
                >
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-forge-blue to-forge-orange flex items-center justify-center text-[11px] font-bold text-white select-none">
                    {session.initials}
                  </div>
                  <span className="text-sm font-medium text-forge-text max-w-[120px] truncate">
                    {session.name}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-forge-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-[calc(100%+8px)] w-52 glass-strong border border-forge-border/60 rounded-xl shadow-xl overflow-hidden"
                    >
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-forge-border/40">
                        <p className="text-xs text-forge-muted">Signed in as</p>
                        <p className="text-sm font-semibold text-forge-text truncate mt-0.5">{session.name}</p>
                        <span className="inline-block mt-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-forge-blue/15 text-forge-blue-light border border-forge-blue/20">
                          {session.role}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="p-1.5">
                        <button
                          onClick={() => { setDropdownOpen(false); navigate(settingsDest) }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-forge-muted hover:text-forge-text hover:bg-white/5 transition-all text-left"
                        >
                          <Settings size={15} />
                          Settings
                        </button>
                        <button
                          onClick={() => { setDropdownOpen(false); signOut() }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-forge-muted hover:text-red-400 hover:bg-red-500/8 transition-all text-left"
                        >
                          <LogOut size={15} />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-forge-muted hover:text-forge-text transition-colors px-3 py-2"
              >
                Sign in
              </Link>
              <Link
                to="/portal"
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-forge-orange hover:bg-forge-orange-light text-white transition-colors glow-orange"
              >
                Get a quote
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-forge-muted hover:text-forge-text transition-colors"
          onClick={() => setMobileOpen(v => !v)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t border-forge-border/30"
          >
            <div className="glass px-6 py-4 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 px-3 rounded-lg text-sm text-forge-muted hover:text-forge-text hover:bg-white/4 transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-forge-border/30 mt-2 pt-3 flex flex-col gap-1">
                {session ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forge-blue to-forge-orange flex items-center justify-center text-xs font-bold text-white">
                        {session.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-forge-text">{session.name}</p>
                        <p className="text-[10px] font-mono text-forge-muted uppercase">{session.role}</p>
                      </div>
                    </div>
                    <Link to={dashDest} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-forge-orange hover:bg-forge-orange/8 transition-colors">
                      <LayoutDashboard size={15} />
                      {isStaff ? 'Dashboard' : 'My Portal'}
                    </Link>
                    <Link to={settingsDest} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-forge-muted hover:text-forge-text hover:bg-white/4 transition-colors">
                      <Settings size={15} />
                      Settings
                    </Link>
                    <button
                      onClick={() => { setMobileOpen(false); signOut() }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-forge-muted hover:text-red-400 hover:bg-red-500/5 transition-colors text-left"
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)}
                      className="px-3 py-2.5 rounded-lg text-sm text-forge-blue-light hover:bg-forge-blue/8 transition-colors">
                      Sign in
                    </Link>
                    <Link to="/portal" onClick={() => setMobileOpen(false)}
                      className="px-3 py-2.5 rounded-lg text-sm font-semibold text-forge-orange hover:bg-forge-orange/8 transition-colors">
                      Get a quote
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
