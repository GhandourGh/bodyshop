import { motion } from 'framer-motion'
import { Car } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'
import { mockVehicles } from '@/data/mock'

const COLORS = {
  active: '#3b82f6',
  in_repair: '#f97316',
  ready: '#4ade80',
}

export default function Vehicles() {
  const statusCounts = [
    { name: 'Active', value: mockVehicles.filter((vehicle) => vehicle.status === 'active').length, color: COLORS.active },
    { name: 'In Repair', value: mockVehicles.filter((vehicle) => vehicle.status === 'in_repair').length, color: COLORS.in_repair },
    { name: 'Ready', value: mockVehicles.filter((vehicle) => vehicle.status === 'ready').length, color: COLORS.ready },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Fleet</p>
          <h1 className="font-display font-bold text-3xl">Vehicles</h1>
        </div>

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
                    {statusCounts.map((status) => (
                      <Cell key={status.name} fill={status.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {statusCounts.map((status) => (
                <div key={status.name} className="glass rounded-lg px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-forge-muted">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                    {status.name}
                  </div>
                  <span className="font-mono text-sm text-forge-text">{status.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockVehicles.map((vehicle) => (
            <motion.div key={vehicle.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-5 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold text-lg">{vehicle.make} {vehicle.model}</h3>
                  <p className="text-xs font-mono text-forge-muted">{vehicle.year} · {vehicle.vin}</p>
                </div>
                <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: vehicle.color }} />
              </div>
              <p className="text-sm text-forge-muted mb-2">Owner: <span className="text-forge-text">{vehicle.owner}</span></p>
              <p className="text-xs font-mono text-forge-muted uppercase tracking-wider">
                Status: <span style={{ color: COLORS[vehicle.status] }}>{vehicle.status.replace('_', ' ')}</span>
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
