import { motion } from 'framer-motion'
import { Package, AlertTriangle } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'
import { mockParts } from '@/data/mock'

export default function Inventory() {
  const stockChartData = mockParts.map((part) => ({
    name: part.name.split(' ')[0],
    stock: part.stock,
    threshold: part.threshold,
  }))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Supply Chain</p>
          <h1 className="font-display font-bold text-3xl">Inventory</h1>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Package size={18} className="text-forge-orange" />
            <h3 className="font-display font-semibold text-lg">Stock vs Threshold</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockChartData}>
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
                <ReferenceLine y={6} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'safety line', fill: '#ef4444', fontSize: 10 }} />
                <Line type="monotone" dataKey="stock" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} />
                <Line type="monotone" dataKey="threshold" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockParts.map((part) => {
            const lowStock = part.stock < part.threshold
            return (
              <motion.div key={part.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-5 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-semibold text-lg">{part.name}</h3>
                    <p className="text-xs font-mono text-forge-muted">{part.category}</p>
                  </div>
                  {lowStock && <AlertTriangle size={16} className="text-red-400" />}
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-forge-muted">Stock</span>
                  <span className="font-mono text-forge-text">{part.stock}</span>
                </div>
                <div className="h-1.5 bg-forge-border rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full ${lowStock ? 'bg-red-500' : 'bg-forge-blue'}`}
                    style={{ width: `${Math.min(100, (part.stock / (part.threshold * 1.4)) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-forge-muted">Threshold: {part.threshold}</span>
                  <span className="font-mono text-forge-orange">${part.price}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
