import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Wrench, Star } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'
import { backendClient } from '@/api/client'

export default function Mechanics() {
  const { data: mechanics = [], isLoading } = useQuery({
    queryKey: ['mechanics'],
    queryFn: async () => {
      const res = await backendClient.get('/api/mechanics')
      return res.data.data ?? res.data
    },
  })

  const chartData = mechanics.map((m: any) => ({
    name: (m.name || 'Unknown').split(' ')[0],
    skill: m.skillLevel ?? 0,
    workload: m.workload ?? 0,
  }))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Operations</p>
          <h1 className="font-display font-bold text-3xl">Mechanics</h1>
        </div>

        {!isLoading && mechanics.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Wrench size={18} className="text-forge-blue" />
              <h3 className="font-display font-semibold text-lg">Team Overview</h3>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="skill" name="Skill Level" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="workload" name="Workload" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse bg-forge-border/20 rounded-2xl" />
            ))}
          </div>
        ) : mechanics.length === 0 ? (
          <div className="text-center py-16 text-forge-muted glass rounded-2xl">
            <Wrench size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No mechanics registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mechanics.map((m: any, i: number) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }} className="glass rounded-2xl p-5 card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display font-semibold text-lg">{m.name || 'Unknown'}</h3>
                    <p className="text-xs font-mono text-forge-muted capitalize">{m.specialty || 'General'}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={12} className={s < (m.skillLevel ?? 0) ? 'text-forge-orange fill-forge-orange' : 'text-forge-border'} />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-forge-muted mb-1">
                    <span className="font-mono uppercase tracking-wider">Workload</span>
                    <span className="font-mono">{m.workload ?? 0}%</span>
                  </div>
                  <div className="h-1.5 bg-forge-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: (m.workload ?? 0) > 80 ? '#ef4444' : (m.workload ?? 0) > 60 ? '#f97316' : '#22c55e' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${m.workload ?? 0}%` }}
                      transition={{ duration: 0.8, delay: i * 0.06 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
