import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { BarChart2, TrendingUp, Users, Briefcase } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'
import BackButton from '@/components/shared/BackButton'
import { backendClient } from '@/api/client'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

const STATUS_COLORS: Record<string, string> = {
  pending:     '#fbbf24',
  in_progress: '#3b82f6',
  done:        '#4ade80',
}

export default function Analytics() {
  const { data: trend,   isLoading: tL } = useQuery({ queryKey: ['analytics-trend'],   queryFn: async () => (await backendClient.get('/api/analytics/jobs-trend')).data.data })
  const { data: revenue, isLoading: rL } = useQuery({ queryKey: ['analytics-revenue'], queryFn: async () => (await backendClient.get('/api/analytics/revenue-series')).data.data })
  const { data: mechs,   isLoading: mL } = useQuery({ queryKey: ['analytics-mechs'],   queryFn: async () => (await backendClient.get('/api/analytics/mechanic-stats')).data.data })

  // Status breakdown from trend data
  const statusPie = trend ? [
    { name: 'Pending',     value: trend.reduce((s: number, d: any) => s + d.pending,     0), color: STATUS_COLORS.pending },
    { name: 'In Progress', value: trend.reduce((s: number, d: any) => s + d.in_progress, 0), color: STATUS_COLORS.in_progress },
    { name: 'Done',        value: trend.reduce((s: number, d: any) => s + d.done,        0), color: STATUS_COLORS.done },
  ] : []

  const totalJobs    = statusPie.reduce((s, p) => s + p.value, 0)
  const totalRevenue = revenue ? revenue.reduce((s: number, d: any) => s + d.revenue, 0) : 0

  const chartStyle = { background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <BackButton />
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Reports</p>
          <h1 className="font-display font-bold text-3xl">Analytics</h1>
          <p className="text-forge-muted text-sm mt-1">Real-time insights from your repair shop data</p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Jobs (12mo)',  value: totalJobs,             icon: Briefcase, color: '#3b82f6' },
            { label: 'Total Revenue',      value: `$${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: '#f97316' },
            { label: 'Mechanics',          value: mechs?.length ?? '…',  icon: Users,     color: '#a855f7' },
            { label: 'Jobs Completed',     value: statusPie.find(p => p.name === 'Done')?.value ?? '…', icon: BarChart2, color: '#4ade80' },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <motion.div key={label} initial="hidden" animate="visible" variants={fadeUp} custom={i} className="glass rounded-2xl p-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: color + '18', border: `1px solid ${color}30` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="font-display font-bold text-2xl">{value}</p>
              <p className="text-xs text-forge-muted mt-1">{label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Jobs over time */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="glass rounded-2xl p-6">
            <p className="text-xs font-mono text-forge-muted mb-1">JOB VOLUME</p>
            <h3 className="font-display font-semibold text-lg mb-5">Jobs Over Time</h3>
            {tL
              ? <div className="h-52 animate-pulse bg-forge-border/20 rounded-xl" />
              : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                      <XAxis dataKey="month" stroke="#4b5563" tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <YAxis stroke="#4b5563" tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
                      <Tooltip contentStyle={chartStyle} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="total"       stroke="#3b82f6" strokeWidth={2} dot={false} name="Total" />
                      <Line type="monotone" dataKey="done"        stroke="#4ade80" strokeWidth={2} dot={false} name="Done" />
                      <Line type="monotone" dataKey="in_progress" stroke="#f97316" strokeWidth={2} dot={false} name="In Progress" strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )
            }
          </motion.div>

          {/* Revenue over time */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5} className="glass rounded-2xl p-6">
            <p className="text-xs font-mono text-forge-muted mb-1">REVENUE</p>
            <h3 className="font-display font-semibold text-lg mb-5">Revenue Trend</h3>
            {rL
              ? <div className="h-52 animate-pulse bg-forge-border/20 rounded-xl" />
              : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenue}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#f97316" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                      <XAxis dataKey="month" stroke="#4b5563" tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <YAxis stroke="#4b5563" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={chartStyle} formatter={v => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#revGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )
            }
          </motion.div>

          {/* Jobs by status */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6} className="glass rounded-2xl p-6">
            <p className="text-xs font-mono text-forge-muted mb-1">STATUS BREAKDOWN</p>
            <h3 className="font-display font-semibold text-lg mb-5">Jobs by Status</h3>
            {tL
              ? <div className="h-52 animate-pulse bg-forge-border/20 rounded-xl" />
              : (
                <div className="h-52 flex items-center gap-8">
                  <ResponsiveContainer width="55%" height="100%">
                    <PieChart>
                      <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        {statusPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={chartStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3 flex-1">
                    {statusPie.map(p => (
                      <div key={p.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                          <span className="text-sm text-forge-muted">{p.name}</span>
                        </div>
                        <span className="text-sm font-bold text-forge-text">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
          </motion.div>

          {/* Mechanic throughput */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7} className="glass rounded-2xl p-6">
            <p className="text-xs font-mono text-forge-muted mb-1">TEAM PERFORMANCE</p>
            <h3 className="font-display font-semibold text-lg mb-5">Mechanic Throughput</h3>
            {mL
              ? <div className="h-52 animate-pulse bg-forge-border/20 rounded-xl" />
              : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(mechs || []).slice(0, 8)} layout="vertical" margin={{ left: 16, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" horizontal={false} />
                      <XAxis type="number" stroke="#4b5563" tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" stroke="#4b5563" tick={{ fontSize: 10, fill: '#6b7280' }} width={90} />
                      <Tooltip contentStyle={chartStyle} />
                      <Bar dataKey="totalJobs" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Jobs" />
                      <Bar dataKey="doneJobs"  fill="#4ade80" radius={[0, 4, 4, 0]} name="Done" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )
            }
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  )
}
