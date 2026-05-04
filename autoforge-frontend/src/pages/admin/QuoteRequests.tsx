import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Search, Mail, Phone, User } from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import BackButton from '@/components/shared/BackButton'
import { backendClient } from '@/api/client'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.03 } }),
}

type Row = {
  id: string
  userId: string | null
  name: string | null
  email: string | null
  phone: string | null
  createdAt: string | null
  payload: { estimate?: { predicted_hours?: number; predicted_cost_usd?: number }; inputs?: Record<string, unknown> }
}

export default function QuoteRequests() {
  const [search, setSearch] = useState('')

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['booking-inquiries'],
    queryFn: async () => {
      const res = await backendClient.get('/api/booking-inquiries')
      const root = res.data
      if (root?.success === false) throw new Error(root.message || 'Failed')
      const d = root?.data ?? res.data
      return Array.isArray(d) ? d : []
    },
  })

  const filtered = (rows as Row[]).filter((r) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      r.name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.phone?.includes(search) ||
      r.id.toLowerCase().includes(q)
    )
  })

  const errMsg = error instanceof Error ? error.message : null

  return (
    <AdminLayout>
      <div className="space-y-6">
        <BackButton />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Portal</p>
            <h1 className="font-display font-bold text-3xl flex items-center gap-3">
              <ClipboardList className="text-forge-blue-light" size={28} />
              Quote requests
            </h1>
            <p className="text-forge-muted text-sm mt-2 max-w-xl">
              Leads saved from the public quote page (with &quot;Save this request&quot;) or while signed in as a customer.
            </p>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forge-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="pl-9 pr-4 py-2.5 glass border border-forge-border rounded-xl text-sm text-forge-text placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-blue/50 bg-transparent w-full sm:w-64"
            />
          </div>
        </div>

        {errMsg && (
          <p className="text-red-400 text-sm">{errMsg}</p>
        )}

        <div className="glass rounded-2xl overflow-hidden border border-forge-border/50">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse bg-forge-border/20 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-forge-muted px-4">
              <ClipboardList size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{search ? 'No rows match your search.' : 'No saved quote requests yet.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-forge-border/40 text-left text-xs font-mono text-forge-muted uppercase">
                    <th className="px-5 py-3">Received</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Hours</th>
                    <th className="px-5 py-3">Est. cost</th>
                    <th className="px-5 py-3">Vehicle / damage</th>
                    <th className="px-5 py-3">Account</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const est = r.payload?.estimate
                    const inp = r.payload?.inputs as { vehicle_type?: string; damage_type?: string } | undefined
                    return (
                      <motion.tr
                        key={r.id}
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        custom={i}
                        className="border-b border-forge-border/15 hover:bg-white/2"
                      >
                        <td className="px-5 py-3 text-forge-muted font-mono text-xs whitespace-nowrap">
                          {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-0.5">
                            {r.name && (
                              <span className="flex items-center gap-1.5 text-forge-text font-medium">
                                <User size={12} className="text-forge-muted shrink-0" /> {r.name}
                              </span>
                            )}
                            {r.email && (
                              <span className="flex items-center gap-1.5 text-forge-muted text-xs">
                                <Mail size={12} className="shrink-0" /> {r.email}
                              </span>
                            )}
                            {r.phone && (
                              <span className="flex items-center gap-1.5 text-forge-muted text-xs">
                                <Phone size={12} className="shrink-0" /> {r.phone}
                              </span>
                            )}
                            {!r.name && !r.email && !r.phone && <span className="text-forge-muted">—</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3 font-semibold">{est?.predicted_hours ?? '—'}</td>
                        <td className="px-5 py-3 font-semibold text-forge-orange whitespace-nowrap">
                          {est?.predicted_cost_usd != null ? `$${est.predicted_cost_usd}` : '—'}
                        </td>
                        <td className="px-5 py-3 text-forge-muted">
                          {[inp?.vehicle_type, inp?.damage_type].filter(Boolean).join(' · ') || '—'}
                        </td>
                        <td className="px-5 py-3 text-xs font-mono">
                          {(r.payload as { source?: string })?.source === 'portal_send_request' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-forge-orange/15 border border-forge-orange/30 text-forge-orange">
                              Request sent
                            </span>
                          ) : r.userId ? (
                            <span className="text-forge-muted">Linked user</span>
                          ) : (
                            <span className="text-forge-muted">Guest</span>
                          )}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
