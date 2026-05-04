import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Car, Loader2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'
import BackButton from '@/components/shared/BackButton'
import { backendClient } from '@/api/client'

const STATUS_COLORS: Record<string, string> = {
  active:    '#3b82f6',
  in_repair: '#f97316',
  ready:     '#4ade80',
  unknown:   '#6b7280',
}

function statusLabel(v: any): string {
  const jobs = v.jobs ?? []
  if (jobs.some((j: any) => j.status === 'in_progress' || j.status === 'pending')) return 'in_repair'
  if (jobs.some((j: any) => j.status === 'done')) return 'ready'
  return 'active'
}

export default function Vehicles() {
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await backendClient.get('/api/vehicles')
      return res.data.data ?? res.data ?? []
    },
  })

  const statusCounts = (() => {
    const counts: Record<string, number> = { active: 0, in_repair: 0, ready: 0 }
    for (const v of vehicles as any[]) {
      const s = statusLabel(v)
      counts[s] = (counts[s] ?? 0) + 1
    }
    return [
      { name: 'Active',    value: counts.active,    color: STATUS_COLORS.active },
      { name: 'In Repair', value: counts.in_repair,  color: STATUS_COLORS.in_repair },
      { name: 'Ready',     value: counts.ready,      color: STATUS_COLORS.ready },
    ].filter(s => s.value > 0)
  })()

  return (
    <AdminLayout>
      <div className="space-y-6">
        <BackButton />
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Fleet</p>
          <h1 className="font-display font-bold text-3xl">Vehicles</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-forge-muted py-8">
            <Loader2 size={18} className="animate-spin" /> Loading fleet…
          </div>
        ) : (
          <>
            {statusCounts.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Car size={18} className="text-forge-orange" />
                  <h3 className="font-display font-semibold text-lg">Vehicle Status Mix</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  <div className="lg:col-span-2 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusCounts} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4}>
                          {statusCounts.map(s => <Cell key={s.name} fill={s.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {statusCounts.map(s => (
                      <div key={s.name} className="glass rounded-lg px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-forge-muted">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.name}
                        </div>
                        <span className="font-mono text-sm text-forge-text">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {(vehicles as any[]).length === 0 ? (
              <div className="text-center py-16 text-forge-muted">
                <Car size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No vehicles registered yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(vehicles as any[]).map((v, i) => {
                  const ownerName = v.customers?.users?.name ?? v.customers?.name ?? '—'
                  const sl = statusLabel(v)
                  return (
                    <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="glass rounded-xl p-5 card-hover">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-display font-semibold text-lg">{[v.make, v.model].filter(Boolean).join(' ') || 'Unknown vehicle'}</h3>
                          <p className="text-xs font-mono text-forge-muted">{v.year ?? '—'}{v.vin ? ` · ${v.vin}` : ''}</p>
                        </div>
                        <div className="w-3 h-3 rounded-full mt-1.5" style={{ backgroundColor: STATUS_COLORS[sl] ?? STATUS_COLORS.unknown }} />
                      </div>
                      <p className="text-sm text-forge-muted mb-2">Owner: <span className="text-forge-text">{ownerName}</span></p>
                      <p className="text-xs font-mono uppercase tracking-wider" style={{ color: STATUS_COLORS[sl] ?? STATUS_COLORS.unknown }}>
                        {sl.replace('_', ' ')}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
