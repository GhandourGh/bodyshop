import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Briefcase, Users, Car,
  Wrench, Package, Bot, MessageSquare, Settings, LogOut,
  DollarSign, Shield, Zap,
} from 'lucide-react'
import logo from '@/assets/logo.svg'

const navGroups = [
  {
    label: 'Management',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',   to: '/admin/dashboard' },
      { icon: Briefcase,       label: 'Jobs',        to: '/admin/jobs' },
      { icon: Users,           label: 'Customers',   to: '/admin/customers' },
      { icon: Car,             label: 'Vehicles',    to: '/admin/vehicles' },
      { icon: Wrench,          label: 'Mechanics',   to: '/admin/mechanics' },
      { icon: Package,         label: 'Inventory',   to: '/admin/inventory' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { icon: Bot,             label: 'AI Lab',      to: '/admin/ai' },
      { icon: MessageSquare,   label: 'Messages',    to: '/admin/messages' },
    ],
  },
  {
    label: 'Finance & System',
    items: [
      { icon: DollarSign,      label: 'Finance',     to: '/admin/finance' },
      { icon: Zap,             label: 'Integrations',to: '/admin/integrations' },
      { icon: Shield,          label: 'Audit Log',   to: '/admin/audit' },
    ],
  },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-forge-card border-r border-forge-border/50 flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-forge-border/30">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="AutoForge logo" className="w-7 h-7 object-contain rounded-md" />
          <span className="font-display font-bold text-base tracking-tight">
            Auto<span className="text-gradient-orange">Forge</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-4">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-forge-muted/50">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ icon: Icon, label, to }) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                      active ? 'nav-link-active' : 'text-forge-muted hover:text-forge-text hover:bg-white/4'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-forge-blue-light' : 'text-forge-muted group-hover:text-forge-text'} />
                    {label}
                    {active && (
                      <motion.div layoutId="active-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-forge-blue" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-forge-border/30 space-y-0.5">
        <Link to="/admin/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-forge-muted hover:text-forge-text hover:bg-white/4 transition-all">
          <Settings size={16} />
          Settings
        </Link>
        <button onClick={() => { localStorage.removeItem('af_token'); localStorage.removeItem('af_user'); window.location.href = '/login' }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-forge-muted hover:text-red-400 hover:bg-red-500/5 transition-all">
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
