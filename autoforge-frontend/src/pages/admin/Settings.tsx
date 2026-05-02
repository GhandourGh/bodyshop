import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Shield, Bell, SunMoon } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'

const uptimeData = [
  { time: '00:00', uptime: 99.9 },
  { time: '06:00', uptime: 99.8 },
  { time: '12:00', uptime: 99.95 },
  { time: '18:00', uptime: 99.92 },
  { time: '24:00', uptime: 99.96 },
]

const settingsCards = [
  { icon: Shield, title: 'Security', description: 'Configure access policy and environment protection for operational screens.' },
  { icon: Bell, title: 'Alerts', description: 'Control low-stock, delayed-repair, and sentiment risk notifications.' },
  { icon: SunMoon, title: 'Appearance', description: 'Set global dark/light preferences and cinematic motion intensity.' },
]

export default function Settings() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">System</p>
          <h1 className="font-display font-bold text-3xl">Settings</h1>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon size={18} className="text-forge-blue" />
            <h3 className="font-display font-semibold text-lg">AI Service Uptime (24h)</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={uptimeData}>
                <defs>
                  <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.06} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis domain={[99.6, 100]} stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="uptime" stroke="#3b82f6" fill="url(#uptimeGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {settingsCards.map(({ icon: Icon, title, description }) => (
            <motion.div key={title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-5 card-hover">
              <div className="w-10 h-10 rounded-xl bg-forge-blue/10 border border-forge-blue/20 flex items-center justify-center mb-3">
                <Icon size={18} className="text-forge-blue-light" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-forge-muted">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
