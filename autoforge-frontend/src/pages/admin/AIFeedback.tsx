import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Brain, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'
import BackButton from '@/components/shared/BackButton'
import { backendClient } from '@/api/client'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

function errorBadge(pct: number | null) {
  if (pct == null) return <span className="text-xs text-forge-muted/50">N/A</span>
  const color = pct < 15 ? '#4ade80' : pct < 30 ? '#fbbf24' : '#ef4444'
  const label = pct < 15 ? 'Good' : pct < 30 ? 'Fair' : 'Poor'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full"
      style={{ color, background: color + '18', border: `1px solid ${color}30` }}>
      {pct < 15 ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
      {pct}% — {label}
    </span>
  )
}

export default function AIFeedback() {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-feedback'],
    queryFn: async () => {
      const res = await backendClient.get('/api/ai-feedback')
      return res.data as {
        rows: {
          id: string; jobId: string; type: string; vehicle: string
          predictedCost: number | null; actualCost: number | null
          predictedHours: number | null; actualHours: number | null
          costError: number | null; hoursError: number | null
          confidence: number | null; createdAt: string
        }[]
        summary: { total: number; avgCostError: number | null; avgHoursError: number | null }
      }
    },
  })

  const rows    = data?.rows    ?? []
  const summary = data?.summary ?? { total: 0, avgCostError: null, avgHoursError: null }

  const scatterData = rows
    .filter(r => r.predictedCost != null && r.actualCost != null)
    .map(r => ({ x: r.predictedCost!, y: r.actualCost!, vehicle: r.vehicle }))

  const maxCost = Math.max(...scatterData.map(d => Math.max(d.x, d.y)), 1000)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <BackButton />
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Intelligence</p>
          <h1 className="font-display font-bold text-3xl">AI Feedback</h1>
          <p className="text-forge-muted text-sm mt-1">Predicted vs actual outcomes — track AI accuracy over time</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Predictions',  value: isLoading ? '…' : summary.total,         icon: Brain,      color: '#a855f7' },
            { label: 'Avg Cost Error',     value: isLoading ? '…' : summary.avgCostError  != null ? `${summary.avgCostError}%`  : 'N/A', icon: TrendingUp, color: summary.avgCostError  != null && summary.avgCostError  < 15 ? '#4ade80' : '#f97316' },
            { label: 'Avg Hours Error',    value: isLoading ? '…' : summary.avgHoursError != null ? `${summary.avgHoursError}%` : 'N/A', icon: TrendingUp, color: summary.avgHoursError != null && summary.avgHoursError < 15 ? '#4ade80' : '#fbbf24' },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <motion.div key={label} initial="hidden" animate="visible" variants={fadeUp} custom={i} className="glass rounded-2xl p-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: color + '18', border: `1px solid ${color}30` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="font-display font-bold text-2xl">{value}</p>
              <p className="text-xs text-forge-muted mt-1">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Scatter chart: predicted vs actual cost */}
        {scatterData.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="glass rounded-2xl p-6">
            <p className="text-xs font-mono text-forge-muted mb-1">COST ACCURACY</p>
            <h3 className="font-display font-semibold text-lg mb-5">Predicted vs Actual Cost</h3>
            <p className="text-xs text-forge-muted mb-4">Points on the diagonal line = perfect prediction. Above = under-predicted; below = over-predicted.</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis type="number" dataKey="x" name="Predicted ($)" stroke="#4b5563" tick={{ fontSize: 10, fill: '#6b7280' }}
                    tickFormatter={v => `$${v}`} domain={[0, maxCost]} label={{ value: 'Predicted ($)', position: 'insideBottom', offset: -4, fontSize: 10, fill: '#6b7280' }} />
                  <YAxis type="number" dataKey="y" name="Actual ($)" stroke="#4b5563" tick={{ fontSize: 10, fill: '#6b7280' }}
                    tickFormatter={v => `$${v}`} domain={[0, maxCost]} label={{ value: 'Actual ($)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 11 }}
                    content={({ payload }) => {
                      if (!payload?.[0]) return null
                      const d = payload[0].payload
                      return (
                        <div style={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
                          <p className="text-forge-muted mb-1">{d.vehicle}</p>
                          <p>Predicted: <strong>${d.x}</strong></p>
                          <p>Actual: <strong>${d.y}</strong></p>
                        </div>
                      )
                    }} />
                  <ReferenceLine segment={[{ x: 0, y: 0 }, { x: maxCost, y: maxCost }]} stroke="#3b82f6" strokeDasharray="6 3" strokeOpacity={0.5} />
                  <Scatter data={scatterData} fill="#f97316" opacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Predictions table */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-forge-border/40">
            <h3 className="font-display font-semibold">Prediction Log <span className="text-xs font-normal text-forge-muted ml-2">{rows.length} entries</span></h3>
          </div>
          {isLoading
            ? <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 animate-pulse bg-forge-border/20 rounded-lg" />)}</div>
            : rows.length === 0
            ? (
              <div className="text-center py-16 text-forge-muted">
                <Brain size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No AI predictions yet. Run the AI Job Wizard to generate predictions.</p>
              </div>
            )
            : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-forge-border/30">
                      {['Vehicle', 'Pred. Cost', 'Actual Cost', 'Cost Δ', 'Pred. Hours', 'Actual Hours', 'Hours Δ', 'Date'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-mono text-forge-muted uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="border-b border-forge-border/20 hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3.5 text-sm font-medium text-forge-text">{row.vehicle}</td>
                        <td className="px-4 py-3.5 text-sm font-mono text-forge-muted">{row.predictedCost  != null ? `$${row.predictedCost}`  : '—'}</td>
                        <td className="px-4 py-3.5 text-sm font-mono text-forge-text"> {row.actualCost     != null ? `$${row.actualCost}`     : '—'}</td>
                        <td className="px-4 py-3.5">{errorBadge(row.costError)}</td>
                        <td className="px-4 py-3.5 text-sm font-mono text-forge-muted">{row.predictedHours != null ? `${row.predictedHours}h` : '—'}</td>
                        <td className="px-4 py-3.5 text-sm font-mono text-forge-text"> {row.actualHours   != null ? `${row.actualHours}h`    : '—'}</td>
                        <td className="px-4 py-3.5">{errorBadge(row.hoursError)}</td>
                        <td className="px-4 py-3.5 text-xs font-mono text-forge-muted">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</td>
                      </motion.tr>
                    ))}
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
