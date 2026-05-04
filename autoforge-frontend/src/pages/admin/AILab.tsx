import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, Activity, ArrowRight } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'
import BackButton from '@/components/shared/BackButton'

const latencyData = [
  { model: 'Damage', latency: 820 },
  { model: 'Time', latency: 120 },
  { model: 'Cost', latency: 110 },
  { model: 'Assign', latency: 95 },
  { model: 'Inventory', latency: 140 },
  { model: 'Message', latency: 640 },
  { model: 'Sentiment', latency: 430 },
]

export default function AILab() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <BackButton />
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Intelligence</p>
          <h1 className="font-display font-bold text-3xl">AI Lab</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-forge-blue/10 to-forge-orange/10" />
          <div className="relative z-10 flex flex-col lg:flex-row gap-6 justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg glass text-xs font-mono text-forge-blue-light mb-4">
                <Bot size={12} /> LIVE INFERENCE
              </div>
              <h2 className="font-display font-bold text-2xl mb-2">Run the Full 7-Model Pipeline</h2>
              <p className="text-forge-muted text-sm max-w-xl">
                Use the AI Demo to execute all backend endpoints end-to-end and validate real predictions from your FastAPI microservice.
              </p>
            </div>
            <Link to="/ai-demo" className="self-start lg:self-center flex items-center gap-2 px-5 py-3 bg-forge-orange hover:bg-forge-orange-light text-white rounded-xl text-sm font-semibold transition-colors">
              Open AI Demo <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={18} className="text-forge-blue" />
            <h3 className="font-display font-semibold text-lg">Median Endpoint Latency (ms)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="model" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#f97316', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
