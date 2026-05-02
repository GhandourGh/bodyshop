import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Users, TrendingUp, AlertTriangle, ArrowUpRight, Plus, Bot, UserPlus } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'
import AnimatedCounter from '@/components/shared/AnimatedCounter'
import StatusBadge from '@/components/shared/StatusBadge'
import { mockJobs, mockRevenue, mockJobsByStatus } from '@/data/mock'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } }),
}

const statCards = [
  { label: 'Active Jobs', value: 6, icon: Briefcase, color: '#3b82f6', trend: '+2 this week' },
  { label: 'Monthly Revenue', value: 61400, prefix: '$', icon: TrendingUp, color: '#f97316', trend: '+18% vs last month' },
  { label: 'Customers', value: 6, icon: Users, color: '#a855f7', trend: '+1 this week' },
  { label: 'Low Stock Parts', value: 2, icon: AlertTriangle, color: '#ef4444', trend: 'Needs attention' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const recent = mockJobs.slice(0, 5)

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Overview</p>
            <h1 className="font-display font-bold text-3xl">Command Center</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/admin/ai')} className="flex items-center gap-2 px-4 py-2.5 glass border border-forge-border hover:border-forge-blue/40 text-sm font-medium rounded-xl transition-all">
              <Bot size={15} className="text-forge-blue" /> Run AI
            </button>
            <button onClick={() => navigate('/admin/jobs')} className="flex items-center gap-2 px-4 py-2.5 bg-forge-orange hover:bg-forge-orange-light text-white text-sm font-semibold rounded-xl transition-colors">
              <Plus size={15} /> New Job
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, prefix = '', icon: Icon, color, trend }, i) => (
            <motion.div key={label} initial="hidden" animate="visible" variants={fadeUp} custom={i}
              className="glass rounded-2xl p-5 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '18', border: `1px solid ${color}30` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <ArrowUpRight size={14} className="text-forge-muted" />
              </div>
              <div className="font-display font-bold text-3xl mb-1">
                {prefix}<AnimatedCounter target={value} />
              </div>
              <p className="text-xs text-forge-muted mb-1">{label}</p>
              <p className="text-xs font-mono" style={{ color }}>{trend}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="lg:col-span-2 glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-mono text-forge-muted mb-1">REVENUE TREND</p>
                <h3 className="font-display font-semibold text-lg">Last 6 Months</h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-forge-muted">Total</p>
                <p className="font-display font-bold text-forge-orange">$278,500</p>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis dataKey="month" stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: any) => [`$${v.toLocaleString()}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Jobs Donut */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}
            className="glass rounded-2xl p-6">
            <p className="text-xs font-mono text-forge-muted mb-1">JOBS BY STATUS</p>
            <h3 className="font-display font-semibold text-lg mb-6">Distribution</h3>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mockJobsByStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                    {mockJobsByStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {mockJobsByStatus.map(s => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-forge-muted">{s.name}</span>
                  </div>
                  <span className="font-mono text-forge-text">{s.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Jobs */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}
          className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-forge-border/40 flex items-center justify-between">
            <h3 className="font-display font-semibold">Recent Jobs</h3>
            <button onClick={() => navigate('/admin/jobs')} className="text-xs font-mono text-forge-blue-light hover:underline">View All →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forge-border/30">
                  {['Vehicle', 'Customer', 'Mechanic', 'Status', 'Cost', 'Date'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-mono text-forge-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((job, i) => (
                  <motion.tr key={job.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="border-b border-forge-border/20 hover:bg-white/2 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-sm font-medium text-forge-text">{job.vehicle}</td>
                    <td className="px-6 py-4 text-sm text-forge-muted">{job.customer}</td>
                    <td className="px-6 py-4 text-sm text-forge-muted">{job.mechanic}</td>
                    <td className="px-6 py-4"><StatusBadge status={job.status} /></td>
                    <td className="px-6 py-4 text-sm font-mono text-forge-text">${job.estimatedCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs font-mono text-forge-muted">{job.created}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7}
          className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Plus, label: 'New Job', color: '#f97316', to: '/admin/jobs' },
            { icon: UserPlus, label: 'Add Customer', color: '#3b82f6', to: '/admin/customers' },
            { icon: Bot, label: 'Run AI Analysis', color: '#a855f7', to: '/admin/ai' },
            { icon: AlertTriangle, label: 'View Alerts', color: '#ef4444', to: '/admin/inventory' },
          ].map(({ icon: Icon, label, color, to }) => (
            <button key={label} onClick={() => navigate(to)}
              className="glass rounded-xl p-4 flex flex-col items-center gap-2 card-hover border border-forge-border/40 hover:border-opacity-60 transition-all">
              <Icon size={20} style={{ color }} />
              <span className="text-xs font-medium text-forge-muted">{label}</span>
            </button>
          ))}
        </motion.div>
      </div>
    </AdminLayout>
  )
}
