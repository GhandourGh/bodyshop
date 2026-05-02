import { useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, FileText, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'
import { mockRevenue, mockJobs } from '@/data/mock'
import * as XLSX from 'xlsx'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07 } }),
}

const mockInvoices = mockJobs.map((job, i) => ({
  id: `INV-${2026}${String(i + 1).padStart(3, '0')}`,
  customer: job.customer,
  vehicle: job.vehicle,
  amount: job.estimatedCost,
  status: job.status === 'done' ? 'paid' : job.status === 'in_progress' ? 'pending' : 'draft',
  date: job.created,
  mechanic: job.mechanic,
}))

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  paid:    { label: 'Paid',    color: '#4ade80', icon: CheckCircle },
  pending: { label: 'Pending', color: '#fbbf24', icon: Clock },
  draft:   { label: 'Draft',   color: '#6b7280', icon: AlertCircle },
}

const totalRevenue = mockRevenue.reduce((s, m) => s + m.revenue, 0)
const totalPaid    = mockInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
const totalPending = mockInvoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0)
const totalDraft   = mockInvoices.filter(i => i.status === 'draft').reduce((s, i) => s + i.amount, 0)

export default function Finance() {
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'All' ? mockInvoices : mockInvoices.filter(i => i.status === filter.toLowerCase())

  function exportInvoices() {
    const rows = filtered.map(inv => ({
      'Invoice ID': inv.id,
      'Customer':   inv.customer,
      'Vehicle':    inv.vehicle,
      'Mechanic':   inv.mechanic,
      'Amount ($)': inv.amount,
      'Status':     inv.status,
      'Date':       inv.date,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices')
    XLSX.writeFile(wb, 'autoforge-invoices.xlsx')
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Finance</p>
            <h1 className="font-display font-bold text-3xl">Payments & Invoices</h1>
          </div>
          <button onClick={exportInvoices}
            className="flex items-center gap-2 px-4 py-2.5 glass border border-forge-border hover:border-forge-blue/40 text-sm font-medium rounded-xl transition-all">
            <Download size={14} className="text-forge-blue" /> Export Excel
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '6-Month Revenue', value: totalRevenue, color: '#f97316', icon: TrendingUp },
            { label: 'Collected',       value: totalPaid,    color: '#4ade80', icon: CheckCircle },
            { label: 'Awaiting',        value: totalPending, color: '#fbbf24', icon: Clock },
            { label: 'Draft',           value: totalDraft,   color: '#6b7280', icon: FileText },
          ].map(({ label, value, color, icon: Icon }, i) => (
            <motion.div key={label} initial="hidden" animate="visible" variants={fadeUp} custom={i}
              className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '18', border: `1px solid ${color}30` }}>
                  <Icon size={16} style={{ color }} />
                </div>
              </div>
              <p className="font-display font-bold text-2xl">${value.toLocaleString()}</p>
              <p className="text-xs text-forge-muted mt-1">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue chart */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-mono text-forge-muted mb-1">REVENUE TREND</p>
              <h3 className="font-display font-semibold text-lg">Last 6 Months</h3>
            </div>
            <p className="font-display font-bold text-forge-orange">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockRevenue}>
                <defs>
                  <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="month" stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#finGrad)" dot={{ fill: '#f97316', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Invoice table */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5} className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-forge-border/40 flex items-center justify-between">
            <h3 className="font-display font-semibold">Invoices</h3>
            <div className="flex gap-1 p-1 glass rounded-lg">
              {['All', 'Paid', 'Pending', 'Draft'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? 'bg-forge-blue text-white' : 'text-forge-muted hover:text-forge-text'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forge-border/30">
                  {['Invoice', 'Customer', 'Vehicle', 'Mechanic', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-mono text-forge-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => {
                  const cfg = statusConfig[inv.status]
                  const Ico = cfg.icon
                  return (
                    <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-forge-border/20 hover:bg-white/2 transition-colors">
                      <td className="px-5 py-4 text-xs font-mono text-forge-blue-light">{inv.id}</td>
                      <td className="px-5 py-4 text-sm font-medium text-forge-text">{inv.customer}</td>
                      <td className="px-5 py-4 text-sm text-forge-muted">{inv.vehicle}</td>
                      <td className="px-5 py-4 text-sm text-forge-muted">{inv.mechanic}</td>
                      <td className="px-5 py-4 text-sm font-mono font-bold text-forge-text">${inv.amount.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full"
                          style={{ color: cfg.color, background: cfg.color + '18', border: `1px solid ${cfg.color}30` }}>
                          <Ico size={11} /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-forge-muted">{inv.date}</td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  )
}
