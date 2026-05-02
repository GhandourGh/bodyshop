import { motion } from 'framer-motion'
import { MessageSquare, Languages } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'

const toneData = [
  { name: 'Status Update', value: 42, color: '#3b82f6' },
  { name: 'Delay Notice', value: 19, color: '#ef4444' },
  { name: 'Completion', value: 28, color: '#4ade80' },
  { name: 'Follow-up', value: 11, color: '#f97316' },
]

const recentMessages = [
  { id: 'm1', language: 'EN', customer: 'Sarah Mitchell', type: 'status_update', text: 'Your Camry paint job is 70% complete and on schedule for Friday delivery.' },
  { id: 'm2', language: 'AR', customer: 'Ahmad Khalil', type: 'delay', text: 'نود إعلامك بوجود تأخير بسيط ليوم واحد بسبب توفر القطعة الأصلية.' },
  { id: 'm3', language: 'EN', customer: 'Nadia Frem', type: 'completion', text: 'Great news: your Audi A6 is ready for pickup. Quality check passed.' },
]

export default function Messages() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Communication</p>
          <h1 className="font-display font-bold text-3xl">Messages</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare size={18} className="text-forge-orange" />
              <h3 className="font-display font-semibold text-lg">Message Mix</h3>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={toneData} dataKey="value" innerRadius={45} outerRadius={75}>
                    {toneData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Languages size={18} className="text-forge-blue-light" />
              <h3 className="font-display font-semibold text-lg">Recent AI Drafts</h3>
            </div>
            <div className="space-y-3">
              {recentMessages.map((message) => (
                <motion.div key={message.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-4 border border-forge-border/40">
                  <div className="flex items-center gap-2 text-xs font-mono text-forge-muted mb-2">
                    <span>{message.customer}</span>
                    <span>·</span>
                    <span>{message.type}</span>
                    <span>·</span>
                    <span className={message.language === 'AR' ? 'text-forge-orange' : 'text-forge-blue-light'}>{message.language}</span>
                  </div>
                  <p className={`text-sm text-forge-text ${message.language === 'AR' ? 'text-right' : ''}`} dir={message.language === 'AR' ? 'rtl' : 'ltr'}>
                    {message.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
