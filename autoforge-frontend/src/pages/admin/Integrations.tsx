import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, CheckCircle, AlertCircle, Clock, RefreshCw, Activity, Bot, Database, Eye } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'
import BackButton from '@/components/shared/BackButton'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07 } }),
}

type EndpointStatus = 'online' | 'degraded' | 'offline'

type Integration = {
  id: string
  name: string
  description: string
  endpoint: string
  method: string
  status: EndpointStatus
  avgMs: number
  calls24h: number
  successRate: number
  lastChecked: string
}

const integrations: Integration[] = [
  { id: 'e1', name: 'Damage Detection',       description: 'YOLOv8n vision model — detects body damage and classifies severity',   endpoint: '/predict-damage',      method: 'POST', status: 'online',   avgMs: 820,  calls24h: 47,  successRate: 100, lastChecked: '1m ago' },
  { id: 'e2', name: 'Repair Time Prediction', description: 'XGBoost model — predicts repair time from vehicle and damage features', endpoint: '/predict-time',        method: 'POST', status: 'online',   avgMs: 38,   calls24h: 93,  successRate: 100, lastChecked: '1m ago' },
  { id: 'e3', name: 'Cost Estimation',        description: 'XGBoost model — estimates repair cost in USD',                         endpoint: '/predict-cost',        method: 'POST', status: 'online',   avgMs: 34,   calls24h: 93,  successRate: 100, lastChecked: '1m ago' },
  { id: 'e4', name: 'Mechanic Assignment',    description: 'LambdaRank model — ranks mechanics by skill, workload, and job fit',   endpoint: '/assign-mechanic',     method: 'POST', status: 'online',   avgMs: 55,   calls24h: 61,  successRate: 98,  lastChecked: '2m ago' },
  { id: 'e5', name: 'Inventory Forecast',     description: 'Prophet time-series — predicts part demand for 5 categories',          endpoint: '/forecast-inventory',  method: 'GET',  status: 'online',   avgMs: 210,  calls24h: 24,  successRate: 100, lastChecked: '3m ago' },
  { id: 'e6', name: 'Customer Messaging',     description: 'Groq LLaMA-3.1-8b — generates EN/AR messages for customers',           endpoint: '/generate-message',    method: 'POST', status: 'online',   avgMs: 1140, calls24h: 38,  successRate: 97,  lastChecked: '2m ago' },
  { id: 'e7', name: 'Sentiment Analysis',     description: 'Groq LLaMA-3.1-8b — classifies review sentiment with confidence',      endpoint: '/analyze-sentiment',   method: 'POST', status: 'online',   avgMs: 980,  calls24h: 19,  successRate: 100, lastChecked: '4m ago' },
  { id: 'e8', name: 'Next.js Backend API',    description: 'Intern-db — REST backend for jobs, customers, vehicles, parts',        endpoint: 'http://localhost:3000', method: '—',    status: 'online',   avgMs: 12,   calls24h: 312, successRate: 99,  lastChecked: '30s ago' },
  { id: 'e9', name: 'Neon PostgreSQL',        description: 'Hosted Postgres — primary database for all business entities',         endpoint: 'neon.tech (pooled)',   method: '—',    status: 'online',   avgMs: 22,   calls24h: 891, successRate: 100, lastChecked: '30s ago' },
]

const statusConfig: Record<EndpointStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  online:   { label: 'Online',   color: '#4ade80', icon: CheckCircle },
  degraded: { label: 'Degraded', color: '#fbbf24', icon: AlertCircle },
  offline:  { label: 'Offline',  color: '#ef4444', icon: AlertCircle },
}

const mockCallsHistory = [
  { hour: '08:00', calls: 12 },
  { hour: '09:00', calls: 28 },
  { hour: '10:00', calls: 45 },
  { hour: '11:00', calls: 61 },
  { hour: '12:00', calls: 38 },
  { hour: '13:00', calls: 53 },
  { hour: '14:00', calls: 74 },
  { hour: '15:00', calls: 91 },
]

