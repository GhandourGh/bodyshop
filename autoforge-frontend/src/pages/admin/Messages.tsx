import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Mail, Globe, Bot, Loader2 } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'
import BackButton from '@/components/shared/BackButton'
import { backendClient } from '@/api/client'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.04 } }),
}

const CHANNEL_COLORS: Record<string, string> = {
  email:   '#3b82f6',
  sms:     '#f97316',
  whatsapp:'#22c55e',
  system:  '#a855f7',
}

type Msg = {
  id: string
  jobId: string | null
  sender: string
  role: string
  channel: string
  content: string
  created: string | null
  customer: string
  vehicle: string
}

export default function Messages() {
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const res = await backendClient.get('/api/messages')
      return (res.data.data ?? res.data ?? []) as Msg[]
    },
  })

  const channelCounts = messages.reduce((acc: Record<string, number>, m) => {
    const ch = m.channel || 'email'
    acc[ch] = (acc[ch] || 0) + 1
    return acc
  }, {})

  const donutData = Object.entries(channelCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: CHANNEL_COLORS[name] ?? '#6b7280',
  }))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <BackButton />
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Communication</p>
          <h1 className="font-display font-bold text-3xl">Messages</h1>
          <p className="text-forge-muted text-sm mt-1">All AI-generated messages sent via the Job Wizard</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donut chart */}
          <div className="lg:col-span-1 glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare size={16} className="text-forge-blue-light" />
              <h3 className="font-display font-semibold">By Channel</h3>
            </div>
            {isLoading ? (
              <div className="h-36 animate-pulse bg-forge-border/20 rounded-xl" />
            ) : donutData.length === 0 ? (
              <p className="text-sm text-forge-muted py-8 text-center">No messages yet</p>
            ) : (
              <>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                        {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-3">
                  {donutData.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                        <span className="text-forge-muted">{d.name}</span>
                      </div>
                      <span className="font-mono text-forge-text">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Message list */}
          <div className="lg:col-span-2 space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse bg-forge-border/20 rounded-xl" />
              ))
            ) : messages.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center text-forge-muted">
                <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No messages yet. Use the AI Job Wizard to generate messages.</p>
              </div>
            ) : (
              messages.map((m, i) => (
                <motion.div key={m.id} initial="hidden" animate="visible" variants={fadeUp} custom={i}
                  className="glass rounded-xl p-4 border border-forge-border/40">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full border"
                        style={{ color: CHANNEL_COLORS[m.channel] ?? '#6b7280', background: (CHANNEL_COLORS[m.channel] ?? '#6b7280') + '18', borderColor: (CHANNEL_COLORS[m.channel] ?? '#6b7280') + '40' }}>
                        {m.channel === 'email' ? <span className="flex items-center gap-1"><Mail size={10} /> email</span>
                          : m.channel === 'system' ? <span className="flex items-center gap-1"><Bot size={10} /> system</span>
                          : <span className="flex items-center gap-1"><Globe size={10} /> {m.channel}</span>}
                      </span>
                      <span className="text-xs text-forge-muted">
                        {m.customer !== '—' && <><span className="text-forge-text font-medium">{m.customer}</span> · </>}
                        {m.vehicle !== '—' && <span>{m.vehicle}</span>}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-forge-muted whitespace-nowrap shrink-0">
                      {m.created ? new Date(m.created).toLocaleString() : '—'}
                    </span>
                  </div>
                  <p className="text-sm text-forge-text leading-relaxed line-clamp-3"
                    dir={/[؀-ۿ]/.test(m.content) ? 'rtl' : 'ltr'}>
                    {m.content}
                  </p>
                  <p className="text-[10px] text-forge-muted mt-2 font-mono">sent by {m.sender}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
