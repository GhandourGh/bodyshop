import { motion } from 'framer-motion'
import { Wrench } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'
import { mockMechanics } from '@/data/mock'

export default function Mechanics() {
  const performanceData = mockMechanics.map((mechanic) => ({
    name: mechanic.name.split(' ')[0],
    completed: mechanic.jobsCompleted,
    rating: Number((mechanic.rating * 20).toFixed(0)),
  }))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Operations</p>
          <h1 className="font-display font-bold text-3xl">Mechanics</h1>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wrench size={18} className="text-forge-blue" />
            <h3 className="font-display font-semibold text-lg">Team Performance</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="completed" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rating" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockMechanics.map((mechanic) => (
            <motion.div key={mechanic.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-5 card-hover">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-lg">{mechanic.name}</h3>
                <span className="text-xs font-mono text-forge-blue-light">{mechanic.specialty}</span>
              </div>
              <p className="text-sm text-forge-muted mb-2">{mechanic.email}</p>
              <div className="flex items-center justify-between text-xs font-mono text-forge-muted mb-2">
                <span>Skill Level</span>
                <span>{mechanic.skillLevel}/5</span>
              </div>
              <div className="h-1.5 bg-forge-border rounded-full overflow-hidden mb-3">
                <div className="h-full bg-forge-blue rounded-full" style={{ width: `${(mechanic.skillLevel / 5) * 100}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-forge-muted mb-2">
                <span>Workload</span>
                <span>{Math.round(mechanic.workload * 100)}%</span>
              </div>
              <div className="h-1.5 bg-forge-border rounded-full overflow-hidden">
                <div className="h-full bg-forge-orange rounded-full" style={{ width: `${mechanic.workload * 100}%` }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