export default function Integrations() {
  const [expanded, setExpanded] = useState<string | null>(null)

  const totalCalls = integrations.reduce((s, i) => s + i.calls24h, 0)
  const avgSuccess = Math.round(integrations.reduce((s, i) => s + i.successRate, 0) / integrations.length)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <BackButton />
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">System</p>
          <h1 className="font-display font-bold text-3xl">API & Integrations</h1>
          <p className="text-sm text-forge-muted mt-2">
            Encrypted API keys and outbound call logs live in{' '}
            <Link to="/admin/vault" className="text-forge-blue-light hover:underline">Vault & logs</Link> (admin).
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Services',       value: `${integrations.length}`,                          color: '#3b82f6', icon: Zap },
            { label: 'Online Now',     value: `${integrations.filter(i => i.status === 'online').length}`, color: '#4ade80', icon: CheckCircle },
            { label: 'Calls (24h)',    value: totalCalls.toString(),                              color: '#f97316', icon: Activity },
            { label: 'Success Rate',   value: `${avgSuccess}%`,                                  color: '#a855f7', icon: Bot },
          ].map(({ label, value, color, icon: Icon }, i) => (
            <motion.div key={label} initial="hidden" animate="visible" variants={fadeUp} custom={i}
              className="glass rounded-2xl p-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: color + '18', border: `1px solid ${color}30` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="font-display font-bold text-2xl">{value}</p>
              <p className="text-xs text-forge-muted mt-1">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Calls chart */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Activity size={16} className="text-forge-blue" />
            <h3 className="font-display font-semibold text-lg">API Calls Today</h3>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockCallsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="hour" stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [Number(v ?? 0), 'Calls']} />
                <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Endpoint cards */}
        <div className="space-y-3">
          {integrations.map((integ, i) => {
            const cfg = statusConfig[integ.status]
            const Ico = cfg.icon
            const isOpen = expanded === integ.id
            return (
              <motion.div key={integ.id} initial="hidden" animate="visible" variants={fadeUp} custom={i}
                className="glass rounded-2xl overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : integ.id)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-white/2 transition-colors text-left">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.color + '15', border: `1px solid ${cfg.color}25` }}>
                    <Ico size={15} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm text-forge-text">{integ.name}</p>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-forge-border/60 text-forge-muted">{integ.method}</span>
                    </div>
                    <p className="text-xs text-forge-muted font-mono truncate">{integ.endpoint}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-xs font-mono text-forge-muted">
                    <span><span className="text-forge-text font-bold">{integ.avgMs}</span>ms avg</span>
                    <span><span className="text-forge-text font-bold">{integ.calls24h}</span> calls</span>
                    <span style={{ color: integ.successRate === 100 ? '#4ade80' : '#fbbf24' }}>
                      {integ.successRate}% ok
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full"
                      style={{ color: cfg.color, background: cfg.color + '15', border: `1px solid ${cfg.color}25` }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
                      {cfg.label}
                    </span>
                    <RefreshCw size={13} className={`text-forge-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 border-t border-forge-border/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="glass rounded-xl p-4 space-y-2">
                        <p className="text-xs font-mono text-forge-muted uppercase tracking-wider mb-3">Details</p>
                        <p className="text-sm text-forge-text">{integ.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock size={12} className="text-forge-muted" />
                          <span className="text-xs text-forge-muted">Last checked {integ.lastChecked}</span>
                        </div>
                      </div>
                      <div className="glass rounded-xl p-4">
                        <p className="text-xs font-mono text-forge-muted uppercase tracking-wider mb-3">Metrics</p>
                        <div className="space-y-2.5">
                          {[
                            { label: 'Avg Response', value: `${integ.avgMs}ms` },
                            { label: 'Calls (24h)',  value: integ.calls24h.toString() },
                            { label: 'Success Rate', value: `${integ.successRate}%` },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between text-sm">
                              <span className="text-forge-muted">{label}</span>
                              <span className="font-mono text-forge-text">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* AI Models section */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={10} className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Database size={16} className="text-forge-orange" />
            <h3 className="font-display font-semibold text-lg">Loaded Model Files</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { file: 'best.pt',              size: '6.2 MB',  type: 'YOLOv8n' },
              { file: 'cost_model.pkl',       size: '1.1 MB',  type: 'XGBoost' },
              { file: 'time_model.pkl',       size: '0.9 MB',  type: 'XGBoost' },
              { file: 'ranker.pkl',           size: '2.3 MB',  type: 'LambdaRank' },
              { file: 'prophet_bumpers.pkl',  size: '0.4 MB',  type: 'Prophet' },
            ].map(m => (
              <div key={m.file} className="glass rounded-xl p-3 flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <Eye size={12} className="text-forge-blue" />
                  <span className="text-xs font-mono text-forge-blue-light">{m.type}</span>
                </div>
                <p className="text-xs font-mono text-forge-text truncate">{m.file}</p>
                <p className="text-xs text-forge-muted">{m.size}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  )
}
