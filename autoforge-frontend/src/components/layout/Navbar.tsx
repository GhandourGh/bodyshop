import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import logo from '@/assets/logo.svg'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'AI Demo', to: '/ai-demo' },
  { label: 'Admin', to: '/admin/dashboard' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-forge-border/50"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={logo} alt="AutoForge logo" className="w-8 h-8 object-contain rounded-md" />
          <span className="font-display font-bold text-lg tracking-tight">
            Auto<span className="text-gradient-orange">Forge</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                location.pathname === link.to
                  ? 'text-forge-blue-light bg-forge-blue/15 border-forge-blue/35'
                  : 'text-forge-text/90 bg-forge-card/70 border-forge-border/60 hover:border-forge-blue/40 hover:text-forge-text'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/ai-demo"
            className="ml-2 px-4 py-2 rounded-lg text-sm font-semibold bg-forge-orange text-white hover:bg-forge-orange-light transition-colors duration-200 glow-orange"
          >
            Try AI Free
          </Link>
        </nav>

        <button className="md:hidden text-forge-muted hover:text-forge-text" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden glass border-t border-forge-border/30 px-6 py-4 flex flex-col gap-2"
        >
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
              className="py-2 text-sm text-forge-muted hover:text-forge-text transition-colors">
              {link.label}
            </Link>
          ))}
        </motion.div>
      )}
    </motion.header>
  )
}
