import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Package, AlertTriangle, CheckCircle } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'
import BackButton from '@/components/shared/BackButton'
import { backendClient } from '@/api/client'

const LOW_STOCK_THRESHOLD = 10

export default function Inventory() {
  const { data: parts = [], isLoading } = useQuery({
    queryKey: ['parts'],
    queryFn: async () => {
      const res = await backendClient.get('/api/parts')
      return res.data.data ?? res.data
    },
  })

  const chartData = parts.map((p: any) => ({
    name: (p.name || 'Part').split(' ')[0],
    stock: p.stock ?? 0,
    threshold: LOW_STOCK_THRESHOLD,
  }))

  const lowStockParts = parts.filter((p: any) => (p.stock ?? 0) < LOW_STOCK_THRESHOLD)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Supply Chain</p>
            <h1 className="font-display font-bold text-3xl">Inventory</h1>
          </div>
          {!isLoading && lowStockParts.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-mono">{lowStockParts.length} part{lowStockParts.length > 1 ? 's' : ''} low on stock</span>
            </div>
          )}
        </div>

        {/* Stock Chart */}
        {!isLoading && parts.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Package size={18} className="text-forge-orange" />
              <h3 className="font-display font-semibold text-lg">Stock Levels</h3>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
                  <ReferenceLine y={LOW_STOCK_THRESHOLD} stroke="#ef4444" strokeDasharray="4 4"
                    label={{ value: 'low stock', fill: '#ef4444', fontSize: 10 }} />
                  <Bar dataKey="stock" name="Current Stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Parts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse bg-forge-border/20 rounded-2xl" />
            ))}
          </div>
        ) : parts.length === 0 ? (
          <div className="text-center py-16 text-forge-muted glass rounded-2xl">
            <Package size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No parts in inventory yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parts.map((part: any, i: number) => {
              const low = (part.stock ?? 0) < LOW_STOCK_THRESHOLD
              return (
                <motion.div key={part.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }} className="glass rounded-xl p-5 card-hover">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display font-semibold">{part.name}</h3>
                      <p className="text-xs font-mono text-forge-muted mt-0.5">
                        ${Number(part.price || 0).toFixed(2)} / unit
                      </p>
                    </div>
                    {low ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <AlertTriangle size={11} className="text-red-400" />
                        <span className="text-xs text-red-400 font-mono">Low</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <CheckCircle size={11} className="text-green-400" />
                        <span className="text-xs text-green-400 font-mono">OK</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="text-forge-muted">Stock</span>
                    <span className={low ? 'text-red-400' : 'text-forge-text'}>{part.stock ?? 0} units</span>
                  </div>
                  <div className="h-1.5 bg-forge-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: low ? '#ef4444' : '#3b82f6' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((part.stock ?? 0) / 50) * 100)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
