import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardList, Loader2, Briefcase, User } from 'lucide-react'
import { backendClient } from '@/api/client'
import BackButton from '@/components/shared/BackButton'

type Row = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  createdAt: string | null
  payload: { estimate?: { predicted_hours?: number; predicted_cost_usd?: number }; inputs?: Record<string, unknown> }
}

export default function PortalDashboard() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const res = await backendClient.get('/api/portal/inquiries')
        const d = res.data?.data ?? res.data
        if (!cancelled) setRows(Array.isArray(d) ? d : [])
      } catch (e: unknown) {
        const ax = e as { response?: { data?: { message?: string } } }
        if (!cancelled) setErr(ax.response?.data?.message || 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <BackButton />
      <div className="flex items-center gap-3 mb-6 mt-4">
        <ClipboardList className="text-forge-blue-light" size={24} />
        <div>
          <p className="text-xs font-mono text-forge-muted uppercase tracking-widest">Portal</p>
          <h1 className="font-display font-bold text-2xl">My saved requests</h1>
        </div>
      </div>
      <p className="text-sm text-forge-muted mb-4 max-w-xl">
        Estimates you saved from the quote page appear here (linked to your account email).
      </p>
      <div className="flex flex-wrap gap-3 mb-8">
        <Link to="/portal/jobs" className="text-sm px-4 py-2 rounded-xl glass border border-forge-border hover:border-forge-blue/40 text-forge-text inline-flex items-center gap-2 transition-colors">
          <Briefcase size={15} /> My repair jobs
        </Link>
        <Link to="/portal/profile" className="text-sm px-4 py-2 rounded-xl glass border border-forge-border hover:border-forge-blue/40 text-forge-text inline-flex items-center gap-2 transition-colors">
          <User size={15} /> Profile
        </Link>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-forge-muted">
          <Loader2 size={18} className="animate-spin" /> Loading…
        </div>
      )}
      {err && <p className="text-red-400 text-sm">{err}</p>}

      {!loading && !err && rows.length === 0 && (
        <p className="text-forge-muted text-sm glass rounded-xl p-6 border border-forge-border">
          No saved requests yet. Go to <strong>Get a quote</strong>, run an estimate, and check &quot;Save this request&quot;.
        </p>
      )}

      {!loading && rows.length > 0 && (
        <div className="glass rounded-2xl border border-forge-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-forge-border/40 text-left text-xs font-mono text-forge-muted uppercase">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Cost (USD)</th>
                <th className="px-4 py-3">Vehicle / damage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const est = r.payload?.estimate
                const inp = r.payload?.inputs as { vehicle_type?: string; damage_type?: string } | undefined
                return (
                  <tr key={r.id} className="border-b border-forge-border/20 hover:bg-white/3">
                    <td className="px-4 py-3 text-forge-muted font-mono text-xs">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold">{est?.predicted_hours ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-forge-orange">
                      {est?.predicted_cost_usd != null ? `$${est.predicted_cost_usd}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-forge-muted">
                      {[inp?.vehicle_type, inp?.damage_type].filter(Boolean).join(' · ') || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}
