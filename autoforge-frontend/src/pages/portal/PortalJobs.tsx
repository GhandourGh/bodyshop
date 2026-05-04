import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, ChevronRight, Loader2 } from 'lucide-react'
import { backendClient } from '@/api/client'
import BackButton from '@/components/shared/BackButton'
import StatusBadge from '@/components/shared/StatusBadge'

type PortalJobRow = {
  id: string
  status: string | null
  estimatedCost: number | null
  estimatedTime: number | null
  createdAt: string | null
  vehicleLabel: string
  mechanicName: string | null
}

export default function PortalJobs() {
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['portal-jobs'],
    queryFn: async () => {
      const res = await backendClient.get('/api/portal/jobs')
      const root = res.data
      if (root?.success === false) throw new Error(root.message || 'Failed')
      const d = root?.data ?? res.data
      return Array.isArray(d) ? d : []
    },
  })

  const errMsg = error instanceof Error ? error.message : null

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <BackButton />
      <div className="flex items-center gap-3 mb-6 mt-4">
        <Briefcase className="text-forge-blue-light" size={24} />
        <div>
          <p className="text-xs font-mono text-forge-muted uppercase tracking-widest">Repairs</p>
          <h1 className="font-display font-bold text-2xl">My jobs</h1>
        </div>
      </div>
      <p className="text-sm text-forge-muted mb-6 max-w-xl">
        Jobs appear here when your account is linked as the customer on a repair (same login you use for quotes).
      </p>

      {isLoading && (
        <div className="flex items-center gap-2 text-forge-muted">
          <Loader2 size={18} className="animate-spin" /> Loading…
        </div>
      )}
      {errMsg && <p className="text-red-400 text-sm">{errMsg}</p>}

      {!isLoading && !errMsg && rows.length === 0 && (
        <p className="text-forge-muted text-sm glass rounded-xl p-6 border border-forge-border">
          No active jobs yet. Saved quote requests are under{' '}
          <Link to="/portal/dashboard" className="text-forge-blue-light hover:underline">My requests</Link>.
        </p>
      )}

      {!isLoading && rows.length > 0 && (
        <div className="glass rounded-2xl border border-forge-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-forge-border/40 text-left text-xs font-mono text-forge-muted uppercase">
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Est. cost</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {(rows as PortalJobRow[]).map((r) => (
                <tr key={r.id} className="border-b border-forge-border/20 hover:bg-white/3">
                  <td className="px-4 py-3 font-medium text-forge-text">{r.vehicleLabel}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status ?? 'pending'} /></td>
                  <td className="px-4 py-3 text-forge-orange font-semibold">
                    {r.estimatedCost != null ? `$${Number(r.estimatedCost).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-forge-muted font-mono text-xs">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/portal/jobs/${r.id}`} className="inline-flex text-forge-blue-light hover:text-forge-text">
                      <ChevronRight size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}
