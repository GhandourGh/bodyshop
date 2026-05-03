import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, TrendingUp, FileText, Download, CheckCircle, Clock, AlertCircle, FileDown } from 'lucide-react'
import { useToast } from '@/components/shared/Toast'
import { downloadInvoicesPdf } from '@/lib/pdf/invoicesPdf'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'
import { backendClient } from '@/api/client'
import * as XLSX from 'xlsx'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07 } }),
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  paid:    { label: 'Paid',    color: '#4ade80', icon: CheckCircle },
  pending: { label: 'Pending', color: '#fbbf24', icon: Clock },
  draft:   { label: 'Draft',   color: '#6b7280', icon: AlertCircle },
}

export default function Finance() {
  const { toast } = useToast()
  const [filter, setFilter] = useState('All')

  const { data, isLoading } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: async () => {
      const res = await backendClient.get('/api/finance/summary')
      return res.data.data as {
        invoices: { id: string; jobId: string; customer: string; vehicle: string; mechanic: string; amount: number; status: string; date: string }[]
        monthlyRevenue: { month: string; revenue: number; jobs: number }[]
        totals: { totalRevenue: number; totalPaid: number; totalPending: number; totalDraft: number }
      }
    },
  })

  const invoices      = data?.invoices      ?? []
  const monthlyRevenue = data?.monthlyRevenue ?? []
  const totals        = data?.totals        ?? { totalRevenue: 0, totalPaid: 0, totalPending: 0, totalDraft: 0 }

  const filtered = filter === 'All' ? invoices : invoices.filter(i => i.status === filter.toLowerCase())

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

  function exportInvoicesPdf() {
    try {
      downloadInvoicesPdf(filtered)
      toast('Invoice PDF downloaded.', 'success')
    } catch {
      toast('Could not create PDF.', 'error')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Finance</p>
            <h1 className="font-display font-bold text-3xl">Payments & Invoices</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportInvoicesPdf}
              className="flex items-center gap-2 px-4 py-2.5 glass border border-forge-border hover:border-forge-blue/40 text-sm font-medium rounded-xl transition-all">
              <FileDown size={14} className="text-forge-orange" /> Export PDF
            </button>
            <button type="button" onClick={exportInvoices}
              className="flex items-center gap-2 px-4 py-2.5 glass border border-forge-border hover:border-forge-blue/40 text-sm font-medium rounded-xl transition-all">
              <Download size={14} className="text-forge-blue" /> Export Excel
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-5 animate-pulse h-28 bg-forge-border/20" />
              ))
            : [
                { label: 'Total Revenue',  value: totals.totalRevenue,  color: '#f97316', icon: TrendingUp },
                { label: 'Collected',      value: totals.totalPaid,     color: '#4ade80', icon: CheckCircle },
                { label: 'Awaiting',       value: totals.totalPending,  color: '#fbbf24', icon: Clock },
                { label: 'Draft',          value: totals.totalDraft,    color: '#6b7280', icon: FileText },
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
              ))
          }
        </div>

        {/* Revenue chart */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-mono text-forge-muted mb-1">REVENUE TREND</p>
              <h3 className="font-display font-semibold text-lg">Last 12 Months</h3>
            </div>
            <p className="font-display font-bold text-forge-orange">${totals.totalRevenue.toLocaleString()}</p>
          </div>
          {isLoading
            ? <div className="h-52 animate-pulse bg-forge-border/20 rounded-xl" />
            : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenue}>
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
                      formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#finGrad)" dot={{ fill: '#f97316', r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )
          }
        </motion.div>

        {/* Invoice table */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5} className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-forge-border/40 flex items-center justify-between">
            <h3 className="font-display font-semibold">Invoices <span className="text-xs font-normal text-forge-muted ml-2">{invoices.length} total</span></h3>
            <div className="flex gap-1 p-1 glass rounded-lg">
              {['All', 'Paid', 'Pending', 'Draft'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? 'bg-forge-blue text-white' : 'text-forge-muted hover:text-forge-text'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          {isLoading
            ? <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 animate-pulse bg-forge-border/20 rounded-lg" />)}</div>
            : (
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
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-12 text-forge-muted">
                        <DollarSign size={28} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No invoices found</p>
                      </td></tr>
                    )}
                    {filtered.map((inv, i) => {
                      const cfg = statusConfig[inv.status] ?? statusConfig.draft
                      const Ico = cfg.icon
                      return (
                        <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                          className="border-b border-forge-border/20 hover:bg-white/2 transition-colors">
                          <td className="px-5 py-4 text-xs font-mono text-forge-blue-light">{inv.id}</td>
                          <td className="px-5 py-4 text-sm font-medium text-forge-text">{inv.customer}</td>
                          <td className="px-5 py-4 text-sm text-forge-muted">{inv.vehicle}</td>
                          <td className="px-5 py-4 text-sm text-forge-muted">{inv.mechanic || 'Unassigned'}</td>
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
            )
          }
        </motion.div>
      </div>
    </AdminLayout>
  )
}
